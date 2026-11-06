"use client";

import { useTranslation } from "@fixr/i18n/react";
import { createDeviceSchema } from "@fixr/schemas/devices";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Loader2, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
	CustomerPicker,
	type PickedCustomer,
} from "@/components/dashboard/customers/customer-picker";
import { StackedDialog } from "@/components/dashboard/dialog-stack";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import type { DeviceRow } from "@/lib/services/devices";
import { DEVICE_STATUSES } from "./device-status-badge";
import { ModelPicker, type PickedModel } from "./model-picker";
import { useCreateDevice, useUpdateDevice } from "./store";

type Values = z.input<typeof createDeviceSchema>;

/**
 * Registers a device or, with `device`, edits it. `customer` fixes the owner
 * (from a customer's page or a service order being opened).
 */
export function DeviceFormDialog({
	open,
	onOpenChange,
	device,
	customer,
	onSaved,
	compact,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	device?: DeviceRow;
	customer?: PickedCustomer;
	onSaved?: (device: DeviceRow) => void;
	/** See {@link DeviceForm}. */
	compact?: boolean;
}) {
	const { t } = useTranslation();

	return (
		<StackedDialog
			description={t(
				device
					? "devices.form.editDescription"
					: "devices.form.createDescription"
			)}
			icon={<Smartphone />}
			onOpenChange={onOpenChange}
			open={open}
			title={t(device ? "devices.form.editTitle" : "devices.form.createTitle")}
		>
			{open && (
				<DeviceForm
					compact={compact}
					customer={customer}
					device={device}
					onSaved={(saved) => {
						onOpenChange(false);
						onSaved?.(saved);
					}}
				/>
			)}
		</StackedDialog>
	);
}

/**
 * The device fields. `compact` (inline on a new service order, which fixes
 * the owner and checks the device in) leaves out the owner and the status.
 */
export function DeviceForm({
	device,
	customer,
	onSaved,
	compact = false,
}: {
	device?: DeviceRow;
	customer?: PickedCustomer;
	onSaved: (device: DeviceRow) => void;
	compact?: boolean;
}) {
	const { t } = useTranslation();
	const createDevice = useCreateDevice();
	const updateDevice = useUpdateDevice();
	const toastError = useApiErrorToast();
	const saving = createDevice.isPending || updateDevice.isPending;

	const [owner, setOwner] = useState<PickedCustomer | null>(
		device ? device.customer : (customer ?? null)
	);
	const [model, setModel] = useState<PickedModel | null>(
		device
			? {
					id: device.model.id,
					name: device.model.name,
					maker: device.maker.name,
					imageUrl: device.model.imageUrl,
					category: device.category?.slug,
				}
			: null
	);

	const form = useForm<Values>({
		resolver: zodResolver(createDeviceSchema),
		defaultValues: {
			customerId: owner?.id ?? "",
			modelId: model?.id ?? "",
			imei: device?.imei ?? "",
			serialNumber: device?.serialNumber ?? "",
			notes: device?.notes ?? "",
			status: device?.status ?? "with_customer",
		},
	});

	async function onSubmit(values: Values) {
		try {
			const { customerId, ...changes } = values;
			const saved = device
				? await updateDevice.mutateAsync({ id: device.id, values: changes })
				: await createDevice.mutateAsync(values);
			toast.success({
				text: t(device ? "devices.form.updated" : "devices.form.created"),
			});
			onSaved(saved);
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<Form {...form}>
			<form
				className="grid gap-4"
				onSubmit={(e) => {
					// Opened over other forms (a new order): keep their submit out of it.
					e.stopPropagation();
					form.handleSubmit(onSubmit)(e);
				}}
			>
				{!compact && (
					<FormField
						control={form.control}
						name="customerId"
						render={({ field }) => (
							<FormItem>
								<FormLabel htmlFor="device-owner">
									{t("devices.form.customerLabel")}
								</FormLabel>
								<CustomerPicker
									disabled={Boolean(device || customer)}
									id="device-owner"
									onChange={(picked) => {
										setOwner(picked);
										field.onChange(picked.id);
									}}
									value={owner}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="modelId"
					render={({ field }) => (
						<FormItem>
							<FormLabel htmlFor="device-model">
								{t("devices.form.modelLabel")}
							</FormLabel>
							<ModelPicker
								id="device-model"
								onChange={(picked) => {
									setModel(picked);
									field.onChange(picked.id);
								}}
								value={model}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="imei"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("devices.form.imeiLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("devices.form.imeiPlaceholder")}
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="serialNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("devices.form.serialNumberLabel")}</FormLabel>
								<FormControl>
									<Input
										placeholder={t("devices.form.serialNumberPlaceholder")}
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				{!compact && (
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("devices.form.statusLabel")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{DEVICE_STATUSES.map((status) => (
											<SelectItem key={status} value={status}>
												{t(`devices.status.${status}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("devices.form.notesLabel")}</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("devices.form.notesPlaceholder")}
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="w-full" disabled={saving} type="submit">
					{t(device ? "devices.form.save" : "devices.form.create")}
					{saving && <Loader2 className="animate-spin" />}
				</Button>
			</form>
		</Form>
	);
}
