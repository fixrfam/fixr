export interface Message {
	title: string;
	description: string;
}

export const messages: Record<string, Message> = {
	create_api_key_success: {
		title: "Chave criada",
		description: "Copie o segredo agora, ele não será exibido novamente.",
	},
	revoke_api_key_success: {
		title: "Chave revogada",
		description: "As requisições que usavam esta chave passam a ser recusadas.",
	},
	api_key_name_conflict: {
		title: "Nome já utilizado",
		description: "Você já tem uma chave ativa com este nome.",
	},
	api_key_invalid_scopes: {
		title: "Permissões inválidas",
		description: "Uma chave não pode ter mais permissões do que você.",
	},
	api_key_not_found: {
		title: "Chave não encontrada",
		description: "Esta chave não existe ou não pertence a você.",
	},
	api_key_already_revoked: {
		title: "Chave já revogada",
		description: "Esta chave foi revogada anteriormente.",
	},
	api_key_expiration_too_far: {
		title: "Validade muito longa",
		description: "A data de expiração excede o limite permitido.",
	},
	rate_limit_exceeded: {
		title: "Muitas requisições",
		description: "Aguarde alguns instantes antes de tentar novamente.",
	},
	schema_mismatch: {
		title: "Schema inválido",
		description: "A requisição enviada não pode ser processada.",
	},
	cpf_conflict: {
		title: "CPF já cadastrado",
		description: "Um funcionário com este CPF já existe.",
	},
	cnpj_conflict: {
		title: "CNPJ já cadastrado",
		description: "Uma empresa com este CNPJ já existe.",
	},
	email_already_exists: {
		title: "Email já cadastrado",
		description: "Um usuario com este email já existe.",
	},
	email_already_used: {
		title: "Email já cadastrado",
		description: "Um usuário com este email já existe.",
	},
	subdomain_taken: {
		title: "Subdomínio em uso.",
		description: "Esse domínio já foi selecionado por outra empresa.",
	},
	company_create_success: {
		title: "Sucesso!",
		description: "Empresa criada com sucesso.",
	},
	company_not_found: {
		title: "Empresa não encontrada",
		description: "Não há empresas atreladas a sua conta.",
	},
	not_allowed: {
		title: "Acesso negado",
		description: "Você nao tem permissão para executar essa ação.",
	},
	violates_role_hierarchy: {
		title: "Ação negada",
		description: "Você só pode cadastrar funcionários subordinados.",
	},
	create_employee_success: {
		title: "Sucesso!",
		description: "Funcionario cadastrado com sucesso.",
	},
};

export const defaultMessages = {
	success: {
		title: "Sucesso!",
		description: "Operação realizada com sucesso.",
	},
	error: {
		title: "Erro!",
		description: "Um erro inesperado ocorreu.",
	},
};
