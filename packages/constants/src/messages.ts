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
        title: "Email ja cadastrado",
        description: "Um usuario com este email já existe.",
    },
    subdomain_taken: {
        title: "Subdomínio em uso.",
        description: "Esse domínio já foi selecionado por outra empresa.",
    },
    organization_create_success: {
        title: "Sucesso!",
        description: "Organização criada com sucesso.",
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
