import type { Translated } from "../../types";
import type { admin as source } from "../en/admin";

export const admin: Translated<typeof source> = {
	metadata: {
		title: "Fixr Admin",
		description: "Painel de administrador",
	},
	landing: {
		title: "Painel de administrador",
		description:
			"Crie empresas, admins e configure os negócios de nossos clientes.",
		restricted: "Acesso restrito a desenvolvedores",
		dashboard: "Dashboard",
	},
	breadcrumb: {
		root: "Fixr",
		current: "Admin",
	},
	nav: {
		companies: "Empresas",
		list: "Lista",
		new: "Nova",
		plan: "Enterprise",
		platform: "Plataforma",
		teams: "Times",
		addTeam: "Adicionar time",
	},
	dashboard: {
		title: "Fixr - Admin",
		description: "Painel de administrador",
		newCompany: "Criar nova empresa",
		listCompanies: "Ver empresas",
	},
	companies: {
		newTitle: "Criar uma nova empresa",
		newDescription:
			"Aqui você pode criar uma nova empresa e definir um admin padrão.",
		listPlaceholder: "Crie uma nova empresa.",
	},
	createCompany: {
		nameLabel: "Nome da empresa *",
		namePlaceholder: "Acme Inc.",
		nameDescription: "Como o nome fantasia da empresa.",
		documentLabel: "CNPJ *",
		documentPlaceholder: "12.345.678/0001-00",
		subdomainLabel: "Subdomínio",
		subdomainPlaceholder: "exemplo",
		subdomainDescription: "Domínio - {{subdomain}}.fixr.ricardo.gg",
		subdomainFallback: "exemplo",
		ownerEmailLabel: "Email do proprietário *",
		ownerEmailPlaceholder: "email@exemplo.com",
		ownerEmailDescription:
			"Ele receberá sua senha de acesso (redefinível) neste email.",
		ownerDocumentLabel: "CPF do proprietário *",
		ownerDocumentPlaceholder: "123.456.789-00",
		ownerPasswordLabel: "Senha do proprietário *",
		ownerPasswordDescription: "Será enviada para o email especificado.",
		generate: "Gerar",
		optionalFields: "Campos opcionais",
		addressLabel: "Endereço",
		addressPlaceholder: "1234 Main St",
		submit: "Criar",
	},
} as const;
