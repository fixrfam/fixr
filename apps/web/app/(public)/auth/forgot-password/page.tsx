"use client";

import { useState } from "react";
import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPassword() {
	const [success, setSuccess] = useState(false);

	return success ? (
		<AuthFormSuccess
			description="Enviamos um email de redefinição."
			paragraph="Clique no link enviado para o seu email, preencha a sua nova senha e está tudo pronto!"
			title="Email enviado! 📧"
		/>
	) : (
		<ForgotPasswordForm onSuccess={setSuccess} />
	);
}
