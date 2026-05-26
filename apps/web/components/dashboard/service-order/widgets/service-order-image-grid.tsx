import type { ServiceOrderRow } from "@fixr/mock";

function ServiceOrderImageGrid({
	images,
}: {
	images: ServiceOrderRow["images"];
}) {
	if (!images || images.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">
				Nenhuma imagem registrada.
			</p>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{images.map((image) => (
				<div
					className="overflow-hidden rounded-lg border bg-background"
					key={image.id}
				>
					{/** biome-ignore lint/correctness/useImageSize: <No need for that> */}
					<img
						alt={image.description}
						className="aspect-square w-full object-cover"
						src={image.url}
					/>
					<p className="p-2 text-muted-foreground text-xs">
						{image.description}
					</p>
				</div>
			))}
		</div>
	);
}

export { ServiceOrderImageGrid };
