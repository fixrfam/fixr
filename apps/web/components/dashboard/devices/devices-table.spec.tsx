import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@/test/mocks";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { device, serveRepairs } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { DeviceFormDialog } from "./device-form-dialog";
import { DevicesTable } from "./devices-table";

let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

describe("DevicesTable", () => {
	it("lists the devices with their owner and status", async () => {
		render(<DevicesTable />);

		const row = (await screen.findByText(device.model.name)).closest("tr")!;
		expect(within(row).getByText(device.client.name)).toBeInTheDocument();
		expect(within(row).getByText("Com o cliente")).toBeInTheDocument();
		expect(api.listQueries[0]?.params).toMatchObject({ sort: "updated" });
	});

	it("filters by status through the API", async () => {
		const user = userEvent.setup();
		render(<DevicesTable />);
		await screen.findByText(device.model.name);

		await user.click(screen.getByRole("combobox", { name: "Status" }));
		await user.click(await screen.findByRole("option", { name: "Na loja" }));

		await waitFor(() =>
			expect(api.listQueries.at(-1)?.params.status).toBe("in_shop")
		);
	});

	it("deletes a device after confirming", async () => {
		const user = userEvent.setup();
		render(<DevicesTable />);
		await screen.findByText(device.model.name);

		await user.click(screen.getByRole("button", { name: "Ações do aparelho" }));
		await user.click(await screen.findByRole("menuitem", { name: /Excluir/ }));
		await user.click(await screen.findByRole("button", { name: "Excluir" }));

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "DELETE",
				path: `/companies/fixr/devices/${device.id}`,
				body: null,
			})
		);
	});

	it("hides writes from a technician", async () => {
		render(<DevicesTable />, { role: "technician" });
		await screen.findByText(device.model.name);

		expect(
			screen.queryByRole("button", { name: /Novo aparelho/ })
		).not.toBeInTheDocument();
	});
});

describe("DeviceFormDialog", () => {
	it("registers a device for a fixed customer with a catalog model", async () => {
		const user = userEvent.setup();
		render(
			<DeviceFormDialog
				customer={device.client}
				onOpenChange={() => undefined}
				open
			/>
		);

		// The model comes from the catalog browser, stacked over the form.
		await user.click(
			screen.getByRole("button", {
				name: /Escolha um modelo|Busque no catálogo|Modelo/,
			})
		);
		await user.click(await screen.findByText(device.model.name));
		await user.type(screen.getByRole("textbox", { name: "IMEI" }), "123");
		await user.click(
			screen.getByRole("button", { name: "Cadastrar aparelho" })
		);

		await waitFor(() =>
			expect(api.writes[0]).toMatchObject({
				method: "POST",
				body: {
					clientId: device.client.id,
					modelId: device.model.id,
					imei: "123",
				},
			})
		);
	});
});
