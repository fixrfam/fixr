"use client";

import { useTranslation } from "@fixr/i18n/react";
import { toast } from "@pheralb/toast";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
	type FileUploadErrorCode,
	useFileUpload,
} from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

/** Photos are shrunk before uploading, so the picker takes big phone pictures. */
const MAX_PICK_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/heic,image/heif";

export interface GalleryPhoto {
	id: string;
	src: string;
	name: string;
}

const ERROR_KEYS = {
	tooLarge: "serviceOrders.images.tooLarge",
	invalidType: "serviceOrders.images.invalidType",
	tooMany: "serviceOrders.images.tooMany",
} as const satisfies Record<FileUploadErrorCode, string>;

/**
 * The device photos as a gallery (ReUI's file upload, image grid variant):
 * an empty drop zone first, then the grid with a tile to add more. Dropping
 * files anywhere on it adds them. Without `onAdd` it only shows the photos.
 */
export function PhotoGallery({
	photos,
	max,
	onAdd,
	onRemove,
	onRemoveAll,
	onOpen,
	uploading = false,
}: {
	photos: GalleryPhoto[];
	max: number;
	onAdd?: (files: File[]) => void;
	onRemove?: (id: string) => void;
	onRemoveAll?: () => void;
	onOpen?: (photo: GalleryPhoto) => void;
	uploading?: boolean;
}) {
	const { t } = useTranslation();
	const remaining = Math.max(max - photos.length, 0);
	const editable = Boolean(onAdd);

	const [{ isDragging }, actions] = useFileUpload({
		accept: IMAGE_TYPES,
		multiple: true,
		maxSize: MAX_PICK_BYTES,
		maxFiles: remaining,
		onFilesAdded: (added) => {
			const files = added
				.map((item) => item.file)
				.filter((file): file is File => file instanceof File);
			// The gallery owns the list: the hook only picks.
			actions.clearFiles();
			if (files.length > 0) {
				onAdd?.(files);
			}
		},
		onError: (errors) => {
			const code = errors[0]?.code ?? "invalidType";
			toast.error({ text: t(ERROR_KEYS[code], { count: max }) });
		},
	});

	const dropHandlers = editable
		? {
				onDragEnter: actions.handleDragEnter,
				onDragLeave: actions.handleDragLeave,
				onDragOver: actions.handleDragOver,
				onDrop: actions.handleDrop,
			}
		: {};
	const empty = photos.length === 0 && !uploading;

	if (!editable && empty) {
		return (
			<p className="text-muted-foreground text-sm">
				{t("serviceOrders.images.empty")}
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{editable && (
				<input
					{...actions.getInputProps()}
					aria-label={t("serviceOrders.images.select")}
					className="sr-only"
				/>
			)}
			<div
				className={cn(
					"relative rounded-2xl border border-dashed p-2 transition-colors",
					isDragging && "border-primary bg-primary/5",
					empty && "grid min-h-44 place-items-center",
					!editable && "border-transparent p-0"
				)}
				data-dragging={isDragging || undefined}
				{...dropHandlers}
			>
				{empty ? (
					<div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
						<div className="grid size-11 place-items-center rounded-full border bg-background">
							<ImagePlus className="size-5 text-muted-foreground" />
						</div>
						<div className="space-y-1">
							<p className="font-medium text-sm">
								{t("serviceOrders.images.dropTitle")}
							</p>
							<p className="max-w-xs text-pretty text-muted-foreground text-xs">
								{t("serviceOrders.images.dropHint", { count: max })}
							</p>
						</div>
						<Button
							onClick={actions.openFileDialog}
							size="sm"
							type="button"
							variant="outline"
						>
							<Upload />
							{t("serviceOrders.images.select")}
						</Button>
					</div>
				) : (
					<>
						<div className="flex items-center justify-between gap-2 px-1.5 pt-0.5 pb-2.5">
							<p className="font-medium text-sm tabular-nums">
								{t("serviceOrders.images.count", { count: photos.length })}
							</p>
							{editable && (
								<div className="flex gap-1.5">
									{onRemoveAll && photos.length > 1 && (
										<Button
											onClick={onRemoveAll}
											size="sm"
											type="button"
											variant="ghost"
										>
											{t("serviceOrders.images.removeAll")}
										</Button>
									)}
									<Button
										disabled={remaining === 0 || uploading}
										onClick={actions.openFileDialog}
										size="sm"
										type="button"
										variant="outline"
									>
										<Upload />
										{t("serviceOrders.images.addMore")}
									</Button>
								</div>
							)}
						</div>
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
							<AnimatePresence initial={false}>
								{photos.map((photo) => (
									<motion.div
										animate={{ opacity: 1, scale: 1 }}
										className="group relative aspect-square"
										exit={{ opacity: 0, scale: 0.96 }}
										initial={{ opacity: 0, scale: 0.96 }}
										key={photo.id}
										layout
										transition={{ type: "spring", duration: 0.3, bounce: 0 }}
									>
										<button
											aria-label={photo.name}
											className="size-full cursor-zoom-in overflow-hidden rounded-lg bg-muted outline outline-1 outline-black/10 -outline-offset-1 dark:outline-white/10"
											onClick={() => onOpen?.(photo)}
											type="button"
										>
											{/** biome-ignore lint/correctness/useImageSize: square tiles, sized by the grid */}
											<img
												alt={photo.name}
												className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
												src={photo.src}
											/>
										</button>
										{onRemove && (
											<button
												aria-label={t("serviceOrders.images.remove")}
												className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border-2 border-background bg-foreground text-background shadow-sm transition-[opacity,scale] hover:scale-110 focus-visible:opacity-100 active:scale-[0.96] sm:opacity-0 sm:group-hover:opacity-100"
												onClick={() => onRemove(photo.id)}
												type="button"
											>
												<X className="size-3.5" />
											</button>
										)}
									</motion.div>
								))}
								{uploading && (
									<motion.div
										animate={{ opacity: 1 }}
										className="grid aspect-square place-items-center rounded-lg bg-muted"
										exit={{ opacity: 0 }}
										initial={{ opacity: 0 }}
										key="uploading"
									>
										<Loader2 className="size-5 animate-spin text-muted-foreground" />
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
