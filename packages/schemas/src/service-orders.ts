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
	url: z
		.string({ error: "URL da foto é obrigatória." })
		.url({ message: "URL da foto inválida." })
		.max(255, { message: "URL da foto excede 255 caracteres." }),
	fileName: z
		.string({ error: "Nome do arquivo é obrigatório." })
		.min(1, { message: "Nome do arquivo é obrigatório." })
		.max(255, { message: "Nome do arquivo excede 255 caracteres." }),
	size: z
		.number({ error: "Tamanho do arquivo é obrigatório." })
		.int({ message: "Tamanho do arquivo deve ser um número inteiro." })
		.positive({ message: "Tamanho do arquivo deve ser maior que zero." }),
	contentType: z
		.string({ error: "Tipo de conteúdo é obrigatório." })
		.min(1, { message: "Tipo de conteúdo é obrigatório." })
		.max(50, { message: "Tipo de conteúdo excede 50 caracteres." }),
	description: z
		.string()
		.max(255, { message: "Descrição excede 255 caracteres." })
		.optional()
		.nullable(),
});

export const createServiceOrderMockSchema = z.object({
	clientId: z.string().cuid2({ message: "Cliente inválido." }),
	deviceBrandId: z
		.string()
		.cuid2({ message: "Marca do dispositivo inválida." }),
	deviceCategoryId: z
		.string()
		.cuid2({ message: "Categoria do dispositivo inválida." }),
	deviceModel: z
		.string({ error: "Modelo do dispositivo é obrigatório." })
		.min(1, { message: "Modelo do dispositivo é obrigatório." })
		.max(100, { message: "Modelo do dispositivo excede 100 caracteres." }),
	imei: z
		.string()
		.max(50, { message: "IMEI excede 50 caracteres." })
		.optional()
		.nullable(),
	reportedDefect: z
		.string({ error: "Defeito relatado é obrigatório." })
		.min(1, { message: "Defeito relatado é obrigatório." })
		.max(65_535, { message: "Defeito relatado excede o limite permitido." }),
	observations: z
		.string()
		.max(65_535, { message: "Observações excedem o limite permitido." })
		.optional()
		.nullable(),
	photos: z
		.array(createServiceOrderPhotoSchema)
		.max(20, { message: "Máximo de 20 fotos por ordem de serviço." })
		.default([]),
});

/** @deprecated Use createServiceOrderSchema */
export const createOrderServiceMockSchema = createServiceOrderMockSchema;

export const getServiceOrdersQuerySchema = getPaginatedDataSchema
	.extend({
		deviceCategoryId: z
			.string()
			.cuid2({ message: "Categoria do dispositivo inválida." })
			.optional(),
		employeeId: z
			.string()
			.cuid2({ message: "Responsável inválido." })
			.optional(),
		status: serviceOrderStatuses.optional(),
		dateFrom: z.coerce.date({ message: "Data inicial inválida." }).optional(),
		dateTo: z.coerce.date({ message: "Data final inválida." }).optional(),
	})
	.refine(
		(data) => {
			if (data.dateFrom && data.dateTo) {
				return data.dateFrom <= data.dateTo;
			}
			return true;
		},
		{
			message: "A data inicial deve ser anterior ou igual à data final.",
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
