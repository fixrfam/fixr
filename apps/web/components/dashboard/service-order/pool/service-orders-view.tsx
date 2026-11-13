"use client";

import type { ServiceOrderScope } from "@/lib/services/service-orders";
import { ServiceOrdersTable } from "../table/service-order-table";
import { ServiceOrdersBoard } from "./service-orders-board";
import { useServiceOrdersView } from "./view-toggle";

/** A pool of orders (all, the caller's sector or the caller's own) as a list or a board. */
export function ServiceOrdersView({
	subdomain,
	scope = "all",
}: {
	subdomain: string;
	scope?: ServiceOrderScope;
}) {
	const [view] = useServiceOrdersView();

	return view === "board" ? (
		<ServiceOrdersBoard scope={scope} subdomain={subdomain} />
	) : (
		<ServiceOrdersTable scope={scope} subdomain={subdomain} />
	);
}
