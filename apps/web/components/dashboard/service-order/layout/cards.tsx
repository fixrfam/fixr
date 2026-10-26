import type { Translator } from "@fixr/i18n";
import {
	ClipboardList,
	FileUser,
	History,
	Image as ImageIcon,
	Package,
	User,
	Wrench,
} from "lucide-react";
import { DashLink } from "@/components/dashboard/service-order/dash-link";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { ServiceOrderImageGrid } from "@/components/dashboard/service-order/widgets/service-order-image-grid";
import { ServiceOrderIssue } from "@/components/dashboard/service-order/widgets/service-order-issue";
import { ServiceOrderItems } from "@/components/dashboard/service-order/widgets/service-order-items";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "@/components/dashboard/service-order/widgets/service-order-key-value";
import { ServiceOrderProgress } from "@/components/dashboard/service-order/widgets/service-order-progress";
import { formatCpf, formatPhone } from "@/lib/format";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import type { ServiceOrderDetail } from "@/lib/services/service-orders";
import { orderNumber } from "../order-number";
import { ServiceOrderStatusBadge } from "../service-order-status-badge";
import type { CardId } from "./utils/constants";

type CardsMap = Record<CardId, React.ReactNode>;

export function getCards(
	order: ServiceOrderDetail,
	{ t, format }: Pick<Translator, "t" | "format">,
	subdomain: string
): CardsMap {
	return {
		summary: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.summaryDescription")}
				icon={ClipboardList}
				title={t("serviceOrders.cards.summaryTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.number")}
						value={`#${orderNumber(order.id)}`}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.status")}
						value={
							<ServiceOrderStatusBadge
								className="rounded-lg px-2.5 py-1 font-semibold text-xs"
								variant={order.status}
							>
								{t(serviceOrderStatusKeys[order.status])}
							</ServiceOrderStatusBadge>
						}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.openedAt")}
						value={format.dateTime(order.createdAt)}
					/>
					{order.deviceCategory && (
						<ServiceOrderKeyValueItem
							label={t("serviceOrders.fields.category")}
							value={order.deviceCategory.name}
						/>
					)}
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.brand")}
						value={order.deviceMaker.name}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.model")}
						value={order.model.name}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		device: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.deviceDescription")}
				icon={Wrench}
				title={t("serviceOrders.cards.deviceTitle")}
			>
				<div className="space-y-3">
					<ServiceOrderKeyValueList>
						{order.device.imei && (
							<ServiceOrderKeyValueItem
								label={t("serviceOrders.fields.imei")}
								value={order.device.imei}
							/>
						)}
						{order.device.serialNumber && (
							<ServiceOrderKeyValueItem
								label={t("serviceOrders.fields.serialNumber")}
								value={order.device.serialNumber}
							/>
						)}
					</ServiceOrderKeyValueList>
					<ServiceOrderIssue order={order} />
				</div>
			</ServiceOrderDetailsCard>
		),
		technician: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.technicianDescription")}
				icon={User}
				title={t("serviceOrders.cards.technicianTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.assignee")}
						value={order.employee.name}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		customer: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.customerDescription")}
				icon={FileUser}
				title={t("serviceOrders.cards.customerTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.name")}
						value={
							<DashLink
								className="hover:underline"
								href={`/customers/${order.customer.id}`}
								subdomain={subdomain}
							>
								{order.customer.name}
							</DashLink>
						}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.document")}
						value={formatCpf(order.customer.cpf)}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.phone")}
						value={formatPhone(order.customer.phone)}
					/>
					{order.customer.email && (
						<ServiceOrderKeyValueItem
							label={t("serviceOrders.fields.email")}
							value={order.customer.email}
						/>
					)}
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		lifecycle: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.statusCard.description")}
				icon={History}
				title={t("serviceOrders.statusCard.title")}
			>
				<ServiceOrderProgress order={order} />
			</ServiceOrderDetailsCard>
		),
		parts: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.items.description")}
				icon={Package}
				title={t("serviceOrders.items.title")}
			>
				<ServiceOrderItems serviceOrderId={order.id} />
			</ServiceOrderDetailsCard>
		),
		images: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.imagesDescription")}
				icon={ImageIcon}
				title={t("serviceOrders.cards.imagesTitle")}
			>
				<ServiceOrderImageGrid images={order.photos} />
			</ServiceOrderDetailsCard>
		),
	};
}
