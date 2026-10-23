import { createTranslator } from "@fixr/i18n";
import { mockParts, mockServices } from "@fixr/mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { toast } from "@/test/mocks";
import { serveInventory } from "@/test/msw/inventory";
import { renderWithQuery as render } from "@/test/query";
import { NewServiceForm } from "./new-service-form";

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

const submitButton = () =>
	screen.getByRole("button", { name: t("services.form.submit") });

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
	await enter(
		user,
		screen.getByLabelText(t("services.form.nameLabel")),
		"Troca de alto-falante"
	);
	await enter(
		user,
		screen.getByLabelText(t("services.form.descriptionLabel")),
		"Substitui o alto-falante e testa o volume."
	);
	await user.click(screen.getByRole("button", { name: "Telefonia" }));
	await enter(
		user,
		screen.getByLabelText(t("services.form.durationLabel")),
		"45"
	);
	await enter(
		user,
		screen.getByLabelText(t("services.form.priceLabel")),
		"120"
	);
}

describe("NewServiceForm", () => {
	it("creates a service with its parts and test topics", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		const part = mockParts[0]!;
		render(<NewServiceForm onSuccess={onSuccess} />);

		await fillRequired(user);
		await user.click(screen.getByRole("combobox"));
		await user.click(
			await screen.findByRole("option", { name: new RegExp(part.sku) })
		);
		await user.type(
			screen.getByPlaceholderText(
				t("services.form.testInstructionsPlaceholder")
			),
			"Tocar um áudio no volume máximo{Enter}"
		);
		await user.click(submitButton());

		await waitFor(() => expect(onSuccess).toHaveBeenCalled());
		expect(api.catalog.services.at(-1)).toMatchObject({
			name: "Troca de alto-falante",
			deviceCategories: ["Telefonia"],
			estimatedDurationMinutes: 45,
			price: 120,
			partIds: [part.id],
			testInstructions: ["Tocar um áudio no volume máximo"],
			testParameters: [],
		});
		expect(toast.success).toHaveBeenCalledWith({
			text: t("services.form.created"),
		});
	});

	it("toggles a device category on and off", async () => {
		const user = userEvent.setup();
		render(<NewServiceForm />);
		const category = screen.getByRole("button", { name: "Telefonia" });

		await user.click(category);
		expect(category).toHaveAttribute("aria-pressed", "true");

		await user.click(category);
		expect(category).toHaveAttribute("aria-pressed", "false");
	});

	it("requires a device category", async () => {
		const user = userEvent.setup();
		const onSuccess = vi.fn();
		render(<NewServiceForm onSuccess={onSuccess} />);

		await fillRequired(user);
		await user.click(screen.getByRole("button", { name: "Telefonia" }));
		await user.click(submitButton());

		expect(
			await screen.findByText(t("validation.service.deviceCategoriesRequired"))
		).toBeInTheDocument();
		expect(onSuccess).not.toHaveBeenCalled();
		expect(api.catalog.services).toHaveLength(mockServices.length);
	});

	describe("editing", () => {
		const service = mockServices.find((s) => s.partIds.length > 0)!;
		const firstPart = mockParts.find((p) => p.id === service.partIds[0])!;

		it("shows the current parts and saves a removal", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			render(<NewServiceForm onSuccess={onSuccess} service={service} />);

			expect(screen.getByLabelText(t("services.form.nameLabel"))).toHaveValue(
				service.name
			);
			// The selected parts show up once the catalog loads from the API.
			await user.click(
				await screen.findByRole("button", {
					name: t("services.form.removeItem", { name: firstPart.name }),
				})
			);
			await user.click(
				screen.getByRole("button", { name: t("common.actions.saveChanges") })
			);

			await waitFor(() => expect(onSuccess).toHaveBeenCalled());
			const saved = api.catalog.services.find((s) => s.id === service.id);
			expect(saved?.partIds).toEqual(service.partIds.slice(1));
			expect(api.catalog.services).toHaveLength(mockServices.length);
			expect(toast.success).toHaveBeenCalledWith({
				text: t("services.form.updated"),
			});
		});
	});
});
