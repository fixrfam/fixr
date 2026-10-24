import { createTranslator } from "@fixr/i18n";
import { mockParts, mockSuppliers } from "@fixr/mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { serveInventory } from "@/test/msw/inventory";
import { server } from "@/test/msw/server";
import { renderWithQuery as render } from "@/test/query";
import { NewPartForm } from "./new-part-form";

const { t } = createTranslator("pt-BR");

/** Pastes instead of typing key by key: these forms have many fields. */
async function enter(
	user: ReturnType<typeof userEvent.setup>,
	element: HTMLElement,
	text: string
) {
	await user.click(element);
	await user.paste(text);
}
let api: ReturnType<typeof serveInventory>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveInventory();
});

afterEach(() => {
	vi.clearAllMocks();
});

const label = (key: Parameters<typeof t>[0]) =>
	screen.getByLabelText(t(key as never));

async function pick(
	user: ReturnType<typeof userEvent.setup>,
	comboboxIndex: number,
	option: string
) {
	await user.click(screen.getAllByRole("combobox")[comboboxIndex]!);
	await user.click(await screen.findByRole("option", { name: option }));
}

async function fill(
	user: ReturnType<typeof userEvent.setup>,
	{ costPrice = "100", salePrice = "180" } = {}
) {
	await enter(user, label("parts.form.skuLabel"), "BAT-TEST");
	await enter(user, label("parts.form.nameLabel"), "Bateria de teste");
	await pick(user, 0, "Baterias");
	await pick(user, 1, mockSuppliers[0]!.name);
	await enter(user, label("parts.form.costPriceLabel"), costPrice);
	await enter(user, label("parts.form.salePriceLabel"), salePrice);
	await enter(user, label("parts.form.stockLabel"), "3");
	await enter(user, label("parts.form.minStockLabel"), "1");
}

describe("NewPartForm", () => {
	it("creates the part through the API and reports success", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewPartForm onSuccess={onSuccess} />);

		await fill(user);
		await user.click(
			screen.getByRole("button", { name: t("parts.form.submit") })
		);

		await waitFor(() => expect(onSuccess).toHaveBeenCalled());
		expect(api.writes).toHaveLength(1);
		expect(api.writes[0]).toMatchObject({
			method: "POST",
			path: "/companies/fixr/parts",
		});
		expect(api.writes[0]!.body).toMatchObject({
			sku: "BAT-TEST",
			category: "Baterias",
			supplierId: mockSuppliers[0]!.id,
			costPrice: 100,
			salePrice: 180,
			stock: 3,
			minStock: 1,
		});
		expect(toast.success).toHaveBeenCalledWith({
			text: t("parts.form.created"),
		});
	});

	it("blocks a sale price below the cost and shows the translated error", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewPartForm onSuccess={onSuccess} />);

		await fill(user, { costPrice: "200", salePrice: "150" });
		await user.click(
			screen.getByRole("button", { name: t("parts.form.submit") })
		);

		expect(
			await screen.findByText(t("validation.part.salePriceBelowCost"))
		).toBeInTheDocument();
		expect(onSuccess).not.toHaveBeenCalled();
		expect(api.writes).toHaveLength(0);
	});

	it("shows the API error and keeps the form open", async () => {
		server.use(
			http.post(apiUrl("/companies/fixr/parts"), () =>
				HttpResponse.json(
					envelope(null, { status: 409, code: "part_sku_conflict" }),
					{ status: 409 }
				)
			)
		);
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewPartForm onSuccess={onSuccess} />);

		await fill(user);
		await user.click(
			screen.getByRole("button", { name: t("parts.form.submit") })
		);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({ text: "SKU já cadastrado" })
			)
		);
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it("does not create anything from an empty form", async () => {
		const user = userEvent.setup();
		render(<NewPartForm />);

		await user.click(
			screen.getByRole("button", { name: t("parts.form.submit") })
		);

		expect(
			await screen.findByText(t("validation.part.skuRequired"))
		).toBeInTheDocument();
		expect(api.writes).toHaveLength(0);
		expect(toast.success).not.toHaveBeenCalled();
	});

	describe("editing", () => {
		const part = mockParts[0]!;

		it("asks for a number again after one is cleared", async () => {
			const user = userEvent.setup();
			render(<NewPartForm part={part} />);

			await user.clear(label("parts.form.minStockLabel"));

			expect(label("parts.form.minStockLabel")).toHaveValue(null);
			expect(
				await screen.findByText(t("validation.part.minStockRequired"))
			).toBeInTheDocument();
		});

		it("locks the stock, which only changes through an adjustment", () => {
			render(<NewPartForm part={part} />);

			expect(label("parts.form.stockLabel")).toBeDisabled();
			expect(
				screen.getByText(t("parts.form.stockLockedDescription"))
			).toBeInTheDocument();
		});

		it("starts from the part and saves only once something changed", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			render(<NewPartForm onSuccess={onSuccess} part={part} />);
			const save = screen.getByRole("button", {
				name: t("common.actions.saveChanges"),
			});

			expect(label("parts.form.skuLabel")).toHaveValue(part.sku);
			expect(save).toBeDisabled();

			const minStock = label("parts.form.minStockLabel");
			await user.clear(minStock);
			await user.type(minStock, "42");
			await user.click(save);

			await waitFor(() => expect(onSuccess).toHaveBeenCalled());
			expect(api.writes).toEqual([
				expect.objectContaining({
					method: "PATCH",
					path: `/companies/fixr/parts/${part.id}`,
					body: expect.objectContaining({ sku: part.sku, minStock: 42 }),
				}),
			]);
			expect(api.writes[0]?.body).not.toHaveProperty("stock");
			expect(toast.success).toHaveBeenCalledWith({
				text: t("parts.form.updated"),
			});
		});
	});
});
