import { randomUUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@fixr/env/server";

const PATH_SEPARATOR_REGEX = /[/\\]/;
const UNSAFE_FILENAME_CHARS_REGEX = /[^\w.-]+/g;
const DUPLICATE_DASHES_REGEX = /-+/g;
const TRIM_DASHES_REGEX = /^-|-$/g;

export function parseR2BucketUrl(bucketUrl: string) {
	const parsed = new URL(bucketUrl);
	const pathSegments = parsed.pathname.split("/").filter(Boolean);

	if (pathSegments.length === 0) {
		throw new Error(
			"R2_BUCKET_URL must include the bucket name in the path (e.g. .../fixr-develop)"
		);
	}

	const bucket = pathSegments[0]!;
	const endpoint = `${parsed.protocol}//${parsed.host}`;

	return { endpoint, bucket };
}

const { endpoint, bucket } = parseR2BucketUrl(env.R2_BUCKET_URL);

export const r2Bucket = bucket;
export const r2PublicBaseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
export const r2PresignExpiresIn = env.R2_PRESIGN_EXPIRES_IN;

export const r2Client = new S3Client({
	region: env.R2_REGION,
	endpoint,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export function buildObjectPublicUrl(key: string) {
	return `${r2PublicBaseUrl}/${key}`;
}

export function sanitizeUploadFileName(fileName: string) {
	const baseName = fileName.split(PATH_SEPARATOR_REGEX).pop() ?? fileName;
	const sanitized = baseName
		.normalize("NFKD")
		.replace(UNSAFE_FILENAME_CHARS_REGEX, "-")
		.replace(DUPLICATE_DASHES_REGEX, "-")
		.replace(TRIM_DASHES_REGEX, "");

	return sanitized.length > 0 ? sanitized.slice(0, 200) : "upload";
}

export function isAllowedCompanyPhotoUrl(url: string, companyId: string) {
	const prefix = `${r2PublicBaseUrl}/companies/${companyId}/service-orders/`;
	return url.startsWith(prefix);
}

export function buildUploadObjectKey({
	companyId,
	fileName,
}: {
	companyId: string;
	fileName: string;
}) {
	const safeName = sanitizeUploadFileName(fileName);
	const uniquePrefix = `${Date.now()}-${randomUUID().slice(0, 8)}`;

	return `companies/${companyId}/service-orders/${uniquePrefix}-${safeName}`;
}
