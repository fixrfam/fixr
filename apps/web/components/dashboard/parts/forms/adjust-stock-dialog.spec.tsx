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
	api = serveInventory("fixr", { parts: [part], services: [], suppliers: [] });
});

afterEach(() => {
	vi.clearAllMocks();
});

async function openAndEnter(delta: string) {
	const user = userEvent.setup();
	render(<AdjustStockDialog part={part} />);
	await user.click(
		screen.getByRole("button", {
			name: t("parts.stockAdjustment.triggerLabel", { name: part.name }),
		})
	);
	const input = screen.getByLabelText(t("parts.stockAdjustment.deltaLabel"));
	await user.type(input, delta);
	return user;
}

function submit(user: ReturnType<typeof userEvent.setup>) {
	return user.click(
		screen.getByRole("button", { name: t("parts.stockAdjustment.submit") })
	);
}

describe("AdjustStockDialog", () => {
	it("previews the new stock and sends the delta", async () => {
		const user = await openAndEnter("-2");

		expect(
			screen.getByText(
				t("parts.stockAdjustment.preview", { current: 3, next: 1 })
			)
		).toBeInTheDocument();

		await submit(user);

		await waitFor(() =>
			expect(toast.success).toHaveBeenCalledWith({
				text: t("parts.stockAdjustment.success"),
			})
		);
		expect(api.writes).toEqual([
			expect.objectContaining({
				method: "POST",
				path: `/companies/fixr/parts/${part.id}/stock-adjustments`,
				body: { delta: -2 },
			}),
		]);
	});

	it("refuses a zero delta without calling the API", async () => {
		const user = await openAndEnter("0");
		await submit(user);

		expect(
			await screen.findByText(t("validation.part.stockDeltaZero"))
		).toBeInTheDocument();
		expect(api.writes).toEqual([]);
	});

	it("shows the API error when the stock would go negative", async () => {
		const user = await openAndEnter("-5");
		await submit(user);

		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				expect.objectContaining({
					text: "Estoque insuficiente",
				})
			)
		);
	});
});
