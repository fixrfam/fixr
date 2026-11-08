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
	customerName: string;
	/** Shop that sent the access; null when the customer asked for the link. */
	companyName: string | null;
	/** Portal entry link (the customer's account). */
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** A friendly welcome to the portal: what they can do there and the magic link. */
export const PortalAccess = ({
	customerName,
	ctaUrl,
	locale = defaultLocale,
}: EmailProps) => {
	/** Values are escaped: part of the copy carries inline markup. */
	const { t } = createTranslator(locale, { escapeValues: true });
	const perks = [
		t("portal.access.perks.track"),
		t("portal.access.perks.answer"),
		t("portal.access.perks.shops"),
	];

	return (
		<EmailLayout
			footer={t("emails.portalAccess.footer")}
			illustration="portal-access"
			preview={t("emails.portalAccess.preview")}
		>
			<Text
				className="mb-0 text-[15px] text-muted"
				dangerouslySetInnerHTML={{
					__html: t("emails.portalAccess.greeting", { name: customerName }),
				}}
			/>
			<Heading className="mt-1 mb-2 font-semibold text-[24px] text-ink leading-8">
				{t("emails.portalAccess.heading")}
			</Heading>
			{perks.map((perk) => (
				<Text className="my-1.5 text-[15px] leading-6" key={perk}>
					<span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
					&nbsp;&nbsp;
					{perk}
				</Text>
			))}
			<EmailButton href={ctaUrl}>{t("emails.portalAccess.cta")}</EmailButton>
			<EmailNote>
				<span
					dangerouslySetInnerHTML={{ __html: t("emails.portalAccess.body") }}
				/>{" "}
				{t("emails.portalAccess.validity")}
			</EmailNote>
		</EmailLayout>
	);
};

PortalAccess.PreviewProps = {
	customerName: "Maria",
	companyName: "Central Assistência",
	ctaUrl: "http://localhost:3000/portal/token",
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
