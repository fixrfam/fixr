import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
	Cropper,
	CropperArea,
	type CropperAreaData,
	CropperImage,
} from "@/components/ui/cropper";

/**
 * Controls for adjusting zoom and rotation of the cropped image.
 */
interface CropperControlsProps {
	zoom: number;
	rotation: number;
	onZoomChange: (zoom: number) => void;
	onRotationChange: (rotation: number) => void;
}

function CropperControls({
	zoom,
	rotation,
	onZoomChange,
	onRotationChange,
}: CropperControlsProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-center gap-4">
				<button
					className="rounded-full p-2 transition-colors hover:bg-muted"
					onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
					type="button"
				>
					<ZoomOut className="size-5" />
				</button>
				<span className="w-12 text-center text-sm tabular-nums">
					{Math.round(zoom * 100)}%
				</span>
				<button
					className="rounded-full p-2 transition-colors hover:bg-muted"
					onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
					type="button"
				>
					<ZoomIn className="size-5" />
				</button>
			</div>
			<div className="flex items-center justify-center gap-4">
				<button
					className="rounded-full p-2 transition-colors hover:bg-muted"
					onClick={() => onRotationChange((rotation + 90) % 360)}
					type="button"
				>
					<RotateCcw className="size-5" />
				</button>
				<span className="w-16 text-center text-sm tabular-nums">
					{rotation}°
				</span>
			</div>
		</div>
	);
}

/**
 * Avatar-cropping step with a circle crop area (1:1 aspect ratio)
 * and zoom/rotation adjustment controls.
 */
interface CropStepProps {
	imageUrl: string;
	zoom: number;
	rotation: number;
	onZoomChange: (zoom: number) => void;
	onRotationChange: (rotation: number) => void;
	onCropAreaChange: (
		croppedArea: CropperAreaData,
		croppedAreaPixels: CropperAreaData
	) => void;
}

export function CropStep({
	imageUrl,
	zoom,
	rotation,
	onZoomChange,
	onRotationChange,
	onCropAreaChange,
}: CropStepProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-center">
				<Cropper
					aspectRatio={1}
					className="h-[50dvh] w-full overflow-hidden rounded-xl"
					onCropAreaChange={onCropAreaChange}
					onRotationChange={onRotationChange}
					onZoomChange={onZoomChange}
					rotation={rotation}
					shape="circle"
					zoom={zoom}
				>
					<CropperImage alt="Foto do perfil" src={imageUrl} />
					<CropperArea />
				</Cropper>
			</div>
			<CropperControls
				onRotationChange={onRotationChange}
				onZoomChange={onZoomChange}
				rotation={rotation}
				zoom={zoom}
			/>
		</div>
	);
}
