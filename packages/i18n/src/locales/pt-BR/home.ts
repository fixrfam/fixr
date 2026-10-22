import type { Translated } from "../../types";
import type { home as source } from "../en/home";

export const home: Translated<typeof source> = {
	nav: {
		features: "Funcionalidades",
		products: "Produtos",
		pricing: "Preços",
		customers: "Clientes",
		contact: "Contato",
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
	},
	features: {
		badge: "Simples & intuitivo",
		titleBefore: "Seu",
		titleWork: "trabalho",
		titleBetween: ", mais",
		titleEasier: "fácil",
		description:
			"O Fixr facilita o workflow em todas as áreas de sua assistência técnica.",
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
