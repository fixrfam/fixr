"use client";

import * as icons from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSidebarStore } from "@/lib/hooks/stores/use-sidebar-store";
import { cn } from "@/lib/utils";
import type { SidebarItem } from "./types";

export function SidebarButton({
	data,
	nestingLevel = 0,
}: {
	data: SidebarItem;
	nestingLevel?: number;
}) {
	//biome-ignore lint/performance/noDynamicNamespaceImportAccess: <This is needed so the user can pass a string as the Icon>
	const Icon = icons[data.icon] as icons.LucideIcon;

	const currentPath = usePathname();
	const params = useParams<{ subdomain: string }>();

	const { close } = useSidebarStore();

	if (data.type === "route") {
		const { id, label, href } = data;

		const path = `/dashboard/${params.subdomain}${href}`;
		const active = path === currentPath;

		return (
			<Link href={path} id={id} onClick={() => close()} prefetch>
				<div
					className={cn(
						"relative inline-flex w-full items-center gap-2 rounded-sm py-1.5 pr-2 text-secondary-foreground text-sm",
						active ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
					)}
					style={{
						paddingLeft: nestingLevel
							? `calc(${nestingLevel + 1}rem - 0.25rem)`
							: "0.5rem",
					}}
				>
					{active && nestingLevel ? (
						<div className="absolute left-[calc(1rem-0.5px)] h-1/2 w-px bg-primary" />
					) : null}
					<Icon className="size-4" />
					{label}
				</div>
			</Link>
		);
	}

	const { label, items } = data;

	return (
		<Collapsible>
			<CollapsibleTrigger asChild>
				<div className="group flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-secondary-foreground text-sm hover:bg-muted/50">
					<div className="inline-flex items-center gap-2">
						<Icon className="size-4" />
						{label}
					</div>
					<icons.ChevronDown className="size-4 text-muted-foreground transition-all group-data-[state=open]:rotate-180" />
				</div>
			</CollapsibleTrigger>
			<CollapsibleContent className="relative">
				<div className="absolute left-[calc(1rem-0.5px)] h-full w-px bg-border" />
				{items.map((item) => (
					<SidebarButton
						data={item}
						key={item.id}
						nestingLevel={nestingLevel + 1}
					/>
				))}
			</CollapsibleContent>
		</Collapsible>
	);
}
