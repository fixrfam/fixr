import type { Translated } from "../../types";
import type { common as source } from "../en/common";

export const common: Translated<typeof source> = {
	app: {
		name: "Fixr",
		tagline: "O jeito fácil de gerenciar sua assistência técnica.",
		description:
			"Simplifique processos, reduza erros e ofereça um atendimento mais ágil e profissional na sua assistência técnica.",
	},
	actions: {
		save: "Salvar",
		saveChanges: "Salvar alterações",
		cancel: "Cancelar",
		create: "Criar",
		confirm: "Confirmar",
		continue: "Continuar",
		close: "Fechar",
		back: "Voltar",
		edit: "Editar",
		delete: "Excluir",
		remove: "Remover",
		copy: "Copiar",
		copied: "Copiado",
		search: "Buscar",
		send: "Enviar",
		retry: "Tentar novamente",
		select: "Selecionar",
		clear: "Limpar",
		apply: "Aplicar",
		reset: "Redefinir",
		upload: "Enviar arquivo",
		openMenu: "Abrir menu",
		seeMore: "Ver mais",
		toggleSidebar: "Alternar barra lateral",
		previous: "Anterior",
		next: "Próximo",
	},
	states: {
		loading: "Carregando...",
		saving: "Salvando...",
		sending: "Enviando...",
		empty: "Nada por aqui ainda",
		noResults: "Nenhum resultado encontrado.",
		error: "Algo deu errado",
	},
	theme: {
		toggle: "Alternar tema",
		light: "Claro",
		dark: "Escuro",
		system: "Sistema",
	},
	language: {
		label: "Idioma",
		change: "Alterar idioma",
	},
	auth: {
		login: "Entrar",
		logout: "Sair",
		register: "Criar conta",
	},
	logo: {
		fixr: "Logo do Fixr",
		google: "Logo do Google",
	},
	fields: {
		name: "Nome",
		email: "Email",
		password: "Senha",
		optional: "opcional",
	},
} as const;
