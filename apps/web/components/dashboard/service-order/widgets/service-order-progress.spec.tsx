import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@/test/mocks";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { serveRepairs, serviceOrder } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { ServiceOrderProgress } from "./service-order-progress";

let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

describe("ServiceOrderProgress", () => {
	it("shows every step and where the device is", () => {
		render(<ServiceOrderProgress order={serviceOrder} />);

		expect(screen.getAllByText("Em reparo").length).toBeGreaterThan(0);
		expect(screen.getByText("Entregue")).toBeInTheDocument();
		expect(screen.getByText("Na loja")).toBeInTheDocument();
	});

	it("moves the order to another status", async () => {
		const user = userEvent.setup();
		render(<ServiceOrderProgress order={serviceOrder} />, {
			role: "technician",
		});

		await user.click(screen.getByRole("combobox", { name: "Mover para" }));
		await user.click(await screen.findByRole("option", { name: "Pronta" }));

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "PATCH",
				path: `/companies/fixr/service-orders/${serviceOrder.id}/status`,
				body: { status: "ready" },
			})
		);
	});

	it("is read only without the change status permission", () => {
		render(<ServiceOrderProgress order={serviceOrder} />, {
			role: "warehouse",
		});

		expect(
			screen.queryByRole("combobox", { name: "Mover para" })
		).not.toBeInTheDocument();
	});
});
