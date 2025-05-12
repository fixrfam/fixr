import { SidebarSection } from "./types";

export const sidebarSections: readonly SidebarSection[] = [
    {
        title: "Sistema",
        items: [
            { id: "home", label: "Início", href: "/home", type: "route", icon: "Home" },
            {
                id: "notifications",
                label: "Notificações",
                href: "/notifications",
                type: "route",
                icon: "Bell",
            },
            { id: "logs", label: "Registros", href: "/logs", type: "route", icon: "List" },
            {
                id: "settings",
                label: "Configurações",
                icon: "Settings",
                items: [
                    {
                        id: "profile",
                        label: "Perfil",
                        href: "/server/account",
                        type: "route",
                        icon: "User",
                    },
                    {
                        id: "security",
                        label: "Segurança",
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
        title: "Funcionalidades",
        items: [
            {
                id: "service-orders",
                label: "Ordens de Serviço",
                href: "/service-orders",
                type: "route",
                icon: "Clipboard",
            },
            {
                id: "estimates",
                label: "Orçamentos",
                href: "/estimates",
                type: "route",
                icon: "HandCoins",
            },
            {
                id: "suppliers",
                label: "Fornecedores",
                href: "/suppliers",
                type: "route",
                icon: "Package",
            },
            { id: "parts", label: "Peças", href: "/parts", type: "route", icon: "Puzzle" },
            {
                id: "inventory",
                label: "Estoque",
                href: "/inventory",
                type: "route",
                icon: "Warehouse",
            },
            {
                id: "support",
                label: "Suporte",
                href: "/support",
                type: "route",
                icon: "MessageCircleQuestion",
            },
            {
                id: "customers",
                label: "Clientes",
                href: "/customers",
                type: "route",
                icon: "Users",
            },
            {
                id: "devices",
                label: "Aparelhos",
                href: "/devices",
                type: "route",
                icon: "MonitorSmartphone",
            },
        ],
    },
    {
        title: "Empresa",
        items: [
            {
                id: "employees",
                label: "Funcionários",
                href: "/employees",
                type: "route",
                icon: "ContactRound",
            },
        ],
    },
];
