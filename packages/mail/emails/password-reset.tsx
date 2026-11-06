/**
 * biome-ignore-all lint/security/noDangerouslySetInnerHtml: the copy comes
 * from our own catalogs and every interpolated value is escaped by the
 * translator, so the only markup that reaches the email is the emphasis the
 * design asks for.
 */
import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { Heading, Text } from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailLayout,
	EmailNote,
} from "../components/email-layout";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** A security email: short, one action, and a reminder not to forward it. */
export const PasswordReset = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<EmailLayout
			footer={t("emails.passwordReset.footer")}
			illustration="password-reset"
			preview={t("emails.passwordReset.preview")}
			tone="action"
		>
			<Text
				className="mb-0 text-[15px] text-muted"
				dangerouslySetInnerHTML={{
					__html: t("emails.passwordReset.greeting", { name: displayName }),
				}}
			/>
			<Heading className="mt-1 mb-2 font-semibold text-[24px] text-ink leading-8">
				{t("emails.passwordReset.heading")}
			</Heading>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.passwordReset.body", { app: appName }),
				}}
			/>
			<EmailButton href={verificationUrl} tone="action">
				{t("emails.passwordReset.cta")}
			</EmailButton>
			<EmailNote>{t("emails.passwordReset.warning")}</EmailNote>
		</EmailLayout>
	);
};

PasswordReset.PreviewProps = {
	displayName: "alanturing",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/auth/forgot-password/token",
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
