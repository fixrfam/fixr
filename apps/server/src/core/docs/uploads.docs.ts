import {
	createAvatarUploadPresignSchema,
	createModelImageUploadPresignSchema,
	createUploadPresignSchema,
	uploadPresignResponseSchema,
} from "@fixr/schemas/uploads";
import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

const createAvatarPresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed avatar upload URL",
	description: `**Generate a presigned PUT URL for uploading a user avatar to Cloudflare R2**

Returns a time-limited presigned URL and the corresponding public URL.
Upload the cropped image directly to R2, then call \`PUT /account/avatar\` to update the user profile.

The object key is deterministic (\`users/{userId}/avatar.{ext}\`), so each upload overwrites the previous one. There is no database record created for avatar uploads.
`,
	body: createAvatarUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Avatar upload URL generated successfully.",
			code: "create_avatar_presign_success",
			data: z.object({
				uploadUrl: z.string().url(),
				url: z.string().url(),
				key: z.string(),
				expiresIn: z.number().int().positive(),
			}),
		}).describe("Presigned avatar upload URL generated."),
	},
	security: [{ JWT: [] }],
};

const createUploadPresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed service order upload URL",
	description: `**Generate a presigned PUT URL for uploading service order images to Cloudflare R2**

Creates a pending upload record and returns a time-limited presigned URL and an upload ID.
Upload the file directly to R2 using the returned URL, then reference the \`id\` when creating the service order.
`,
	body: createUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_upload_presign_success",
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

const createModelImagePresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed model image upload URL",
	description: `**Generate a presigned PUT URL for uploading a model image to Cloudflare R2**

Creates a pending upload record and returns a time-limited presigned URL and an upload ID.
Upload the file directly to R2 using the returned URL, then use \`POST /{modelId}/images\` to assign it to a model.
`,
	body: createModelImageUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_model_image_presign_success",
			data: uploadPresignResponseSchema,
		}).describe("Presigned model image upload URL generated."),
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
	createAvatarPresignSchema: createAvatarPresignSchemaDoc,
	createUploadPresignSchema: createUploadPresignSchemaDoc,
	createModelImagePresignSchema: createModelImagePresignSchemaDoc,
};
