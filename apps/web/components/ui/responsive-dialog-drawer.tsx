"use client"

import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
} from "@/components/ui/drawer"

interface ResponsiveDialogDrawerProps {
	title: string
	description: string
	icon?: React.ReactNode
	children: React.ReactNode
}

export function ResponsiveDialogDrawer({
	title,
	description,
	icon,
	children,
}: ResponsiveDialogDrawerProps) {
	const router = useRouter()
	const isDesktop = useMediaQuery("(min-width: 768px)")

	function handleOpenChange(open: boolean) {
		if (!open) router.back()
	}

	if (isDesktop) {
		return (
			<Dialog onOpenChange={handleOpenChange} open>
				<DialogContent className="w-full! max-w-3xl! max-h-[calc(100dvh-5rem)] overflow-y-auto">
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
		<Drawer onOpenChange={handleOpenChange} open>
			<DrawerContent>
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
