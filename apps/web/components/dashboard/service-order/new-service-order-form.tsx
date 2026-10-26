"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { createServiceOrderSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
	CustomerPicker,
	type PickedCustomer,
} from "@/components/dashboard/customers/customer-picker";
import {
	useCustomer,
	useSubdomain,
} from "@/components/dashboard/customers/store";
import { DeviceFormDialog } from "@/components/dashboard/devices/device-form-dialog";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import {
	useCustomerDevices,
	useDevice,
} from "@/components/dashboard/devices/store";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadServiceOrderPhoto } from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { useCreateServiceOrder } from "./store";

type Values = z.input<typeof createServiceOrderSchema>;

/** Developer-facing: this never reaches the screen, only the console. */
const IMAGE_READ_ERROR = "Failed to read the image file";
const MAX_PHOTOS = 20;

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(new Error(IMAGE_READ_ERROR));
		reader.readAsDataURL(file);
	});
}

function getFilePreviewKey(file: File): string {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Opens a service order for one of a customer's devices. `?customerId=` or
 * `?deviceId=` (from a customer or device page) fill the form in.
 */
export function NewServiceOrderForm({
	className,
	onCreated,
	...props
}: Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> & {
	onCreated?: (id: string) => void;
}) {
	const { t } = useTranslation();
	const router = useRouter();
	const subdomain = useSubdomain();
	const searchParams = useSearchParams();
	const ability = useCatalogAbility();
	const createServiceOrder = useCreateServiceOrder();
	const toastError = useApiErrorToast();

	const presetDevice = useDevice(searchParams.get("deviceId"));
	const presetCustomer = useCustomer(searchParams.get("customerId") ?? "");
	const [customer, setCustomer] = useState<PickedCustomer | null>(null);
	const [addingDevice, setAddingDevice] = useState(false);
	const [images, setImages] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);
	const { devices, loading: loadingDevices } = useCustomerDevices(customer?.id);

	const form = useForm<Values>({
		resolver: zodResolver(createServiceOrderSchema),
		defaultValues: { deviceId: "", reportedDefect: "", observations: "" },
		mode: "onTouched",
	});

	// Fill in what the link that opened the form points to.
	useEffect(() => {
		const device = presetDevice.data;
		if (device) {
			setCustomer(device.customer);
			form.setValue("deviceId", device.id);
		} else if (presetCustomer.data) {
			setCustomer(presetCustomer.data);
		}
	}, [presetDevice.data, presetCustomer.data, form]);

	const { data: previewUrlsByKey = {} } = useQuery<Record<string, string>>({
		queryKey: ["image-previews", images.map(getFilePreviewKey)],
		enabled: images.length > 0,
		queryFn: () =>
			Promise.all(
				images.map(
					async (file) =>
						[getFilePreviewKey(file), await fileToDataUrl(file)] as const
				)
			).then((entries) => Object.fromEntries(entries)),
		staleTime: Number.POSITIVE_INFINITY,
	});

	async function onSubmit(values: Values) {
		try {
			setUploading(images.length > 0);
			const uploadIds = await Promise.all(images.map(uploadServiceOrderPhoto));
			setUploading(false);
			const created = await createServiceOrder.mutateAsync({
				...values,
				observations: values.observations?.trim() ? values.observations : null,
				photos: uploadIds.map((uploadId) => ({ uploadId })),
			});
			toast.success({ text: t("serviceOrders.form.created") });
			if (onCreated) {
				onCreated(created.id);
			} else {
				router.push(`/dashboard/${subdomain}/service-orders/${created.id}`);
			}
		} catch (error) {
			setUploading(false);
			toastError(error);
		}
	}

	const saving = uploading || createServiceOrder.isPending;
	let devicePlaceholder = t("serviceOrders.form.devicePlaceholder");
	if (!customer) {
		devicePlaceholder = t("serviceOrders.form.deviceBlocked");
	} else if (!loadingDevices && devices.length === 0) {
		devicePlaceholder = t("serviceOrders.form.deviceEmpty");
	}

	return (
		<Form {...form}>
			<form
				className={cn("space-y-4", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<FormItem>
					<FormLabel htmlFor="order-customer">
						{t("serviceOrders.form.customerLabel")}
					</FormLabel>
					<CustomerPicker
						id="order-customer"
						onChange={(picked) => {
							setCustomer(picked);
							form.setValue("deviceId", "");
						}}
						value={customer}
					/>
				</FormItem>

				<FormField
					control={form.control}
					name="deviceId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("serviceOrders.form.deviceLabel")}</FormLabel>
							<div className="flex gap-2">
								<Select
									disabled={!customer || devices.length === 0}
									// Radix clears the value while the options are still loading.
									onValueChange={(value) => value && field.onChange(value)}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full min-w-0">
											<SelectValue placeholder={devicePlaceholder} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{devices.map((device) => (
											<SelectItem key={device.id} value={device.id}>
												<span className="truncate">
													{device.model.name}
													{device.imei && ` · ${device.imei}`}
												</span>
												<DeviceStatusBadge
													className="ml-2"
													status={device.status}
												/>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{ability.can(permissions.devices.create) && (
									<Button
										className="shrink-0"
										disabled={!customer}
										onClick={() => setAddingDevice(true)}
										type="button"
										variant="outline"
									>
										<Plus className="size-3.5" />
										{t("serviceOrders.form.newDevice")}
									</Button>
								)}
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reportedDefect"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("serviceOrders.form.issueLabel")}</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("serviceOrders.form.issuePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="observations"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("serviceOrders.form.notesLabel")}</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("serviceOrders.form.notesPlaceholder")}
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="space-y-3">
					<p className="font-medium text-sm">
						{t("serviceOrders.form.imagesLabel")}
					</p>
					<input
						accept="image/*"
						className="hidden"
						id="images-upload"
						multiple
						onChange={(e) => {
							const picked = Array.from(e.target.files ?? []);
							setImages((current) =>
								[...current, ...picked].slice(0, MAX_PHOTOS)
							);
							e.target.value = "";
						}}
						type="file"
					/>
					<label
						className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-muted-foreground text-sm hover:bg-accent hover:text-foreground"
						htmlFor="images-upload"
					>
						<span>
							{images.length > 0
								? t("serviceOrders.form.imagesSelected", {
										count: images.length,
									})
								: t("serviceOrders.form.imagesPlaceholder")}
						</span>
						<ImagePlus className="h-4 w-4" />
					</label>
					{images.length > 0 && (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{images.map((file) => {
								const fileKey = getFilePreviewKey(file);
								const url = previewUrlsByKey[fileKey];
								return url ? (
									<div
										className="relative aspect-square overflow-hidden rounded-md border"
										key={fileKey}
									>
										<img
											alt={file.name}
											className="h-full w-full object-cover"
											height={320}
											src={url}
											width={320}
										/>
										<button
											aria-label={t("serviceOrders.form.imageRemove", {
												name: file.name,
											})}
											className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
											onClick={() =>
												setImages((current) =>
													current.filter(
														(f) => getFilePreviewKey(f) !== fileKey
													)
												)
											}
											type="button"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								) : null;
							})}
						</div>
					)}
				</div>

				<div className="pt-4">
					<Button className="w-full" disabled={saving} type="submit">
						{t("serviceOrders.form.submit")}
						{saving && <Loader2 className="animate-spin" />}
					</Button>
				</div>
			</form>

			{customer && (
				<DeviceFormDialog
					customer={customer}
					onOpenChange={setAddingDevice}
					onSaved={(device) =>
						form.setValue("deviceId", device.id, { shouldValidate: true })
					}
					open={addingDevice}
				/>
			)}
		</Form>
	);
}
