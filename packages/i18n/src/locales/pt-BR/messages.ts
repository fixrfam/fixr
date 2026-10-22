import type { Translated } from "../../types";
import type { messages as source } from "../en/messages";

export const messages: Translated<typeof source> = {
	fallback: {
		success: {
			title: "Sucesso!",
			description: "Sua solicitação foi concluída com sucesso.",
		},
		error: {
			title: "Ops! Algo deu errado.",
			description:
				"Não foi possível processar sua solicitação. Verifique os dados e tente novamente.",
		},
	},
	codes: {
		create_api_key_success: {
			title: "Chave criada",
			description: "Copie o segredo agora, ele não será exibido novamente.",
		},
		revoke_api_key_success: {
			title: "Chave revogada",
			description:
				"As requisições que usavam esta chave passam a ser recusadas.",
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
			description: "Um usuário com este email já existe.",
		},
		email_already_used: {
			title: "Email já cadastrado",
			description: "Já existe uma conta utilizando este email.",
		},
		subdomain_taken: {
			title: "Subdomínio em uso",
			description: "Esse domínio já foi selecionado por outra empresa.",
		},
		company_create_success: {
			title: "Sucesso!",
			description: "Empresa criada com sucesso.",
		},
		company_not_found: {
			title: "Empresa não encontrada",
			description: "Não há empresas atreladas à sua conta.",
		},
		not_allowed: {
			title: "Acesso negado",
			description: "Você não tem permissão para executar essa ação.",
		},
		violates_role_hierarchy: {
			title: "Ação negada",
			description: "Você só pode cadastrar funcionários subordinados.",
		},
		create_employee_success: {
			title: "Sucesso!",
			description: "Funcionário cadastrado com sucesso.",
		},
		verification_email_failed: {
			title: "Falha ao enviar email de verificação",
			description:
				"Houve um problema do nosso lado. Tente novamente mais tarde.",
		},
		user_registered_success: {
			title: "Conta criada.",
			description: "Verifique seu email para ativá-la.",
		},
		invalid_password: {
			title: "Senha incorreta",
			description: "Verifique a digitação e tente novamente.",
		},
		email_not_verified: {
			title: "Email não verificado",
			description: "Clique no link enviado para seu email e tente novamente.",
		},
		user_not_found: {
			title: "Usuário não encontrado",
			description: "Não encontramos nenhum usuário com essas credenciais.",
		},
		login_success: {
			title: "Login realizado!",
			description: "Você será redirecionado em instantes...",
		},
		update_account_success: {
			title: "Conta atualizada!",
			description: "Recarregue a página para ver as mudanças.",
		},
		password_update_success: {
			title: "Senha atualizada!",
			description: "Use sua nova senha no próximo login.",
		},
		equal_passwords: {
			title: "Senhas iguais",
			description: "Sua nova senha não pode ser igual à atual.",
		},
		password_reset_request_accepted: {
			title: "Solicitação de redefinição enviada",
			description: "Verifique seu email para as instruções.",
		},
		existing_password_reset_request: {
			title: "Solicitação pendente",
			description:
				"Você já possui uma solicitação ativa. Conclua-a ou aguarde 30 minutos para expirar.",
		},
		token_expired: {
			title: "Ops... Seu tempo expirou.",
			description: "Recomece o processo, pois já se passaram 30 minutos.",
		},
		deletion_request_accepted: {
			title: "Solicitação de exclusão enviada",
			description: "Verifique seu email para confirmar.",
		},
		existing_deletion_request: {
			title: "Solicitação pendente",
			description:
				"Você já possui uma solicitação de exclusão. Conclua-a ou aguarde 30 minutos para expirar.",
		},
		gacc_missing_email: {
			title: "E-mail não fornecido",
			description:
				"Não foi possível recuperar seu endereço de e-mail do Google. Por favor, tente novamente.",
		},
		gacc_user_not_found: {
			title: "Não foi possível acessar sua conta",
			description:
				"O seu e-mail vinculado ao Google não está registrado como funcionário ou cliente de nenhuma empresa.",
		},
		gacc_email_not_verified: {
			title: "E-mail não verificado",
			description:
				"O seu endereço de e-mail do Google ainda não foi verificado. Verifique seu e-mail e tente novamente.",
		},
	},
} as const;
