"use client";

import { useTranslation } from "@fixr/i18n/react";
import { Maximize2, Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { ServiceOrderDetailsLayout } from "@/components/dashboard/service-order/layout";
import { ServiceOrderActions } from "@/components/dashboard/service-order/service-order-details";
import {
	useOrderCode,
	useServiceOrder,
} from "@/components/dashboard/service-order/store";
import { Button } from "@/components/ui/button";
import { ResponsiveDialogDrawer } from "@/components/ui/responsive-dialog-drawer";
import { Skeleton } from "@/components/ui/skeleton";

/** An order opened from a list or the board, over it; "full screen" goes to its page. */
export default function ServiceOrderModal() {
	const { t } = useTranslation();
	const { subdomain, id } = useParams<{ subdomain: string; id: string }>();
	const { data: order, isPending } = useServiceOrder(id);
	const orderCode = useOrderCode();
	const fullPage = `/dashboard/${subdomain}/service-orders/${id}`;

	let body = (
		<p className="text-muted-foreground text-sm">
			{t("serviceOrders.detail.notFound")}
		</p>
	);
	if (isPending) {
		body = <Skeleton className="h-[32rem] w-full" />;
	} else if (order) {
		body = (
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<ServiceOrderActions order={order} />
					<Button
						// A full load: a client navigation would open this modal again.
						onClick={() => window.location.assign(fullPage)}
						size="sm"
						type="button"
						variant="ghost"
					>
						<Maximize2 className="size-3.5" />
						{t("serviceOrders.detail.fullScreen")}
					</Button>
				</div>
				<ServiceOrderDetailsLayout order={order} subdomain={subdomain} />
			</div>
		);
	}

	return (
		<ResponsiveDialogDrawer
			className="max-w-6xl!"
			description={t("serviceOrders.detail.description")}
			icon={<Wrench />}
			title={
				order
					? `${t("serviceOrders.detail.title")} ${orderCode(order.number)}`
					: t("serviceOrders.detail.title")
			}
		>
			{body}
		</ResponsiveDialogDrawer>
	);
}
