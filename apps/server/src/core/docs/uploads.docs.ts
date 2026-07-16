import {
	createUploadPresignSchema,
	uploadPresignResponseSchema,
} from "@fixr/schemas/uploads";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

const createPresignSchema: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed upload URL",
	description: `**Generate a presigned PUT URL for uploading files to Cloudflare R2**

Supports three purposes controlled by the path parameter:

- \`avatar\` - user profile picture. Deterministic key, no DB record. Call \`PUT /account/avatar\` after uploading.
- \`service-orders\` - service order images. Creates a pending upload record, reference the returned \`id\` when creating the service order.
- \`models\` - model images. Creates a pending upload record, reference the returned \`id\` when assigning to a model.
`,
	params: z.object({
		purpose: z.enum(["avatar", "service-orders", "models"]),
	}),
	body: createUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_avatar_presign_success",
			data: uploadPresignResponseSchema,
		}).describe("Presigned upload URL generated."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to perform this action.",
			data: null,
		}).describe("Forbidden."),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no company associated with this account.",
			data: null,
		}).describe("Company not found."),
	},
	security: [{ JWT: [] }],
};

export const uploadsDocs = {
	createPresignSchema,
};
