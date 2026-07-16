import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@fixr/db/connection";
import { uploads } from "@fixr/db/schema";
import type { uploadPurpose } from "@fixr/schemas/uploads";
import type { z } from "zod";
import {
	buildAvatarObjectKey,
	buildModelObjectKey,
	buildObjectPublicUrl,
	buildUploadObjectKey,
	r2Bucket,
	r2Client,
	r2PresignExpiresIn,
} from "../../../config/r2";

type ApiPurpose = z.infer<typeof uploadPurpose>;

const KEY_BUILDERS: Record<
	ApiPurpose,
	(opts: { userId?: string; companyId?: string; fileName: string }) => string
> = {
	avatar: ({ userId, fileName }) =>
		buildAvatarObjectKey({ userId: userId!, fileName }),
	"service-orders": ({ companyId, fileName }) =>
		buildUploadObjectKey({ companyId: companyId!, fileName }),
	models: ({ companyId, fileName }) =>
		buildModelObjectKey({ companyId: companyId!, fileName }),
};

const PURPOSE_TO_DB: Record<
	ApiPurpose,
	"avatar" | "service_order" | "model_image"
> = {
	avatar: "avatar",
	"service-orders": "service_order",
	models: "model_image",
};

export class UploadsRepository {
	static async createPresignedUpload({
		purpose,
		companyId,
		employeeId,
		userId,
		fileName,
		contentType,
		size,
	}: {
		purpose: ApiPurpose;
		companyId?: string;
		employeeId?: string;
		userId?: string;
		fileName: string;
		contentType: string;
		size: number;
	}) {
		const buildKey = KEY_BUILDERS[purpose];
		const key = buildKey({ userId, companyId, fileName });
		const url = `${buildObjectPublicUrl(key)}${purpose === "avatar" ? `?v=${Date.now()}` : ""}`;

		const command = new PutObjectCommand({
			Bucket: r2Bucket,
			Key: key,
			ContentType: contentType,
			ContentLength: size,
		});

		const uploadUrl = await getSignedUrl(r2Client, command, {
			expiresIn: r2PresignExpiresIn,
		});

		const [record] = await db
			.insert(uploads)
			.values({
				companyId: companyId ?? null,
				employeeId: employeeId ?? null,
				purpose: PURPOSE_TO_DB[purpose],
				key,
				url,
				fileName,
				contentType,
				sizeInBytes: size,
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
