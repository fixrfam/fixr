import type { companySelectSchema } from "@fixr/db/schema";
import type { updateCompanyProfileSchema } from "@fixr/schemas/companies";
import type { ApiResponse } from "@fixr/schemas/utils";
import type { z } from "zod";
import { axios } from "../auth/axios";
import { tryCatch } from "../utils";

export type Company = z.infer<typeof companySelectSchema>;

interface PresignedUpload {
	uploadUrl: string;
	url: string;
	key: string;
	expiresIn: number;
}

/** React Query key of a company's profile, shared by the settings page and the sidebar. */
export const companyQueryKey = (subdomain: string) =>
	["company", subdomain] as const;

export async function getCompany(subdomain: string) {
	const { data, error } = await tryCatch(
		axios.get<ApiResponse<Company>>(`/companies/${subdomain}`)
	);
	if (error) {
		throw error;
	}
	return data.data.data as Company;
}

export async function updateCompanyProfile(
	subdomain: string,
	values: z.input<typeof updateCompanyProfileSchema>
) {
	return await tryCatch(
		axios.patch<ApiResponse<Company>>(`/companies/${subdomain}`, values)
	);
}

const EXTENSION_PATTERN = /\.[^.]+$/;

/**
 * Upload a cropped logo (WebP) straight to R2 through a presigned URL and
 * return its public URL. The profile only changes once that URL is saved with
 * `updateCompanyProfile`.
 *
 * The object key is the same for every upload of a company, so the URL gets a
 * version: without it, browsers keep showing the previous logo.
 */
export async function uploadCompanyLogo(image: Blob, fileName: string) {
	const presign = await axios.post<ApiResponse<PresignedUpload>>(
		"/uploads/company-logo/presign",
		{
			fileName: `${fileName.replace(EXTENSION_PATTERN, "")}.webp`,
			contentType: "image/webp",
			size: image.size,
		}
	);
	const { uploadUrl, url } = presign.data.data as PresignedUpload;

	const upload = await fetch(uploadUrl, {
		method: "PUT",
		body: image,
		headers: { "Content-Type": "image/webp" },
	});
	if (!upload.ok) {
		throw new Error(`Logo upload failed with status ${upload.status}`);
	}

	return `${url}?v=${Date.now()}`;
}
