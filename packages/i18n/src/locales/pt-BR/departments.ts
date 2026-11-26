import type { Translated } from "../../types";
import type { departments as en } from "../en/departments";

export const departments: Translated<typeof en> = {
	page: {
		title: "Setores",
		description:
			"As equipes da sua assistência, quem está em cada uma e qual setor recebe a ordem de serviço em cada etapa",
	},
	table: {
		search: "Buscar setores pelo nome...",
		create: "Novo setor",
		noLeader: "Sem líder",
		membersCount_one: "{{count}} funcionário",
		membersCount_other: "{{count}} funcionários",
		headers: {
			name: "Setor",
			leader: "Líder",
			members: "Funcionários",
			createdAt: "Criado em",
		},
	},
	form: {
		title: "Novo setor",
		description:
			"Dê um nome à equipe. Os funcionários e o líder você adiciona em seguida.",
		nameLabel: "Nome",
		namePlaceholder: "Bancada, Recepção, Estoque...",
		nameDescription: "Como a equipe é conhecida na loja. Não pode se repetir.",
		submit: "Criar setor",
		created: "Setor criado!",
	},
	detail: {
		back: "Setores",
		title: "Setor",
		description: "Quem está no setor e quem o lidera.",
		notFound: "Este setor não existe ou foi excluído.",
		rename: "Renomear",
		renamed: "Setor renomeado!",
		delete: "Excluir",
		deleteTitle: "Excluir {{name}}?",
		deleteDescription:
			"Os funcionários saem dele, as etapas que ele recebia perdem o padrão e as ordens dele ficam sem setor.",
		deleted: "Setor excluído!",
		leaderTitle: "Líder",
		leaderDescription:
			"Um membro que responde pelo setor. As etapas podem mandar as ordens direto para ele.",
		noLeader: "Sem líder",
		clearLeader: "Tirar líder",
		leaderChanged: "Líder atualizado!",
		leaderBadge: "Líder",
	},
	members: {
		title: "Funcionários ({{count}})",
		description: "Um funcionário pode estar em mais de um setor.",
		empty: "Ninguém neste setor ainda.",
		add: "Adicionar funcionários",
		addDescription:
			"Busque pelo nome ou CPF, ou cadastre alguém novo. Ele pode estar em outros setores também.",
		pickPlaceholder: "Buscar um funcionário para adicionar",
		pickHint: "Escolha um ou mais funcionários; eles entram juntos.",
		submit_one: "Adicionar {{count}} funcionário",
		submit_other: "Adicionar {{count}} funcionários",
		added_one: "{{count}} funcionário adicionado!",
		added_other: "{{count}} funcionários adicionados!",
		remove: "Tirar do setor",
		removed: "{{name}} saiu do setor.",
		headers: {
			employee: "Funcionário",
			role: "Cargo",
			addedAt: "No setor desde",
		},
	},
	stages: {
		title: "Quem recebe a ordem de serviço em cada etapa",
		description:
			"Quando uma ordem é aberta ou muda de etapa, ela vai para o setor definido aqui e, dentro dele, para quem você escolher. Etapas sem setor mantêm a ordem com quem está.",
		department: "Setor",
		keep: "Sem padrão",
		keepHint: "A ordem continua com quem está.",
		stage: "Etapa",
		assignee: "Responsável",
		modes: {
			pool: "Pool do setor",
			poolHint: "Ninguém em específico: qualquer pessoa do setor pega.",
			leader: "Líder do setor",
			leaderHint: "Vai direto para o líder do setor.",
			employee: "Funcionário específico",
			employeeHint: "Vai sempre para o funcionário que você escolher.",
		},
		noLeaderYet:
			"Este setor ainda não tem líder: as ordens vão para o pool até um ser definido.",
		pickEmployee: "Escolha um funcionário do setor",
		saved: "Etapa atualizada!",
	},
	employee: {
		title: "Setores",
		description: "Escolha todos os setores em que {{name}} está.",
		assign: "Setores",
		none: "Sem setor",
		noDepartments: "Nenhum setor ainda. Crie um em Setores.",
		submit: "Salvar setores",
		saved: "Setores de {{name}} atualizados!",
	},
};
