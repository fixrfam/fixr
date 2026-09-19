"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Props for the remove-avatar confirmation dialog. */
interface RemoveAvatarDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called when the user confirms removal. */
	onConfirm: () => void;
	/** Whether the removal request is in flight. */
	loading?: boolean;
}

/**
 * Destructive confirmation dialog for removing the user's profile picture.
 *
 * Renders a red "Remover" action button and a "Cancelar" cancel button.
 */
export function RemoveAvatarDialog({
	open,
	onOpenChange,
	onConfirm,
	loading = false,
}: RemoveAvatarDialogProps) {
	return (
		<AlertDialog onOpenChange={onOpenChange} open={open}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remover foto do perfil</AlertDialogTitle>
					<AlertDialogDescription>
						Tem certeza que deseja remover sua foto de perfil? Essa ação não
						pode ser desfeita.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={loading}
						onClick={onConfirm}
					>
						{loading ? "Removendo..." : "Remover"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
