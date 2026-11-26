import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailHeading,
	EmailLayout,
	EmailText,
	EmailWarning,
} from "../components/email-layout";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Confirms a permanent deletion: the consequence comes before the button. */
export const AccountDeletionEmail = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale);
	const values = { name: displayName, app: appName };

	return (
		<EmailLayout
			footer={t("emails.accountDeletion.footer")}
			illustration="account-deletion"
			preview={t("emails.accountDeletion.preview")}
		>
			<EmailHeading>{t("emails.accountDeletion.heading")}</EmailHeading>
			<EmailText>{t("emails.accountDeletion.lead", values)}</EmailText>
			<EmailWarning>{t("emails.accountDeletion.irreversible")}</EmailWarning>
			<EmailButton
				fallback={t("emails.common.linkFallback")}
				href={verificationUrl}
				tone="danger"
			>
				{t("emails.accountDeletion.cta")}
			</EmailButton>
		</EmailLayout>
	);
};

AccountDeletionEmail.PreviewProps = {
	displayName: "Ricardo",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/account/confirm-deletion?token=abc",
	locale: "pt-BR",
} as EmailProps;

export default AccountDeletionEmail;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<AccountDeletionEmail {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
