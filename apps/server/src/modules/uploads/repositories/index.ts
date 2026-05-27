import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@fixr/db/connection";
import { uploads } from "@fixr/db/schema";
import type { createUploadPresignSchema } from "@fixr/schemas/uploads";
import type { z } from "zod";
import {
	buildObjectPublicUrl,
	buildUploadObjectKey,
	r2Bucket,
	r2Client,
	r2PresignExpiresIn,
} from "../../../config/r2";

export class UploadsRepository {
	static async createPresignedUpload({
		companyId,
		employeeId,
		data,
	}: {
		companyId: string;
		employeeId: string;
		data: z.infer<typeof createUploadPresignSchema>;
	}) {
		const key = buildUploadObjectKey({ companyId, fileName: data.fileName });
		const url = buildObjectPublicUrl(key);

		const command = new PutObjectCommand({
			Bucket: r2Bucket,
			Key: key,
			ContentType: data.contentType,
			ContentLength: data.size,
		});

		const uploadUrl = await getSignedUrl(r2Client, command, {
			expiresIn: r2PresignExpiresIn,
		});

		const [record] = await db
			.insert(uploads)
			.values({
				companyId,
				employeeId,
				key,
				url,
				fileName: data.fileName,
				contentType: data.contentType,
				sizeInBytes: data.size,
				status: "pending",
			})
			.$returningId();

		return {
			id: record.id,
			uploadUrl,
			key,
			url,
			expiresIn: r2PresignExpiresIn,
		};
	}
}
