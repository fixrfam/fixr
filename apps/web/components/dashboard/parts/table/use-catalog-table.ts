"use client";

import {
	type ColumnDef,
	getCoreRowModel,
	type PaginationState,
	type Updater,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	type UseQueryStatesKeysMap,
	useQueryStates,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 300;

/** URL state every catalog table shares: page, page size, search and order. */
export const catalogParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(10),
	q: parseAsString.withDefault(""),
	sort: parseAsStringLiteral(["name", "newer", "older"] as const).withDefault(
		"name"
	),
};

export const catalogUrlOptions = {
	history: "replace",
	clearOnDefault: true,
} as const;

/**
 * The URL state of a catalog table, its own filters included. Changing
 * anything but the page goes back to the first page, since the old page may
 * not exist in the new result.
 */
export function useCatalogParams<TFilters extends UseQueryStatesKeysMap>(
	/** Parsers of the table's own filters; keep the object stable (module level). */
	filters: TFilters
) {
	const [params, setParams] = useQueryStates(
		{ ...catalogParsers, ...filters },
		catalogUrlOptions
	);

	// nuqs can't type a setter over a generic parser map; the keys are checked
	// by `refine`'s parameter instead.
	const set = setParams as unknown as (
		values: Record<string, unknown> | null
	) => Promise<URLSearchParams>;

	// The setters only depend on nuqs' setter, which is stable.
	const actions = useMemo(
		() => ({
			/** Changes filters, search or order, and goes back to page one. */
			refine: (
				changes: {
					[K in keyof typeof params]?: (typeof params)[K] | null;
				}
			) => set({ ...changes, page: 1 }),
			setPagination: ({ page, perPage }: { page: number; perPage: number }) =>
				set({ page, perPage }),
			reset: () => set(null),
		}),
		[set]
	);

	return { params, ...actions };
}

/** `?lowStock=true` or nothing. */
export function parseAsBooleanFlag() {
	return parseAsStringLiteral(["true"] as const);
}

/**
 * The search box value. It updates as the user types and reaches the URL (and
 * the API) once they pause.
 */
export function useSearchInput(
	value: string,
	onCommit: (value: string) => void
) {
	const [input, setInput] = useState(value);
	const commit = useDebouncedCallback(onCommit, SEARCH_DEBOUNCE_MS);

	// Follows outside changes, such as "Clear" or the back button.
	useEffect(() => {
		setInput(value);
	}, [value]);

	return {
		input,
		setInput: (next: string) => {
			setInput(next);
			commit(next.trim());
		},
	};
}

/**
 * A table over one page of server results. Searching, filtering, sorting and
 * paging happen on the API, so the table only lays out what it is given.
 */
export function useCatalogTable<TData>({
	data,
	columns,
	page,
	perPage,
	pageCount,
	rowCount,
	onPaginationChange,
	columnVisibility: initialVisibility = {},
}: {
	data: TData[];
	columns: ColumnDef<TData>[];
	page: number;
	perPage: number;
	pageCount: number;
	rowCount: number;
	onPaginationChange: (pagination: { page: number; perPage: number }) => void;
	columnVisibility?: VisibilityState;
}) {
	const [columnVisibility, setColumnVisibility] =
		useState<VisibilityState>(initialVisibility);
	const pagination: PaginationState = {
		pageIndex: page - 1,
		pageSize: perPage,
	};

	return useReactTable({
		data,
		columns,
		pageCount,
		rowCount,
		state: { pagination, columnVisibility },
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: (updater: Updater<PaginationState>) => {
			const next =
				typeof updater === "function" ? updater(pagination) : updater;
			const sizeChanged = next.pageSize !== perPage;
			onPaginationChange({
				page: sizeChanged ? 1 : next.pageIndex + 1,
				perPage: next.pageSize,
			});
		},
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		// The API sorts by the toolbar's order, not by column.
		enableSorting: false,
		getCoreRowModel: getCoreRowModel(),
	});
}

/**
 * A page past the end, from an old link or after rows were deleted, makes the
 * API answer an error. Go back to the first page instead of showing it.
 */
export function useOutOfRangePage(
	query: { isError: boolean },
	params: { page: number; perPage: number },
	setPagination: (pagination: { page: number; perPage: number }) => void
) {
	const outOfRange = query.isError && params.page > 1;

	useEffect(() => {
		if (outOfRange) {
			setPagination({ page: 1, perPage: params.perPage });
		}
	}, [outOfRange, params.perPage, setPagination]);
}
