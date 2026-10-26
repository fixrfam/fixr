import { createTranslator } from "@fixr/i18n";
import { mockParts } from "@fixr/mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { serveInventory } from "@/test/msw/inventory";
import { renderWithQuery as render } from "@/test/query";
import { AdjustStockDialog } from "./adjust-stock-dialog";

// jsdom has no matchMedia: render the desktop dialog.
vi.mock("@/lib/hooks/use-media-query", () => ({ useMediaQuery: () => true }));

const { t } = createTranslator("pt-BR");
const part = { ...mockParts[0]!, stock: 3 };

let api: ReturnType<typeof serveInventory>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	// A copy: the handler changes the stock it serves.
	api = serveInventory("fixr", {
		parts: [{ ...part }],
		services: [],
		suppliers: [],
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

async function open() {
	const user = userEvent.setup();
	render(<AdjustStockDialog part={part} />);
	await user.click(
		screen.getByRole("button", {
			name: t("parts.stockAdjustment.triggerLabel", { name: part.name }),
		})
	);
	return user;
}

async function openAndEnter(delta: string) {
	const user = await open();
	await user.type(
		screen.getByLabelText(t("parts.stockAdjustment.deltaLabel")),
		delta
	);
	return user;
}

const submitButton = (name: string) => screen.getByRole("button", { name });

describe("AdjustStockDialog", () => {
	it("steps with the buttons, previews the new stock and sends the delta", async () => {
		const user = await open();
		const increase = screen.getByRole("button", {
			name: t("parts.stockAdjustment.increase"),
		});
		await user.click(increase);
		await user.click(increase);
		await user.click(
			screen.getByRole("button", {
				name: t("parts.stockAdjustment.quickAdd", { count: 5 }),
			})
		);

		expect(
			screen.getByLabelText(t("parts.stockAdjustment.deltaLabel"))
		).toHaveValue("+7");
		expect(
			screen.getByText(
				t("parts.stockAdjustment.preview", { current: 3, next: 10 })
			)
		).toBeInTheDocument();

		await user.click(
			submitButton(t("parts.stockAdjustment.submitAdd", { count: 7 }))
		);

		await waitFor(() =>
			expect(toast.success).toHaveBeenCalledWith({
				text: t("parts.stockAdjustment.success"),
			})
		);
		expect(api.writes).toEqual([
			expect.objectContaining({
				method: "POST",
				path: `/companies/fixr/parts/${part.id}/stock-adjustments`,
				body: { delta: 7 },
			}),
		]);
	});

	it("sends a typed removal", async () => {
		const user = await openAndEnter("-2");

		expect(
			screen.getByText(
				t("parts.stockAdjustment.preview", { current: 3, next: 1 })
			)
		).toBeInTheDocument();

		await user.click(
			submitButton(t("parts.stockAdjustment.submitRemove", { count: 2 }))
		);

		await waitFor(() =>
			expect(api.writes).toEqual([
				expect.objectContaining({ body: { delta: -2 } }),
			])
		);
	});

	it("keeps the submit disabled until there is something to adjust", async () => {
		await open();

		expect(submitButton(t("parts.stockAdjustment.submit"))).toBeDisabled();
	});

	it("stops removals below zero before calling the API", async () => {
		await openAndEnter("-5");

		expect(screen.getByRole("alert")).toHaveTextContent(
			t("parts.stockAdjustment.insufficient", { count: 3 })
		);
		expect(submitButton(t("parts.stockAdjustment.submit"))).toBeDisabled();
		expect(
			screen.getByRole("button", { name: t("parts.stockAdjustment.decrease") })
		).toBeDisabled();
		expect(api.writes).toEqual([]);
	});

	it("shows the API error when the stock changed in the meantime", async () => {
		// Someone else took units since the list loaded.
		api = serveInventory("fixr", {
			parts: [{ ...part, stock: 1 }],
			services: [],
			suppliers: [],
		});
		const user = await openAndEnter("-2");
		await user.click(
			submitButton(t("parts.stockAdjustment.submitRemove", { count: 2 }))
		);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({
					text: "Estoque insuficiente",
				})
			)
		);
	});
});
