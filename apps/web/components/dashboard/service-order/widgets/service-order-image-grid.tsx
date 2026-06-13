"use client";

import type { ServiceOrderRow } from "@fixr/mock";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ImageItem = NonNullable<ServiceOrderRow["images"]>[number];

function ServiceOrderImageGrid({
	images,
}: {
	images: ServiceOrderRow["images"];
}) {
	const [selected, setSelected] = useState<ImageItem | null>(null);

	if (!images || images.length === 0) {
		return (
			<p className="text-2xs text-muted-foreground">
				Nenhuma imagem registrada.
			</p>
		);
	}

	return (
		<>
			<div className="grid grid-cols-2 gap-3">
				{images.map((image) => (
					<button
						className="cursor-pointer overflow-hidden rounded-lg border bg-card transition-colors hover:border-primary/50"
						key={image.id}
						onClick={() => setSelected(image)}
						type="button"
					>
						{/** biome-ignore lint/correctness/useImageSize: <No need for that> */}
						<img
							alt={image.description}
							className="h-32 w-full object-cover"
							src={image.url}
						/>
						<p className="p-2 text-center text-muted-foreground text-xs">
							{image.description}
						</p>
					</button>
				))}
			</div>
			<Dialog
				onOpenChange={(open) => {
					if (!open) setSelected(null);
				}}
				open={!!selected}
			>
				<DialogContent className="max-w-3xl">
					<DialogTitle className="sr-only">
						{selected?.description ?? "Preview da imagem"}
					</DialogTitle>
					{selected && (
						<>
							{/** biome-ignore lint/correctness/useImageSize: <No need for that> */}
							<img
								alt={selected.description}
								className="max-h-[70vh] w-full rounded-lg object-contain"
								src={selected.url}
							/>
							<p className="text-center text-2xs text-muted-foreground">
								{selected.description}
							</p>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export { ServiceOrderImageGrid };
