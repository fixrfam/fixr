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

/** The most serious email: red accents, the warning before the button. */
export const AccountDeletionEmail = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<EmailLayout
			footer={t("emails.accountDeletion.footer")}
			illustration="account-deletion"
			preview={t("emails.accountDeletion.preview", { name: displayName })}
			tone="danger"
		>
			<Text
				className="mb-0 text-[15px] text-muted"
				dangerouslySetInnerHTML={{
					__html: t("emails.accountDeletion.greeting", { name: displayName }),
				}}
			/>
			<Heading className="mt-1 mb-2 font-semibold text-[24px] text-ink leading-8">
				{t("emails.accountDeletion.title")}
			</Heading>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.accountDeletion.body", { app: appName }),
				}}
			/>
			<EmailNote tone="danger">
				<span
					dangerouslySetInnerHTML={{
						__html: t("emails.accountDeletion.irreversible"),
					}}
				/>
			</EmailNote>
			<EmailButton href={verificationUrl} tone="danger">
				{t("emails.accountDeletion.cta")}
			</EmailButton>
		</EmailLayout>
	);
};

AccountDeletionEmail.PreviewProps = {
	displayName: "alanturing",
	appName: "Fixr",
	verificationUrl: "https://fixr.com.br/account/confirm-deletion?token=abc",
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
