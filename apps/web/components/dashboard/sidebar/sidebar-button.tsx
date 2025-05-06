"use client";

import Link from "next/link";
import { SidebarItem } from "./types";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as icons from "lucide-react";

export function SidebarButton(data: SidebarItem) {
    const Icon = icons[data.icon] as icons.LucideIcon;

    if (data.type === "route") {
        const { id, label, href } = data;

        const path = `/dashboard/${href.replace("/", "")}`;
        const active = path === usePathname();

        return (
            <Link id={id} href={path}>
                <div
                    className={cn(
                        "text-secondary-foreground px-2 py-1.5 text-sm rounded-sm inline-flex items-center gap-2 w-full",
                        !active ? "hover:bg-muted" : "bg-primary/10 text-primary"
                    )}
                >
                    <Icon className='size-4' />
                    {label}
                </div>
            </Link>
        );
    }

    const { id, label, items } = data;

    return (
        <div>
            <div className='text-secondary-foreground hover:bg-muted px-2 py-1.5 text-sm inline-flex items-center gap-2 w-full'>
                <Icon className='size-4' />
                {label}
            </div>
            <div>
                {items.map((item) => (
                    <SidebarButton key={item.id} {...item} />
                ))}
            </div>
        </div>
    );
}
