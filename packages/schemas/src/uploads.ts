import { i18nMessage } from "@fixr/i18n";
import { z } from "zod";

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_AVATAR_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Content types an upload may be stored with. Every purpose is an image, and the
 * bucket is public: anything that a browser renders as a page (HTML, SVG) would
 * run as a site on the bucket's domain, so only raster images are signed.
 */
export const UPLOAD_CONTENT_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/heic",
	"image/heif",
] as const;

export const uploadPurpose = z.enum([
	"avatar",
	"service-orders",
	"models",
	"company-logo",
]);

export const presignParamsSchema = z.object({
	purpose: uploadPurpose,
});

export const createUploadPresignSchema = z.object({
	fileName: z
		.string({ error: i18nMessage("validation.upload.fileNameRequired") })
		.min(1, { message: i18nMessage("validation.upload.fileNameRequired") })
		.max(255, {
			message: i18nMessage("validation.upload.fileNameMax", { count: 255 }),
		}),
	contentType: z
		.string({ error: i18nMessage("validation.upload.contentTypeRequired") })
		.min(1, { message: i18nMessage("validation.upload.contentTypeRequired") })
		.max(255, {
			message: i18nMessage("validation.upload.contentTypeMax", { count: 255 }),
		})
		.refine(
			(value) =>
				(UPLOAD_CONTENT_TYPES as readonly string[]).includes(
					value.toLowerCase()
				),
			{ message: i18nMessage("validation.upload.contentTypeInvalid") }
		)
		.transform((value) => value.toLowerCase()),
	size: z
		.number({ error: i18nMessage("validation.upload.sizeRequired") })
		.int({ message: i18nMessage("validation.upload.sizeInteger") })
		.positive({ message: i18nMessage("validation.upload.sizePositive") })
		.max(MAX_UPLOAD_SIZE_BYTES, {
			message: i18nMessage("validation.upload.sizeMax", { limit: "10 MB" }),
		}),
});

export const uploadPresignResponseSchema = z.object({
	id: z.string(),
	uploadUrl: z.string().url(),
	key: z.string(),
	url: z.string().url(),
	expiresIn: z.number().int().positive(),
});

export const createAvatarUploadPresignSchema = createUploadPresignSchema.extend(
	{
		size: z
			.number({ error: i18nMessage("validation.upload.sizeRequired") })
			.int({ message: i18nMessage("validation.upload.sizeInteger") })
			.positive({ message: i18nMessage("validation.upload.sizePositive") })
			.max(MAX_AVATAR_UPLOAD_SIZE_BYTES, {
				message: i18nMessage("validation.upload.sizeMax", { limit: "5 MB" }),
			}),
	}
);

/** @deprecated Use {@link createUploadPresignSchema} instead */
export const createModelImageUploadPresignSchema = createUploadPresignSchema;
