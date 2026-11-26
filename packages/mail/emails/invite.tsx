import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailCode,
	EmailHeading,
	EmailLayout,
	EmailNote,
	EmailSteps,
	EmailText,
} from "../components/email-layout";

export interface EmailProps {
	displayName: string;
	companyName: string;
	appName: string;
	password: string;
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Welcome to the team: who added you, the temporary password, the way in. */
export const Invite = ({
	displayName,
	appName,
	companyName,
	ctaUrl,
	password,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale);
	const values = { name: displayName, company: companyName, app: appName };

	return (
		<EmailLayout
			company={companyName}
			footer={t("emails.invite.footer", values)}
			illustration="invite"
			preview={t("emails.invite.preview")}
		>
			<EmailHeading>{t("emails.invite.heading", values)}</EmailHeading>
			<EmailText>{t("emails.invite.lead", values)}</EmailText>
			<EmailCode label={t("emails.invite.passwordLabel")}>{password}</EmailCode>
			<EmailSteps
				steps={[
					t("emails.invite.step1"),
					t("emails.invite.step2"),
					t("emails.invite.step3"),
				]}
				title={t("emails.invite.stepsTitle")}
			/>
			<EmailButton fallback={t("emails.common.linkFallback")} href={ctaUrl}>
				{t("emails.invite.cta", values)}
			</EmailButton>
			<EmailNote>{t("emails.invite.note", values)}</EmailNote>
		</EmailLayout>
	);
};

Invite.PreviewProps = {
	displayName: "Ricardo",
	companyName: "CONTEEX",
	appName: "Fixr",
	ctaUrl: "https://fixr.com.br/auth/login",
	password: "#}sPhzIvUj",
	locale: "pt-BR",
} as EmailProps;

export default Invite;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<Invite {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
