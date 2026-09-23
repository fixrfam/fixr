import type { Translated } from "../../types";
import type { apiKeys as source } from "../en/api-keys";

export const apiKeys: Translated<typeof source> = {
	page: {
		title: "Chaves de API",
		description: "Suas chaves para acesso programático à API do Fixr.",
	},
	table: {
		search: "Procurar nas suas chaves...",
		empty: "Você ainda não criou nenhuma chave",
		columns: {
			name: "Chave",
			status: "Status",
			scopes: "Permissões",
			lastUsed: "Último uso",
			expiresAt: "Expira em",
			createdAt: "Criada em",
			actions: "Ações",
		},
		neverUsed: "Nunca usada",
		noExpiration: "Sem expiração",
		inheritsRole: "Herda seu cargo",
		scopeCount_one: "{{count}} permissão",
		scopeCount_other: "{{count}} permissões",
	},
	status: {
		active: "Ativa",
		revoked: "Revogada",
		expired: "Expirada",
	},
	actions: {
		revoke: "Revogar",
		newKey: "Nova chave",
	},
	create: {
		title: "Nova chave de API",
		description: "A chave é sua e carrega as permissões do seu cargo.",
		createdTitle: "Chave criada",
		createdDescription: 'Guarde o segredo de "{{name}}" em local seguro.',
		nameLabel: "Nome da chave",
		namePlaceholder: "Integração com o ERP",
		nameDescription: "Use um nome que identifique onde a chave será usada.",
		expirationLabel: "Validade",
		expirationDescription:
			"Chaves com prazo reduzem o impacto de um vazamento.",
		expirationNever: "Sem expiração",
		expirationDays: "{{count}} dias",
		expirationYear: "1 ano",
		scopesLabel: "Permissões",
		scopesInherit: "herda seu cargo",
		scopesSelected_one: "{{count}} selecionada",
		scopesSelected_other: "{{count}} selecionadas",
		scopesHint:
			"Sem nenhuma selecionada, a chave usa exatamente as permissões do seu cargo. Selecionar restringe: uma chave nunca pode ter mais acesso do que você.",
		submit: "Criar chave",
	},
	secret: {
		warningTitle: "Copie agora, este segredo não será exibido de novo",
		warningDescription:
			"O Fixr guarda apenas um hash da chave. Se você perder este valor, será preciso revogar a chave e criar outra.",
		label: "Seu segredo",
		copy: "Copiar segredo",
		copied: "Segredo copiado",
		copyFailedTitle: "Não foi possível copiar",
		copyFailedDescription: "Selecione o texto e copie manualmente.",
		usageBefore: "Envie no header",
		usageBetween: "ou como",
		secretWord: "segredo",
		done: "Já copiei, fechar",
	},
	revoke: {
		title: 'Revogar "{{name}}"?',
		description:
			"Qualquer integração que use esta chave passa a receber erro de autenticação imediatamente. Esta ação não pode ser desfeita.",
		confirm: "Revogar",
	},
} as const;
