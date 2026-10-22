import type { Translated } from "../../types";
import type { emails as source } from "../en/emails";

export const emails: Translated<typeof source> = {
	header: {
		docs: "Docs",
		app: "App",
	},
	invite: {
		subject: "🎉 Bem-vindo ao {{app}} – Seu acesso ao sistema",
		preview: "{{name}}, seu acesso ao {{app}}!",
		greeting: "Olá, <i>{{name}}</i>!",
		heading: "A <b>{{company}}</b> te adicionou no {{app}}.",
		body: "Seu cadastro foi realizado com <b>sucesso</b>. Agora você é um <b>funcionário</b> da <b>{{company}}</b> e pode acessar a plataforma para gerenciar ordens de serviço, orçamentos e muito mais.",
		instructions:
			"Para acessar o sistema, <b>clique no botão abaixo</b> e faça login com <b>este email</b> e a <b>senha aleatória</b> de acesso.",
		cta: "Acessar",
		passwordHint:
			"Altere a senha padrão no painel de conta após o primeiro acesso.",
		footer: "Se você não reconhece essa empresa, por favor, ignore este email.",
	},
	verification: {
		subject: "Confirme seu email, @{{name}}!",
		preview: "{{name}}, confirme seu email!",
		title: "<b>{{name}}</b>, sua nova conta está a um passo de distância.",
		greeting: "Olá, <b>{{name}}</b>!",
		body: "Você criou uma nova conta no {{app}}, clique no botão abaixo para confirmar sua identidade.",
		cta: "Confirmar email",
		footer: "Se não foi você quem criou a conta, ignore este email.",
	},
	passwordReset: {
		subject: "Esqueceu sua senha, {{name}}?",
		preview: "Redefinição de senha",
		greeting: "Olá, <i>{{name}}</i>!",
		heading: "Esqueceu sua senha? 🔒",
		body: "Recebemos uma solicitação para alterar a senha da sua conta no {{app}}.<br />Se foi você, pode definir uma nova senha clicando no botão abaixo:",
		cta: "Redefinir minha senha",
		warning:
			"Para manter sua conta segura, não encaminhe este e-mail a ninguém.",
		footer:
			"Se você não solicitou essa alteração, basta ignorar e excluir esta mensagem.",
	},
	accountDeletion: {
		subject: "Confirmação de exclusão da conta de {{name}}.",
		preview: "{{name}}, confirme a exclusão da sua conta.",
		title: "Confirmação de exclusão de conta",
		greeting: "Olá, <b>{{name}}</b>.",
		body: "Você solicitou a exclusão da sua conta no {{app}}. Ao clicar no botão abaixo, sua conta será <b>excluída permanentemente</b> junto com todos os dados associados.",
		irreversible: "<b>Esta ação é irreversível.</b>",
		cta: "Excluir conta",
		footer: "Se você não solicitou a exclusão, por favor, ignore este email.",
	},
} as const;
