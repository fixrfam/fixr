import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailHeading,
	EmailLayout,
	EmailList,
	EmailNote,
	EmailText,
} from "../components/email-layout";

export interface EmailProps {
	customerName: string;
	/** Shop that sent the access; null when the customer asked for the link. */
	companyName: string | null;
	/** Portal entry link (the customer's account). */
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** The way into the customer portal, what is there and why it stays private. */
export const PortalAccess = ({
	customerName,
	companyName,
	ctaUrl,
	locale = defaultLocale,
}: EmailProps) => {
	const { t } = createTranslator(locale);
	const lead = companyName
		? t("emails.portalAccess.lead", {
				name: customerName,
				company: companyName,
			})
		: t("emails.portalAccess.leadSelf", { name: customerName });

	return (
		<EmailLayout
			company={companyName}
			footer={t("emails.portalAccess.footer")}
			illustration="portal-access"
			preview={t("emails.portalAccess.preview")}
		>
			<EmailHeading>{t("emails.portalAccess.heading")}</EmailHeading>
			<EmailText>{lead}</EmailText>
			<EmailList
				items={[
					t("emails.portalAccess.item1"),
					t("emails.portalAccess.item2"),
					t("emails.portalAccess.item3"),
				]}
				title={t("emails.portalAccess.listTitle")}
			/>
			<EmailButton fallback={t("emails.common.linkFallback")} href={ctaUrl}>
				{t("emails.portalAccess.cta")}
			</EmailButton>
			<EmailNote>{t("emails.portalAccess.note")}</EmailNote>
		</EmailLayout>
	);
};

PortalAccess.PreviewProps = {
	customerName: "Maria",
	companyName: "CONTEEX",
	ctaUrl: "https://fixr.com.br/portal/token",
	locale: "pt-BR",
} as EmailProps;

export default PortalAccess;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<PortalAccess {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
