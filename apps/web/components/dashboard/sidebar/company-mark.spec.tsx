import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeJwt, setSessionCookie } from "@/test/jwt";
import "@/test/mocks";
import { apiUrl, envelope } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { render as renderUi } from "@/test/render";
import { CompanyMark } from "./company-mark";

function render(ui: React.ReactElement) {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return renderUi(
		<QueryClientProvider client={client}>{ui}</QueryClientProvider>
	);
}

function serveCompany(logoUrl: string | null) {
	server.use(
		http.get(apiUrl("/companies/fixr"), () =>
			HttpResponse.json(
				envelope({ id: "c1", name: "Alfa", subdomain: "fixr", logoUrl })
			)
		)
	);
}

beforeEach(() => {
	setSessionCookie(fakeJwt());
});

describe("CompanyMark", () => {
	it("shows the company logo once it loads", async () => {
		serveCompany("https://cdn.fixr.test/companies/c1/logo.webp?v=2");
		render(<CompanyMark companyId="c1" subdomain="fixr" />);

		expect(await screen.findByAltText("Logo da empresa")).toHaveAttribute(
			"src",
			"https://cdn.fixr.test/companies/c1/logo.webp?v=2"
		);
	});

	it("falls back to the generated avatar without a logo", async () => {
		serveCompany(null);
		render(<CompanyMark companyId="c1" subdomain="fixr" />);

		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(screen.queryByAltText("Logo da empresa")).not.toBeInTheDocument();
	});
});
