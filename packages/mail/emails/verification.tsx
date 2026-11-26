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

/** Confirms a new account: one click left. */
export const VerificationEmail = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale);
	const values = { name: displayName, app: appName };

	return (
		<EmailLayout
			footer={t("emails.verification.footer", values)}
			illustration="verification"
			preview={t("emails.verification.preview")}
		>
			<EmailHeading>{t("emails.verification.heading")}</EmailHeading>
			<EmailText>{t("emails.verification.lead", values)}</EmailText>
			<EmailButton
				fallback={t("emails.common.linkFallback")}
				href={verificationUrl}
			>
				{t("emails.verification.cta")}
			</EmailButton>
			<EmailNote>{t("emails.verification.note")}</EmailNote>
		</EmailLayout>
	);
};

VerificationEmail.PreviewProps = {
	displayName: "Ricardo",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/auth/verify?token=abc",
	locale: "pt-BR",
} as EmailProps;

export default VerificationEmail;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<VerificationEmail {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
