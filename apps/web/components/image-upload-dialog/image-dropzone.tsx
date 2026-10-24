"use client";

import { useTranslation } from "@fixr/i18n/react";
import { MAX_AVATAR_UPLOAD_SIZE_BYTES } from "@fixr/schemas/uploads";
import { toast } from "@pheralb/toast";
import { CloudUpload, ImageIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

export const IMAGE_TYPES = "image/png,image/jpeg,image/webp";

const ERROR_KEYS = {
	tooLarge: "common.upload.tooLarge",
	invalidType: "common.upload.invalidType",
	tooMany: "common.upload.tooMany",
} as const;

/**
 * Pick one image by click or drag and drop. Rejected files (type or size) are
 * reported with a toast; accepted ones go to `onPick`.
 */
export function useImagePicker(onPick: (file: File) => void) {
	const { t } = useTranslation();

	const [{ isDragging }, actions] = useFileUpload({
		accept: IMAGE_TYPES,
		maxSize: MAX_AVATAR_UPLOAD_SIZE_BYTES,
		onFilesAdded: (files) => {
			const file = files[0]?.file;
			if (file instanceof File) {
				onPick(file);
			}
		},
		onError: (errors) => {
			const code = errors[0]?.code ?? "invalidType";
			toast.error({ text: t(ERROR_KEYS[code]) });
		},
	});

	return { isDragging, ...actions };
}

/** Event handlers that turn an element into a drop target. */
export function dropTargetProps(picker: ReturnType<typeof useImagePicker>) {
	return {
		onDragEnter: picker.handleDragEnter,
		onDragLeave: picker.handleDragLeave,
		onDragOver: picker.handleDragOver,
		onDrop: picker.handleDrop,
	};
}

/** Empty drop area in the style of ReUI's cover upload. The whole area is the button. */
export function ImageDropzone({
	onPick,
	title,
	hint,
	compact = false,
	className,
}: {
	onPick: (file: File) => void;
	title: string;
	hint: string;
	/** Drops the formats line and the browse label, for narrow columns. */
	compact?: boolean;
	className?: string;
}) {
	const { t } = useTranslation();
	const picker = useImagePicker(onPick);

	return (
		<>
			<input {...picker.getInputProps()} className="sr-only" tabIndex={-1} />
			<button
				className={cn(
					"flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
					picker.isDragging
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 bg-muted/30 hover:border-primary hover:bg-primary/5",
					className
				)}
				onClick={picker.openFileDialog}
				type="button"
				{...dropTargetProps(picker)}
			>
				<span className="rounded-full bg-primary/10 p-3">
					<CloudUpload className="size-6 text-primary" />
				</span>
				<span className="flex flex-col gap-1">
					<span className="font-medium text-sm">{title}</span>
					<span className="text-muted-foreground text-xs">{hint}</span>
					{compact ? null : (
						<span className="text-2xs text-muted-foreground">
							{t("common.upload.formats")}
						</span>
					)}
				</span>
				{compact ? null : (
					<span className={buttonVariants({ size: "sm", variant: "outline" })}>
						<ImageIcon className="size-4" />
						{t("common.upload.browse")}
					</span>
				)}
			</button>
		</>
	);
}
