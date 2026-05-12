import {
	type ColumnFiltersState,
	getCoreRowModel,
	getFacetedMinMaxValues,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	type TableOptions,
	type TableState,
	type Updater,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	type SingleParser,
	type UseQueryStateOptions,
	useQueryState,
	useQueryStates,
} from "nuqs";
import * as React from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getSortingStateParser } from "@/lib/parsers";

type ExtendedColumnSort = SortingState[number];

interface QueryKeys {
	page?: string;
	perPage?: string;
	sort?: string;
	filters?: string;
	joinOperator?: string;
}

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const FILTERS_KEY = "filters";
const JOIN_OPERATOR_KEY = "joinOperator";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]/;
const SPLIT_NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]+/;

interface UseDataTableProps<TData>
	extends Omit<
			TableOptions<TData>,
			| "state"
			| "pageCount"
			| "getCoreRowModel"
			| "manualFiltering"
			| "manualPagination"
			| "manualSorting"
		>,
		Required<Pick<TableOptions<TData>, "pageCount">> {
	initialState?: Omit<Partial<TableState>, "sorting"> & {
		sorting?: ExtendedColumnSort[];
	};
	queryKeys?: Partial<QueryKeys>;
	history?: "push" | "replace";
	debounceMs?: number;
	throttleMs?: number;
	clearOnDefault?: boolean;
	enableAdvancedFilter?: boolean;
	scroll?: boolean;
	shallow?: boolean;
	startTransition?: React.TransitionStartFunction;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
	const {
		columns,
		pageCount = -1,
		initialState,
		queryKeys,
		history = "replace",
		debounceMs = DEBOUNCE_MS,
		throttleMs = THROTTLE_MS,
		clearOnDefault = false,
		enableAdvancedFilter = false,
		scroll = false,
		shallow = true,
		startTransition,
		...tableProps
	} = props;
	const pageKey = queryKeys?.page ?? PAGE_KEY;
	const perPageKey = queryKeys?.perPage ?? PER_PAGE_KEY;
	const sortKey = queryKeys?.sort ?? SORT_KEY;
	const filtersKey = queryKeys?.filters ?? FILTERS_KEY;
	const joinOperatorKey = queryKeys?.joinOperator ?? JOIN_OPERATOR_KEY;

	const queryStateOptions = React.useMemo<
		Omit<UseQueryStateOptions<string>, "parse">
	>(
		() => ({
			history,
			scroll,
			shallow,
			throttleMs,
			debounceMs,
			clearOnDefault,
			startTransition,
		}),
		[
			history,
			scroll,
			shallow,
			throttleMs,
			debounceMs,
			clearOnDefault,
			startTransition,
		]
	);

	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
		initialState?.rowSelection ?? {}
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

	const [page, setPage] = useQueryState(
		pageKey,
		parseAsInteger.withOptions(queryStateOptions).withDefault(1)
	);
	const [perPage, setPerPage] = useQueryState(
		perPageKey,
		parseAsInteger
			.withOptions(queryStateOptions)
			.withDefault(initialState?.pagination?.pageSize ?? 10)
	);

	const pagination: PaginationState = React.useMemo(() => {
		return {
			pageIndex: page - 1, // zero-based index -> one-based index
			pageSize: perPage,
		};
	}, [page, perPage]);

	const onPaginationChange = React.useCallback(
		(updaterOrValue: Updater<PaginationState>) => {
			if (typeof updaterOrValue === "function") {
				const newPagination = updaterOrValue(pagination);
				setPage(newPagination.pageIndex + 1);
				setPerPage(newPagination.pageSize);
			} else {
				setPage(updaterOrValue.pageIndex + 1);
				setPerPage(updaterOrValue.pageSize);
			}
		},
		[pagination, setPage, setPerPage]
	);

	const columnIds = React.useMemo(() => {
		return new Set(
			columns.map((column) => column.id).filter(Boolean) as string[]
		);
	}, [columns]);

	const initialSorting = (initialState?.sorting ?? []) as SortingState;

	const [sorting, setSorting] = useQueryState(
		sortKey,
		getSortingStateParser<Record<string, unknown>>(columnIds)
			.withOptions(queryStateOptions)
			.withDefault(initialSorting)
	);

	const onSortingChange = React.useCallback(
		(updaterOrValue: Updater<SortingState>) => {
			if (typeof updaterOrValue === "function") {
				const newSorting = updaterOrValue(sorting);
				setSorting(newSorting);
			} else {
				setSorting(updaterOrValue);
			}
		},
		[sorting, setSorting]
	);

	const filterableColumns = React.useMemo(() => {
		if (enableAdvancedFilter) {
			return [];
		}

		return columns.filter((column) => column.enableColumnFilter);
	}, [columns, enableAdvancedFilter]);

	const filterParsers = React.useMemo(() => {
		if (enableAdvancedFilter) {
			return {};
		}

		return filterableColumns.reduce<
			Record<string, SingleParser<string> | SingleParser<string[]>>
		>((acc, column) => {
			if (column.meta?.options) {
				acc[column.id ?? ""] = parseAsArrayOf(
					parseAsString,
					ARRAY_SEPARATOR
				).withOptions(queryStateOptions);
			} else {
				acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
			}
			return acc;
		}, {});
	}, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

	const [filterValues, setFilterValues] = useQueryStates(filterParsers);

	const debouncedSetFilterValues = useDebouncedCallback(
		(values: typeof filterValues) => {
			setPage(1);
			setFilterValues(values);
		},
		debounceMs
	);

	const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
		if (enableAdvancedFilter) {
			return [];
		}

		return Object.entries(filterValues).reduce<ColumnFiltersState>(
			(filters, [key, value]) => {
				if (value !== null) {
					let processedValue: string | string[];

					if (Array.isArray(value)) {
						processedValue = value;
					} else if (
						typeof value === "string" &&
						NON_ALPHANUMERIC_REGEX.test(value)
					) {
						processedValue = value
							.split(SPLIT_NON_ALPHANUMERIC_REGEX)
							.filter(Boolean);
					} else {
						processedValue = [value];
					}

					filters.push({
						id: key,
						value: processedValue,
					});
				}
				return filters;
			},
			[]
		);
	}, [filterValues, enableAdvancedFilter]);

	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>(initialColumnFilters);

	const onColumnFiltersChange = React.useCallback(
		(updaterOrValue: Updater<ColumnFiltersState>) => {
			if (enableAdvancedFilter) {
				return;
			}

			setColumnFilters((prev) => {
				const next =
					typeof updaterOrValue === "function"
						? updaterOrValue(prev)
						: updaterOrValue;

				const filterUpdates = next.reduce<
					Record<string, string | string[] | null>
				>((acc, filter) => {
					if (filterableColumns.find((column) => column.id === filter.id)) {
						acc[filter.id] = filter.value as string | string[];
					}
					return acc;
				}, {});

				for (const prevFilter of prev) {
					if (!next.some((filter) => filter.id === prevFilter.id)) {
						filterUpdates[prevFilter.id] = null;
					}
				}

				debouncedSetFilterValues(filterUpdates);
				return next;
			});
		},
		[debouncedSetFilterValues, filterableColumns, enableAdvancedFilter]
	);

	const table = useReactTable({
		...tableProps,
		columns,
		initialState,
		pageCount,
		state: {
			pagination,
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		defaultColumn: {
			...tableProps.defaultColumn,
			enableColumnFilter: false,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onPaginationChange,
		onSortingChange,
		onColumnFiltersChange,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFacetedMinMaxValues: getFacetedMinMaxValues(),
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		meta: {
			...tableProps.meta,
			queryKeys: {
				page: pageKey,
				perPage: perPageKey,
				sort: sortKey,
				filters: filtersKey,
				joinOperator: joinOperatorKey,
			},
		},
	});

	return React.useMemo(
		() => ({ table, shallow, debounceMs, throttleMs }),
		[table, shallow, debounceMs, throttleMs]
	);
}
