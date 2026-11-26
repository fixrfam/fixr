import type { Translated } from "../../types";
import type { emails as source } from "../en/emails";

export const emails: Translated<typeof source> = {
	common: {
		linkFallback: "Se o botão não funcionar, abra este link:",
	},
	invite: {
		subject: "{{company}} te adicionou no {{app}}",
		preview:
			"Sua senha temporária está aqui dentro. Entre e troque por uma sua.",
		heading: "Boas-vindas à equipe da {{company}}",
		lead: "Olá, {{name}}. A {{company}} organiza a assistência no {{app}} e acabou de liberar o seu acesso. Para entrar, use este email e a senha temporária abaixo.",
		passwordLabel: "Senha temporária",
		stepsTitle: "Seus primeiros cinco minutos",
		step1: "Entre com este email e a senha temporária.",
		step2: "Vá em Conta e escolha uma senha que só você saiba.",
		step3:
			"Abra Ordens de serviço para ver o que está com você e com o seu setor.",
		cta: "Entrar no {{app}}",
		note: "Ninguém da {{company}} ou do {{app}} vai pedir essa senha por telefone ou mensagem.",
		footer:
			"Você recebeu este email porque a {{company}} te adicionou à equipe no {{app}}. Se não conhece a empresa, ignore e nada vai acontecer.",
	},
	portalAccess: {
		subject: "Suas ordens de serviço na {{company}}",
		subjectSelf: "Seu link para acompanhar suas ordens de serviço",
		preview:
			"Veja como está cada reparo sem precisar ligar para a assistência.",
		heading: "Todos os seus reparos num só lugar",
		lead: "Olá, {{name}}. O portal do cliente mostra cada aparelho que você deixou na {{company}}, do diagnóstico à retirada, para você não precisar ligar para saber como está.",
		leadSelf:
			"Olá, {{name}}. Aqui está o link que você pediu. O portal do cliente mostra cada aparelho que você deixou nas assistências que usam o Fixr, do diagnóstico à retirada.",
		listTitle: "No portal você pode",
		item1: "Ver em que etapa está cada ordem de serviço",
		item2: "Aprovar ou recusar orçamentos e baixar os PDFs",
		item3: "Consultar o histórico e as fotos dos seus aparelhos",
		cta: "Abrir meu portal",
		note: "O link vale por 30 dias em qualquer aparelho e abre o seu histórico, então guarde só para você.",
		footer:
			"Você recebeu este email porque o seu acesso ao portal do cliente do Fixr foi solicitado. Se não foi você, ignore.",
	},
	estimate: {
		subject: "Orçamento #{{number}} da {{company}}",
		preview: "{{total}} para consertar o seu {{device}}. Válido até {{date}}.",
		heading: "Seu {{device}} já tem orçamento",
		lead: "Olá, {{name}}. A {{company}} avaliou o seu {{device}} e o reparo fica em {{total}}. Confira o que está incluído e responda até {{date}}.",
		numberLabel: "Orçamento",
		deviceLabel: "Aparelho",
		validUntilLabel: "Válido até",
		totalLabel: "Total",
		stepsTitle: "Como funciona daqui para frente",
		step1: "Você aprova ou recusa pelo link, sem precisar criar conta.",
		step2:
			"Se aprovar, a {{company}} começa o reparo e você acompanha cada etapa.",
		step3:
			"Se recusar, pode deixar um motivo e a {{company}} vê sua resposta na hora.",
		cta: "Responder orçamento #{{number}}",
		note: "O PDF com todos os itens segue em anexo. Depois de {{date}}, peça um novo orçamento à {{company}}.",
		footer:
			"Você recebeu este email porque a {{company}} te enviou um orçamento pelo Fixr. Se não pediu, ignore.",
	},
	verification: {
		subject: "Confirme seu email no {{app}}",
		preview: "Um clique e sua conta está pronta.",
		heading: "Falta só um clique",
		lead: "Olá, {{name}}. Sua conta no {{app}} foi criada. Confirme que este endereço é seu para começar a usar e para conseguir voltar se um dia esquecer a senha.",
		cta: "Confirmar meu email",
		note: "O link funciona uma vez e só confirma este endereço.",
		footer:
			"Você recebeu este email porque alguém criou uma conta no {{app}} com este endereço. Se não foi você, ignore.",
	},
	passwordReset: {
		subject: "Redefina sua senha do {{app}}",
		preview: "Escolha uma nova senha para a sua conta.",
		heading: "Vamos trocar sua senha",
		lead: "Olá, {{name}}. Recebemos um pedido para redefinir a senha da sua conta no {{app}}. Se foi você, escolha uma nova pelo botão abaixo.",
		cta: "Escolher nova senha",
		note: "O link funciona uma vez. Não encaminhe este email: quem tiver o link consegue trocar a sua senha.",
		footer: "Se não foi você, ignore este email. Sua senha continua a mesma.",
	},
	accountDeletion: {
		subject: "Confirme a exclusão da sua conta no {{app}}",
		preview: "Precisamos da sua confirmação antes de apagar qualquer coisa.",
		heading: "Confirme a exclusão da sua conta",
		lead: "Olá, {{name}}. Você pediu para excluir sua conta no {{app}}. Antes de apagar qualquer coisa, precisamos confirmar que foi você.",
		irreversible:
			"Ao confirmar, a conta e todos os dados ligados a ela são apagados na hora. Não dá para desfazer.",
		cta: "Excluir minha conta",
		footer:
			"Se você não pediu isso, ignore este email. Sua conta continua ativa.",
	},
} as const;
