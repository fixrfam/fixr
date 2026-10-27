import { createTranslator } from "@fixr/i18n";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/test/mocks";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { device, serveRepairs } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { ModelPicker } from "./model-picker";

const { t } = createTranslator("pt-BR");
let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

async function openBrowser(role?: "admin" | "technician") {
	const onChange = vi.fn();
	const user = userEvent.setup();
	render(<ModelPicker onChange={onChange} value={null} />, { role });
	await user.click(
		screen.getByRole("button", { name: t("devices.form.modelPlaceholder") })
	);
	const browser = await screen.findByRole("dialog", {
		name: t("devices.form.modelBrowseTitle"),
	});
	return { user, onChange, browser };
}

describe("ModelPicker", () => {
	it("picks a model from the catalog table", async () => {
		const { user, onChange, browser } = await openBrowser();

		await user.click(await within(browser).findByText(device.model.name));

		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ id: device.model.id, maker: "Apple" })
		);
	});

	it("adds a missing model in a dialog over the catalog and picks it", async () => {
		const { user, onChange, browser } = await openBrowser();

		await user.type(
			within(browser).getByRole("searchbox", {
				name: t("models.explorer.search"),
			}),
			"Galaxy Z9"
		);
		await user.click(
			await within(browser).findByRole("button", {
				name: t("devices.form.modelCreate", { name: "Galaxy Z9" }),
			})
		);
		const form = await screen.findByRole("dialog", {
			name: t("devices.form.modelCreateTitle"),
		});
		expect(
			within(form).getByLabelText(t("devices.form.modelNameLabel"))
		).toHaveValue("Galaxy Z9");
		await user.click(
			within(form).getByRole("combobox", {
				name: t("devices.form.makerLabel"),
			})
		);
		await user.click(await screen.findByRole("option", { name: "Apple" }));
		await user.click(
			within(form).getByRole("button", {
				name: t("devices.form.modelCreateSubmit"),
			})
		);

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "POST",
				path: "/companies/fixr/models",
				body: { name: "Galaxy Z9", makerId: device.maker.id },
			})
		);
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Galaxy Z9", maker: "Apple" })
		);
	});

	it("doesn't offer to add models without the permission", async () => {
		const { browser } = await openBrowser("technician");

		await within(browser).findByText(device.model.name);
		expect(
			within(browser).queryByText(t("devices.form.modelMissing"))
		).not.toBeInTheDocument();
	});
});
