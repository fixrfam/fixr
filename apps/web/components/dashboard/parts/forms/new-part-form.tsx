"use client";

import { useTranslation } from "@fixr/i18n/react";
import { partCategories } from "@fixr/mock";
import { createPartSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Check, ChevronsUpDown, Loader2, Plus, Save } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
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
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatCnpj } from "@/lib/format";
import type { PartRow } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";
import { useCreatePart, useInventory, useUpdatePart } from "../store";
import { useApiErrorToast } from "./api-feedback";
import { numberInputProps } from "./number-input";

type PartValues = z.infer<typeof createPartSchema>;

/** Profit per unit and margin over the sale price, once both prices make sense. */
function MarginHint({
	control,
}: {
	control: ReturnType<typeof useForm<PartValues>>["control"];
}) {
	const { t, format } = useTranslation();
	const [costPrice, salePrice] = useWatch({
		control,
		name: ["costPrice", "salePrice"],
	});

	if (
		typeof costPrice !== "number" ||
		typeof salePrice !== "number" ||
		salePrice <= 0 ||
		salePrice < costPrice
	) {
		return null;
	}

	return (
		<p className="text-emerald-700 text-xs dark:text-emerald-400">
			{t("parts.form.margin", {
				profit: format.currency(salePrice - costPrice),
				percent: format.number((salePrice - costPrice) / salePrice, {
					style: "percent",
					maximumFractionDigits: 0,
				}),
			})}
		</p>
	);
}

export function NewPartForm({
	part,
	onSuccess,
	className,
	...props
}: Omit<ComponentPropsWithoutRef<"form">, "part"> & {
	/** When given, the form edits this part instead of creating a new one. */
	part?: PartRow;
	onSuccess?: () => void;
}) {
	const { t, format } = useTranslation();
	const { suppliers } = useInventory();
	const createPart = useCreatePart();
	const updatePart = useUpdatePart();
	const toastError = useApiErrorToast();
	const saving = createPart.isPending || updatePart.isPending;

	// A part saved with a category outside the list keeps it as an option.
	const categories: string[] =
		part && !(partCategories as readonly string[]).includes(part.category)
			? [...partCategories, part.category]
			: [...partCategories];

	const form = useForm<PartValues>({
		resolver: zodResolver(createPartSchema),
		defaultValues: part
			? {
					sku: part.sku,
					name: part.name,
					description: part.description ?? "",
					category: part.category,
					costPrice: part.costPrice,
					salePrice: part.salePrice,
					stock: part.stock,
					minStock: part.minStock,
					supplierId: part.supplierId,
				}
			: {
					sku: "",
					name: "",
					description: "",
					category: "",
					supplierId: "",
				},
		mode: "all",
	});

	const pricePlaceholder = format.number(0, { minimumFractionDigits: 2 });

	async function onSubmit(values: PartValues) {
		try {
			if (part) {
				// The stock only changes through a stock adjustment.
				const { stock: _stock, ...changes } = values;
				await updatePart.mutateAsync({ id: part.id, values: changes });
				toast.success({ text: t("parts.form.updated") });
			} else {
				await createPart.mutateAsync(values);
				toast.success({ text: t("parts.form.created") });
			}
			onSuccess?.();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.nameLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("parts.form.namePlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="sku"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.skuLabel")}</FormLabel>
								<FormControl>
									<Input
										className="font-mono"
										placeholder={t("parts.form.skuPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormDescription>
									{t("parts.form.skuDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>{t("parts.form.descriptionLabel")}</FormLabel>
								<FormControl>
									<Textarea
										placeholder={t("parts.form.descriptionPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem className="col-span-full">
								<FormLabel>{t("parts.form.categoryLabel")}</FormLabel>
								<div className="flex flex-wrap gap-2">
									{categories.map((category) => {
										const selected = field.value === category;

										return (
											<Button
												aria-pressed={selected}
												key={category}
												onClick={() => field.onChange(category)}
												size="sm"
												type="button"
												variant={selected ? "default" : "outline"}
											>
												{selected && <Check className="size-3.5" />}
												{category}
											</Button>
										);
									})}
								</div>
								<FormDescription>
									{t("parts.form.categoryDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="supplierId"
						render={({ field }) => {
							const selected =
								suppliers.find((supplier) => supplier.id === field.value) ??
								(part?.supplier?.id === field.value
									? part.supplier
									: undefined);

							return (
								<FormItem className="col-span-full">
									<FormLabel>{t("parts.form.supplierLabel")}</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													className={cn(
														"w-full justify-between font-normal",
														!selected && "text-muted-foreground"
													)}
													role="combobox"
													type="button"
													variant="outline"
												>
													{selected?.name ??
														t("parts.form.supplierPlaceholder")}
													<ChevronsUpDown className="size-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											className="w-(--radix-popover-trigger-width) p-0"
										>
											<Command>
												<CommandInput
													placeholder={t("parts.form.supplierSearch")}
												/>
												<CommandList>
													<CommandEmpty>
														{t("parts.form.supplierEmpty")}
													</CommandEmpty>
													<CommandGroup>
														{suppliers.map((supplier) => (
															<CommandItem
																key={supplier.id}
																keywords={[
																	supplier.cnpj,
																	formatCnpj(supplier.cnpj),
																]}
																onSelect={() => field.onChange(supplier.id)}
																value={supplier.name}
															>
																<Check
																	className={cn(
																		"size-4",
																		field.value === supplier.id
																			? "opacity-100"
																			: "opacity-0"
																	)}
																/>
																<span className="flex-1 truncate">
																	{supplier.name}
																</span>
																<span className="text-muted-foreground text-xs tabular-nums">
																	{formatCnpj(supplier.cnpj)}
																</span>
															</CommandItem>
														))}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormDescription>
										{t("parts.form.supplierDescription")}
									</FormDescription>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
					<FormField
						control={form.control}
						name="costPrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.costPriceLabel")}</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder={pricePlaceholder}
										step="0.01"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormDescription>
									{t("parts.form.costPriceDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="salePrice"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.salePriceLabel")}</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder={pricePlaceholder}
										step="0.01"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormDescription>
									{t("parts.form.salePriceDescription")}
								</FormDescription>
								<MarginHint control={form.control} />
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="stock"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.stockLabel")}</FormLabel>
								<FormControl>
									<Input
										disabled={Boolean(part)}
										min={0}
										placeholder="0"
										step="1"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormDescription>
									{part
										? t("parts.form.stockLockedDescription")
										: t("parts.form.stockDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="minStock"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.minStockLabel")}</FormLabel>
								<FormControl>
									<Input
										min={0}
										placeholder="0"
										step="1"
										{...numberInputProps(field)}
									/>
								</FormControl>
								<FormDescription>
									{t("parts.form.minStockDescription")}
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{part ? (
					<Button
						className="w-full"
						disabled={!form.formState.isDirty || saving}
						type="submit"
					>
						{t("common.actions.saveChanges")}{" "}
						{saving ? <Loader2 className="animate-spin" /> : <Save />}
					</Button>
				) : (
					<Button className="w-full" disabled={saving} type="submit">
						{t("parts.form.submit")}{" "}
						{saving ? <Loader2 className="animate-spin" /> : <Plus />}
					</Button>
				)}
			</form>
		</Form>
	);
}
