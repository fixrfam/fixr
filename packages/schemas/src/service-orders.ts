import { i18nMessage } from "@fixr/i18n";
import { formattedIMEI } from "@fixr/schemas/common";
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

export const createServiceOrderMockSchema = z.object({
	clientId: z
		.string()
		.cuid2({ message: i18nMessage("validation.serviceOrder.clientInvalid") }),
	deviceBrandId: z
		.string()
		.cuid2({ message: i18nMessage("validation.serviceOrder.brandInvalid") }),
	deviceCategoryId: z
		.string()
		.cuid2({ message: i18nMessage("validation.serviceOrder.categoryInvalid") }),
	deviceModel: z
		.string({ error: i18nMessage("validation.serviceOrder.modelRequired") })
		.min(1, { message: i18nMessage("validation.serviceOrder.modelRequired") })
		.max(100, {
			message: i18nMessage("validation.serviceOrder.modelMax", { count: 100 }),
		}),
	imei: z
		.string()
		.max(50, {
			message: i18nMessage("validation.serviceOrder.imeiMax", { count: 50 }),
		})
		.optional()
		.nullable(),
	reportedDefect: z
		.string({ error: i18nMessage("validation.serviceOrder.issueRequired") })
		.min(1, { message: i18nMessage("validation.serviceOrder.issueRequired") })
		.max(65_535, { message: i18nMessage("validation.serviceOrder.issueMax") }),
	observations: z
		.string()
		.max(65_535, { message: i18nMessage("validation.serviceOrder.notesMax") })
		.optional()
		.nullable(),
	photos: z
		.array(createServiceOrderPhotoSchema)
		.max(20, {
			message: i18nMessage("validation.serviceOrder.photosMax", { count: 20 }),
		})
		.default([]),
});

/** @deprecated Use createServiceOrderSchema */
export const createOrderServiceMockSchema = createServiceOrderMockSchema;

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

import { documentSchema } from "./documents";

export const createOrderServiceSchema = z.object({
	customerCPF: documentSchema("cpf").min(1, "O CPF é obrigatório"),
	deviceIMEI: formattedIMEI.optional(),
	description: z.string().min(1, "A descrição do problema é obrigatória"),
	notes: z.string().optional(),
	deviceId: z.string().min(1, "Selecione o modelo do aparelho"),
	assigned_to: z
		.string()
		.min(1, "Selecione o funcionário responsável pela ordem de serviço"),
	images: z
		.array(z.instanceof(File))
		.min(3, "Adicione pelo menos três fotos do aparelho")
		.max(15, "Adicione no máximo quinze fotos do aparelho"),
});
