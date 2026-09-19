"use client";

import { axios } from "@/lib/auth/axios";

const EXTENSION_PATTERN = /\.[^.]+$/;

/**
 * Crop an image using Canvas API and return it as a WebP blob.
 *
 * Draws the cropped region from the source image onto a canvas,
 * then exports it as a WebP blob at 90% quality.
 */
export async function cropImage(
	imageUrl: string,
	{
		x,
		y,
		width,
		height,
	}: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
	const img = new Image();
	img.src = imageUrl;
	await img.decode();

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;

	ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(b) => {
				if (b) resolve(b);
				else reject(new Error("Falha ao processar imagem"));
			},
			"image/webp",
			0.9
		);
	});
}

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
