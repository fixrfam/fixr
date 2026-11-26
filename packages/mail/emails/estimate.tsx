import { createTranslator, defaultLocale, type Locale } from "@fixr/i18n";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import {
	EmailButton,
	EmailDetails,
	EmailHeading,
	EmailLayout,
	EmailNote,
	EmailSteps,
	EmailText,
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

/** Asks the customer to answer: how much, until when, and what happens next. */
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
	const { t } = createTranslator(locale);
	const values = {
		name: customerName,
		company: companyName,
		number,
		device,
		total,
		date: validUntil,
	};

	return (
		<EmailLayout
			company={companyName}
			footer={t("emails.estimate.footer", values)}
			illustration="estimate"
			preview={t("emails.estimate.preview", values)}
		>
			<EmailHeading>{t("emails.estimate.heading", values)}</EmailHeading>
			<EmailText>{t("emails.estimate.lead", values)}</EmailText>
			<EmailDetails
				rows={[
					{ label: t("emails.estimate.numberLabel"), value: `#${number}` },
					{ label: t("emails.estimate.deviceLabel"), value: device },
					{ label: t("emails.estimate.validUntilLabel"), value: validUntil },
					{
						label: t("emails.estimate.totalLabel"),
						value: total,
						strong: true,
					},
				]}
			/>
			<EmailSteps
				steps={[
					t("emails.estimate.step1"),
					t("emails.estimate.step2", values),
					t("emails.estimate.step3", values),
				]}
				title={t("emails.estimate.stepsTitle")}
			/>
			<EmailButton fallback={t("emails.common.linkFallback")} href={ctaUrl}>
				{t("emails.estimate.cta", values)}
			</EmailButton>
			<EmailNote>{t("emails.estimate.note", values)}</EmailNote>
		</EmailLayout>
	);
};

Estimate.PreviewProps = {
	customerName: "Maria",
	companyName: "CONTEEX",
	number: "0042",
	device: "Samsung Galaxy S23",
	total: "R$ 1.220,00",
	validUntil: "26/12/2026",
	ctaUrl: "https://fixr.com.br/estimate/token",
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
