import { createTranslator } from "@fixr/i18n";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { navigation, router } from "@/test/mocks";
import { device, serveRepairs, serviceOrder } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { NewServiceOrderForm } from "./new-service-order-form";

const { t } = createTranslator("pt-BR");
let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

afterEach(() => {
	navigation.searchParams = new URLSearchParams();
	vi.clearAllMocks();
});

describe("NewServiceOrderForm", () => {
	it("opens an order for the device of the link and goes to it", async () => {
		navigation.searchParams = new URLSearchParams({ deviceId: device.id });
		const user = userEvent.setup();
		render(<NewServiceOrderForm />);

		await waitFor(() =>
			expect(
				screen.getByRole("combobox", { name: "Cliente" })
			).toHaveTextContent(device.customer.name)
		);
		await user.type(
			screen.getByRole("textbox", { name: /Problema|Defeito/i }),
			"Não liga"
		);
		await user.click(
			screen.getByRole("button", { name: /Salvar ordem de serviço/ })
		);

		await waitFor(() =>
			expect(api.writes[0]).toMatchObject({
				method: "POST",
				path: "/companies/fixr/service-orders",
				body: { deviceId: device.id, reportedDefect: "Não liga", photos: [] },
			})
		);
		expect(router.push).toHaveBeenCalledWith(
			`/dashboard/fixr/service-orders/${serviceOrder.id}`
		);
	});

	it("asks for a device before saving", async () => {
		const user = userEvent.setup();
		render(<NewServiceOrderForm />);

		await user.click(
			screen.getByRole("button", { name: /Salvar ordem de serviço/ })
		);

		expect(
			await screen.findByText("Escolha o aparelho que será consertado.")
		).toBeInTheDocument();
		expect(api.writes).toHaveLength(0);
	});

	it("registers a customer in place and picks them", async () => {
		const user = userEvent.setup();
		render(<NewServiceOrderForm />);

		await user.click(
			screen.getByRole("button", { name: t("serviceOrders.form.newCustomer") })
		);

		expect(
			await screen.findByText(t("serviceOrders.form.newCustomerHint"))
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText(t("customers.form.namePlaceholder"))
		).toBeInTheDocument();
	});

	it("offers the inline forms only to who can register", () => {
		render(<NewServiceOrderForm />, { role: "technician" });

		expect(
			screen.queryByRole("button", {
				name: t("serviceOrders.form.newCustomer"),
			})
		).not.toBeInTheDocument();
	});

	it("shows the customer's devices as cards to pick", async () => {
		navigation.searchParams = new URLSearchParams({
			customerId: device.customerId,
		});
		const user = userEvent.setup();
		render(<NewServiceOrderForm />);

		const card = await screen.findByRole("button", {
			name: new RegExp(device.model.name),
		});
		await user.click(card);

		expect(card).toHaveAttribute("aria-pressed", "true");
	});
});
