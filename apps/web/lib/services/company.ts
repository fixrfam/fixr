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

/**
 * Upload a logo straight to R2 through a presigned URL and return its public
 * URL. The profile only changes once that URL is saved with
 * `updateCompanyProfile`.
 */
export async function uploadCompanyLogo(file: File) {
	return await tryCatch(
		(async () => {
			const presign = await axios.post<ApiResponse<PresignedUpload>>(
				"/uploads/company-logo/presign",
				{ fileName: file.name, contentType: file.type, size: file.size }
			);
			const { uploadUrl, url } = presign.data.data as PresignedUpload;

			const upload = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!upload.ok) {
				throw new Error(`Logo upload failed with status ${upload.status}`);
			}

			return url;
		})()
	);
}
