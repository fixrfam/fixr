import { createTranslator, type Locale } from "@fixr/i18n";
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { EstimateDocument } from "./estimate-document";
import { registerPdfFonts } from "./fonts";
import type { EstimatePdfData } from "./types";

const LOGO_TIMEOUT_MS = 3000;
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Download the company logo for the PDF. Any failure (slow CDN, missing file,
 * oversized image) falls back to the Fixr logo instead of failing the PDF.
 */
export async function fetchLogo(url: string | null): Promise<Buffer | null> {
	if (!url) {
		return null;
	}

	try {
		const response = await fetch(url, {
			signal: AbortSignal.timeout(LOGO_TIMEOUT_MS),
		});
		if (!response.ok) {
			return null;
		}
		const bytes = Buffer.from(await response.arrayBuffer());
		return bytes.length > LOGO_MAX_BYTES ? null : bytes;
	} catch {
		return null;
	}
}

/** Render the estimate PDF in the given language. */
export async function renderEstimatePdf(
	data: EstimatePdfData,
	locale: Locale
): Promise<Buffer> {
	registerPdfFonts();
	const translator = createTranslator(locale);

	// EstimateDocument renders a <Document> at its root, which is what react-pdf expects.
	const document = createElement(EstimateDocument, {
		data,
		translator,
	}) as unknown as ReactElement<DocumentProps>;

	return await renderToBuffer(document);
}
