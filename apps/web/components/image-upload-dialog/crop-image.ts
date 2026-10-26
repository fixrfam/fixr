"use client";

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
