"use client";

import { useTranslation } from "@fixr/i18n/react";
import { ArrowDownUp, Check, PlusCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { CatalogSort } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";

export interface FilterOption {
	label: string;
	value: string;
}

/**
 * A single value filter. The API filters by one value at a time, so this
 * picks one option instead of several.
 *
 * With `onSearchChange` the options come from the server: the typed search is
 * handed over and the options are shown as they arrive, unfiltered.
 */
export function FilterSelect({
	title,
	options,
	value,
	selectedLabel,
	onChange,
	onSearchChange,
	loading,
}: {
	title: string;
	options: FilterOption[];
	value: string | null;
	/** Label of the chosen value when it may not be among the loaded options. */
	selectedLabel?: string;
	onChange: (value: string | null) => void;
	onSearchChange?: (search: string) => void;
	loading?: boolean;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const label =
		options.find((option) => option.value === value)?.label ?? selectedLabel;

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button className="h-8 border-dashed" size="sm" variant="outline">
					{value ? (
						// biome-ignore lint/a11y/useSemanticElements: a button can't nest inside the trigger button
						<span
							aria-label={t("dataTable.filters.clearFilter", { name: title })}
							className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
							onClick={(event) => {
								event.stopPropagation();
								onChange(null);
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.stopPropagation();
									onChange(null);
								}
							}}
							role="button"
							tabIndex={0}
						>
							<XCircle />
						</span>
					) : (
						<PlusCircle />
					)}
					{title}
					{value && label && (
						<>
							<Separator
								className="mx-0.5 data-[orientation=vertical]:h-4"
								orientation="vertical"
							/>
							<Badge
								className="rounded-sm px-1 font-normal"
								variant="secondary"
							>
								{label}
							</Badge>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-60 p-0">
				<Command shouldFilter={!onSearchChange}>
					<CommandInput
						onValueChange={onSearchChange}
						placeholder={t("dataTable.filters.searchOptions")}
					/>
					<CommandList>
						<CommandEmpty>
							{loading
								? t("dataTable.filters.loading")
								: t("dataTable.filters.noResults")}
						</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const selected = option.value === value;
								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											onChange(selected ? null : option.value);
											setOpen(false);
										}}
										value={option.label}
									>
										<Check
											className={cn(
												"size-4",
												selected ? "opacity-100" : "opacity-0"
											)}
										/>
										<span className="truncate">{option.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/** An on/off filter, such as "low stock only". */
export function ToggleFilter({
	label,
	pressed,
	onPressedChange,
}: {
	label: string;
	pressed: boolean;
	onPressedChange: (pressed: boolean) => void;
}) {
	return (
		<Button
			aria-pressed={pressed}
			className={cn("h-8", !pressed && "border-dashed")}
			onClick={() => onPressedChange(!pressed)}
			size="sm"
			variant={pressed ? "secondary" : "outline"}
		>
			{pressed ? <Check /> : <PlusCircle />}
			{label}
		</Button>
	);
}

const SORTS: CatalogSort[] = ["name", "newer", "older"];

/** The orders the catalog lists support. */
export function SortSelect({
	value,
	onChange,
}: {
	value: CatalogSort;
	onChange: (value: CatalogSort) => void;
}) {
	const { t } = useTranslation();

	return (
		<Select
			onValueChange={(next: string) => onChange(next as CatalogSort)}
			value={value}
		>
			<SelectTrigger
				aria-label={t("dataTable.catalogSort.label")}
				className="h-8 w-auto gap-2"
				size="sm"
			>
				<ArrowDownUp className="size-3.5 text-muted-foreground" />
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="end">
				{SORTS.map((sort) => (
					<SelectItem key={sort} value={sort}>
						{t(`dataTable.catalogSort.${sort}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
