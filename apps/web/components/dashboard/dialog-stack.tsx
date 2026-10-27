"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
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
	DrawerNested,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface Layer {
	/** How many dialogs are open under this point of the tree. */
	depth: number;
	/** What the closest layer is: a drawer (mobile) nests drawers, not dialogs. */
	kind: "root" | "dialog" | "drawer";
	/** Tells the dialog this one opened over that it's covered. */
	setCovered: (covered: boolean) => void;
}

/** Outside any dialog: nothing to cover. */
const ROOT: Layer = {
	depth: 0,
	kind: "root",
	setCovered: () => undefined,
};

const LayerContext = createContext<Layer>(ROOT);

/**
 * Makes a dialog part of the stack: while a dialog opened from inside it is
 * on top, `covered` is true so it can step back. Wrap the dialog's content
 * in {@link DialogLayer} with `layer` so the dialogs it opens find it.
 */
export function useDialogLayer(
	open: boolean,
	kind: "dialog" | "drawer" = "dialog"
) {
	const parent = useContext(LayerContext);
	const [covered, setCovered] = useState(false);
	const { setCovered: coverParent } = parent;

	useEffect(() => {
		if (!open) {
			return;
		}
		coverParent(true);
		return () => coverParent(false);
	}, [open, coverParent]);

	const layer = useMemo(
		() => ({ depth: parent.depth + 1, kind, setCovered }),
		[parent.depth, kind]
	);

	return { covered, layer, parentKind: parent.kind };
}

/** Wraps a dialog's content so the dialogs opened from it stack over it. */
export function DialogLayer({
	layer,
	children,
}: {
	layer: Layer;
	children: ReactNode;
}) {
	return (
		<LayerContext.Provider value={layer}>{children}</LayerContext.Provider>
	);
}

/** Classes of a dialog panel that another dialog covers: it steps back. */
export const coveredDialogClass =
	"transition-[scale,translate,filter] duration-300 ease-out data-[covered=true]:pointer-events-none data-[covered=true]:-translate-y-[calc(50%+1.25rem)] data-[covered=true]:scale-[0.94] data-[covered=true]:blur-[2px]";

/**
 * A dialog that opens over another one (a new customer over the new order,
 * a model over the new device...). The one under it steps back while it's
 * open, and closing it returns there with everything as it was.
 */
export function StackedDialog({
	open,
	onOpenChange,
	title,
	description,
	icon,
	className,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	icon?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const { covered, layer, parentKind } = useDialogLayer(
		open,
		isMobile ? "drawer" : "dialog"
	);

	const Title = isMobile ? DrawerTitle : DialogTitle;
	const Description = isMobile ? DrawerDescription : DialogDescription;
	const heading = (
		<>
			{icon && (
				<div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-white [&_svg]:size-5">
					{icon}
				</div>
			)}
			<div className="grid min-w-0 gap-0.5">
				<Title className="font-heading text-xl leading-tight">{title}</Title>
				{description && (
					<Description className="text-pretty text-muted-foreground text-sm">
						{description}
					</Description>
				)}
			</div>
		</>
	);

	// On phones it's a drawer; over another drawer, vaul's nested drawer,
	// which steps the one under it back on its own.
	if (isMobile) {
		const Root = parentKind === "drawer" ? DrawerNested : Drawer;
		return (
			<Root onOpenChange={onOpenChange} open={open}>
				<DrawerContent className="max-h-[92dvh]">
					<div className="flex items-center gap-3 px-4 pt-4 pb-3 text-left">
						{heading}
					</div>
					<div className="min-h-0 overflow-y-auto px-4 pb-6">
						<DialogLayer layer={layer}>{children}</DialogLayer>
					</div>
				</DrawerContent>
			</Root>
		);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className={cn(
					"max-h-[calc(100dvh-4rem)] gap-4 overflow-y-auto sm:max-w-xl",
					coveredDialogClass,
					className
				)}
				data-covered={covered}
				// The backdrop of the first dialog already dims the page.
				overlayClassName={layer.depth > 1 ? "bg-black/25" : undefined}
			>
				<DialogHeader className="flex-row items-center gap-3 text-left">
					{heading}
				</DialogHeader>
				<DialogLayer layer={layer}>{children}</DialogLayer>
			</DialogContent>
		</Dialog>
	);
}
