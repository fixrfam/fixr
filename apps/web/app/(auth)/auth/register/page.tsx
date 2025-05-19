"use client";

import { RegisterForm } from "@/components/auth/register-form";
import AuthFormSuccess from "@/components/auth/auth-form-success";
import { useState } from "react";

export default function RegisterPage() {
    const [success, setSuccess] = useState(false);

    return !success ? (
        <RegisterForm onSuccess={setSuccess} />
    ) : (
        <AuthFormSuccess
            title='Verifique sua caixa de entrada'
            description='Sua conta foi criada com sucesso!🎉'
            paragraph='Enviamos um email de confirmação. Clique no link e está tudo pronto!'
        />
    );
}
