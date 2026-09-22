/**
 * biome-ignore-all lint/security/noDangerouslySetInnerHtml: the copy comes
 * from our own catalogs and every interpolated value is escaped by the
 * translator, so the only markup that reaches the email is the emphasis the
 * design asks for.
 */
import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Img,
	Preview,
	render,
	Section,
	Text,
} from "@react-email/components";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

export const AccountDeletionEmail = ({
	displayName,
	appName,
	verificationUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<Html>
			<Head />
			<Preview>
				{t("emails.accountDeletion.preview", { name: displayName })}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Img alt="" height="25" src={"/public/logo.png"} width="31" />

					<Text style={title}>{t("emails.accountDeletion.title")}</Text>

					<Section style={section}>
						<Text
							dangerouslySetInnerHTML={{
								__html: t("emails.accountDeletion.greeting", {
									name: displayName,
								}),
							}}
							style={text}
						/>
						<Text
							dangerouslySetInnerHTML={{
								__html: t("emails.accountDeletion.body", { app: appName }),
							}}
							style={text}
						/>

						<Text
							dangerouslySetInnerHTML={{
								__html: t("emails.accountDeletion.irreversible"),
							}}
							style={text}
						/>

						<Button href={verificationUrl} style={button} target="_blank">
							{t("emails.accountDeletion.cta")}
						</Button>
					</Section>

					<Text style={footer}>{t("emails.accountDeletion.footer")}</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default AccountDeletionEmail;

const main = {
	backgroundColor: "#ffffff",
	color: "#24292e",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const container = {
	maxWidth: "480px",
	margin: "0 auto",
	padding: "20px 0 48px",
};

const title = {
	fontSize: "24px",
	lineHeight: 1.25,
};

const section = {
	padding: "24px",
	border: "solid 1px #dedede",
	borderRadius: "5px",
	textAlign: "center" as const,
};

const text = {
	margin: "0 0 10px 0",
	textAlign: "left" as const,
};

const button = {
	fontSize: "14px",
	backgroundColor: "#d12a2a",
	color: "#fff",
	lineHeight: 1.5,
	borderRadius: "0.5em",
	padding: "12px 24px",
};

const _links = {
	textAlign: "center" as const,
};

const _link = {
	color: "#0366d6",
	fontSize: "12px",
};

const footer = {
	color: "#6a737d",
	fontSize: "12px",
	textAlign: "center" as const,
	marginTop: "60px",
};

export async function renderEmail({
	verificationUrl,
	displayName,
	appName,
	locale,
}: EmailProps): Promise<string> {
	return await render(
		<AccountDeletionEmail
			appName={appName}
			displayName={displayName}
			locale={locale}
			verificationUrl={verificationUrl}
		/>
	);
}
