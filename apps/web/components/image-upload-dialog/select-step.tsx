"use client";

import { ImageDropzone } from "./image-dropzone";

/** Step that lets the user pick an image file (PNG, JPG or WebP up to 5 MB). */
interface SelectStepProps {
	onFileSelected: (file: File) => void;
	title: string;
	hint: string;
}

export function SelectStep({ onFileSelected, title, hint }: SelectStepProps) {
	return (
		<ImageDropzone
			className="aspect-video"
			hint={hint}
			onPick={onFileSelected}
			title={title}
		/>
	);
}
