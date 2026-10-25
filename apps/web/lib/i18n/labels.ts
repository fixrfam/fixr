import type { StaticTranslationKey } from "@fixr/i18n";
import type { employeeRoles } from "@fixr/schemas/roles";
import type { z } from "zod";
import type { ServiceOrderStatusId } from "@/lib/utils/service-orders";

/**
 * Translation key for each employee role.
 *
 * Roles are ids on the wire, so the label lives here and the catalog holds
 * the copy. Adding a role to `@fixr/schemas` breaks this map until it is
 * translated.
 */
export const roleLabelKeys: Record<
	z.infer<typeof employeeRoles>,
	StaticTranslationKey
> = {
	guest: "roles.guest",
	admin: "roles.admin",
	manager: "roles.manager",
	financial: "roles.financial",
	warehouse: "roles.warehouse",
	technician: "roles.technician",
};

/** Translation key for each service order status the API can report. */
export const serviceOrderStatusKeys: Record<
	ServiceOrderStatusId,
	StaticTranslationKey
> = {
	registered: "serviceOrders.status.registered",
	parts_pending: "serviceOrders.status.parts_pending",
	analysis: "serviceOrders.status.analysis",
	finished: "serviceOrders.status.finished",
	canceled: "serviceOrders.status.canceled",
	quote_pending: "serviceOrders.status.quote_pending",
	approval_pending: "serviceOrders.status.approval_pending",
	in_progress: "serviceOrders.status.in_progress",
	ready_for_pickup: "serviceOrders.status.ready_for_pickup",
};
