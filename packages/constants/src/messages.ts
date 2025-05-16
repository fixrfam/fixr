export interface Message {
    title: string;
    description: string;
}

export const messages: Record<string, Message> = {
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
