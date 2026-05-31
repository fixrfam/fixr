import {
	createModelImageUploadPresignSchema,
	createUploadPresignSchema,
	uploadPresignResponseSchema,
} from "@fixr/schemas/uploads";
import type { FastifySchema } from "fastify";
import { zodResponseSchema } from "./types";

const createUploadPresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed upload URL for service order images",
	description: `
**Generates a pre-signed URL for direct upload to Cloudflare R2**

Creates a pending upload record and returns a time-limited pre-signed PUT URL. Use the returned URL to upload the file, then pass the \`id\` when creating the service order.

The request accepts file metadata (\`fileName\`, \`contentType\`, \`size\`) and returns the upload ID, upload URL, object key, public URL and expiration time.
`,
	body: createUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_upload_presign_success",
			data: uploadPresignResponseSchema,
		}).describe("Pre-signed upload URL generated."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to perform this action.",
			data: null,
		}),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no company associated with this account.",
			data: null,
		}),
	},
	security: [{ JWT: [] }],
};

const createModelImagePresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed upload URL for a model image",
	description: `
**Generates a pre-signed URL for uploading a model image to Cloudflare R2**

Returns a time-limited presigned PUT URL and an upload ID. Upload the file directly to R2 using the returned URL, then use \`POST /{modelId}/images\` in the devices module to assign it to a model.
`,
	body: createModelImageUploadPresignSchema,
	response: {
		200: zodResponseSchema({
			status: 200,
			error: null,
			message: "Upload URL generated successfully.",
			code: "create_model_image_presign_success",
			data: uploadPresignResponseSchema,
		}).describe("Presigned URL generated."),
		403: zodResponseSchema({
			status: 403,
			error: "Forbidden",
			code: "not_allowed",
			message: "You are not authorized to perform this action.",
			data: null,
		}),
		404: zodResponseSchema({
			status: 404,
			error: "Not Found",
			code: "company_not_found",
			message: "There's no company associated with this account.",
			data: null,
		}),
	},
	security: [{ JWT: [] }],
};

export const uploadsDocs = {
	createUploadPresignSchema: createUploadPresignSchemaDoc,
	createModelImagePresignSchema: createModelImagePresignSchemaDoc,
};
