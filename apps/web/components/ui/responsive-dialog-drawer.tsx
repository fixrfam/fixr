"use client"

import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveDialogDrawerProps {
	title: string
	description: string
	icon?: React.ReactNode
	children: React.ReactNode
	/**
	 * Controlled open state. Leave it out and the component behaves as a route
	 * modal: it mounts open and closes by going back in history.
	 */
	open?: boolean
	onOpenChange?: (open: boolean) => void
	/** Element that opens it. Only makes sense when controlled. */
	trigger?: React.ReactNode
	/**
	 * When false, escape, outside clicks and the close button stop dismissing
	 * it, leaving whatever the content offers as the only way out.
	 */
	dismissible?: boolean
	/** Extra classes for the dialog panel. The drawer always fills the width. */
	className?: string
}

export function ResponsiveDialogDrawer({
	title,
	description,
	icon,
	children,
	open,
	onOpenChange,
	trigger,
	dismissible = true,
	className,
}: ResponsiveDialogDrawerProps) {
	const router = useRouter()
	const isDesktop = useMediaQuery("(min-width: 768px)")

	const isControlled = open !== undefined

	function handleOpenChange(next: boolean) {
		if (isControlled) {
			onOpenChange?.(next)
			return
		}

		if (!next) router.back()
	}

	function guardDismiss(event: { preventDefault: () => void }) {
		if (!dismissible) event.preventDefault()
	}

	if (isDesktop) {
		return (
			<Dialog onOpenChange={handleOpenChange} open={isControlled ? open : true}>
				{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
				<DialogContent
					className={cn(
						"w-full! max-w-3xl! max-h-[calc(100dvh-5rem)] overflow-y-auto",
						className
					)}
					onEscapeKeyDown={guardDismiss}
					onInteractOutside={guardDismiss}
					showCloseButton={dismissible}
				>
					<DialogHeader>
						<div className="flex items-center gap-4">
							{icon && (
								<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary [&_svg]:size-6 [&_svg]:text-white">
									{icon}
								</div>
							)}
							<div>
								<DialogTitle className="font-heading font-semibold text-2xl lg:text-3xl">
									{title}
								</DialogTitle>
								<DialogDescription className="text-muted-foreground text-sm">
									{description}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					{children}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer
			dismissible={dismissible}
			onOpenChange={handleOpenChange}
			open={isControlled ? open : true}
		>
			{trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
			<DrawerContent
				onEscapeKeyDown={guardDismiss}
				onInteractOutside={guardDismiss}
			>
				<div className="flex flex-col gap-3 px-4 py-6 text-left">
					{icon && (
						<div className="grid size-12 shrink-0 place-items-center rounded-md bg-primary [&_svg]:size-6 [&_svg]:text-white">
							{icon}
						</div>
					)}
					<div className="space-y-1">
						<DrawerTitle className="font-heading font-semibold text-2xl">
							{title}
						</DrawerTitle>
						<DrawerDescription className="text-muted-foreground text-sm">
							{description}
						</DrawerDescription>
					</div>
				</div>
				<div className="overflow-auto px-4 pb-6">{children}</div>
			</DrawerContent>
		</Drawer>
	)
}
