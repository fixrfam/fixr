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

export interface EmailProps {
	displayName: string;
	companyName: string;
	appName: string;
	password: string;
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Welcome to the team: the temporary password stands out, then the way in. */
export const Invite = ({
	displayName,
	appName,
	companyName,
	ctaUrl,
	password,
	locale = defaultLocale,
}: EmailProps) => {
	/** Values are escaped: part of the copy carries inline markup. */
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<EmailLayout
			footer={t("emails.invite.footer")}
			illustration="invite"
			preview={t("emails.invite.preview", { name: displayName, app: appName })}
		>
			<Text
				className="mb-0 text-[15px] text-muted"
				dangerouslySetInnerHTML={{
					__html: t("emails.invite.greeting", { name: displayName }),
				}}
			/>
			<Heading
				className="mt-1 mb-2 font-semibold text-[24px] text-ink leading-8"
				dangerouslySetInnerHTML={{
					__html: t("emails.invite.heading", {
						company: companyName,
						app: appName,
					}),
				}}
			/>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.invite.body", { company: companyName }),
				}}
			/>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{ __html: t("emails.invite.instructions") }}
			/>
			<Text className="mb-1 text-muted text-xs">
				{t("emails.invite.passwordLabel")}
			</Text>
			<Text
				className="mt-0 rounded-[12px] bg-[#f6f8fc] py-4 text-center font-bold text-[22px] text-ink tracking-wide"
				style={{ fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}
			>
				{password}
			</Text>
			<EmailButton href={ctaUrl}>{t("emails.invite.cta")}</EmailButton>
			<EmailNote>{t("emails.invite.passwordHint")}</EmailNote>
		</EmailLayout>
	);
};

Invite.PreviewProps = {
	displayName: "Ricardo",
	companyName: "Empresa",
	appName: "Fixr",
	ctaUrl: "https://localhost:3000/auth/login",
	password: "#}sPhzIvUj",
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
