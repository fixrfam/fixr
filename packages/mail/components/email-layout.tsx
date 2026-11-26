import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";
// biome-ignore lint/correctness/noUnusedImports: <Need that for the email to render :P>
import React from "react";
import { type Illustration, illustrationUrl, logoUrl } from "../src";

/**
 * Neutral grays for text and lines, Fixr blue only on the action and red only
 * on a destructive one, the same as the app.
 */
const color = {
	page: "#f4f5f7",
	card: "#ffffff",
	line: "#e6e8ec",
	ink: "#0b0d12",
	body: "#3d4250",
	muted: "#6b7180",
	subtle: "#9aa0ad",
	brand: "#1F65FE",
	danger: "#dc2626",
	art: "#f5f7fb",
};

const sans =
	'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';
const mono = 'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace';

export type EmailTone = "brand" | "danger";

/**
 * The frame every Fixr email shares: the logo and the shop that sent it, a
 * card that opens on the process the email is about, and a footer that says
 * why the reader got it.
 */
export function EmailLayout({
	preview,
	illustration,
	illustrationAlt = "",
	company,
	footer,
	children,
}: {
	preview: string;
	illustration: Illustration;
	illustrationAlt?: string;
	/** The shop the email comes from, shown next to the logo. */
	company?: string | null;
	footer: string;
	children: ReactNode;
}) {
	return (
		<Html>
			<Head>
				<meta content="light" name="color-scheme" />
				<meta content="light" name="supported-color-schemes" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<Preview>{preview}</Preview>
			<Body
				style={{
					backgroundColor: color.page,
					fontFamily: sans,
					margin: 0,
					padding: "32px 12px 40px",
				}}
			>
				<Container style={{ maxWidth: "560px", margin: "0 auto" }}>
					<Row style={{ marginBottom: "16px" }}>
						<Column style={{ padding: "0 4px", verticalAlign: "middle" }}>
							<Img alt="Fixr" height={26} src={logoUrl} width={67} />
						</Column>
						{company ? (
							<Column
								align="right"
								style={{ padding: "0 4px", verticalAlign: "middle" }}
							>
								<Text
									style={{
										color: color.muted,
										fontSize: "13px",
										fontWeight: 500,
										lineHeight: "20px",
										margin: 0,
									}}
								>
									{company}
								</Text>
							</Column>
						) : null}
					</Row>
					<Section
						style={{
							backgroundColor: color.card,
							border: `1px solid ${color.line}`,
							borderRadius: "14px",
							overflow: "hidden",
						}}
					>
						<Img
							alt={illustrationAlt}
							height={233}
							src={illustrationUrl(illustration)}
							style={{
								backgroundColor: color.art,
								borderBottom: `1px solid ${color.line}`,
								display: "block",
								height: "auto",
								width: "100%",
							}}
							width={560}
						/>
						<Section style={{ padding: "32px 36px 36px" }}>{children}</Section>
					</Section>
					<Text
						style={{
							color: color.subtle,
							fontSize: "12px",
							lineHeight: "18px",
							margin: "20px 0 0",
							padding: "0 8px",
						}}
					>
						{footer}
					</Text>
					<Text
						style={{
							color: color.subtle,
							fontSize: "12px",
							lineHeight: "18px",
							margin: "8px 0 0",
							padding: "0 8px",
						}}
					>
						<Link
							href="https://fixr.com.br"
							style={{ color: color.subtle, textDecoration: "underline" }}
						>
							fixr.com.br
						</Link>
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

/** The one line that says what the email is about. */
export function EmailHeading({ children }: { children: ReactNode }) {
	return (
		<Heading
			as="h1"
			style={{
				color: color.ink,
				fontSize: "26px",
				fontWeight: 600,
				letterSpacing: "-0.02em",
				lineHeight: "32px",
				margin: "0 0 14px",
			}}
		>
			{children}
		</Heading>
	);
}

/** A paragraph of body copy. */
export function EmailText({ children }: { children: ReactNode }) {
	return (
		<Text
			style={{
				color: color.body,
				fontSize: "15px",
				lineHeight: "24px",
				margin: "0 0 16px",
			}}
		>
			{children}
		</Text>
	);
}

/** A small label over a block: a list, the steps, a password. */
function Label({ children }: { children: ReactNode }) {
	return (
		<Text
			style={{
				color: color.ink,
				fontSize: "13px",
				fontWeight: 600,
				lineHeight: "20px",
				margin: "0 0 8px",
			}}
		>
			{children}
		</Text>
	);
}

/**
 * The action, sized to its label. A plain link to the same address follows,
 * for clients that strip buttons or readers who'd rather copy it.
 */
export function EmailButton({
	href,
	tone = "brand",
	fallback,
	children,
}: {
	href: string;
	tone?: EmailTone;
	/** Text before the copyable link. */
	fallback: string;
	children: ReactNode;
}) {
	return (
		<Section style={{ margin: "28px 0 0" }}>
			<Button
				href={href}
				style={{
					backgroundColor: tone === "danger" ? color.danger : color.brand,
					borderRadius: "8px",
					color: "#ffffff",
					display: "inline-block",
					fontSize: "14px",
					fontWeight: 600,
					lineHeight: "20px",
					padding: "12px 20px",
					textDecoration: "none",
				}}
			>
				{children}
			</Button>
			<Text
				style={{
					color: color.muted,
					fontSize: "12px",
					lineHeight: "18px",
					margin: "14px 0 0",
					wordBreak: "break-all",
				}}
			>
				{fallback}{" "}
				<Link href={href} style={{ color: color.brand }}>
					{href}
				</Link>
			</Text>
		</Section>
	);
}

/**
 * Label and value rows split by hairlines, as the app shows an order's
 * summary. The `strong` row (a total) closes the list in a larger size.
 */
export function EmailDetails({
	rows,
}: {
	rows: { label: string; value: ReactNode; strong?: boolean }[];
}) {
	return (
		<Section
			style={{
				border: `1px solid ${color.line}`,
				borderRadius: "10px",
				margin: "20px 0 0",
				padding: "4px 16px",
			}}
		>
			{rows.map((row, index) => (
				<Row
					key={row.label}
					style={{
						borderTop: index === 0 ? "none" : `1px solid ${color.line}`,
					}}
				>
					<Column style={{ padding: "11px 0", verticalAlign: "middle" }}>
						<Text
							style={{
								color: color.muted,
								fontSize: "14px",
								lineHeight: "20px",
								margin: 0,
							}}
						>
							{row.label}
						</Text>
					</Column>
					<Column
						align="right"
						style={{ padding: "11px 0", verticalAlign: "middle" }}
					>
						<Text
							style={{
								color: color.ink,
								fontSize: row.strong ? "20px" : "14px",
								fontWeight: row.strong ? 600 : 500,
								letterSpacing: row.strong ? "-0.01em" : "normal",
								lineHeight: row.strong ? "28px" : "20px",
								margin: 0,
							}}
						>
							{row.value}
						</Text>
					</Column>
				</Row>
			))}
		</Section>
	);
}

/** Things that happen in order, numbered because the order matters. */
export function EmailSteps({
	title,
	steps,
}: {
	title: string;
	steps: string[];
}) {
	return (
		<Section style={{ margin: "28px 0 0" }}>
			<Label>{title}</Label>
			{steps.map((step, index) => (
				<Row key={step}>
					<Column
						style={{ padding: "6px 0", verticalAlign: "top", width: "32px" }}
					>
						<Text
							style={{
								backgroundColor: "#eef3ff",
								borderRadius: "6px",
								color: color.brand,
								fontSize: "12px",
								fontWeight: 600,
								height: "22px",
								lineHeight: "22px",
								margin: 0,
								textAlign: "center",
								width: "22px",
							}}
						>
							{index + 1}
						</Text>
					</Column>
					<Column style={{ padding: "6px 0", verticalAlign: "top" }}>
						<Text
							style={{
								color: color.body,
								fontSize: "14px",
								lineHeight: "22px",
								margin: 0,
							}}
						>
							{step}
						</Text>
					</Column>
				</Row>
			))}
		</Section>
	);
}

/** What the reader can do somewhere, one per hairline row. */
export function EmailList({
	title,
	items,
}: {
	title: string;
	items: string[];
}) {
	return (
		<Section style={{ margin: "24px 0 0" }}>
			<Label>{title}</Label>
			{items.map((item, index) => (
				<Text
					key={item}
					style={{
						borderTop: index === 0 ? "none" : `1px solid ${color.line}`,
						color: color.body,
						fontSize: "14px",
						lineHeight: "22px",
						margin: 0,
						padding: "9px 0",
					}}
				>
					{item}
				</Text>
			))}
		</Section>
	);
}

/** Something to type somewhere else, like a temporary password. */
export function EmailCode({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<Section style={{ margin: "20px 0 0" }}>
			<Label>{label}</Label>
			<Text
				style={{
					backgroundColor: color.art,
					border: `1px solid ${color.line}`,
					borderRadius: "10px",
					color: color.ink,
					fontFamily: mono,
					fontSize: "20px",
					letterSpacing: "0.06em",
					lineHeight: "28px",
					margin: 0,
					padding: "14px 18px",
				}}
			>
				{children}
			</Text>
		</Section>
	);
}

/** The consequence of a destructive step, said once, before its button. */
export function EmailWarning({ children }: { children: ReactNode }) {
	return (
		<Text
			style={{
				color: color.danger,
				fontSize: "14px",
				fontWeight: 500,
				lineHeight: "22px",
				margin: "4px 0 0",
			}}
		>
			{children}
		</Text>
	);
}

/** Small print after a hairline: a reminder about the link or the password. */
export function EmailNote({ children }: { children: ReactNode }) {
	return (
		<>
			<Hr style={{ borderColor: color.line, margin: "28px 0 16px" }} />
			<Text
				style={{
					color: color.muted,
					fontSize: "13px",
					lineHeight: "20px",
					margin: 0,
				}}
			>
				{children}
			</Text>
		</>
	);
}
