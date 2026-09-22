import type { Translated } from "../../types";
import type { validation as source } from "../en/validation";

export const validation: Translated<typeof source> = {
	generic: {
		required: "Preencha este campo",
		invalidFormat: "Formato inválido.",
	},
	name: {
		required: "O nome é obrigatório",
		min: "O nome deve ter no mínimo {{count}} caracteres.",
		max: "Ops! Nome muito grande...",
		tooLong: "Nome muito grande.",
		atLeast: "O nome deve ter no mínimo {{count}} caracteres.",
		atMost: "O nome deve ter no máximo {{count}} caracteres.",
	},
	email: {
		required: "O email é obrigatório.",
		invalid: "Email inválido",
	},
	password: {
		required: "A senha é obrigatória.",
		complexity:
			"A senha precisa conter uma letra maiúscula, uma minúscula, um número, um caractere especial e ter ao menos 8 caracteres.",
		min: "A senha deve ter no mínimo {{count}} caracteres.",
		max: "A senha deve ter no máximo {{count}} caracteres.",
		uppercase: "A senha deve conter pelo menos um caractere maiúsculo.",
		lowercase: "A senha deve conter pelo menos um caractere minúsculo.",
		number: "A senha deve conter pelo menos um número.",
		special: "A senha deve conter pelo menos um caractere especial.",
		confirm: "Por favor, confirme sua senha.",
		mismatch: "As senhas não coincidem.",
	},
	phone: {
		required: "O telefone é obrigatório",
		incomplete: "Telefone incompleto.",
	},
	address: {
		required: "O endereço é obrigatório",
		min: "O endereço deve ter no mínimo {{count}} caracteres.",
		max: "O endereço deve ter no máximo {{count}} caracteres.",
	},
	city: {
		required: "A cidade é obrigatória",
	},
	state: {
		required: "O estado é obrigatório",
	},
	document: {
		cpf: "CPF inválido",
		cnpj: "CNPJ inválido",
	},
	subdomain: {
		min: "O subdomínio deve ter no mínimo {{count}} caractere.",
		max: "O subdomínio deve ter no máximo {{count}} caracteres.",
	},
	apiKey: {
		expirationInPast: "A data de expiração deve ser no futuro.",
	},
	serviceOrder: {
		clientInvalid: "Cliente inválido.",
		brandInvalid: "Marca do dispositivo inválida.",
		categoryInvalid: "Categoria do dispositivo inválida.",
		assigneeInvalid: "Responsável inválido.",
		modelRequired: "Modelo do dispositivo é obrigatório.",
		modelMax: "Modelo do dispositivo excede {{count}} caracteres.",
		imeiMax: "IMEI excede {{count}} caracteres.",
		issueRequired: "Defeito relatado é obrigatório.",
		issueMax: "Defeito relatado excede o limite permitido.",
		notesMax: "Observações excedem o limite permitido.",
		photosMax: "Máximo de {{count}} fotos por ordem de serviço.",
		photoDescriptionMax: "Descrição excede {{count}} caracteres.",
		dateFromInvalid: "Data inicial inválida.",
		dateToInvalid: "Data final inválida.",
		dateRange: "A data inicial deve ser anterior ou igual à data final.",
	},
	upload: {
		idRequired: "ID do upload é obrigatório.",
		fileNameRequired: "Nome do arquivo é obrigatório.",
		fileNameMax: "Nome do arquivo excede {{count}} caracteres.",
		contentTypeRequired: "Tipo de conteúdo é obrigatório.",
		contentTypeMax: "Tipo de conteúdo excede {{count}} caracteres.",
		contentTypeInvalid: "Tipo de conteúdo deve ser um MIME válido.",
		sizeRequired: "Tamanho do arquivo é obrigatório.",
		sizeInteger: "Tamanho deve ser um número inteiro.",
		sizePositive: "Tamanho deve ser maior que zero.",
		sizeMax: "Arquivo excede o limite de {{limit}}.",
	},
} as const;
