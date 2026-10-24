"use client";

import { Camera } from "lucide-react";
import { FileUpload, FileUploadDropzone } from "@/components/ui/file-upload";

/**
 * Step that lets the user pick an image file.
 *
 * Accepts images up to 5 MB (PNG, JPG, WebP) and fires
 * `onFileSelected` with the chosen file.
 */
interface SelectStepProps {
	onFileSelected: (files: File[]) => void;
	title: string;
	hint: string;
}

export function SelectStep({ onFileSelected, title, hint }: SelectStepProps) {
	return (
		<FileUpload
			accept="image/*"
			maxFiles={1}
			maxSize={5 * 1024 * 1024}
			onValueChange={onFileSelected}
		>
			<FileUploadDropzone className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors hover:border-primary/50 [&_svg]:size-10 [&_svg]:text-muted-foreground">
				<Camera />
				<div className="flex flex-col gap-1">
					<p className="font-medium text-sm">{title}</p>
					<p className="text-muted-foreground text-xs">{hint}</p>
				</div>
			</FileUploadDropzone>
		</FileUpload>
	);
}
