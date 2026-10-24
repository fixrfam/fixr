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
	/** Shop that sent the access; null when the customer asked for the link. */
	companyName: string | null;
	/** Portal entry link (the customer's account). */
	ctaUrl: string;
	/** Language of the recipient. Defaults to the app's default locale. */
	locale?: Locale;
}

export const PortalAccess = ({
	customerName,
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
				<Preview>{t("emails.portalAccess.preview")}</Preview>
				<Body style={main}>
					<Container className="mx-auto max-w-[480px]">
						<FixrHeader />

						<Text
							className="my-0 text-lg tracking-tight"
							dangerouslySetInnerHTML={{
								__html: t("emails.portalAccess.greeting", {
									name: customerName,
								}),
							}}
						/>
						<Heading className="my-0 mb-4 text-left font-semibold text-2xl tracking-tight md:mb-[32px] md:text-3xl">
							{t("emails.portalAccess.heading")}
						</Heading>
						<Section className="gap-0">
							<Text
								dangerouslySetInnerHTML={{
									__html: t("emails.portalAccess.body"),
								}}
							/>
							<Button
								className="my-4 box-border w-full rounded-[8px] bg-brand px-[20px] py-[12px] text-center font-semibold text-white"
								href={ctaUrl}
							>
								{t("emails.portalAccess.cta")}
							</Button>
						</Section>
						<Hr className="my-12" />
						<Text className="text-center text-[#6a737d] text-sm">
							{t("emails.portalAccess.footer")}
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	);
};

PortalAccess.PreviewProps = {
	customerName: "Maria",
	companyName: "Central Assistência",
	ctaUrl: "http://localhost:3000/portal/token",
	locale: "pt-BR",
} as EmailProps;

export default PortalAccess;

const main = {
	backgroundColor: "#ffffff",
	color: "#24292e",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

export async function renderEmail({ ...props }: EmailProps): Promise<string> {
	try {
		return await render(<PortalAccess {...props} />);
	} catch (error) {
		console.error("Failed to render email", error);
		throw new Error(`Failed to render email ${error}`);
	}
}
