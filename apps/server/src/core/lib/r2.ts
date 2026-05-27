import { randomUUID } from "node:crypto";

const PATH_SEPARATOR_REGEX = /[/\\]/;
const UNSAFE_FILENAME_CHARS_REGEX = /[^\w.-]+/g;
const DUPLICATE_DASHES_REGEX = /-+/g;
const TRIM_DASHES_REGEX = /^-|-$/g;

/**
 * Sanitize a file name for safe R2 object key usage
 */
export function sanitizeUploadFileName(fileName: string): string {
	const baseName = fileName.split(PATH_SEPARATOR_REGEX).pop() ?? fileName;
	const sanitized = baseName
		.normalize("NFKD")
		.replace(UNSAFE_FILENAME_CHARS_REGEX, "-")
		.replace(DUPLICATE_DASHES_REGEX, "-")
		.replace(TRIM_DASHES_REGEX, "");

	return sanitized.length > 0 ? sanitized.slice(0, 200) : "upload";
}

/**
 * Build the public URL for an R2 object key
 */
export function buildObjectPublicUrl(
	publicBaseUrl: string,
	key: string
): string {
	return `${publicBaseUrl}/${key}`;
}

/**
 * Check if a photo URL was issued by a specific company's upload flow
 */
export function isAllowedCompanyPhotoUrl(
	publicBaseUrl: string,
	url: string,
	companyId: string
): boolean {
	const prefix = `${publicBaseUrl}/companies/${companyId}/service-orders/`;
	return url.startsWith(prefix);
}

/**
 * Build an R2 object key for a company upload
 */
export function buildUploadObjectKey({
	companyId,
	fileName,
}: {
	companyId: string;
	fileName: string;
}): string {
	const safeName = sanitizeUploadFileName(fileName);
	const uniquePrefix = `${Date.now()}-${randomUUID().slice(0, 8)}`;

	return `companies/${companyId}/service-orders/${uniquePrefix}-${safeName}`;
}
