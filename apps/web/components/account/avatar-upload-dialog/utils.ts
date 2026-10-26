"use client";

import { axios } from "@/lib/auth/axios";

const EXTENSION_PATTERN = /\.[^.]+$/;

/**
 * Get a pre-signed upload URL from the server, upload the blob to R2,
 * then notify the server about the new avatar URL.
 *
 * Returns the public URL returned by the presign endpoint.
 */
export async function uploadAvatar(
	blob: Blob,
	fileName: string
): Promise<string> {
	const presignRes = await axios.post<{
		data: {
			uploadUrl: string;
			url: string;
			key: string;
			expiresIn: number;
		};
	}>("/uploads/avatar/presign", {
		fileName: `${fileName.replace(EXTENSION_PATTERN, "")}.webp`,
		contentType: "image/webp",
		size: blob.size,
	});

	const { uploadUrl, url } = presignRes.data.data;

	const uploadRes = await fetch(uploadUrl, {
		method: "PUT",
		body: blob,
		headers: { "Content-Type": "image/webp" },
	});

	if (!uploadRes.ok) {
		throw new Error("Falha ao enviar imagem");
	}

	await axios.put("/account/avatar", { url });

	return url;
}
