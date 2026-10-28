"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import {
	ClipboardList,
	ClipboardPlus,
	FileUser,
	Pencil,
	Plus,
	Smartphone,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/dashboard/back-button";
import { DeleteDeviceDialog } from "@/components/dashboard/devices/delete-device-dialog";
import { DeviceActions } from "@/components/dashboard/devices/device-actions";
import { DeviceFormDialog } from "@/components/dashboard/devices/device-form-dialog";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import { useCustomerDevices } from "@/components/dashboard/devices/store";
import { Heading } from "@/components/dashboard/heading";
import { ModelImage } from "@/components/dashboard/models/model-image";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { ServiceOrderStatusBadge } from "@/components/dashboard/service-order/service-order-status-badge";
import { useOrderCode } from "@/components/dashboard/service-order/store";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "@/components/dashboard/service-order/widgets/service-order-key-value";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCpf, formatPhone } from "@/lib/format";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type { DeviceRow } from "@/lib/services/devices";
import { CustomerAvatar } from "./customer-avatar";
import { CustomerForm } from "./customer-form";
import { useCustomer, useDeleteCustomer, useSubdomain } from "./store";

/** A customer with their contact data, devices and latest service orders. */
export function CustomerDetails({ id }: { id: string }) {
	const { t, format } = useTranslation();
	const router = useRouter();
	const subdomain = useSubdomain();
	const ability = useCatalogAbility();
	const toastError = useApiErrorToast();
	const customerQuery = useCustomer(id);
	const { devices, loading: devicesLoading } = useCustomerDevices(id);
	const deleteCustomer = useDeleteCustomer();
	const orderCode = useOrderCode();

	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [addingDevice, setAddingDevice] = useState(false);
	const [editingDevice, setEditingDevice] = useState<DeviceRow | undefined>();
	const [deletingDevice, setDeletingDevice] = useState<string | null>(null);

	const customer = customerQuery.data;

	if (customerQuery.isPending) {
		return <Skeleton className="h-96 w-full rounded-md" />;
	}
	if (!customer) {
		return (
			<div className="space-y-4">
				<BackButton className="-translate-x-3" />
				<p className="text-muted-foreground text-sm">
					{t("customers.detail.notFound")}
				</p>
			</div>
		);
	}

	async function remove() {
		try {
			await deleteCustomer.mutateAsync(id);
			toast.success({ text: t("customers.detail.deleted") });
			router.push(`/dashboard/${subdomain}/customers`);
		} catch (error) {
			toastError(error);
		}
	}

	const owner = { id: customer.id, name: customer.name, cpf: customer.cpf };

	return (
		<div className="space-y-6">
			<BackButton className="-translate-x-3" />
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<CustomerAvatar className="size-12" customer={customer} />
					<Heading
						description={t("customers.detail.description")}
						title={customer.name}
					/>
				</div>
				<div className="flex flex-wrap gap-2">
					{ability.can(permissions.serviceOrders.create) && (
						<Button asChild>
							<DashLink
								href={`/service-orders/new?customerId=${customer.id}`}
								subdomain={subdomain}
							>
								<ClipboardPlus className="size-3.5" />
								{t("serviceOrders.table.newOrder")}
							</DashLink>
						</Button>
					)}
					{ability.can(permissions.customers.update) && (
						<Button onClick={() => setEditing(true)} variant="outline">
							<Pencil className="size-3.5" />
							{t("customers.detail.edit")}
						</Button>
					)}
					{ability.can(permissions.customers.delete) && (
						<Button onClick={() => setConfirmDelete(true)} variant="ghost">
							<Trash2 className="size-3.5" />
							{t("customers.detail.delete")}
						</Button>
					)}
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<ServiceOrderDetailsCard
					description={t("customers.detail.dataDescription")}
					icon={FileUser}
					title={t("customers.detail.dataTitle")}
				>
					<ServiceOrderKeyValueList>
						<ServiceOrderKeyValueItem
							label={t("customers.form.documentLabel")}
							value={formatCpf(customer.cpf)}
						/>
						<ServiceOrderKeyValueItem
							label={t("customers.form.phoneLabel")}
							value={formatPhone(customer.phone)}
						/>
						{customer.alternativePhone && (
							<ServiceOrderKeyValueItem
								label={t("customers.form.alternativePhoneLabel")}
								value={formatPhone(customer.alternativePhone)}
							/>
						)}
						<ServiceOrderKeyValueItem
							label={t("customers.form.emailLabel")}
							value={customer.email}
						/>
						<ServiceOrderKeyValueItem
							label={t("customers.form.addressLabel")}
							stacked
							value={[customer.address, customer.city, customer.state]
								.filter(Boolean)
								.join(", ")}
						/>
					</ServiceOrderKeyValueList>
				</ServiceOrderDetailsCard>

				<ServiceOrderDetailsCard
					description={t("customers.detail.devicesDescription")}
					icon={Smartphone}
					title={t("customers.detail.devicesTitle")}
				>
					<div className="space-y-3">
						<CustomerDevicesList
							devices={devices}
							loading={devicesLoading}
							onDelete={(d) => setDeletingDevice(d.id)}
							onEdit={setEditingDevice}
						/>
						{ability.can(permissions.devices.create) && (
							<Button
								className="w-full"
								onClick={() => setAddingDevice(true)}
								size="sm"
								variant="outline"
							>
								<Plus className="size-3.5" />
								{t("customers.detail.addDevice")}
							</Button>
						)}
					</div>
				</ServiceOrderDetailsCard>

				<ServiceOrderDetailsCard
					description={t("customers.detail.ordersDescription")}
					icon={ClipboardList}
					title={t("customers.detail.ordersTitle")}
				>
					{customer.serviceOrders.length === 0 ? (
						<p className="text-2xs text-muted-foreground">
							{t("customers.detail.noOrders")}
						</p>
					) : (
						<ul className="divide-y">
							{customer.serviceOrders.map((order) => (
								<li key={order.id}>
									<DashLink
										className="flex items-center justify-between gap-2 py-2 hover:underline"
										href={`/service-orders/${order.id}`}
										subdomain={subdomain}
									>
										<div className="min-w-0">
											<p className="truncate font-medium text-2xs">
												<span className="tabular-nums">
													{orderCode(order.number)}
												</span>{" "}
												· {order.deviceModel}
											</p>
											<p className="text-2xs text-muted-foreground">
												{format.date(order.createdAt)}
											</p>
										</div>
										<ServiceOrderStatusBadge variant={order.status}>
											{t(serviceOrderStatusKeys[order.status])}
										</ServiceOrderStatusBadge>
									</DashLink>
								</li>
							))}
						</ul>
					)}
				</ServiceOrderDetailsCard>
			</div>

			<Sheet onOpenChange={setEditing} open={editing}>
				<SheetContent className="overflow-y-auto">
					<SheetHeader>
						<SheetTitle>{t("customers.detail.editTitle")}</SheetTitle>
						<SheetDescription>
							{t("customers.detail.editDescription")}
						</SheetDescription>
					</SheetHeader>
					<CustomerForm
						className="px-4 pb-4"
						customer={customer}
						onSaved={() => setEditing(false)}
					/>
				</SheetContent>
			</Sheet>

			<AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("customers.detail.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("customers.detail.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("customers.detail.deleteCancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={deleteCustomer.isPending}
							onClick={(event) => {
								event.preventDefault();
								remove();
							}}
						>
							{t("customers.detail.deleteConfirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<DeviceFormDialog
				customer={owner}
				onOpenChange={setAddingDevice}
				open={addingDevice}
			/>
			<DeviceFormDialog
				device={editingDevice}
				onOpenChange={(open) => !open && setEditingDevice(undefined)}
				open={Boolean(editingDevice)}
			/>
			<DeleteDeviceDialog
				deviceId={deletingDevice}
				onOpenChange={(open) => !open && setDeletingDevice(null)}
			/>
		</div>
	);
}

function CustomerDevicesList({
	devices,
	loading,
	onEdit,
	onDelete,
}: {
	devices: DeviceRow[];
	loading: boolean;
	onEdit: (device: DeviceRow) => void;
	onDelete: (device: DeviceRow) => void;
}) {
	const { t } = useTranslation();

	if (loading && devices.length === 0) {
		return <Skeleton className="h-16 w-full" />;
	}
	if (devices.length === 0) {
		return (
			<p className="text-2xs text-muted-foreground">
				{t("devices.detail.empty")}
			</p>
		);
	}

	return (
		<ul className="divide-y">
			{devices.map((device) => (
				<li
					className="flex items-center justify-between gap-2 py-2"
					key={device.id}
				>
					<div className="flex min-w-0 items-center gap-2.5">
						<ModelImage
							alt={device.model.name}
							category={device.category?.slug}
							className="size-10"
							src={device.model.imageUrl}
						/>
						<div className="min-w-0">
							<p className="truncate font-medium text-2xs">
								{device.model.name}
							</p>
							<p className="truncate text-2xs text-muted-foreground tabular-nums">
								{device.imei ??
									device.serialNumber ??
									t("devices.table.noIdentifiers")}
							</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-1">
						<DeviceStatusBadge status={device.status} />
						<DeviceActions
							device={device}
							onDelete={onDelete}
							onEdit={onEdit}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}
