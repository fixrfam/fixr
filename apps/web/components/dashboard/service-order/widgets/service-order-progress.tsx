"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { serviceOrderStatuses } from "@fixr/schemas/service-orders";
import { toast } from "@pheralb/toast";
import { Check } from "lucide-react";
import { DeviceStatusBadge } from "@/components/dashboard/devices/device-status-badge";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type {
	ServiceOrderDetail,
	ServiceOrderStatus,
} from "@/lib/services/service-orders";
import { cn } from "@/lib/utils";
import { useChangeServiceOrderStatus } from "../store";

const STATUSES = serviceOrderStatuses.options;

/**
 * The order's lifecycle with the current step highlighted. Who can change the
 * status moves it here; the device's whereabouts follow.
 */
export function ServiceOrderProgress({ order }: { order: ServiceOrderDetail }) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const changeStatus = useChangeServiceOrderStatus(order.id);
	const toastError = useApiErrorToast();
	const current = STATUSES.indexOf(order.status);

	async function move(status: ServiceOrderStatus) {
		try {
			await changeStatus.mutateAsync(status);
			toast.success({ text: t("serviceOrders.statusCard.changed") });
		} catch (error) {
			toastError(error);
		}
	}

	return (
		<div className="space-y-4">
			<ol className="space-y-2">
				{STATUSES.map((status, index) => (
					<li className="flex items-center gap-2 text-2xs" key={status}>
						<span
							className={cn(
								"grid size-5 shrink-0 place-items-center rounded-full border",
								index < current && "border-primary bg-primary text-white",
								index === current &&
									"border-primary text-primary ring-2 ring-primary/30"
							)}
						>
							{index < current ? (
								<Check className="size-3" />
							) : (
								<span className="tabular-nums">{index + 1}</span>
							)}
						</span>
						<span
							className={cn(
								index === current
									? "font-semibold"
									: index > current && "text-muted-foreground"
							)}
						>
							{t(serviceOrderStatusKeys[status])}
						</span>
					</li>
				))}
			</ol>
			<div className="flex items-center justify-between gap-2 border-t pt-3 text-2xs">
				<span className="text-muted-foreground">
					{t("serviceOrders.fields.deviceStatus")}
				</span>
				<DeviceStatusBadge status={order.device.status} />
			</div>
			{ability.can(permissions.serviceOrders.changeStatus) && (
				<Select
					disabled={changeStatus.isPending}
					onValueChange={(value) => move(value as ServiceOrderStatus)}
					value={order.status}
				>
					<SelectTrigger
						aria-label={t("serviceOrders.statusCard.change")}
						className="w-full"
					>
						<span className="text-muted-foreground">
							{t("serviceOrders.statusCard.change")}
						</span>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUSES.map((status) => (
							<SelectItem key={status} value={status}>
								{t(serviceOrderStatusKeys[status])}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
}
