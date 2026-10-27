import { createTranslator } from "@fixr/i18n";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/test/mocks";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { serveRepairs, serviceOrder } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { ServiceOrderProgress } from "./service-order-progress";

// jsdom has no matchMedia: render the desktop dialog.
vi.mock("@/lib/hooks/use-media-query", () => ({ useMediaQuery: () => true }));

const { t } = createTranslator("pt-BR");
let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

async function openDialog() {
	const user = userEvent.setup();
	render(<ServiceOrderProgress order={serviceOrder} />, {
		role: "technician",
	});
	await user.click(
		screen.getByRole("button", { name: t("serviceOrders.statusCard.move") })
	);
	return { user, dialog: await screen.findByRole("dialog") };
}

describe("ServiceOrderProgress", () => {
	it("shows the phases with the order's history and where the device is", () => {
		render(<ServiceOrderProgress order={serviceOrder} />);

		expect(
			screen.getByText(t("serviceOrders.lifecycle.progressTitle"))
		).toBeInTheDocument();
		expect(
			screen.getByText(t("serviceOrders.statusCard.opened"))
		).toBeInTheDocument();
		expect(screen.getByText("Troca da tela iniciada")).toBeInTheDocument();
		expect(screen.getByText("Na loja")).toBeInTheDocument();
	});

	it("suggests the next status, previews the device and sends the note", async () => {
		const { user, dialog } = await openDialog();

		// From "fixing", the next step is "ready": the device waits for pickup.
		expect(within(dialog).getAllByText("Pronta").length).toBeGreaterThan(0);
		expect(
			within(dialog).getByText("Pronto para retirada")
		).toBeInTheDocument();

		await user.type(
			within(dialog).getByLabelText(t("serviceOrders.statusCard.noteLabel")),
			"Testado"
		);
		await user.click(
			within(dialog).getByRole("button", {
				name: t("serviceOrders.statusCard.submit", { status: "Pronta" }),
			})
		);

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "PATCH",
				path: `/companies/fixr/service-orders/${serviceOrder.id}/status`,
				body: { status: "ready", note: "Testado" },
			})
		);
	});

	it("steps back and warns about it", async () => {
		const { user, dialog } = await openDialog();

		await user.click(
			within(dialog).getByRole("button", {
				name: t("serviceOrders.statusCard.previousStep"),
			})
		);
		await user.click(
			within(dialog).getByRole("button", {
				name: t("serviceOrders.statusCard.previousStep"),
			})
		);

		expect(
			within(dialog).getByText(t("serviceOrders.statusCard.backwards"))
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("radio", { name: "Aprovada" })
		).toBeChecked();
	});

	it("is read only without the change status permission", () => {
		render(<ServiceOrderProgress order={serviceOrder} />, {
			role: "warehouse",
		});

		expect(
			screen.queryByRole("button", { name: t("serviceOrders.statusCard.move") })
		).not.toBeInTheDocument();
	});
});
