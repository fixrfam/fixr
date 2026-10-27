/** The longest side a stored photo needs: sharp on a laptop, small on a phone. */
const MAX_SIDE = 2560;
const QUALITY = 0.85;
/** Smaller files that already fit go up untouched. */
const KEEP_BELOW_BYTES = 1.5 * 1024 * 1024;

const EXTENSION = /\.[^.]+$/;

/**
 * Scale a photo down to {@link MAX_SIDE} and re-encode it as WebP, so a 12 MB
 * phone picture uploads as a few hundred KB. Anything that isn't a decodable
 * image, or that would come out bigger, is returned as it was.
 */
export async function shrinkImage(file: File): Promise<File> {
	if (!file.type.startsWith("image/") || file.type === "image/gif") {
		return file;
	}
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return file;
	}
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	if (scale === 1 && file.size <= KEEP_BELOW_BYTES) {
		bitmap.close();
		return file;
	}

	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/webp", QUALITY)
	);
	if (!blob || blob.size >= file.size) {
		return file;
	}
	return new File([blob], `${file.name.replace(EXTENSION, "")}.webp`, {
		type: "image/webp",
		lastModified: file.lastModified,
	});
}
