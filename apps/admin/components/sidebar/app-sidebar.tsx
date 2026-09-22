"use client";

import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import { useTranslation } from "@fixr/i18n/react";
import { Building2, LogOut } from "lucide-react";
import type * as React from "react";
import FixrIcon from "@/components/fixr-icon";
import { LanguageToggle } from "@/components/language-toggle";
import { NavMain } from "@/components/sidebar/nav-main";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

// This is sample data.
const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	teams: [
		{
			name: "Fixr",
			logo: FixrIcon,
			planKey: "admin.nav.plan",
		},
	],
	navMain: [
		{
			titleKey: "admin.nav.companies",
			url: "/dash/companies",
			icon: Building2,
			isActive: true,
			items: [
				{
					titleKey: "admin.nav.list",
					url: "/dash/companies",
				},
				{
					titleKey: "admin.nav.new",
					url: "/dash/companies/new",
				},
			],
		},
	],
	// projects: [
	//     {
	//         name: "Design Engineering",
	//         url: "#",
	//         icon: Frame,
	//     },
	//     {
	//         name: "Sales & Marketing",
	//         url: "#",
	//         icon: PieChart,
	//     },
	//     {
	//         name: "Travel",
	//         url: "#",
	//         icon: Map,
	//     },
	// ],
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { t } = useTranslation();
	const { isLoaded, user } = useUser();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* <NavProjects projects={data.projects} /> */}
			</SidebarContent>
			<SidebarFooter>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<UserButton />
						<div className="flex flex-col text-sm">
							{isLoaded ? (
								<>
									<p>{user?.fullName}</p>
									<p className="text-muted-foreground text-xs">
										{user?.externalAccounts?.find((acc) => acc.username)
											?.username ??
											user?.emailAddresses?.find((email) => email.emailAddress)
												?.emailAddress}
									</p>
								</>
							) : (
								t("common.states.loading")
							)}
						</div>
					</div>
					<div className="flex items-center">
						<LanguageToggle />
						<Button asChild size={"icon"} variant={"ghost"}>
							<SignOutButton>
								<span>
									<LogOut />
								</span>
							</SignOutButton>
						</Button>
					</div>
				</div>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
