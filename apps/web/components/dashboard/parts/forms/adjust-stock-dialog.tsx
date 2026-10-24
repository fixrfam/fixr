"use client";

import { useTranslation } from "@fixr/i18n/react";
import { adjustPartStockSchema } from "@fixr/schemas/parts";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Loader2, PackagePlus, Save } from "lucide-react";
import { useState } from "react";
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
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import type { PartRow } from "@/lib/services/inventory";
import { useAdjustPartStock } from "../store";
import { useApiErrorToast } from "./api-feedback";
import { numberInputProps } from "./number-input";

type AdjustStockValues = z.infer<typeof adjustPartStockSchema>;

function AdjustStockForm({
	part,
	onDone,
}: {
	part: Pick<PartRow, "id" | "stock">;
	onDone: () => void;
}) {
	const { t } = useTranslation();
	const adjustStock = useAdjustPartStock();
	const toastError = useApiErrorToast();

	const form = useForm<AdjustStockValues>({
		resolver: zodResolver(adjustPartStockSchema),
		mode: "all",
	});
	const delta = form.watch("delta");

	async function onSubmit(values: AdjustStockValues) {
		try {
			await adjustStock.mutateAsync({ id: part.id, delta: values.delta });
			toast.success({ text: t("parts.stockAdjustment.success") });
			onDone();
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="delta"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("parts.stockAdjustment.deltaLabel")}</FormLabel>
							<FormControl>
								<Input
									autoFocus
									placeholder="0"
									step="1"
									{...numberInputProps(field)}
								/>
							</FormControl>
							<FormDescription>
								{Number.isInteger(delta) && delta !== 0
									? t("parts.stockAdjustment.preview", {
											current: part.stock,
											next: part.stock + delta,
										})
									: t("parts.stockAdjustment.deltaDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					className="w-full"
					disabled={adjustStock.isPending}
					type="submit"
				>
					{t("parts.stockAdjustment.submit")}{" "}
					{adjustStock.isPending ? (
						<Loader2 className="animate-spin" />
					) : (
						<Save />
					)}
				</Button>
			</form>
		</Form>
	);
}

/** Adds or removes units of a part. Stock never changes through the part form. */
export function AdjustStockDialog({
	part,
}: {
	part: Pick<PartRow, "id" | "name" | "stock">;
}) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);

	return (
		<ResponsiveDialogDrawer
			description={t("parts.stockAdjustment.description", { name: part.name })}
			icon={<PackagePlus />}
			onOpenChange={setOpen}
			open={open}
			title={t("parts.stockAdjustment.title")}
			trigger={
				<Button
					aria-label={t("parts.stockAdjustment.triggerLabel", {
						name: part.name,
					})}
					onClick={(e) => e.stopPropagation()}
					size="sm"
					type="button"
					variant="outline"
				>
					<PackagePlus className="size-3.5" />{" "}
					{t("parts.stockAdjustment.trigger")}
				</Button>
			}
		>
			{open && <AdjustStockForm onDone={() => setOpen(false)} part={part} />}
		</ResponsiveDialogDrawer>
	);
}
