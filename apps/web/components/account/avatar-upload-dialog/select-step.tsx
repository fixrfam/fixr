import { Camera } from "lucide-react";
import { FileUpload, FileUploadDropzone } from "@/components/ui/file-upload";

/**
 * Step that lets the user pick an image file for their avatar.
 *
 * Accepts images up to 5 MB (PNG, JPG, WebP) and fires
 * `onFileSelected` with the chosen file.
 */
interface SelectStepProps {
	onFileSelected: (files: File[]) => void;
}

export function SelectStep({ onFileSelected }: SelectStepProps) {
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
					<p className="font-medium text-sm">
						Arraste sua foto aqui ou clique para selecionar
					</p>
					<p className="text-muted-foreground text-xs">
						PNG, JPG ou WebP. Máximo de 5MB.
					</p>
				</div>
			</FileUploadDropzone>
		</FileUpload>
	);
}
