import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLogo, renderEstimatePdf } from "./render";
import type { EstimatePdfData } from "./types";

const data: EstimatePdfData = {
	number: 7,
	serviceOrderCode: "ACME-12",
	issuedAt: new Date("2026-10-01T12:00:00Z"),
	validUntil: new Date("2026-10-31T12:00:00Z"),
	discountPercentage: 10,
	notes: "Garantia de 90 dias para peças e serviço.",
	company: {
		name: "Assistência Alfa",
		cnpj: "12345678000190",
		address: "Rua das Flores, 123, São Paulo - SP",
		email: "contato@alfa.dev",
		phone: "1134567890",
		website: "https://alfa.dev",
		logo: null,
	},
	client: {
		name: "Maria Oliveira",
		cpf: "52998224725",
		email: "maria@cliente.com",
		phone: "11998765432",
		address: "Avenida Cliente, 456",
		city: "São Paulo",
		state: "SP",
	},
	device: {
		maker: "Apple",
		model: "iPhone 13",
		reportedDefect: "Tela quebrada após queda.",
	},
	items: Array.from({ length: 40 }, (_, i) => ({
		name: `Item ${i + 1}`,
		type: i % 2 === 0 ? ("part" as const) : ("service" as const),
		quantity: 1,
		unitPrice: 10,
		total: 10,
	})),
	totals: { subtotal: 400, discount: 40, total: 360 },
};

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("renderEstimatePdf", () => {
	it.each([
		"pt-BR",
		"en",
	] as const)("renders a multi-page PDF in %s", async (locale) => {
		const pdf = await renderEstimatePdf(data, locale);

		expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
		// 40 items do not fit on one A4 page.
		expect(
			(pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length
		).toBeGreaterThan(1);
	});

	it("renders the parts of a service under it", async () => {
		const pdf = await renderEstimatePdf(
			{
				...data,
				items: [
					{ ...data.items[1]!, parentItemId: null },
					{ ...data.items[0]!, parentItemId: "service-line" },
				],
			},
			"pt-BR"
		);

		expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
	});

	it("renders without a client", async () => {
		const pdf = await renderEstimatePdf({ ...data, client: null }, "pt-BR");

		expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
	});
});

describe("fetchLogo", () => {
	it("returns null without a URL", async () => {
		expect(await fetchLogo(null)).toBeNull();
	});

	it("falls back when the logo can't be downloaded", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

		expect(await fetchLogo("https://cdn.test/logo.png")).toBeNull();
	});

	it("falls back on an error status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
		);

		expect(await fetchLogo("https://cdn.test/logo.png")).toBeNull();
	});

	it("returns the image bytes", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3])))
		);

		expect(await fetchLogo("https://cdn.test/logo.png")).toEqual(
			Buffer.from([1, 2, 3])
		);
	});
});
