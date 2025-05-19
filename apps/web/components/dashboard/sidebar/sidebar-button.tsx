"use client";

import { SidebarItem } from "./types";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as icons from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";

export function SidebarButton({
    data,
    nestingLevel = 0,
}: {
    data: SidebarItem;
    nestingLevel?: number;
}) {
    const Icon = icons[data.icon] as icons.LucideIcon;

    const currentPath = usePathname();
    const params = useParams<{ subdomain: string }>();

    if (data.type === "route") {
        const { id, label, href } = data;

        const path = `/dashboard/${params.subdomain}${href}`;
        const active = path === currentPath;

        return (
            <Link id={id} href={path} prefetch>
                <div
                    className={cn(
                        "text-secondary-foreground pr-2 py-1.5 text-sm rounded-sm inline-flex items-center gap-2 w-full relative",
                        !active ? "hover:bg-muted/50" : "bg-primary/10 text-primary"
                    )}
                    style={{
                        paddingLeft: nestingLevel
                            ? `calc(${nestingLevel + 1}rem - 0.25rem)`
                            : "0.5rem",
                    }}
                >
                    {active && nestingLevel ? (
                        <div className='absolute h-1/2 w-[1px] bg-primary left-[calc(1rem-0.5px)]'></div>
                    ) : (
                        <></>
                    )}
                    <Icon className='size-4' />
                    {label}
                </div>
            </Link>
        );
    }

    const { id, label, items } = data;

    return (
        <Collapsible>
            <CollapsibleTrigger asChild>
                <div className='text-secondary-foreground hover:bg-muted/50 px-2 py-1.5 text-sm rounded-sm w-full flex justify-between items-center group cursor-pointer'>
                    <div className='inline-flex items-center gap-2'>
                        <Icon className='size-4' />
                        {label}
                    </div>
                    <icons.ChevronDown className='size-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-all' />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className='relative'>
                <div className='absolute w-[1px] left-[calc(1rem-0.5px)] h-full bg-border'></div>
                {items.map((item) => (
                    <SidebarButton key={item.id} data={item} nestingLevel={nestingLevel + 1} />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}
