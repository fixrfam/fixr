import type { Translated } from "../../types";
import type { home as source } from "../en/home";

export const home: Translated<typeof source> = {
	nav: {
		label: "Principal",
		overview: "Visão geral",
		showSections: "Mostrar seções da página",
		features: "Funcionalidades",
		howItWorks: "Como funciona",
		roles: "Cargos",
		faq: "Dúvidas",
		docs: "Docs",
	},
	hero: {
		badge: "Simplifique e expanda",
		titleFirst: "O jeito",
		titleHighlight: "fácil",
		titleMiddle: "de gerenciar sua",
		titleEnd: "assistência técnica",
		subtitle:
			"Consolide suas ordens de serviço, o controle de estoque e o acompanhamento dos consertos em um só lugar.",
		cta: "Acessar o Fixr",
		docs: "Documentação",
		scene:
			"O painel do Fixr mostrando uma ordem de serviço com os dados do aparelho, ciclo de vida, resumo, técnico e cliente",
		proof: {
			openSource: "Código aberto",
			interviews: "Desenhado com donos de assistência",
			languages: "Português e inglês",
		},
	},
	preview: {
		title: "Ordem de serviço",
		description: "Veja os detalhes completos da ordem de serviço abaixo",
		issue: "Bateria descarrega rapidamente e superaquecimento.",
		entryRegistered: "Ordem de serviço registrada pelo técnico.",
		entryDiagnosis: "Diagnóstico concluído, necessário troca de bateria.",
		entryWaiting: "Aguardando chegada de bateria nova.",
		notes: "Diagnóstico concluído, aguardando chegada de bateria nova.",
		category: "Telefonia",
		part: "Bateria",
		caption: "Bateria do celular inchando",
	},
	problem: {
		badge: "Por que o Fixr",
		titleBefore: "Do papel carbonado para",
		titleHighlight: "um só sistema",
		description:
			"A maioria das assistências ainda roda com bloco de OS, caderno de estoque e orçamento mandado por mensagem. O Fixr junta cada etapa no mesmo lugar.",
		scene:
			"Folhas de papel soltas voando e se empilhando em um único registro do Fixr",
		solution:
			"Com o Fixr, cada conserto tem um único registro da entrada até a retirada.",
		pains: {
			lost: {
				title: "Ordens de serviço perdidas",
				description:
					"Uma via de papel some e ninguém sabe mais qual celular é de quem.",
			},
			estimates: {
				title: "Orçamentos que ninguém encontra",
				description:
					"Os preços ficam perdidos em conversas, as aprovações somem e o conserto para na bancada.",
			},
			stock: {
				title: "Estoque no chute",
				description:
					"Você só descobre que a peça acabou quando o técnico abre a gaveta.",
			},
			calls: {
				title: "Cliente ligando para saber",
				description:
					"Cada ligação perguntando se o aparelho ficou pronto tira alguém da bancada.",
			},
		},
	},
	features: {
		badge: "Simples & intuitivo",
		titleBefore: "Seu",
		titleWork: "trabalho",
		titleBetween: ", mais",
		titleEasier: "fácil",
		description:
			"O Fixr facilita o workflow em todas as áreas de sua assistência técnica.",
		cards: {
			serviceOrders: {
				title: "Ordens de serviço que andam",
				description:
					"Abra a OS no balcão, atribua um técnico e acompanhe do aberto ao concluído em um só quadro.",
				scene:
					"Cartões de ordens de serviço passando pelas colunas aberta, em andamento e concluída",
			},
			estimates: {
				title: "Orçamento aprovado pelo link",
				description:
					"Monte o orçamento com as peças e serviços da OS, envie o PDF e deixe o cliente aprovar online.",
				scene:
					"Um orçamento sendo preenchido linha a linha até receber o carimbo de aprovação",
			},
			portal: {
				title: "Um portal para seus clientes",
				description:
					"O cliente abre o link do email e confere o andamento do conserto sem precisar ligar.",
				scene:
					"Um celular mostrando o conserto passando pelos status, com uma nova notificação",
			},
			inventory: {
				title: "Estoque que avisa antes",
				description:
					"As peças usadas na OS saem do estoque sozinhas, e cada uma aponta os fornecedores de quem você compra.",
				scene:
					"Prateleiras de peças em que um espaço vazio é reposto por uma caixa do fornecedor",
			},
			catalog: {
				title: "Catálogo de aparelhos pronto",
				description:
					"Celulares, tablets, smartwatches e notebooks já vêm com marcas e especificações, e a entrada leva segundos.",
				scene:
					"Um notebook, um celular e um tablet flutuando sobre o catálogo de aparelhos",
			},
		},
		extras: {
			notifications: {
				title: "Emails automáticos",
				description:
					"O cliente fica sabendo de cada mudança de status e resposta de orçamento pelo email.",
			},
			history: {
				title: "Histórico completo da OS",
				description:
					"Veja quem alterou cada ordem, quando, e qual técnico assumiu o conserto.",
			},
			api: {
				title: "Chaves de API",
				description:
					"Conecte suas ferramentas com chaves que nunca passam do cargo de quem as criou.",
			},
		},
	},
	tagline: {
		lineOne: "Cada conserto ganha *um único registro*,",
		lineTwo: "do balcão até a hora de *voltar para o cliente*.",
	},
	howItWorks: {
		badge: "Como funciona",
		titleBefore: "Três passos,",
		titleHighlight: "zero papel",
		description:
			"O mesmo fluxo que sua assistência já segue, sem formulários e sem ligações de acompanhamento.",
		step: "Passo {{number}}",
		steps: {
			intake: {
				title: "Abra a OS no balcão",
				description:
					"Cadastre o cliente e escolha o aparelho no catálogo. A ordem ganha um número e um técnico.",
			},
			estimate: {
				title: "Diagnostique e envie o orçamento",
				description:
					"O técnico adiciona peças e serviços. O Fixr confere o estoque e gera o PDF para o cliente.",
			},
			deliver: {
				title: "Aprove, conserte e avise",
				description:
					"O cliente aprova pelo link, a equipe trabalha, e cada mudança de status chega no email dele.",
			},
		},
	},
	roles: {
		badge: "Acesso por cargo",
		titleBefore: "Cada pessoa vê",
		titleHighlight: "só o que precisa",
		description:
			"Cinco cargos já vêm prontos, cada um limitado ao trabalho que faz. Balcão, bancada, estoque e financeiro dividem um sistema sem atrapalhar um ao outro.",
		scene:
			"Cinco camadas de acesso empilhadas, com o cargo escolhido levantado e em destaque",
		pick: "Escolha um cargo para ver o que ele faz",
		items: {
			technician:
				"Trabalha nas ordens de serviço, atualiza o status e consulta peças e aparelhos.",
			warehouse:
				"Ajusta o estoque, cadastra peças e mantém os fornecedores em dia.",
			financial: "Cria orçamentos, ajusta preços e envia para os clientes.",
			manager:
				"Abre e atribui ordens, e cuida de clientes, estoque e orçamentos.",
			admin:
				"Acesso completo, incluindo funcionários, cargos e dados da empresa.",
		},
	},
	proof: {
		badge: "Feito por quem é do ramo",
		titleBefore: "Feito com",
		titleHighlight: "assistências técnicas",
		description:
			"O Fixr nasceu de entrevistas com donos e técnicos de assistências de pequeno e médio porte. Cada tela segue o jeito que eles realmente trabalham.",
		points: {
			interviews: {
				title: "Desenhado com assistências reais",
				description:
					"Os requisitos vieram de conversas com quem conserta aparelhos todos os dias.",
			},
			isolation: {
				title: "Sua assistência, seus dados",
				description:
					"Cada assistência tem seu próprio espaço, e os registros nunca se misturam com os de outra.",
			},
			openSource: {
				title: "Código aberto",
				description:
					"O código é público no GitHub, então você vê exatamente como seus dados são tratados.",
			},
		},
		github: "Ver o código no GitHub",
	},
	faq: {
		badge: "Dúvidas",
		titleBefore: "Perguntas",
		titleHighlight: "frequentes",
		items: {
			install: {
				question: "Preciso instalar alguma coisa?",
				answer:
					"Não. O Fixr roda no navegador em computadores, tablets e celulares, e cada assistência tem seu próprio espaço com sua equipe.",
			},
			approval: {
				question: "Como o cliente aprova um orçamento?",
				answer:
					"Ele recebe um email com um link, abre o orçamento em PDF e aprova ou recusa. A resposta chega na ordem de serviço na hora.",
			},
			tracking: {
				question: "Meus clientes conseguem acompanhar o conserto?",
				answer:
					"Sim. O mesmo link abre um portal em que eles confirmam a identidade e veem o status e o histórico das suas ordens.",
			},
			roles: {
				question: "Posso limitar o que cada funcionário vê?",
				answer:
					"Sim. Técnico, estoquista, financeiro, gerente e administrador já vêm prontos, e cada cargo só acessa as telas de que precisa.",
			},
			stock: {
				question: "O Fixr controla meu estoque?",
				answer:
					"Sim. As peças usadas em uma ordem de serviço saem do estoque automaticamente, e cada peça fica ligada aos fornecedores de quem você compra.",
			},
			catalog: {
				question: "Preciso cadastrar cada modelo de aparelho?",
				answer:
					"Não. O Fixr já vem com um catálogo de celulares, tablets, smartwatches e notebooks, com marcas e especificações preenchidas.",
			},
			invoices: {
				question: "O Fixr emite nota fiscal?",
				answer:
					"Ainda não. A emissão de nota fiscal está em estudo, e as ordens e orçamentos já guardam os dados de que ela vai precisar.",
			},
			pricing: {
				question: "Quanto custa o Fixr?",
				answer:
					"Os planos ainda estão sendo definidos. Enquanto isso o código está aberto no GitHub, e você pode ver tudo o que o Fixr faz antes de decidir.",
			},
			language: {
				question: "O Fixr está disponível em inglês?",
				answer:
					"Sim. O app inteiro funciona em português e inglês, e você pode trocar de idioma a qualquer momento.",
			},
			integrations: {
				question: "Posso conectar o Fixr a outras ferramentas?",
				answer:
					"Sim. Cada funcionário pode criar chaves de API, e uma chave nunca tem mais acesso do que o cargo de quem a criou.",
			},
		},
	},
	cta: {
		titleBefore: "Pronto para gerenciar sua assistência",
		titleHighlight: "em um só lugar?",
		description:
			"Acesse o Fixr, registre sua primeira ordem de serviço e veja o fluxo inteiro do conserto em poucos minutos.",
		reassurance: "Sem instalação. Roda no navegador. Código aberto.",
		scene:
			"O logo do Fixr como um bloco flutuante com pequenas peças orbitando ao redor",
	},
	footer: {
		builtByBefore: "Construído pela equipe",
		builtByAfter: "como projeto acadêmico na",
		codeAvailable: "Código disponível no",
		privacy: "Política de Privacidade",
		terms: "Termos de Uso",
	},
	banner: {
		apiDown: "API indisponível",
		learnMore: "Saiba mais",
	},
	downtime: {
		title: "O sistema está temporariamente fora do ar",
		bannerAlt: "Banner do Fixr",
		project:
			"Este é um projeto interdisciplinar desenvolvido na FAM (Faculdade das Américas). Sua infraestrutura envolve diversos serviços: como o servidor da API, banco de dados e sistema de cache, todos hospedados em uma VPS privada.",
		costs:
			"Como esses serviços possuem custos em dólar, optamos por mantê-los disponíveis apenas durante o período de contexto e apresentações dos Projetos Integradores (PIs).",
		outside:
			"Fora desses períodos, o backend é desativado para reduzir custos operacionais, permanecendo apenas o frontend acessível para fins de demonstração e consulta visual.",
		learn:
			"Caso queira conhecer mais sobre o funcionamento do projeto, sua arquitetura e principais decisões técnicas, você pode acessar a documentação ou explorar os demais links disponíveis.",
		linktree: "Linktree",
		docs: "Documentação",
		thanks: "Agradecemos sua compreensão e interesse no projeto.",
		signature: "Atenciosamente, a equipe Fixr.",
	},
	legal: {
		back: "Voltar para o início",
		badge: "Termos legais",
		updatedAt: "Atualizado por último em: {{date}}",
	},
} as const;
