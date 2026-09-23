import type { Translator } from "@fixr/i18n";
import type { ServiceOrderRow } from "@fixr/mock";
import {
	ClipboardList,
	FileUser,
	History,
	Image as ImageIcon,
	Package,
	User,
	Wrench,
} from "lucide-react";
import { ServiceOrderLifecycle } from "@/components/dashboard/service-order/lifecycle";
import { ServiceOrderDetailsCard } from "@/components/dashboard/service-order/service-order-details-card";
import { ServiceOrderImageGrid } from "@/components/dashboard/service-order/widgets/service-order-image-grid";
import {
	ServiceOrderKeyValueItem,
	ServiceOrderKeyValueList,
} from "@/components/dashboard/service-order/widgets/service-order-key-value";
import { ServiceOrderPartsList } from "@/components/dashboard/service-order/widgets/service-order-parts-list";
import { serviceOrderStatusKeys } from "@/lib/i18n/labels";
import { ServiceOrderStatusBadge } from "../service-order-status-badge";
import type { CardId } from "./utils/constants";

type CardsMap = Record<CardId, React.ReactNode>;

export function getCards(order: ServiceOrderRow, t: Translator["t"]): CardsMap {
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
						value={order.orderNumber}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.status")}
						value={
							<ServiceOrderStatusBadge
								className="rounded-lg px-2.5 py-1 font-semibold text-xs"
								variant={order.status.id}
							>
								{t(serviceOrderStatusKeys[order.status.id])}
							</ServiceOrderStatusBadge>
						}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.category")}
						value={order.category}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.brand")}
						value={order.mark}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.model")}
						value={order.model}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		device: order.orderDetails ? (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.deviceDescription")}
				icon={Wrench}
				title={t("serviceOrders.cards.deviceTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.receivedAt")}
						value={order.orderDetails.receivedAt}
					/>
					{order.orderDetails.imei && (
						<ServiceOrderKeyValueItem
							label={t("serviceOrders.fields.imei")}
							value={order.orderDetails.imei}
						/>
					)}
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.description")}
						stacked
						value={order.orderDetails.description}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		) : null,
		technician: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.technicianDescription")}
				icon={User}
				title={t("serviceOrders.cards.technicianTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.assignee")}
						value={order.technician}
					/>
					{order.notes && (
						<ServiceOrderKeyValueItem
							label={t("serviceOrders.fields.notes")}
							stacked
							value={order.notes}
						/>
					)}
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		client: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.clientDescription")}
				icon={FileUser}
				title={t("serviceOrders.cards.clientTitle")}
			>
				<ServiceOrderKeyValueList>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.name")}
						value={order.client.name}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.document")}
						value={order.client.cpf}
					/>
					<ServiceOrderKeyValueItem
						label={t("serviceOrders.fields.phone")}
						value={order.client.phone}
					/>
				</ServiceOrderKeyValueList>
			</ServiceOrderDetailsCard>
		),
		lifecycle: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.lifecycleDescription")}
				icon={History}
				title={t("serviceOrders.cards.lifecycleTitle")}
			>
				{order.history.length > 0 ? (
					<ServiceOrderLifecycle
						currentStatus={order.status.id}
						history={order.history}
					/>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("serviceOrders.cards.noHistory")}
					</p>
				)}
			</ServiceOrderDetailsCard>
		),
		parts: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.partsDescription")}
				icon={Package}
				title={t("serviceOrders.cards.partsTitle")}
			>
				<ServiceOrderPartsList parts={order.parts} />
			</ServiceOrderDetailsCard>
		),
		images: (
			<ServiceOrderDetailsCard
				description={t("serviceOrders.cards.imagesDescription")}
				icon={ImageIcon}
				title={t("serviceOrders.cards.imagesTitle")}
			>
				<ServiceOrderImageGrid images={order.images} />
			</ServiceOrderDetailsCard>
		),
	};
}
