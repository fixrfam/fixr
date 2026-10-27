"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { createServiceOrderSchema } from "@fixr/schemas/service-orders";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@pheralb/toast";
import { Check, Loader2, Plus, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	type ComponentPropsWithoutRef,
	useEffect,
	useRef,
	useState,
} from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CustomerForm } from "@/components/dashboard/customers/customer-form";
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
import { StackedDialog } from "@/components/dashboard/dialog-stack";
import { ModelImage } from "@/components/dashboard/models/model-image";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { DeviceRow } from "@/lib/services/devices";
import { uploadServiceOrderPhoto } from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { useCreateServiceOrder } from "./store";
import { type GalleryPhoto, PhotoGallery } from "./widgets/photo-gallery";

type Values = z.input<typeof createServiceOrderSchema>;

const MAX_PHOTOS = 20;

interface LocalPhoto extends GalleryPhoto {
	file: File;
}

/** Photos picked before the order exists, previewed from memory. */
function useLocalPhotos() {
	const [photos, setPhotos] = useState<LocalPhoto[]>([]);
	const latest = useRef(photos);
	latest.current = photos;

	// The previews are object URLs: free them when the form goes away.
	useEffect(
		() => () => {
			for (const photo of latest.current) {
				URL.revokeObjectURL(photo.src);
			}
		},
		[]
	);

	return {
		photos,
		add: (files: File[]) =>
			setPhotos((current) => [
				...current,
				...files.slice(0, MAX_PHOTOS - current.length).map((file) => ({
					id: crypto.randomUUID(),
					src: URL.createObjectURL(file),
					name: file.name,
					file,
				})),
			]),
		remove: (id: string) =>
			setPhotos((current) => {
				const photo = current.find((item) => item.id === id);
				if (photo) {
					URL.revokeObjectURL(photo.src);
				}
				return current.filter((item) => item.id !== id);
			}),
		clear: () =>
			setPhotos((current) => {
				for (const photo of current) {
					URL.revokeObjectURL(photo.src);
				}
				return [];
			}),
	};
}

/** One of the customer's devices, as a card to pick. */
function DeviceOption({
	device,
	selected,
	onSelect,
}: {
	device: DeviceRow;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			aria-pressed={selected}
			className={cn(
				"relative flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-[border-color,background-color,box-shadow] active:scale-[0.99]",
				"hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				selected && "border-primary bg-primary/5 ring-1 ring-primary"
			)}
			onClick={onSelect}
			type="button"
		>
			<ModelImage
				alt={device.model.name}
				category={device.category?.slug}
				className="size-12 rounded-lg"
				src={device.model.imageUrl}
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-sm">{device.model.name}</p>
				<p className="truncate text-muted-foreground text-xs tabular-nums">
					{[device.maker.name, device.imei ?? device.serialNumber]
						.filter(Boolean)
						.join(" · ")}
				</p>
				<DeviceStatusBadge className="mt-1.5" status={device.status} />
			</div>
			<span
				className={cn(
					"grid size-5 shrink-0 place-items-center self-start rounded-full border transition-colors",
					selected
						? "border-primary bg-primary text-white"
						: "border-border bg-background"
				)}
			>
				{selected && <Check className="size-3" />}
			</span>
		</button>
	);
}

/**
 * Opens a service order for one of a customer's devices. A customer or a
 * device that isn't registered yet is added in a dialog over this one (for
 * who can), and comes back picked. `?customerId=` or `?deviceId=` (from a
 * customer or device page) fill the form in.
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
	const photos = useLocalPhotos();

	const presetDevice = useDevice(searchParams.get("deviceId"));
	const presetCustomer = useCustomer(searchParams.get("customerId") ?? "");
	const [customer, setCustomer] = useState<PickedCustomer | null>(null);
	const [addingCustomer, setAddingCustomer] = useState(false);
	const [addingDevice, setAddingDevice] = useState(false);
	const [uploading, setUploading] = useState(false);
	const { devices, loading: loadingDevices } = useCustomerDevices(customer?.id);
	const canAddCustomer = ability.can(permissions.customers.create);
	const canAddDevice = ability.can(permissions.devices.create);

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

	function pickCustomer(picked: PickedCustomer) {
		setCustomer(picked);
		setAddingCustomer(false);
		form.setValue("deviceId", "");
	}

	async function onSubmit(values: Values) {
		try {
			setUploading(photos.photos.length > 0);
			const uploadIds = await Promise.all(
				photos.photos.map((photo) => uploadServiceOrderPhoto(photo.file))
			);
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

	return (
		<Form {...form}>
			<form
				className={cn("grid gap-6", className)}
				onSubmit={form.handleSubmit(onSubmit)}
				{...props}
			>
				<div className="grid gap-2">
					<Label htmlFor="order-customer">
						{t("serviceOrders.form.customerLabel")}
					</Label>
					<div className="flex gap-2">
						<div className="min-w-0 flex-1">
							<CustomerPicker
								id="order-customer"
								onChange={pickCustomer}
								value={customer}
							/>
						</div>
						{canAddCustomer && (
							<Button
								className="shrink-0"
								onClick={() => setAddingCustomer(true)}
								type="button"
								variant="outline"
							>
								<UserPlus />
								<span className="max-sm:sr-only">
									{t("serviceOrders.form.newCustomer")}
								</span>
							</Button>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{t("serviceOrders.form.customerDescription")}
					</p>
				</div>

				<FormField
					control={form.control}
					name="deviceId"
					render={({ field }) => (
						<FormItem className="gap-2">
							<div className="flex h-8 items-center justify-between gap-2">
								<FormLabel>{t("serviceOrders.form.deviceLabel")}</FormLabel>
								{canAddDevice && customer && devices.length > 0 && (
									<Button
										onClick={() => setAddingDevice(true)}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Plus />
										{t("serviceOrders.form.newDevice")}
									</Button>
								)}
							</div>
							<FormDescription className="-mt-1 text-xs">
								{t("serviceOrders.form.deviceDescription")}
							</FormDescription>
							{!customer && (
								<p className="grid min-h-20 place-items-center rounded-xl border border-dashed px-4 text-center text-muted-foreground text-sm">
									{t("serviceOrders.form.deviceBlocked")}
								</p>
							)}
							{customer && loadingDevices && devices.length === 0 && (
								<div className="grid gap-2 sm:grid-cols-2">
									<Skeleton className="h-[4.75rem] rounded-xl" />
									<Skeleton className="h-[4.75rem] rounded-xl" />
								</div>
							)}
							{customer && !loadingDevices && devices.length === 0 && (
								<div className="flex min-h-20 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 text-center sm:flex-row sm:justify-between sm:text-left">
									<p className="text-muted-foreground text-sm">
										{t("serviceOrders.form.deviceEmpty")}
									</p>
									{canAddDevice && (
										<Button
											onClick={() => setAddingDevice(true)}
											type="button"
											variant="outline"
										>
											<Plus />
											{t("serviceOrders.form.newDevice")}
										</Button>
									)}
								</div>
							)}
							{devices.length > 0 && (
								<fieldset
									aria-label={t("serviceOrders.form.deviceSection")}
									className="m-0 grid max-h-[17rem] min-w-0 gap-2 overflow-y-auto border-0 p-0.5 sm:grid-cols-2"
								>
									{devices.map((device) => (
										<DeviceOption
											device={device}
											key={device.id}
											onSelect={() => field.onChange(device.id)}
											selected={field.value === device.id}
										/>
									))}
								</fieldset>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reportedDefect"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel>{t("serviceOrders.form.issueLabel")}</FormLabel>
							<FormControl>
								<Textarea
									className="min-h-24"
									placeholder={t("serviceOrders.form.issuePlaceholder")}
									{...field}
								/>
							</FormControl>
							<FormDescription className="text-xs">
								{t("serviceOrders.form.issueDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="observations"
					render={({ field }) => (
						<FormItem className="gap-2">
							<FormLabel>{t("serviceOrders.form.notesLabel")}</FormLabel>
							<FormControl>
								<Textarea
									placeholder={t("serviceOrders.form.notesPlaceholder")}
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormDescription className="text-xs">
								{t("serviceOrders.form.notesDescription")}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid gap-2">
					<div className="grid gap-1">
						<Label>{t("serviceOrders.form.imagesLabel")}</Label>
						<p className="text-muted-foreground text-xs">
							{t("serviceOrders.form.imagesDescription")}
						</p>
					</div>
					<PhotoGallery
						max={MAX_PHOTOS}
						onAdd={photos.add}
						onRemove={photos.remove}
						onRemoveAll={photos.clear}
						photos={photos.photos}
					/>
				</div>

				<Button className="w-full" disabled={saving} size="lg" type="submit">
					{t("serviceOrders.form.submit")}
					{saving && <Loader2 className="animate-spin" />}
				</Button>
			</form>

			{/* Outside the order's <form>: their own submits never reach it. */}
			<StackedDialog
				className="sm:max-w-2xl"
				description={t("serviceOrders.form.newCustomerHint")}
				icon={<UserPlus />}
				onOpenChange={setAddingCustomer}
				open={addingCustomer}
				title={t("serviceOrders.form.newCustomer")}
			>
				<CustomerForm cols={2} onSaved={(saved) => pickCustomer(saved)} />
			</StackedDialog>
			{customer && (
				<DeviceFormDialog
					compact
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
