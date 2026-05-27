import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { z } from "zod";
import {
	buildObjectPublicUrl,
	buildUploadObjectKey,
	r2Bucket,
	r2Client,
	r2PresignExpiresIn,
} from "@/src/config/r2";

export async function createPresignedUpload({
	companyId,
	data,
}: {
	companyId: string;
	data: z.infer<typeof createUploadPresignSchema>;
}) {
	const key = buildUploadObjectKey({
		companyId,
		fileName: data.fileName,
	});

	const command = new PutObjectCommand({
		Bucket: r2Bucket,
		Key: key,
		ContentType: data.contentType,
		ContentLength: data.size,
	});

	const uploadUrl = await getSignedUrl(r2Client, command, {
		expiresIn: r2PresignExpiresIn,
	});

	return {
		uploadUrl,
		key,
		url: buildObjectPublicUrl(key),
		expiresIn: r2PresignExpiresIn,
	};
}
