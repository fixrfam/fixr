import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { companyQueryKey } from "@/lib/services/company";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { render } from "@/test/render";
import { useCompany } from "./use-company";

function serveName(name: string) {
	server.use(
		http.get(apiUrl("/companies/fixr"), () =>
			HttpResponse.json(envelope({ id: "c1", name, subdomain: "fixr" }))
		)
	);
}

function CompanyName() {
	const { data } = useCompany("fixr");
	return <p>{data?.name}</p>;
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

describe("useCompany", () => {
	it("picks up a renamed company once the settings save invalidates it", async () => {
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		serveName("Alfa");
		render(
			<QueryClientProvider client={client}>
				<CompanyName />
			</QueryClientProvider>
		);
		expect(await screen.findByText("Alfa")).toBeInTheDocument();

		serveName("Alfa Assistência");
		await act(() =>
			client.invalidateQueries({ queryKey: companyQueryKey("fixr") })
		);

		expect(await screen.findByText("Alfa Assistência")).toBeInTheDocument();
	});
});
