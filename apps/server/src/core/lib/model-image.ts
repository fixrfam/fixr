import { sql } from "@fixr/db/connection";
import { modelImages, models, uploads } from "@fixr/db/schema";
import { generatePresignedGetUrl } from "../../config/r2";

/**
 * R2 key of the model's primary image, as a column of any query that joins
 * `models`. Turn it into a URL with {@link withModelImageUrl}.
 */
export const modelImageKey = sql<string | null>`(
	SELECT ${uploads.key}
	FROM ${modelImages}
	INNER JOIN ${uploads} ON ${uploads.id} = ${modelImages.uploadId}
	WHERE ${modelImages.modelId} = ${models.id} AND ${modelImages.isPrimary} = true
	ORDER BY ${modelImages.position}
	LIMIT 1
)`;

/** Swap the `imageKey` of a record's model for a signed URL of the image. */
export async function withModelImageUrl<
	T extends { model: { imageKey: string | null } },
>(record: T) {
	const { imageKey, ...model } = record.model;
	return {
		...record,
		model: {
			...model,
			imageUrl: imageKey ? await generatePresignedGetUrl(imageKey) : null,
		},
	};
}
