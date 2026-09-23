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
