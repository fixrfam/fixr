"use client";

import { useTranslation } from "@fixr/i18n/react";
import { use, useState } from "react";
import AuthFormSuccess from "@/components/auth/auth-form-success";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ChangePasswordPage(props: {
	params: Promise<{ token: string }>;
}) {
	const { t } = useTranslation();
	const params = use(props.params);
	const [success, setSuccess] = useState(false);

	return success ? (
		<AuthFormSuccess
			description={t("auth.resetPassword.success.description")}
			paragraph={t("auth.resetPassword.success.paragraph")}
			title={t("auth.resetPassword.success.title")}
		/>
	) : (
		<ResetPasswordForm onSuccess={setSuccess} token={params.token} />
	);
}
