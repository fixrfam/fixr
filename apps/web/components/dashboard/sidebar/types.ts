import type { StaticTranslationKey } from "@fixr/i18n";
import type { Permission } from "@fixr/permissions";
import type * as icons from "lucide-react";

export interface BaseItem {
	readonly id: string;
	/** Key of the label, translated when the item is rendered. */
	readonly labelKey: StaticTranslationKey;
	icon: keyof typeof icons;
}

export type RouteItem = BaseItem & {
	readonly type: "route";
	readonly href: string;
	permission?: Permission;
};

export type MenuItem = BaseItem & {
	readonly type: "menu";
	readonly items: readonly SidebarItem[];
};

export type SidebarItem = RouteItem | MenuItem;

export interface SidebarSection {
	readonly titleKey: StaticTranslationKey;
	readonly items: readonly SidebarItem[];
}
