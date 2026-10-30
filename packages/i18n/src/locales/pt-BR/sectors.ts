import type { Translated } from "../../types";
import type { sectors as en } from "../en/sectors";

export const sectors: Translated<typeof en> = {
	page: {
		title: "Setores",
		description:
			"As equipes da sua assistência, quem está em cada uma e quem é responsável por cada etapa da ordem de serviço",
	},
	list: {
		title: "Setores",
		description:
			'Cada funcionário pertence a um setor: o pool dele é o "Meu setor".',
		empty: "Nenhum setor ainda. Crie o primeiro, como Recepção ou Bancada.",
		newPlaceholder: "Nome do novo setor",
		create: "Criar setor",
		created: "Setor criado!",
		rename: "Renomear",
		renamed: "Setor renomeado!",
		remove: "Excluir",
		removeTitle: "Excluir {{name}}?",
		removeDescription:
			"Os funcionários e ordens dele ficam sem setor, e as etapas que ele cuidava perdem o setor padrão.",
		removed: "Setor excluído!",
		employees_one: "{{count}} funcionário",
		employees_other: "{{count}} funcionários",
		noEmployees: "Ninguém neste setor",
	},
	members: {
		title: "Funcionários",
		description: "Coloque cada funcionário no seu setor.",
		sector: "Setor",
		none: "Sem setor",
		moved: "{{name}} movido!",
	},
	stages: {
		title: "Responsáveis por etapa",
		description:
			"Quando uma ordem entra numa etapa, ela vai para o pool desse setor e, se definido, para esse funcionário. Deixe os dois vazios para mantê-la com quem estiver.",
		stage: "Etapa",
		sector: "Setor",
		employee: "Funcionário",
		noSector: "Manter o setor",
		noEmployee: "Pool do setor",
		save: "Salvar etapas",
		saved: "Responsáveis salvos!",
	},
};
