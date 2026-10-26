import type { Translator } from "@fixr/i18n";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { FixrLogo } from "./fixr-logo";
import { PDF_FONT_FAMILY } from "./fonts";
import { formatCnpj, formatCpf, formatPhone } from "./format";
import type { EstimatePdfData } from "./types";

const colors = {
	text: "#111827",
	muted: "#6B7280",
	faint: "#a8a8a8",
	border: "#e0e0e0",
	stripe: "#f9fafb",
};

const label = {
	fontSize: 10,
	fontWeight: 600,
	letterSpacing: -0.25,
} as const;

const heading = {
	fontSize: 14,
	fontWeight: 600,
	letterSpacing: -0.5,
} as const;

const detail = { fontSize: 8.5 } as const;

function compact(values: (string | null | undefined)[]) {
	return values.filter((value): value is string => Boolean(value));
}

function Header({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t, format } = translator;

	return (
		<View style={{ flexDirection: "row", paddingHorizontal: 10 }}>
			<View style={{ flex: 1 }}>
				<Text style={{ fontSize: 21, fontWeight: 600, letterSpacing: -0.75 }}>
					{t("estimates.pdf.title")}
				</Text>
				<View
					style={{ marginTop: 16, fontSize: 8.5, color: colors.muted, gap: 2 }}
				>
					<View style={{ flexDirection: "row" }}>
						<Text style={{ flex: 1 }}>{t("estimates.pdf.number")}</Text>
						<Text style={{ color: "#000", flex: 1.5 }}>
							{String(data.number).padStart(4, "0")}
						</Text>
					</View>
					<View style={{ flexDirection: "row" }}>
						<Text style={{ flex: 1 }}>{t("estimates.pdf.issuedAt")}</Text>
						<Text style={{ color: "#000", flex: 1.5, fontWeight: 600 }}>
							{format.date(data.issuedAt)}
						</Text>
					</View>
					<View style={{ flexDirection: "row" }}>
						<Text style={{ flex: 1 }}>{t("estimates.pdf.validUntil")}</Text>
						<Text style={{ color: "#000", flex: 1.5 }}>
							{format.date(data.validUntil)}
						</Text>
					</View>
				</View>
			</View>
			{data.company.logo ? (
				<Image
					src={data.company.logo}
					style={{ maxWidth: 128, maxHeight: 68, objectFit: "contain" }}
				/>
			) : (
				<FixrLogo style={{ width: 128 }} />
			)}
		</View>
	);
}

function Entities({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t } = translator;
	const { company, client } = data;

	const companyLines = compact([
		t("estimates.pdf.cnpj", { cnpj: formatCnpj(company.cnpj) }),
		company.address,
		company.email,
		company.phone ? formatPhone(company.phone) : null,
		company.website,
	]);
	const clientLines = client
		? compact([
				formatCpf(client.cpf),
				compact([
					client.address,
					compact([client.city, client.state]).join(" - "),
				]).join(", "),
				client.email,
				client.phone ? formatPhone(client.phone) : null,
			])
		: [];

	return (
		<View
			style={{ flexDirection: "row", marginTop: 20, paddingHorizontal: 10 }}
		>
			<View style={{ flex: 1, gap: 6 }}>
				<View style={{ gap: 2 }}>
					<Text style={label}>{t("estimates.pdf.issuer")}</Text>
					<Text style={heading}>{company.name}</Text>
				</View>
				<View style={{ gap: 1 }}>
					{companyLines.map((line) => (
						<Text key={line} style={detail}>
							{line}
						</Text>
					))}
				</View>
			</View>
			{client ? (
				<View style={{ flex: 1, gap: 6, textAlign: "right" }}>
					<View style={{ gap: 2 }}>
						<Text style={label}>{t("estimates.pdf.client")}</Text>
						<Text style={heading}>{client.name}</Text>
					</View>
					<View style={{ gap: 1 }}>
						{clientLines.map((line) => (
							<Text key={line} style={detail}>
								{line}
							</Text>
						))}
					</View>
				</View>
			) : null}
		</View>
	);
}

function Device({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t } = translator;

	return (
		<View
			style={{
				marginTop: 16,
				marginHorizontal: 10,
				padding: 10,
				borderRadius: 4,
				backgroundColor: colors.stripe,
				flexDirection: "row",
				gap: 20,
				fontSize: 8.5,
			}}
		>
			<View style={{ flex: 1, gap: 2 }}>
				<Text style={{ color: colors.muted }}>{t("estimates.pdf.device")}</Text>
				<Text style={{ fontWeight: 600 }}>{deviceLabel(data.device)}</Text>
			</View>
			<View style={{ flex: 2, gap: 2 }}>
				<Text style={{ color: colors.muted }}>
					{t("estimates.pdf.reportedDefect")}
				</Text>
				<Text>{data.device.reportedDefect}</Text>
			</View>
		</View>
	);
}

const headerCell = {
	fontWeight: 600,
	color: colors.muted,
	textTransform: "uppercase",
} as const;

function ItemsTable({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t, format } = translator;

	return (
		<View style={{ marginVertical: 20 }}>
			<View
				fixed
				style={{
					flexDirection: "row",
					borderBottom: `1px solid ${colors.border}`,
					padding: 10,
					gap: 17.5,
					fontSize: 7.5,
				}}
			>
				<Text style={{ ...headerCell, flex: 3 }}>
					{t("estimates.pdf.headers.item")}
				</Text>
				<Text style={{ ...headerCell, flex: 0.75 }}>
					{t("estimates.pdf.headers.type")}
				</Text>
				<Text style={{ ...headerCell, flex: 1, textAlign: "right" }}>
					{t("estimates.pdf.headers.unitPrice")}
				</Text>
				<Text style={{ ...headerCell, flex: 0.5, textAlign: "right" }}>
					{t("estimates.pdf.headers.quantity")}
				</Text>
				<Text style={{ ...headerCell, flex: 1, textAlign: "right" }}>
					{t("estimates.pdf.headers.total")}
				</Text>
			</View>
			{data.items.map((item, index) => (
				<View
					key={`${index}-${item.name}`}
					style={{
						flexDirection: "row",
						backgroundColor: index % 2 === 0 ? "transparent" : colors.stripe,
						padding: 10,
						gap: 17.5,
						fontSize: 8.5,
						alignItems: "center",
					}}
					wrap={false}
				>
					<Text style={{ flex: 3 }}>{item.name}</Text>
					<Text style={{ flex: 0.75 }}>
						{item.type === "part"
							? t("estimates.pdf.part")
							: t("estimates.pdf.service")}
					</Text>
					<Text style={{ flex: 1, textAlign: "right" }}>
						{format.currency(item.unitPrice)}
					</Text>
					<Text style={{ flex: 0.5, textAlign: "right" }}>{item.quantity}</Text>
					<Text style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>
						{format.currency(item.total)}
					</Text>
				</View>
			))}
		</View>
	);
}

function Totals({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t, format } = translator;

	return (
		<View
			style={{ flexDirection: "row", gap: 25, paddingHorizontal: 10 }}
			wrap={false}
		>
			<View style={{ flex: 1, gap: 6, fontSize: 9 }}>
				<Text style={{ fontWeight: 600 }}>{t("estimates.pdf.notes")}</Text>
				{data.notes ? (
					<Text style={{ color: colors.text, letterSpacing: -0.15 }}>
						{data.notes}
					</Text>
				) : null}
				<Text
					style={{
						color: colors.muted,
						textAlign: "justify",
						letterSpacing: -0.15,
					}}
				>
					{t("estimates.pdf.terms", {
						date: format.date(data.validUntil),
					})}
				</Text>
			</View>
			<View style={{ flex: 1, gap: 8, fontSize: 10 }}>
				<View style={{ flexDirection: "row", fontWeight: 600, gap: 15 }}>
					<Text style={{ flex: 1 }}>{t("estimates.pdf.subtotal")}</Text>
					<Text>{format.currency(data.totals.subtotal)}</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						gap: 15,
						borderBottom: `1px solid ${colors.border}`,
						paddingBottom: 8,
					}}
				>
					<Text style={{ flex: 1 }}>
						{t("estimates.pdf.discount", {
							percentage: format.number(data.discountPercentage, {
								maximumFractionDigits: 2,
							}),
						})}
					</Text>
					<Text>{format.currency(data.totals.discount)}</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						fontWeight: 600,
						fontSize: 14,
						gap: 15,
					}}
				>
					<Text style={{ flex: 1 }}>{t("estimates.pdf.total")}</Text>
					<Text>{format.currency(data.totals.total)}</Text>
				</View>
			</View>
		</View>
	);
}

function Footer({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	const { t } = translator;

	return (
		<View
			fixed
			style={{
				flexDirection: "row",
				position: "absolute",
				left: 54,
				right: 54,
				bottom: 20,
				alignItems: "center",
			}}
		>
			<Text style={{ flex: 1, fontSize: 8.5, color: colors.faint }}>
				{`${data.company.name} - ${t("estimates.pdf.cnpj", {
					cnpj: formatCnpj(data.company.cnpj),
				})}`}
			</Text>
			<FixrLogo style={{ width: 48 }} />
		</View>
	);
}

/** A4 estimate: header, issuer and client, device, items, totals and footer. */
/** Catalog names usually start with the maker ("Apple iPhone 13"): print it once. */
function deviceLabel(device: { maker: string; model: string }) {
	return device.model.toLowerCase().startsWith(device.maker.toLowerCase())
		? device.model
		: `${device.maker} ${device.model}`;
}

export function EstimateDocument({
	data,
	translator,
}: {
	data: EstimatePdfData;
	translator: Translator;
}) {
	return (
		<Document
			language={translator.locale}
			title={translator.t("estimates.pdf.fileName", {
				number: String(data.number).padStart(4, "0"),
			})}
		>
			<Page
				size="A4"
				style={{
					padding: 54,
					paddingBottom: 64,
					color: colors.text,
					fontFamily: PDF_FONT_FAMILY,
				}}
			>
				<Header data={data} translator={translator} />
				<Entities data={data} translator={translator} />
				<Device data={data} translator={translator} />
				<ItemsTable data={data} translator={translator} />
				<Totals data={data} translator={translator} />
				<Footer data={data} translator={translator} />
			</Page>
		</Document>
	);
}
