import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import type { serviceOrderStatuses } from "./service-orders";
import { getPaginatedDataSchema } from "./utils";

/** @description Where a customer's device is right now */
export const deviceStatuses = z.enum([
	"in_shop",
	"ready_for_pickup",
	"with_customer",
]);

/** @description Body schema for registering a customer's device */
export const createDeviceSchema = z.object({
	clientId: z.string().cuid2(i18nMessage("validation.device.clientRequired")),
	modelId: z.string().cuid2(i18nMessage("validation.device.modelRequired")),
	imei: z
		.string()
		.trim()
		.max(50, i18nMessage("validation.device.imeiMax", { count: 50 }))
		.optional()
		.nullable(),
	serialNumber: z
		.string()
		.trim()
		.max(100, i18nMessage("validation.device.serialNumberMax", { count: 100 }))
		.optional()
		.nullable(),
	notes: z
		.string()
		.trim()
		.max(1000, i18nMessage("validation.device.notesMax", { count: 1000 }))
		.optional()
		.nullable(),
	status: deviceStatuses.optional(),
});

/**
 * @description Body schema for updating a device. The owner can't change: a
 * device sold to someone else is registered again for the new customer.
 */
export const patchDeviceSchema = createDeviceSchema
	.omit({ clientId: true })
	.partial();

/** @description Query schema for listing devices: pagination, search and filters */
export const getDevicesQuerySchema = getPaginatedDataSchema.extend({
	clientId: z.string().cuid2().optional(),
	status: deviceStatuses.optional(),
	sort: z.enum(["newer", "older", "updated"]).optional(),
});

/** @description Params schema for routes that target a single device */
export const deviceIdParamsSchema = z.object({
	deviceId: z.string().cuid2(),
});

/**
 * Where a device is while its service order is in a status: in the shop
 * during the repair, waiting for pickup when it's ready, back with the
 * customer once delivered.
 */
export function deviceStatusFor(
	status: z.infer<typeof serviceOrderStatuses>
): z.infer<typeof deviceStatuses> {
	if (status === "delivered") {
		return "with_customer";
	}
	return status === "ready" ? "ready_for_pickup" : "in_shop";
}
