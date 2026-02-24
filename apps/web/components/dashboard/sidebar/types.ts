import type * as icons from "lucide-react";

export interface BaseItem {
	readonly id: string;
	readonly label: string;
	icon: keyof typeof icons;
}

export type RouteItem = BaseItem & {
	readonly type: "route";
	readonly href: string;
};

export type MenuItem = BaseItem & {
	readonly type: "menu";
	readonly items: readonly SidebarItem[];
};

export type SidebarItem = RouteItem | MenuItem;

export interface SidebarSection {
	readonly title: string;
	readonly items: readonly SidebarItem[];
}
