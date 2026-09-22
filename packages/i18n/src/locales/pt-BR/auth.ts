import type { Translated } from "../../types";
import type { auth as source } from "../en/auth";

export const auth: Translated<typeof source> = {
	layout: {
		imageAlt: "Uma pessoa consertando um laptop com uma chave de fenda.",
		headline: {
			first: "Gerenciando",
			second: "serviços",
			third: "com",
			fourth: "excelência.",
		},
		cta: "Faça login para começar.",
		photoCredit: "Foto de Samsung Memory na Unsplash",
	},
	login: {
		title: "Bem vindo ao Fixr!",
		subtitle: "Insira suas credenciais e entre na sua conta",
		emailLabel: "E-mail *",
		emailPlaceholder: "email@exemplo.com",
		passwordLabel: "Senha *",
		forgotPassword: "Esqueceu sua senha?",
		submit: "Entrar",
		orContinueWith: "Ou continue com",
		google: "Entrar com Google",
		disclaimer: "Projeto universitário sem fins lucrativos.",
	},
	register: {
		title: "Crie uma conta",
		subtitle: "Preencha o formulário abaixo para começar",
		emailLabel: "Email *",
		emailPlaceholder: "m@exemplo.com",
		nameLabel: "Nome",
		namePlaceholder: "João Doe",
		passwordLabel: "Senha *",
		confirmPasswordLabel: "Confirmar senha *",
		submit: "Cadastrar",
		haveAccount: "Já tem uma conta?",
		login: "Faça login",
	},
	forgotPassword: {
		title: "Esqueceu sua senha?",
		subtitle: "Digite seu e-mail abaixo, redefinimos para você!",
		emailLabel: "E-mail *",
		emailPlaceholder: "email@exemplo.com",
		submit: "Redefinir senha",
		success: {
			title: "Email enviado! 📧",
			description: "Enviamos um email de redefinição.",
			paragraph:
				"Clique no link enviado para o seu email, preencha a sua nova senha e está tudo pronto!",
		},
	},
	resetPassword: {
		title: "Alterar sua senha",
		subtitle: "Crie uma nova senha segura e preencha abaixo.",
		passwordLabel: "Senha *",
		confirmPasswordLabel: "Confirmar senha *",
		confirmDescription:
			"A confirmação ajuda a garantir que não haja erros de digitação, mantendo sua conta segura.",
		submit: "Alterar senha",
		success: {
			title: "Senha alterada! 🎉",
			description: "Sua senha foi alterada com sucesso.",
			paragraph: "Você conseguiu! Agora você pode entrar com sua nova senha.",
		},
	},
	success: {
		goToLogin: "Ir para o login",
	},
	turnstile: {
		error:
			"Falha na verificação de segurança. Recarregue a página e tente novamente.",
		interactive:
			"Verificação de segurança necessária. Complete o desafio CAPTCHA",
	},
	signOut: {
		loading: "Saindo, aguarde um momento...",
		success: "Até logo!",
		error: "Erro ao sair, tente novamente.",
	},
	verifiedDialog: {
		cta: "Iniciar",
		toastTitle: "Entre para explorar o app.",
		toastDescription: "Estamos esperando por você!",
		title: "Conta verificada com sucesso!",
		description: "A verificação da sua conta foi concluída com sucesso.",
		details:
			"O seu e-mail foi verificado com sucesso e a sua conta está pronta para uso. Clique abaixo para entrar e começar a explorar.",
	},
	deletedDialog: {
		cta: "Fechar",
		toastTitle: "Até mais!",
		toastDescription: "A sua conta foi excluída. Volte quando quiser.",
		title: "A sua conta foi excluída",
		description: "Estamos tristes em ver você ir embora!",
		details:
			"Se você decidir voltar, estaremos aqui para recebê-lo de volta. Sinta-se à vontade para se inscrever novamente a qualquer momento!",
	},
} as const;
