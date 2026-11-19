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

const DEPARTMENTS_URL = apiUrl("/companies/fixr/departments");
const STAGES_URL = apiUrl("/companies/fixr/departments/stage-owners");

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

const bench = {
	id: "bench",
	name: "Bancada",
	leaderId: "lia",
	leader: { id: "lia", name: "Lia Líder", cpf: "52998224725" },
	membersCount: 1,
	createdAt: new Date().toISOString(),
};

beforeEach(() => {
	setSessionCookie(fakeJwt());
	server.use(
		http.get(DEPARTMENTS_URL, () =>
			HttpResponse.json(
				envelope({
					records: [bench],
					pagination: {
						total_records: 1,
						total_pages: 1,
						current_page: 1,
						next_page: null,
						prev_page: null,
					},
				})
			)
		),
		http.get(`${DEPARTMENTS_URL}/bench`, () =>
			HttpResponse.json(
				envelope({
					...bench,
					members: [
						{ ...bench.leader, role: "technician", addedAt: bench.createdAt },
					],
				})
			)
		),
		http.get(apiUrl("/companies/fixr/employees"), () =>
			HttpResponse.json(
				envelope({ records: [], pagination: { total_records: 0 } })
			)
		)
	);
});

describe("StageOwners", () => {
	it("saves a stage to the department's pool as soon as the department is picked", async () => {
		let body: { stages: unknown[] } | null = null;
		server.use(
			http.get(STAGES_URL, () => HttpResponse.json(envelope([]))),
			http.put(STAGES_URL, async ({ request }) => {
				body = (await request.json()) as typeof body;
				return HttpResponse.json(envelope(body?.stages ?? []));
			})
		);
		const user = userEvent.setup();
		renderStages();

		const [pendingDepartment] = await screen.findAllByRole("combobox", {
			name: "Setor",
		});
		await user.click(pendingDepartment!);
		await user.click(await screen.findByRole("option", { name: "Bancada" }));

		await waitFor(() =>
			expect(body?.stages).toEqual([
				{
					status: "pending",
					departmentId: "bench",
					assigneeMode: "pool",
					employeeId: null,
				},
			])
		);
	});

	it("sends a stage to the department's leader", async () => {
		let body: { stages: unknown[] } | null = null;
		server.use(
			http.get(STAGES_URL, () =>
				HttpResponse.json(
					envelope([
						{
							status: "fixing",
							departmentId: "bench",
							assigneeMode: "pool",
							employeeId: null,
						},
					])
				)
			),
			http.put(STAGES_URL, async ({ request }) => {
				body = (await request.json()) as typeof body;
				return HttpResponse.json(envelope(body?.stages ?? []));
			})
		);
		const user = userEvent.setup();
		renderStages();

		await user.click(
			await screen.findByRole("combobox", { name: "Responsável" })
		);
		await user.click(
			await screen.findByRole("option", { name: /Líder do setor/ })
		);

		await waitFor(() =>
			expect(body?.stages).toEqual([
				expect.objectContaining({ status: "fixing", assigneeMode: "leader" }),
			])
		);
	});

	it("shows what is saved and can't be changed without departments:update", async () => {
		server.use(
			http.get(STAGES_URL, () =>
				HttpResponse.json(
					envelope([
						{
							status: "fixing",
							departmentId: "bench",
							assigneeMode: "pool",
							employeeId: null,
						},
					])
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
