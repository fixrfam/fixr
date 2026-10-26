import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";
import { getPaginatedDataSchema } from "./utils";

export const serviceOrderStatuses = z.enum([
	"pending",
	"diagnosing",
	"waiting_approval",
	"approved",
	"fixing",
	"ready",
	"delivered",
]);

export const createServiceOrderPhotoSchema = z.object({
	uploadId: z
		.string({ error: i18nMessage("validation.upload.idRequired") })
		.min(1, { message: i18nMessage("validation.upload.idRequired") }),
	description: z
		.string()
		.max(255, {
			message: i18nMessage("validation.serviceOrder.photoDescriptionMax", {
				count: 255,
			}),
		})
		.optional()
		.nullable(),
});

const reportedDefect = z
	.string({ error: i18nMessage("validation.serviceOrder.issueRequired") })
	.trim()
	.min(1, { message: i18nMessage("validation.serviceOrder.issueRequired") })
	.max(65_535, { message: i18nMessage("validation.serviceOrder.issueMax") });

const observations = z
	.string()
	.max(65_535, { message: i18nMessage("validation.serviceOrder.notesMax") })
	.optional()
	.nullable();

/**
 * @description Body schema for opening a service order for a customer's
 * device. The customer is the device's owner.
 */
export const createServiceOrderSchema = z.object({
	deviceId: z
		.string()
		.cuid2({ message: i18nMessage("validation.serviceOrder.deviceRequired") }),
	reportedDefect,
	observations,
	photos: z
		.array(createServiceOrderPhotoSchema)
		.max(20, {
			message: i18nMessage("validation.serviceOrder.photosMax", { count: 20 }),
		})
		.default([]),
});

/** @description Body schema for editing the reported issue and the notes */
export const patchServiceOrderSchema = z.object({
	reportedDefect: reportedDefect.optional(),
	observations,
});

/** @description Body schema for moving a service order to another status */
export const changeServiceOrderStatusSchema = z.object({
	status: serviceOrderStatuses,
});

/** @description Kind of catalog item used on a service order */
export const serviceOrderItemTypes = z.enum(["part", "service"]);

const itemQuantity = z
	.number({
		error: i18nMessage("validation.serviceOrder.itemQuantityRequired"),
	})
	.int(i18nMessage("validation.serviceOrder.itemQuantityInteger"))
	.min(1, i18nMessage("validation.serviceOrder.itemQuantityMin"))
	.max(
		999,
		i18nMessage("validation.serviceOrder.itemQuantityMax", { count: 999 })
	);

const itemUnitPrice = z
	.number({ error: i18nMessage("validation.serviceOrder.itemPriceRequired") })
	.min(0, i18nMessage("validation.serviceOrder.itemPriceMin"));

/**
 * @description Body schema for adding a catalog part or service to a service
 * order. `unitPrice` defaults to the catalog price at the time it is added.
 */
export const addServiceOrderItemSchema = z.object({
	type: serviceOrderItemTypes,
	itemId: z.string().cuid2(i18nMessage("validation.serviceOrder.itemInvalid")),
	quantity: itemQuantity.default(1),
	unitPrice: itemUnitPrice.optional(),
});

/** @description Body schema for changing an item's quantity or price */
export const patchServiceOrderItemSchema = z.object({
	quantity: itemQuantity.optional(),
	unitPrice: itemUnitPrice.optional(),
});

/** @description Params schema for routes that target a service order */
export const serviceOrderIdParamsSchema = z.object({
	serviceOrderId: z.string().cuid2(),
});

/** @description Params schema for routes that target an item of a service order */
export const serviceOrderItemParamsSchema = serviceOrderIdParamsSchema.extend({
	itemId: z.string().cuid2(),
});

export const getServiceOrdersQuerySchema = getPaginatedDataSchema
	.extend({
		deviceCategoryId: z
			.string()
			.cuid2({
				message: i18nMessage("validation.serviceOrder.categoryInvalid"),
			})
			.optional(),
		employeeId: z
			.string()
			.cuid2({
				message: i18nMessage("validation.serviceOrder.assigneeInvalid"),
			})
			.optional(),
		status: serviceOrderStatuses.optional(),
		dateFrom: z.coerce
			.date({ message: i18nMessage("validation.serviceOrder.dateFromInvalid") })
			.optional(),
		dateTo: z.coerce
			.date({ message: i18nMessage("validation.serviceOrder.dateToInvalid") })
			.optional(),
	})
	.refine(
		(data) => {
			if (data.dateFrom && data.dateTo) {
				return data.dateFrom <= data.dateTo;
			}
			return true;
		},
		{
			message: i18nMessage("validation.serviceOrder.dateRange"),
			path: ["dateTo"],
		}
	);
