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
	EmailSummary,
} from "../components/email-layout";

export interface EmailProps {
	customerName: string;
	companyName: string;
	/** Estimate number as the customer sees it, e.g. `0042`. */
	number: string;
	device: string;
	/** Total already formatted in the recipient's currency. */
	total: string;
	/** Validity date already formatted for the recipient. */
	validUntil: string;
	/** Link that opens the estimate in the customer portal. */
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

/** Asks the customer to answer: the total and the deadline lead the email. */
export const Estimate = ({
	customerName,
	companyName,
	number,
	device,
	total,
	validUntil,
	ctaUrl,
	locale = defaultLocale,
}: EmailProps) => {
	/** Values are escaped: part of the copy carries inline markup. */
	const { t } = createTranslator(locale, { escapeValues: true });

	return (
		<EmailLayout
			footer={t("emails.estimate.footer")}
			illustration="estimate"
			preview={t("emails.estimate.preview", { company: companyName, number })}
			tone="action"
		>
			<Text
				className="mb-0 text-[15px] text-muted"
				dangerouslySetInnerHTML={{
					__html: t("emails.estimate.greeting", { name: customerName }),
				}}
			/>
			<Heading
				className="mt-1 mb-2 font-semibold text-[24px] text-ink leading-8"
				dangerouslySetInnerHTML={{
					__html: t("emails.estimate.heading", { company: companyName }),
				}}
			/>
			<EmailSummary
				rows={[
					{
						label: t("emails.estimate.totalLabel"),
						value: total,
						strong: true,
					},
					{ label: t("emails.estimate.deviceLabel"), value: device },
					{ label: t("emails.estimate.numberLabel"), value: `#${number}` },
					{ label: t("emails.estimate.validUntilLabel"), value: validUntil },
				]}
			/>
			<Text
				className="text-[15px] leading-6"
				dangerouslySetInnerHTML={{
					__html: t("emails.estimate.instructions", { date: validUntil }),
				}}
			/>
			<EmailButton href={ctaUrl} tone="action">
				{t("emails.estimate.cta")}
			</EmailButton>
			<EmailNote>{t("emails.estimate.portalHint")}</EmailNote>
		</EmailLayout>
	);
};

Estimate.PreviewProps = {
	customerName: "Maria",
	companyName: "Central Assistência",
	number: "0042",
	device: "Samsung Galaxy S21",
	total: "R$ 450,00",
	validUntil: "23/11/2026",
	ctaUrl: "http://localhost:3000/estimate/token",
	locale: "pt-BR",
} as EmailProps;

export default Estimate;

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<Estimate {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
