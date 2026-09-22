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
	Section,
	Text,
} from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";

interface EmailProps {
	displayName: string;
	appName: string;
	verificationUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

const _baseUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "";

export const VerificationEmail = ({
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
				{t("emails.verification.preview", { name: displayName })}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Img alt="" height="25" src={"/public/logo.png"} width="31" />

					<Text
						dangerouslySetInnerHTML={{
							__html: t("emails.verification.title", { name: displayName }),
						}}
						style={title}
					/>

					<Section style={section}>
						<Text
							dangerouslySetInnerHTML={{
								__html: t("emails.verification.greeting", {
									name: displayName,
								}),
							}}
							style={text}
						/>
						<Text style={text}>
							{t("emails.verification.body", { app: appName })}
						</Text>

						<Button href={verificationUrl} style={button} target="_blank">
							{t("emails.verification.cta")}
						</Button>
					</Section>

					<Text style={footer}>{t("emails.verification.footer")}</Text>
				</Container>
			</Body>
		</Html>
	);
};

VerificationEmail.PreviewProps = {
	displayName: "alanturing",
} as EmailProps;

export default VerificationEmail;

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
	backgroundColor: "#000000",
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
	try {
		return await render(
			<VerificationEmail
				appName={appName}
				displayName={displayName}
				locale={locale}
				verificationUrl={verificationUrl}
			/>
		);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
