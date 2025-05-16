export const messages: { [key: string]: { title: string; description: string } } = {
    email_already_used: {
        title: "Email já cadastrado.",
        description: "Já existe uma conta utilizando este email.",
    },
    verification_email_failed: {
        title: "Falha ao enviar email de verificação",
        description: "Houve um problema do nosso lado. Tente novamente mais tarde.",
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
};

export const fallbackMessages = {
    success: {
        title: "Sucesso!",
        description: "Sua solicitação foi concluída com sucesso.",
    },
    error: {
        title: "Ops! Algo deu errado.",
        description:
            "Não foi possível processar sua solicitação. Verifique os dados e tente novamente.",
    },
};
