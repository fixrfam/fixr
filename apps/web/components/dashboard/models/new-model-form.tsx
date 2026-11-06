"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { Check, ChevronsUpDown, Loader2, PackagePlus } from "lucide-react";
import { useState } from "react";
import { StackedDialog } from "@/components/dashboard/dialog-stack";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import { useCreateModel, useMakers, useModelCategories } from "./store";

const NO_CATEGORY = "none";

/** A model just added to the company's catalog. */
export interface CreatedModel {
	id: string;
	slug: string;
	name: string;
	maker: string;
	imageUrl: string | null;
	category?: string | null;
}

/**
 * "Not in the catalog? Add it": a bar under the results that opens the new
 * model form over the current screen, for who can register devices.
 * `search` fills the name in.
 */
export function AddModelPrompt({
	search,
	onCreated,
}: {
	search: string;
	onCreated: (model: CreatedModel) => void;
}) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const [open, setOpen] = useState(false);
	const name = search.trim();

	if (!ability.can(permissions.devices.create)) {
		return null;
	}

	return (
		<>
			<div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 py-2 pr-2 pl-4 text-sm">
				<span className="text-muted-foreground">
					{t("devices.form.modelMissing")}
				</span>
				<Button
					onClick={() => setOpen(true)}
					size="sm"
					type="button"
					variant="outline"
				>
					<PackagePlus />
					{name
						? t("devices.form.modelCreate", { name })
						: t("devices.form.modelAdd")}
				</Button>
			</div>
			<StackedDialog
				description={t("devices.form.modelCreateDescription")}
				icon={<PackagePlus />}
				onOpenChange={setOpen}
				open={open}
				title={t("devices.form.modelCreateTitle")}
			>
				<NewModelForm
					initialName={name}
					onCreated={(model) => {
						setOpen(false);
						onCreated(model);
					}}
				/>
			</StackedDialog>
		</>
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

interface Maker {
	id: string;
	name: string;
}

/** Search the brands and pick one, sized like the other fields. */
function MakerCombobox({
	id,
	value,
	onChange,
	options,
	loading,
	onSearchChange,
}: {
	id?: string;
	value: Maker | null;
	onChange: (maker: Maker) => void;
	options: { label: string; value: string }[];
	loading: boolean;
	onSearchChange: (search: string) => void;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between font-normal"
					id={id}
					role="combobox"
					type="button"
					variant="outline"
				>
					<span className={cn("truncate", !value && "text-muted-foreground")}>
						{value?.name ?? t("devices.form.makerPlaceholder")}
					</span>
					<ChevronsUpDown className="size-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="w-(--radix-popover-trigger-width) min-w-56 p-0"
			>
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={onSearchChange}
						placeholder={t("devices.form.makerPlaceholder")}
					/>
					<CommandList>
						{!loading && (
							<CommandEmpty>{t("devices.form.makerEmpty")}</CommandEmpty>
						)}
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									onSelect={() => {
										onChange({ id: option.value, name: option.label });
										setOpen(false);
									}}
									value={option.value}
								>
									<Check
										className={cn(
											"size-4",
											value?.id === option.value ? "opacity-100" : "opacity-0"
										)}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

/** Adds a company model with what identifies it: name, brand and category. */
export function NewModelForm({
	initialName,
	onCreated,
}: {
	initialName: string;
	onCreated: (model: CreatedModel) => void;
}) {
	const { t } = useTranslation();
	const toastError = useApiErrorToast();
	const createModel = useCreateModel();
	const categories = useModelCategories();
	const makers = useMakerOptions();
	const [name, setName] = useState(initialName);
	const [maker, setMaker] = useState<Maker | null>(null);
	const [categoryId, setCategoryId] = useState(NO_CATEGORY);
	const canSubmit = name.trim() !== "" && maker !== null;

	async function submit() {
		if (!(canSubmit && maker)) {
			return;
		}
		try {
			const created = await createModel.mutateAsync({
				name: name.trim(),
				makerId: maker.id,
				categoryId: categoryId === NO_CATEGORY ? undefined : categoryId,
			});
			toast.success({ text: t("devices.form.modelCreated") });
			onCreated({
				id: created.id,
				slug: created.slug,
				name: created.name,
				maker: maker.name,
				imageUrl: null,
				category: categories.data?.find((c) => c.id === categoryId)?.slug,
			});
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<form
			className="grid gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				// It opens over other forms (the device's): keep their submit out of it.
				e.stopPropagation();
				submit();
			}}
		>
			<div className="grid gap-2">
				<Label htmlFor="new-model-name">
					{t("devices.form.modelNameLabel")}
				</Label>
				<Input
					autoFocus
					id="new-model-name"
					onChange={(e) => setName(e.target.value)}
					value={name}
				/>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<Label htmlFor="new-model-maker">
						{t("devices.form.makerLabel")}
					</Label>
					<MakerCombobox
						id="new-model-maker"
						loading={makers.loading}
						onChange={setMaker}
						onSearchChange={makers.onSearchChange}
						options={makers.options}
						value={maker}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="new-model-category">
						{t("devices.form.categoryLabel")}
					</Label>
					<Select onValueChange={setCategoryId} value={categoryId}>
						<SelectTrigger className="w-full" id="new-model-category">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={NO_CATEGORY}>
								{t("devices.form.categoryNone")}
							</SelectItem>
							{(categories.data ?? []).map((category) => (
								<SelectItem key={category.id} value={category.id}>
									{category.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<Button
				className="w-full"
				disabled={!canSubmit || createModel.isPending}
				type="submit"
			>
				{t("devices.form.modelCreateSubmit")}
				{createModel.isPending ? (
					<Loader2 className="animate-spin" />
				) : (
					<PackagePlus />
				)}
			</Button>
		</form>
	);
}
