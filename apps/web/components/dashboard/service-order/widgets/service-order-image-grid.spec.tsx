import { createTranslator } from "@fixr/i18n";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/test/mocks";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import { serveRepairs, serviceOrder } from "@/test/msw/repairs";
import { renderWithQuery as render } from "@/test/query";
import { ServiceOrderImageGrid } from "./service-order-image-grid";

// The R2 upload itself is covered by the uploads module: here it returns an id.
vi.mock("@/lib/services/service-orders", async (importOriginal) => ({
	...(await importOriginal<object>()),
	uploadServiceOrderPhoto: vi.fn(async () => "cupload00000000000000001"),
}));

const { t } = createTranslator("pt-BR");
let api: ReturnType<typeof serveRepairs>;

beforeEach(() => {
	setSessionCookie(fakeJwt());
	api = serveRepairs();
});

const photo = {
	id: "cphoto0000000000000000001",
	imageUrl: "https://cdn.test.local/a.jpg",
	fileName: "a.jpg",
	description: null,
	createdAt: "2026-10-20T12:00:00.000Z",
};

describe("ServiceOrderImageGrid", () => {
	it("uploads new photos and attaches them to the order", async () => {
		const user = userEvent.setup();
		render(
			<ServiceOrderImageGrid images={[]} serviceOrderId={serviceOrder.id} />,
			{ role: "technician" }
		);

		await user.upload(
			screen.getByLabelText(t("serviceOrders.images.select")),
			new File(["x"], "board.jpg", { type: "image/jpeg" })
		);

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "POST",
				path: `/companies/fixr/service-orders/${serviceOrder.id}/photos`,
				body: { photos: [{ uploadId: "cupload00000000000000001" }] },
			})
		);
	});

	it("removes a photo", async () => {
		const user = userEvent.setup();
		render(
			<ServiceOrderImageGrid
				images={[photo]}
				serviceOrderId={serviceOrder.id}
			/>,
			{ role: "technician" }
		);

		await user.click(
			screen.getByRole("button", { name: t("serviceOrders.images.remove") })
		);

		await waitFor(() =>
			expect(api.writes).toContainEqual({
				method: "DELETE",
				path: `/companies/fixr/service-orders/${serviceOrder.id}/photos/${photo.id}`,
				body: null,
			})
		);
	});

	it("only shows the photos without the edit permission", () => {
		render(
			<ServiceOrderImageGrid
				images={[photo]}
				serviceOrderId={serviceOrder.id}
			/>,
			{ role: "warehouse" }
		);

		expect(
			screen.queryByText(t("serviceOrders.images.addMore"))
		).not.toBeInTheDocument();
		expect(screen.getByRole("img")).toBeInTheDocument();
	});
});
