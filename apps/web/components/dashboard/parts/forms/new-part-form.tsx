"use client";

import { useTranslation } from "@fixr/i18n/react";
import { partCategories } from "@fixr/mock";
import { createPartSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Loader2, Plus, Save } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { PartRow } from "@/lib/services/inventory";
import { cn } from "@/lib/utils";
import { useCreatePart, useInventory, useUpdatePart } from "../store";
import { useApiErrorToast } from "./api-feedback";
import { numberInputProps } from "./number-input";

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

	const form = useForm<z.infer<typeof createPartSchema>>({
		resolver: zodResolver(createPartSchema),
		defaultValues: part
			? {
					sku: part.sku,
					name: part.name,
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
					category: "",
					supplierId: "",
				},
		mode: "all",
	});

	const pricePlaceholder = format.number(0, { minimumFractionDigits: 2 });

	async function onSubmit(values: z.infer<typeof createPartSchema>) {
		try {
			if (part) {
				await updatePart.mutateAsync({ id: part.id, values });
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
						name="sku"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.skuLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("parts.form.skuPlaceholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
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
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.categoryLabel")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder={t("parts.form.categoryPlaceholder")}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{partCategories.map((category) => (
											<SelectItem key={category} value={category}>
												{category}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="supplierId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("parts.form.supplierLabel")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue
												placeholder={t("parts.form.supplierPlaceholder")}
											/>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{suppliers.map((supplier) => (
											<SelectItem key={supplier.id} value={supplier.id}>
												{supplier.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
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
										min={0}
										placeholder="0"
										step="1"
										{...numberInputProps(field)}
									/>
								</FormControl>
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
