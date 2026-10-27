"use client";

import { useTranslation } from "@fixr/i18n/react";
import type { ModelListItem } from "@fixr/schemas/models";
import { Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from "nuqs";
import { type ReactNode, useCallback, useId, useMemo, useState } from "react";
import {
	FilterSelect,
	SortSelect,
} from "@/components/dashboard/parts/table/catalog-filters";
import {
	useCatalogTable,
	useOutOfRangePage,
	useSearchInput,
} from "@/components/dashboard/parts/table/use-catalog-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { useModelColumns } from "./columns";
import {
	CATALOG_CATEGORIES,
	CATEGORY_ICONS,
	isCatalogCategory,
} from "./format";
import { AddModelPrompt } from "./new-model-form";
import { useMakers, useModelCategories, useModelsPage } from "./store";

/** URL state of the explorer: page, search, filters and order. */
export const modelsParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(20),
	q: parseAsString.withDefault(""),
	category: parseAsString,
	maker: parseAsString,
	sort: parseAsStringLiteral(["newer", "older", "name"] as const).withDefault(
		"newer"
	),
};

export interface ModelsParams {
	page: number;
	perPage: number;
	q: string;
	category: string | null;
	maker: string | null;
	sort: "newer" | "older" | "name";
}

/** Merges changes into the params; `null` goes back to the defaults. */
export type SetModelsParams = (changes: Partial<ModelsParams> | null) => void;

const DEFAULT_PARAMS: ModelsParams = {
	page: 1,
	perPage: 20,
	q: "",
	category: null,
	maker: null,
	sort: "newer",
};

/** Explorer state kept in the component, for a browser inside a dialog. */
export function useLocalModelsParams(perPage = 10) {
	const [params, setState] = useState<ModelsParams>({
		...DEFAULT_PARAMS,
		perPage,
	});
	const setParams: SetModelsParams = useCallback(
		(changes) =>
			setState((current) =>
				changes === null
					? { ...DEFAULT_PARAMS, perPage }
					: { ...current, ...changes }
			),
		[perPage]
	);
	return [params, setParams] as const;
}

function CategoryChips({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (slug: string | null) => void;
}) {
	const { t } = useTranslation();
	// Unique per browser, so two of them on screen don't share the highlight.
	const chipId = useId();
	const chips = [null, ...CATALOG_CATEGORIES];

	return (
		<div
			aria-label={t("models.explorer.category")}
			className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
			role="radiogroup"
		>
			{chips.map((slug) => {
				const active = value === slug;
				const Icon = slug ? CATEGORY_ICONS[slug] : null;
				return (
					// biome-ignore lint/a11y/useSemanticElements: chips are buttons styled as a segmented control
					<button
						aria-checked={active}
						className={cn(
							"relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium text-sm transition-colors",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							active
								? "text-primary-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						)}
						key={slug ?? "all"}
						onClick={() => onChange(slug)}
						role="radio"
						type="button"
					>
						{active && (
							<motion.span
								className="absolute inset-0 rounded-full bg-primary"
								layoutId={`${chipId}-category-chip`}
								transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
							/>
						)}
						<span className="relative flex items-center gap-1.5">
							{Icon && <Icon className="size-3.5" />}
							{t(`models.categories.${slug ?? "all"}`)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

/** Brands matching what the user types, the biggest first. */
function useMakerOptions() {
	const [search, setSearch] = useState("");
	const onSearchChange = useDebouncedCallback(setSearch, 250);
	const makers = useMakers(search);

	return {
		options: (makers.data?.records ?? []).map((maker) => ({
			label: maker.name,
			value: maker.id,
		})),
		loading: makers.isFetching,
		onSearchChange,
	};
}

/** The device catalog page: the browser with its state in the URL. */
export function ModelsExplorer() {
	const router = useRouter();
	const { subdomain } = useParams<{ subdomain: string }>();
	const [params, setParams] = useQueryStates(modelsParsers, {
		history: "replace",
		clearOnDefault: true,
	});
	const hrefOf = useCallback(
		(model: Pick<ModelListItem, "slug">) =>
			`/dashboard/${subdomain}/devices/models/${model.slug}`,
		[subdomain]
	);

	return (
		<ModelsBrowser
			footer={
				<AddModelPrompt
					onCreated={(model) => router.push(hrefOf(model))}
					search={params.q}
				/>
			}
			hrefOf={hrefOf}
			onSelect={(model) => router.push(hrefOf(model))}
			params={params}
			setParams={setParams}
		/>
	);
}

/**
 * Search, brand and category filters, order and the table of the device
 * catalog. The state comes from outside: the URL on the catalog page, the
 * component in a picker. `hrefOf` links each model; `onSelect` runs on a row
 * click; `footer` goes under the results line (e.g. "add a model").
 */
export function ModelsBrowser({
	params,
	setParams,
	onSelect,
	hrefOf,
	footer,
}: {
	params: ModelsParams;
	setParams: SetModelsParams;
	onSelect: (model: ModelListItem) => void;
	hrefOf?: (model: ModelListItem) => string;
	footer?: ReactNode;
}) {
	const { t } = useTranslation();
	const makers = useMakerOptions();
	const categories = useModelCategories();

	/** Changes filters, search or order, and goes back to page one. */
	const refine = useCallback(
		(changes: Partial<Omit<typeof params, "page" | "perPage">>) =>
			setParams({ ...changes, page: 1 }),
		[setParams]
	);
	const setPagination = useCallback(
		(pagination: { page: number; perPage: number }) => setParams(pagination),
		[setParams]
	);
	const search = useSearchInput(params.q, (q) => refine({ q }));

	const category =
		params.category && isCatalogCategory(params.category)
			? params.category
			: null;
	const categoryId = categories.data?.find(
		(item) => item.slug === category
	)?.id;
	// A category filter waits for the category ids before asking for models.
	const waiting = Boolean(category) && categories.isPending;

	const query = useModelsPage({
		page: params.page,
		perPage: params.perPage,
		query: params.q || undefined,
		categoryId,
		makerId: params.maker ?? undefined,
		sort: params.sort,
	});
	useOutOfRangePage(query, params, setPagination);

	const columns = useModelColumns(hrefOf);
	const rows = useMemo(() => query.data?.records ?? [], [query.data]);

	const table = useCatalogTable({
		data: rows,
		columns,
		page: params.page,
		perPage: params.perPage,
		pageCount: query.data?.pagination.total_pages ?? 0,
		rowCount: query.data?.pagination.total_records ?? 0,
		onPaginationChange: setPagination,
	});

	const total = query.data?.pagination.total_records ?? 0;
	const hasFilters = Boolean(params.q || category || params.maker);
	const makerLabel =
		params.maker && rows[0]?.maker.id === params.maker
			? rows[0].maker.name
			: undefined;

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						aria-label={t("models.explorer.search")}
						className="h-9 pr-9 pl-9"
						onChange={(event) => search.setInput(event.target.value)}
						placeholder={t("models.explorer.search")}
						type="search"
						value={search.input}
					/>
					{search.input && (
						<button
							aria-label={t("models.explorer.clear")}
							className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
							onClick={() => search.setInput("")}
							type="button"
						>
							<X className="size-3.5" />
						</button>
					)}
				</div>
				<div className="flex items-center gap-2">
					<FilterSelect
						loading={makers.loading}
						onChange={(maker) => refine({ maker })}
						onSearchChange={makers.onSearchChange}
						options={makers.options}
						selectedLabel={makerLabel}
						title={t("models.explorer.maker")}
						value={params.maker}
					/>
					<SortSelect
						onChange={(sort) => refine({ sort })}
						value={params.sort}
					/>
					<DataTableViewOptions align="end" table={table} />
				</div>
			</div>

			<CategoryChips
				onChange={(slug) => refine({ category: slug })}
				value={category}
			/>

			<div className="flex h-7 items-center justify-between text-sm">
				<span aria-live="polite" className="text-muted-foreground">
					{query.isPending || waiting ? (
						<Skeleton className="h-4 w-24" />
					) : (
						t("models.explorer.results", { count: total })
					)}
				</span>
				{hasFilters && (
					<Button
						className="h-7 px-2 text-muted-foreground"
						onClick={() => {
							search.setInput("");
							setParams(null);
						}}
						size="sm"
						variant="ghost"
					>
						<X />
						{t("models.explorer.clear")}
					</Button>
				)}
			</div>
			{footer}

			{query.isPending || waiting ? (
				<Skeleton className="h-96 w-full rounded-md" />
			) : (
				<DataTable
					aria-busy={query.isPlaceholderData}
					className={cn(
						"w-full transition-opacity",
						query.isPlaceholderData && "opacity-60"
					)}
					onRowClick={(row) => onSelect(row.original)}
					table={table}
				/>
			)}
		</div>
	);
}
