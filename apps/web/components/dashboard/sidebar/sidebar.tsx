"use client";

import type { userJWT } from "@fixr/schemas/auth";
import { PanelLeft, Search } from "lucide-react";
import type { z } from "zod";
import { Avatar } from "@/components/account/profile-avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { TextLogo } from "@/components/svg/text-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/hooks/stores/use-sidebar-store";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { AccountPopover } from "../account-popover";
import { SidebarButton } from "./sidebar-button";
import { sidebarSections } from "./sidebar-routes";

export function Sidebar({ session }: { session: z.infer<typeof userJWT> }) {
	const { isOpen, close } = useSidebarStore();
	const isDesktop = useMediaQuery("(min-width: 1024px)");

	return (
		<>
			<aside
				className={cn(
					"fixed top-2.5 left-2.5 z-99 flex h-[calc(100dvh-(2*0.625rem))] w-[286px] select-none flex-col justify-between rounded-md border border-border bg-background transition-transform",
					"lg:translate-x-0", // Always visible on desktop
					"-translate-x-[calc(100%+0.625rem)] data-[state=open]:translate-x-0" // Slide in on mobile
				)}
				data-state={isOpen ? "open" : "closed"}
			>
				<div className="flex w-full items-center justify-between px-5">
					<TextLogo className="size-16 text-primary" />
					<Button onClick={close} size={"icon"} variant={"ghost"}>
						<PanelLeft className="text-muted-foreground" />
					</Button>
				</div>
				<div className="space-y-4">
					<div className="flex w-full items-center justify-between px-5">
						<div className="flex gap-3">
							<Avatar
								className="size-9 rounded-sm"
								fallbackHash={session.company?.id as string}
								fallbackType="marble"
								variant="square"
							/>
							<div>
								<p className="font-medium text-sm tracking-tight">
									{session.company?.name}
								</p>
								<p className="text-muted-foreground text-xs tracking-tight">
									Minha empresa
								</p>
							</div>
						</div>
					</div>
					<div className="w-full px-5">
						<Button
							className="h-8.5 w-full justify-between bg-muted/50 px-3 text-[0.8rem] text-muted-foreground hover:bg-muted"
							variant={"outline"}
						>
							<div className="inline-flex items-center gap-1.5">
								<Search className={"size-4"} />
								Acesso rápido
							</div>
							<div className="inline-flex items-center gap-1.5">
								<Badge
									className="grid min-w-5 place-items-center rounded-[4px] bg-background px-0.5 text-muted-foreground"
									variant={"outline"}
								>
									⌘
								</Badge>
								<Badge
									className="grid min-w-5 place-items-center rounded-[4px] bg-background px-0.5 text-muted-foreground"
									variant={"outline"}
								>
									K
								</Badge>
							</div>
						</Button>
					</div>
				</div>
				<div
					className="h-full w-full space-y-5 overflow-y-auto px-2 py-5"
					style={{
						maskImage: `
                        linear-gradient(to bottom, transparent, white 1rem),
                        linear-gradient(to top, transparent, white 1rem)
                    `,
						maskComposite: "intersect",
						WebkitMaskComposite: "destination-in",
					}}
				>
					{sidebarSections.map((section) => (
						<div className="space-y-1" key={section.title}>
							<p className="px-5 font-semibold text-muted-foreground text-xs uppercase tracking-tight">
								{section.title}
							</p>
							<div className="px-3">
								{section.items.map((item) => (
									<SidebarButton data={item} key={item.id} />
								))}
							</div>
						</div>
					))}
				</div>
				<div className="flex h-16 w-full shrink-0 items-center justify-between gap-5 rounded-b-md border-border border-t bg-card px-4">
					<div className="flex min-w-0 flex-1 items-center">
						<AccountPopover
							className="min-w-0 flex-1 overflow-hidden"
							session={session}
							showData
							variant="square"
						/>
					</div>
					<ModeToggle />
				</div>
			</aside>
			<button
				className={cn(
					"fixed z-98 h-dvh w-full bg-background/5 backdrop-blur-xs transition-all",
					isDesktop && "hidden",
					isDesktop || isOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0"
				)}
				onClick={close}
				type="button"
			/>
		</>
	);
}
