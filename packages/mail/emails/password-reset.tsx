import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailHeading,
	EmailLayout,
	EmailNote,
	EmailText,
} from "../components/email-layout";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Lets the owner of the account choose a new password. */
export const PasswordReset = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale);
	const values = { name: displayName, app: appName };

	return (
		<EmailLayout
			footer={t("emails.passwordReset.footer")}
			illustration="password-reset"
			preview={t("emails.passwordReset.preview")}
		>
			<EmailHeading>{t("emails.passwordReset.heading")}</EmailHeading>
			<EmailText>{t("emails.passwordReset.lead", values)}</EmailText>
			<EmailButton
				fallback={t("emails.common.linkFallback")}
				href={verificationUrl}
			>
				{t("emails.passwordReset.cta")}
			</EmailButton>
			<EmailNote>{t("emails.passwordReset.note")}</EmailNote>
		</EmailLayout>
	);
};

PasswordReset.PreviewProps = {
	displayName: "Ricardo",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/auth/forgot-password/token",
	locale: "pt-BR",
} as EmailProps;

export default PasswordReset;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<PasswordReset {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
