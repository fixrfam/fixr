"use client";

import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useState } from "react";

export default function ForgotPassword() {
    const [success, setSuccess] = useState(false);

    return !success ? (
        <ForgotPasswordForm onSuccess={setSuccess} />
    ) : (
        <AuthFormSuccess
            title='Email enviado! 📧'
            description='Enviamos um email de confirmação.'
            paragraph='Clique no link enviado para o seu email, preencha a sua nova senha e está tudo pronto!'
        />
    );
}
