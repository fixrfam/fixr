"use client";

import type { StaticTranslationKey } from "@fixr/i18n";
import { useTranslation } from "@fixr/i18n/react";
import { ChevronRight, type LucideIcon } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: readonly {
		readonly titleKey: StaticTranslationKey;
		readonly url: string;
		readonly icon?: LucideIcon;
		readonly isActive?: boolean;
		readonly items?: readonly {
			readonly titleKey: StaticTranslationKey;
			readonly url: string;
		}[];
	}[];
}) {
	const { t } = useTranslation();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{t("admin.nav.platform")}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						asChild
						className="group/collapsible"
						defaultOpen={item.isActive}
						key={item.titleKey}
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={t(item.titleKey)}>
									{item.icon && <item.icon />}
									<span>{t(item.titleKey)}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.titleKey}>
											<SidebarMenuSubButton asChild>
												<a href={subItem.url}>
													<span>{t(subItem.titleKey)}</span>
												</a>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
