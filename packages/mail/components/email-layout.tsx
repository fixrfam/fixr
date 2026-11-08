import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import { type Illustration, illustrationUrl, whiteLogoUrl } from "../src";

/**
 * How much the email asks of the reader:
 * - `info`: something happened, nothing to do (or an optional action).
 * - `action`: the reader is expected to act (approve an estimate, set a password).
 * - `danger`: a destructive or irreversible step; red accents and a warning.
 */
export type EmailTone = "info" | "action" | "danger";

const ACCENT: Record<EmailTone, string> = {
	info: "#1F65FE",
	action: "#1F65FE",
	danger: "#dc2626",
};

const tailwindConfig = {
	theme: {
		extend: {
			colors: {
				brand: "#1F65FE",
				ink: "#11225a",
				muted: "#6a737d",
				border: "#e4e8f0",
				danger: "#dc2626",
			},
		},
	},
};

/**
 * The frame every Fixr email shares: a brand bar, an isometric illustration
 * of what the email is about, the content on a white card and a footer.
 */
export function EmailLayout({
	preview,
	illustration,
	illustrationAlt = "",
	tone = "info",
	footer,
	children,
}: {
	preview: string;
	illustration: Illustration;
	illustrationAlt?: string;
	tone?: EmailTone;
	footer: string;
	children: ReactNode;
}) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html>
				<Head />
				<Preview>{preview}</Preview>
				<Body style={main}>
					<Container className="mx-auto max-w-[520px] px-3 py-8">
						<Section className="pb-4">
							<Img alt="Fixr" src={whiteLogoUrl} style={logo} width={64} />
						</Section>
						<Section
							className="overflow-hidden rounded-[20px] border border-border border-solid bg-white"
							style={{ borderTop: `4px solid ${ACCENT[tone]}` }}
						>
							<Img
								alt={illustrationAlt}
								className="block w-full"
								height={240}
								src={illustrationUrl(illustration)}
								width={520}
							/>
							<Section className="px-7 pt-2 pb-7">{children}</Section>
						</Section>
						<Text className="mt-6 text-center text-muted text-xs leading-5">
							{footer}
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
	);
}

/** The main call to action, full width, in the tone's color. */
export function EmailButton({
	href,
	tone = "info",
	children,
}: {
	href: string;
	tone?: EmailTone;
	children: ReactNode;
}) {
	return (
		<Button
			className="my-5 box-border block w-full rounded-[12px] px-[20px] py-[14px] text-center font-semibold text-[15px] text-white"
			href={href}
			style={{ backgroundColor: ACCENT[tone] }}
		>
			{children}
		</Button>
	);
}

/** A highlighted note: a security reminder or the warning of a destructive step. */
export function EmailNote({
	tone = "info",
	children,
}: {
	tone?: EmailTone;
	children: ReactNode;
}) {
	const danger = tone === "danger";
	return (
		<Section
			className="my-2 rounded-[12px] px-4"
			style={{
				backgroundColor: danger ? "#fef2f2" : "#f1f5ff",
				border: `1px solid ${danger ? "#fecaca" : "#dbe7ff"}`,
			}}
		>
			<Text
				className="my-3 text-[13px] leading-5"
				style={{ color: danger ? "#991b1b" : "#11225a" }}
			>
				{children}
			</Text>
		</Section>
	);
}

/** Label/value rows on a soft card, e.g. what an estimate is about. */
export function EmailSummary({
	rows,
}: {
	rows: { label: string; value: ReactNode; strong?: boolean }[];
}) {
	return (
		<Section className="my-4 rounded-[14px] bg-[#f6f8fc] px-5 py-2">
			{rows.map((row) => (
				<Section className="py-1" key={row.label}>
					<Text className="my-0 text-muted text-xs">{row.label}</Text>
					<Text
						className={
							row.strong
								? "my-0 font-bold text-[26px] text-ink leading-8"
								: "my-0 font-semibold text-[15px] text-ink"
						}
					>
						{row.value}
					</Text>
				</Section>
			))}
		</Section>
	);
}

export const main = {
	backgroundColor: "#f4f6fb",
	color: "#24292e",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
};

const logo = {
	backgroundColor: "#1F65FE",
	borderRadius: "10px",
	padding: "8px 12px",
};
