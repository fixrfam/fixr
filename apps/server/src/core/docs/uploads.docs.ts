import {
	createUploadPresignSchema,
	uploadPresignResponseSchema,
} from "@fixr/schemas/uploads";
import type { FastifySchema } from "fastify";
import { zodResponseSchema } from "./types";

const createUploadPresignSchemaDoc: FastifySchema = {
	tags: ["Uploads"],
	summary: "Generate pre-signed upload URL",
	description: `
**Generates a pre-signed URL for direct upload to Backblaze/Cloudflare R2**

This endpoint is generic and supports any file type. Use the returned URL to upload the file, then store the returned \`url\` for later download, preview or editing.

The request accepts file metadata (\`fileName\`, \`contentType\`, \`size\`) and returns the upload URL, object key, public URL and expiration time.
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

export const uploadsDocs = {
	createUploadPresignSchema: createUploadPresignSchemaDoc,
};
