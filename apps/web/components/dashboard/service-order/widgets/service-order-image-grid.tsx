"use client";

import { useTranslation } from "@fixr/i18n/react";
import { permissions } from "@fixr/permissions";
import { toast } from "@pheralb/toast";
import { useState } from "react";
import { useApiErrorToast } from "@/components/dashboard/parts/forms/api-feedback";
import { useCatalogAbility } from "@/components/dashboard/parts/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ServiceOrderPhoto } from "@/lib/services/service-orders";
import { useAddServiceOrderPhotos, useDeleteServiceOrderPhoto } from "../store";
import { type GalleryPhoto, PhotoGallery } from "./photo-gallery";

const MAX_PHOTOS = 20;

/**
 * The pictures of the device. Who can edit the order adds more at any time
 * (e.g. during the repair) and removes the wrong ones.
 */
function ServiceOrderImageGrid({
	serviceOrderId,
	images,
}: {
	serviceOrderId: string;
	images: ServiceOrderPhoto[];
}) {
	const { t } = useTranslation();
	const ability = useCatalogAbility();
	const toastError = useApiErrorToast();
	const addPhotos = useAddServiceOrderPhotos(serviceOrderId);
	const deletePhoto = useDeleteServiceOrderPhoto(serviceOrderId);
	const [selected, setSelected] = useState<ServiceOrderPhoto | null>(null);
	const canEdit = ability.can(permissions.serviceOrders.update);

	async function add(files: File[]) {
		try {
			await addPhotos.mutateAsync(files);
			toast.success({
				text: t("serviceOrders.images.added", { count: files.length }),
			});
		} catch (error) {
			toastError(error);
		}
	}

	async function remove(photoId: string) {
		try {
			await deletePhoto.mutateAsync(photoId);
			toast.success({ text: t("serviceOrders.images.removed") });
		} catch (error) {
			toastError(error);
		}
	}

	const photos: GalleryPhoto[] = images.map((image) => ({
		id: image.id,
		src: image.imageUrl,
		name: image.description ?? image.fileName,
	}));

	return (
		<>
			<PhotoGallery
				max={MAX_PHOTOS}
				onAdd={canEdit ? add : undefined}
				onOpen={(photo) =>
					setSelected(images.find((image) => image.id === photo.id) ?? null)
				}
				onRemove={canEdit ? remove : undefined}
				photos={photos}
				uploading={addPhotos.isPending}
			/>
			<Dialog
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
				open={!!selected}
			>
				<DialogContent className="max-w-3xl">
					<DialogTitle className="sr-only">
						{selected?.description ?? t("serviceOrders.images.preview")}
					</DialogTitle>
					{selected && (
						<>
							{/** biome-ignore lint/correctness/useImageSize: <No need for that> */}
							<img
								alt={selected.description ?? selected.fileName}
								className="max-h-[70vh] w-full rounded-lg object-contain"
								src={selected.imageUrl}
							/>
							{selected.description && (
								<p className="text-center text-muted-foreground text-sm">
									{selected.description}
								</p>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export { ServiceOrderImageGrid };
