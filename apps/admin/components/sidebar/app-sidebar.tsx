"use client";

import * as React from "react";
import { Building2, LogOut } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import FixrIcon from "@/components/FixrIcon";
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
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: "Empresas",
            url: "/dash/companies",
            icon: Building2,
            isActive: true,
            items: [
                {
                    title: "Lista",
                    url: "/dash/companies",
                },
                {
                    title: "Nova",
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { isLoaded, user } = useUser();

    return (
        <Sidebar collapsible='icon' {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {/* <NavProjects projects={data.projects} /> */}
            </SidebarContent>
            <SidebarFooter>
                <div className='flex items-center justify-between'>
                    <div className='flex gap-4 items-center'>
                        <UserButton />
                        <div className='flex flex-col text-sm'>
                            {isLoaded ? (
                                <>
                                    <p>{user?.fullName}</p>
                                    <p className='text-muted-foreground text-xs'>
                                        {user?.externalAccounts?.find((acc) => acc.username)
                                            ?.username ??
                                            user?.emailAddresses?.find(
                                                (email) => email.emailAddress
                                            )?.emailAddress}
                                    </p>
                                </>
                            ) : (
                                "Carregando..."
                            )}
                        </div>
                    </div>
                    <Button asChild variant={"ghost"} size={"icon"}>
                        <SignOutButton>
                            <span>
                                <LogOut />
                            </span>
                        </SignOutButton>
                    </Button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
