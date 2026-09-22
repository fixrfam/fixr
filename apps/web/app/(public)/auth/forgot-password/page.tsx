"use client";

import { useTranslation } from "@fixr/i18n/react";
import { useState } from "react";
import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPassword() {
	const { t } = useTranslation();
	const [success, setSuccess] = useState(false);

	return success ? (
		<AuthFormSuccess
			description={t("auth.forgotPassword.success.description")}
			paragraph={t("auth.forgotPassword.success.paragraph")}
			title={t("auth.forgotPassword.success.title")}
		/>
	) : (
		<ForgotPasswordForm onSuccess={setSuccess} />
	);
}
