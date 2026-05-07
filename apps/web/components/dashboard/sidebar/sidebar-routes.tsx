import { permissions } from "@fixr/permissions/permissions";
import type { SidebarSection } from "./types";

export const sidebarSections: readonly SidebarSection[] = [
	{
		title: "Sistema",
		items: [
			{
				id: "home",
				label: "Início",
				href: "/home",
				type: "route",
				icon: "Home",
				permission: permissions.serviceOrders.read,
			},
			{
				id: "notifications",
				label: "Notificações",
				href: "/notifications",
				type: "route",
				icon: "Bell",
				permission: permissions.companies.read,
			},
			{
				id: "logs",
				label: "Registros",
				href: "/logs",
				type: "route",
				icon: "List",
				permission: permissions.logs.read,
			},
			{
				id: "settings",
				label: "Configurações",
				icon: "Settings",
				items: [
					{
						id: "profile",
						label: "Perfil",
						href: "/account",
						type: "route",
						icon: "User",
						permission: permissions.companies.read,
					},
					{
						id: "security",
						label: "Segurança",
						href: "/settings/security",
						type: "route",
						icon: "Shield",
						permission: permissions.settings.security,
					},
				],
				type: "menu",
			},
		],
	},
	{
		title: "Módulos",
		items: [
			{
				id: "service-orders",
				label: "Ordens de Serviço",
				href: "/service-orders",
				type: "route",
				icon: "Clipboard",
				permission: permissions.serviceOrders.read,
			},
			{
				id: "estimates",
				label: "Orçamentos",
				href: "/estimates",
				type: "route",
				icon: "HandCoins",
				permission: permissions.estimates.read,
			},
			{
				id: "suppliers",
				label: "Fornecedores",
				href: "/suppliers",
				type: "route",
				icon: "Package",
				permission: permissions.suppliers.read,
			},
			{
				id: "parts",
				label: "Peças",
				href: "/parts",
				type: "route",
				icon: "Puzzle",
				permission: permissions.parts.read,
			},
			{
				id: "inventory",
				label: "Estoque",
				href: "/inventory",
				type: "route",
				icon: "Warehouse",
				permission: permissions.inventory.read,
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
				permission: permissions.customers.read,
			},
			{
				id: "devices",
				label: "Aparelhos",
				href: "/devices",
				type: "route",
				icon: "MonitorSmartphone",
				permission: permissions.devices.read,
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
				permission: permissions.employees.read,
			},
		],
	},
];
