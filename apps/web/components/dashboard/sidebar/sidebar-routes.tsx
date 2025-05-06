import { SidebarSection } from "./types";

export const sidebarSections: readonly SidebarSection[] = [
    {
        title: "System",
        items: [
            { id: "home", label: "Home", href: "/home", type: "route", icon: "Home" },
            {
                id: "notifications",
                label: "Notifications",
                href: "/notifications",
                type: "route",
                icon: "Bell",
            },
            { id: "logs", label: "Logs", href: "/logs", type: "route", icon: "List" },
            {
                id: "settings",
                label: "Settings",
                icon: "Settings",
                items: [
                    {
                        id: "profile",
                        label: "Profile",
                        href: "/settings/profile",
                        type: "route",
                        icon: "User",
                    },
                    {
                        id: "security",
                        label: "Security",
                        href: "/settings/security",
                        type: "route",
                        icon: "Shield",
                    },
                ],
                type: "menu",
            },
        ],
    },
    {
        title: "Features",
        items: [
            {
                id: "service-orders",
                label: "Service Orders",
                href: "/service-orders",
                type: "route",
                icon: "Clipboard",
            },
            {
                id: "estimates",
                label: "Estimates",
                href: "/estimates",
                type: "route",
                icon: "HandCoins",
            },
            {
                id: "suppliers",
                label: "Suppliers",
                href: "/suppliers",
                type: "route",
                icon: "Package",
            },
            { id: "parts", label: "Parts", href: "/parts", type: "route", icon: "Puzzle" },
            {
                id: "inventory",
                label: "Inventory",
                href: "/inventory",
                type: "route",
                icon: "Warehouse",
            },
            {
                id: "support",
                label: "Support",
                href: "/support",
                type: "route",
                icon: "MessageCircleQuestion",
            },
            {
                id: "customers",
                label: "Customers",
                href: "/customers",
                type: "route",
                icon: "Users",
            },
            {
                id: "devices",
                label: "Devices",
                href: "/devices",
                type: "route",
                icon: "MonitorSmartphone",
            },
        ],
    },
    {
        title: "Company",
        items: [
            {
                id: "employees",
                label: "Employees",
                href: "/employees",
                type: "route",
                icon: "ContactRound",
            },
        ],
    },
];
