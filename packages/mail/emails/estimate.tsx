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
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { render } from "@react-email/render";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import { FixrHeader } from "../components/fixr-header";

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
	/** Public page where the customer approves or rejects the estimate. */
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

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
		<Tailwind
			config={{
				theme: {
					extend: {
						colors: {
							brand: "#1F65FE",
							border: "#dedede",
						},
					},
				},
			}}
		>
			<Html>
				<Head />
				<Preview>
					{t("emails.estimate.preview", { company: companyName, number })}
				</Preview>
				<Body style={main}>
					<Container className="mx-auto max-w-[480px]">
						<FixrHeader />

						<Text
							className="my-0 text-lg tracking-tight"
							dangerouslySetInnerHTML={{
								__html: t("emails.estimate.greeting", { name: customerName }),
							}}
						/>
						<Heading
							className="my-0 mb-4 text-left font-semibold text-2xl tracking-tight md:mb-[32px] md:text-3xl"
							dangerouslySetInnerHTML={{
								__html: t("emails.estimate.heading", { company: companyName }),
							}}
						/>
						<Section className="gap-0">
							<Text
								dangerouslySetInnerHTML={{
									__html: t("emails.estimate.body", { number, device, total }),
								}}
							/>
							<Text
								dangerouslySetInnerHTML={{
									__html: t("emails.estimate.instructions", {
										date: validUntil,
									}),
								}}
							/>
							<Button
								className="my-4 box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white"
								href={ctaUrl}
							>
								{t("emails.estimate.cta")}
							</Button>
						</Section>
						<Hr className="my-12" />
						<Text className="text-center text-[#6a737d] text-sm">
							{t("emails.estimate.footer")}
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
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

const main = {
	backgroundColor: "#ffffff",
	color: "#24292e",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<Estimate {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
