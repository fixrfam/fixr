import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { SessionProvider } from "@/lib/hooks/use-session";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { render } from "@/test/render";
import { StageOwners } from "./stage-owners";

const SECTORS_URL = apiUrl("/companies/fixr/sectors");
const STAGES_URL = apiUrl("/companies/fixr/sectors/stage-owners");

function renderStages(role = "manager") {
	render(
		<QueryClientProvider
			client={
				new QueryClient({ defaultOptions: { queries: { retry: false } } })
			}
		>
			<SessionProvider
				session={
					{
						id: "u1",
						email: "a@fixr.test",
						displayName: "A",
						avatarUrl: null,
						profileType: "employee",
						company: { id: "c1", name: "Fixr", subdomain: "fixr", role },
						createdAt: new Date(),
						iat: 1,
						exp: 9_999_999_999,
					} as never
				}
			>
				<StageOwners />
			</SessionProvider>
		</QueryClientProvider>
	);
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
	server.use(
		http.get(SECTORS_URL, () =>
			HttpResponse.json(
				envelope([{ id: "bench", name: "Bancada", employees: [] }])
			)
		),
		http.get(apiUrl("/companies/fixr/employees"), () =>
			HttpResponse.json(envelope({ records: [] }))
		)
	);
});

describe("StageOwners", () => {
	it("saves a stage as soon as its sector is picked", async () => {
		let body: { stages: { status: string; sectorId: string | null }[] } | null =
			null;
		server.use(
			http.get(STAGES_URL, () => HttpResponse.json(envelope([]))),
			http.put(STAGES_URL, async ({ request }) => {
				body = (await request.json()) as typeof body;
				return HttpResponse.json(envelope(body?.stages ?? []));
			})
		);
		const user = userEvent.setup();
		renderStages();

		const [pendingSector] = await screen.findAllByRole("combobox", {
			name: "Setor",
		});
		await user.click(pendingSector!);
		await user.click(await screen.findByRole("option", { name: "Bancada" }));

		await waitFor(() =>
			expect(body?.stages.find((stage) => stage.status === "pending")).toEqual({
				status: "pending",
				sectorId: "bench",
				employeeId: null,
			})
		);
		expect(screen.queryByRole("button", { name: /Salvar/ })).toBeNull();
	});

	it("shows what is saved and can't be changed without sectors:update", async () => {
		server.use(
			http.get(STAGES_URL, () =>
				HttpResponse.json(
					envelope([{ status: "fixing", sectorId: "bench", employeeId: null }])
				)
			)
		);
		renderStages("technician");

		expect(await screen.findByText("Bancada")).toBeInTheDocument();
		for (const select of screen.getAllByRole("combobox")) {
			expect(select).toBeDisabled();
		}
	});
});
