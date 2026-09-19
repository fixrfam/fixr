"use client";

import { toast } from "@pheralb/toast";
import { Camera } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { CropperAreaData } from "@/components/ui/cropper";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSession } from "@/lib/hooks/use-session";
import { ConfirmStep } from "./confirm-step";
import { CropStep } from "./crop-step";
import { SelectStep } from "./select-step";
import { cropImage, uploadAvatar } from "./utils";

type Step = "select" | "crop" | "uploading";

/** Props for the avatar upload dialog. */
interface AvatarUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAvatarChange: (url: string) => void;
}

/**
 * Responsive dialog/drawer that guides the user through
 * selecting, cropping, and uploading a new avatar picture.
 */
export function AvatarUploadDialog({
	open,
	onOpenChange,
	onAvatarChange,
}: AvatarUploadDialogProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const { refreshSession } = useSession();
	const [step, setStep] = useState<Step>("select");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string>("");
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const croppedAreaRef = useRef<CropperAreaData | null>(null);

	const reset = useCallback(() => {
		setStep("select");
		setImageUrl(null);
		setFileName("");
		croppedAreaRef.current = null;
	}, []);

	const handleFileSelect = useCallback((files: File[]) => {
		const file = files[0];
		if (!file) return;

		setFileName(file.name);

		const reader = new FileReader();
		reader.onload = (e) => {
			setImageUrl(e.target?.result as string);
			setStep("crop");
		};
		reader.readAsDataURL(file);
	}, []);

	const handleCropAreaChange = useCallback(
		(_croppedArea: CropperAreaData, croppedAreaPixels: CropperAreaData) => {
			croppedAreaRef.current = croppedAreaPixels;
		},
		[]
	);

	const handleSave = useCallback(async () => {
		if (!(imageUrl && croppedAreaRef.current)) return;

		setStep("uploading");

		try {
			const blob = await cropImage(imageUrl, croppedAreaRef.current);
			const url = await uploadAvatar(blob, fileName);

			await refreshSession();
			onAvatarChange(url);
			toast.success({ text: "Foto de perfil atualizada com sucesso!" });
			onOpenChange(false);
		} catch (err) {
			toast.error({
				text:
					err instanceof Error
						? err.message
						: "Erro ao atualizar foto de perfil",
			});
			setStep("crop");
		}
	}, [imageUrl, fileName, onAvatarChange, onOpenChange, refreshSession]);

	const descriptions: Record<Step, string> = {
		select: "Escolha uma foto para seu perfil.",
		crop: "Ajuste o enquadramento da sua foto.",
		uploading: "Salvando...",
	};
	const description = descriptions[step];

	const header = (
		<div className="flex items-center gap-4">
			<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary [&_svg]:size-6 [&_svg]:text-white">
				<Camera />
			</div>
			<div>
				<DialogTitle className="font-heading font-semibold text-2xl lg:text-3xl">
					Alterar Foto do Perfil
				</DialogTitle>
				<DialogDescription className="text-muted-foreground text-sm">
					{description}
				</DialogDescription>
			</div>
		</div>
	);

	const drawerHeader = (
		<div className="flex flex-col gap-3 px-4 py-6 text-left">
			<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary [&_svg]:size-6 [&_svg]:text-white">
				<Camera />
			</div>
			<div className="space-y-1">
				<DrawerTitle className="font-heading font-semibold text-2xl">
					Alterar Foto do Perfil
				</DrawerTitle>
				<DrawerDescription className="text-muted-foreground text-sm">
					{description}
				</DrawerDescription>
			</div>
		</div>
	);

	const body = (
		<div className="flex flex-col gap-6">
			{step === "select" && <SelectStep onFileSelected={handleFileSelect} />}
			{step === "crop" && imageUrl && (
				<CropStep
					imageUrl={imageUrl}
					onCropAreaChange={handleCropAreaChange}
					onRotationChange={setRotation}
					onZoomChange={setZoom}
					rotation={rotation}
					zoom={zoom}
				/>
			)}
			{step === "uploading" && <ConfirmStep />}
		</div>
	);

	const footer = step === "crop" && (
		<div className="flex items-center justify-end gap-2 border-t p-4">
			<button
				className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
				onClick={reset}
				type="button"
			>
				Cancelar
			</button>
			<button
				className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
				onClick={handleSave}
				type="button"
			>
				Salvar
			</button>
		</div>
	);

	if (isDesktop) {
		return (
			<Dialog onOpenChange={onOpenChange} open={open}>
				<DialogContent className="flex w-full max-w-lg flex-col gap-0 p-0">
					<DialogHeader className="p-6 pb-0">{header}</DialogHeader>
					<div className="overflow-y-auto p-6 pt-4">{body}</div>
					{footer}
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer onOpenChange={onOpenChange} open={open}>
			<DrawerContent>
				{drawerHeader}
				<div className="flex-1 overflow-auto px-4 pb-4">{body}</div>
				{footer}
			</DrawerContent>
		</Drawer>
	);
}
