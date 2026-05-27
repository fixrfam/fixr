import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@fixr/env/server";
import {
	buildObjectPublicUrl as _buildObjectPublicUrl,
	isAllowedCompanyPhotoUrl as _isAllowedCompanyPhotoUrl,
} from "../core/lib/r2";

export { buildUploadObjectKey, sanitizeUploadFileName } from "../core/lib/r2";

function parseR2BucketUrl(bucketUrl: string) {
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
	return _buildObjectPublicUrl(r2PublicBaseUrl, key);
}

export function isAllowedCompanyPhotoUrl(url: string, companyId: string) {
	return _isAllowedCompanyPhotoUrl(r2PublicBaseUrl, url, companyId);
}
