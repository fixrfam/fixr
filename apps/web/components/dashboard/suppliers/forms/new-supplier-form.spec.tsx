import { createTranslator } from "@fixr/i18n";
import { mockSuppliers } from "@fixr/mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePartsStore } from "@/components/dashboard/parts/store";
import { toast } from "@/test/mocks";
import { render } from "@/test/render";
import { NewSupplierForm } from "./new-supplier-form";

const { t } = createTranslator("pt-BR");
const initialState = usePartsStore.getState();

beforeEach(() => {
	usePartsStore.setState(initialState, true);
});

afterEach(() => {
	vi.clearAllMocks();
});

const field = (label: string) =>
	screen.getByRole("textbox", { name: new RegExp(label, "i") });

async function fill(
	user: ReturnType<typeof userEvent.setup>,
	email = "compras@pecas.test"
) {
	await user.type(field(t("suppliers.form.nameLabel")), "Peças & Cia");
	await user.type(field(t("suppliers.form.cnpjLabel")), "11222333000181");
	await user.type(field(t("suppliers.form.contactLabel")), "Ana");
	await user.type(field(t("suppliers.form.phoneLabel")), "11999998888");
	await user.type(field(t("suppliers.form.emailLabel")), email);
}

describe("NewSupplierForm", () => {
	it("masks the CNPJ and the phone as the user types", async () => {
		const user = userEvent.setup();
		render(<NewSupplierForm />);

		await fill(user);

		expect(field(t("suppliers.form.cnpjLabel"))).toHaveValue(
			"11.222.333/0001-81"
		);
		expect(field(t("suppliers.form.phoneLabel"))).toHaveValue(
			"(11) 99999-8888"
		);
	});

	it("adds the supplier to the store and reports success", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewSupplierForm onSuccess={onSuccess} />);

		await fill(user);
		await user.click(
			screen.getByRole("button", { name: t("suppliers.form.submit") })
		);

		await waitFor(() => expect(onSuccess).toHaveBeenCalled());
		const { suppliers } = usePartsStore.getState();
		expect(suppliers).toHaveLength(mockSuppliers.length + 1);
		expect(suppliers.at(-1)).toMatchObject({
			name: "Peças & Cia",
			contact: "Ana",
			cnpj: "11.222.333/0001-81",
			phone: "(11) 99999-8888",
			email: "compras@pecas.test",
		});
		expect(toast.success).toHaveBeenCalledWith({
			text: t("suppliers.form.created"),
		});
	});

	it("rejects an invalid email with the translated message", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewSupplierForm onSuccess={onSuccess} />);

		await fill(user, "not-an-email");
		await user.click(
			screen.getByRole("button", { name: t("suppliers.form.submit") })
		);

		expect(
			await screen.findByText(t("validation.email.invalid"))
		).toBeInTheDocument();
		expect(onSuccess).not.toHaveBeenCalled();
		expect(usePartsStore.getState().suppliers).toHaveLength(
			mockSuppliers.length
		);
	});
});
