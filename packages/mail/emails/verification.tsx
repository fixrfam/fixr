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
import { EmailButton, EmailLayout } from "../components/email-layout";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Confirms a new account: one step left, one button. */
export const VerificationEmail = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<EmailLayout
			footer={t("emails.verification.footer")}
			illustration="verification"
			preview={t("emails.verification.preview", { name: displayName })}
		>
			<Heading
				className="mt-3 mb-2 font-semibold text-[24px] text-ink leading-8"
				dangerouslySetInnerHTML={{
					__html: t("emails.verification.title", { name: displayName }),
				}}
			/>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.verification.greeting", { name: displayName }),
				}}
			/>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.verification.body", { app: appName }),
				}}
			/>
			<EmailButton href={verificationUrl}>
				{t("emails.verification.cta")}
			</EmailButton>
		</EmailLayout>
	);
};

VerificationEmail.PreviewProps = {
	displayName: "alanturing",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/auth/verify?token=abc",
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
