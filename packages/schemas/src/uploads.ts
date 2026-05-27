import { z } from "zod";

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const createUploadPresignSchema = z.object({
	fileName: z
		.string({ error: "Nome do arquivo é obrigatório." })
		.min(1, { message: "Nome do arquivo é obrigatório." })
		.max(255, { message: "Nome do arquivo excede 255 caracteres." }),
	contentType: z
		.string({ error: "Tipo de conteúdo é obrigatório." })
		.min(1, { message: "Tipo de conteúdo é obrigatório." })
		.max(255, { message: "Tipo de conteúdo excede 255 caracteres." })
		.regex(/^[^/]+\/[^/]+$/, {
			message: "Tipo de conteúdo deve ser um MIME válido.",
		}),
	size: z
		.number({ error: "Tamanho do arquivo é obrigatório." })
		.int({ message: "Tamanho deve ser um número inteiro." })
		.positive({ message: "Tamanho deve ser maior que zero." })
		.max(MAX_UPLOAD_SIZE_BYTES, {
			message: "Arquivo excede o limite de 10 MB.",
		}),
});

export const uploadPresignResponseSchema = z.object({
	id: z.string(),
	uploadUrl: z.string().url(),
	key: z.string(),
	url: z.string().url(),
	expiresIn: z.number().int().positive(),
});
