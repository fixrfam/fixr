import { createTranslator } from "@fixr/i18n";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { customer, serveRepairs } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { CustomerForm } from "./customer-form";

const { t } = createTranslator("pt-BR");
let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

afterEach(() => {
	vi.clearAllMocks();
});

const field = (label: string) =>
	screen.getByRole("textbox", { name: new RegExp(`^${label}$`, "i") });

describe("CustomerForm", () => {
	it("registers a customer with unmasked CPF and phones", async () => {
		const user = userEvent.setup();
		const onSaved = vi.fn();
		render(<CustomerForm onSaved={onSaved} />);

		await user.type(field(t("customers.form.nameLabel")), "João");
		await user.type(field(t("customers.form.emailLabel")), "joao@cliente.test");
		await user.type(field(t("customers.form.phoneLabel")), "11912345678");
		await user.type(field(t("customers.form.documentLabel")), "52998224725");
		await user.type(field(t("customers.form.addressLabel")), "Rua B, 2");
		await user.type(field(t("customers.form.stateLabel")), "SP");
		await user.type(field(t("customers.form.cityLabel")), "Santos");
		await user.click(
			screen.getByRole("button", { name: t("customers.form.submit") })
		);

		await waitFor(() => expect(onSaved).toHaveBeenCalled());
		expect(api.writes[0]).toMatchObject({
			method: "POST",
			body: { cpf: "52998224725", phone: "11912345678", alternativePhone: "" },
		});
		expect(toast.success).toHaveBeenCalled();
	});

	it("edits a customer, starting from the formatted saved data", async () => {
		const user = userEvent.setup();
		render(<CustomerForm customer={customer} />);

		expect(field(t("customers.form.documentLabel"))).toHaveValue(
			"529.982.247-25"
		);
		await user.clear(field(t("customers.form.cityLabel")));
		await user.type(field(t("customers.form.cityLabel")), "Campinas");
		await user.click(
			screen.getByRole("button", { name: t("customers.form.save") })
		);

		await waitFor(() =>
			expect(api.writes[0]).toMatchObject({
				method: "PATCH",
				path: `/companies/fixr/customers/${customer.id}`,
				body: { city: "Campinas", cpf: customer.cpf },
			})
		);
	});
});
