import { userJWT } from "@fixr/schemas/auth";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/lib/hooks/use-session";
import { parseJwt } from "@/lib/utils";
import { fakeJwt } from "@/test/jwt";
import { render } from "@/test/render";
import Header from "./header";

vi.mock("@/components/language-toggle", () => ({ LanguageToggle: () => null }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));

const session = userJWT.parse(parseJwt(fakeJwt()));

describe("Header", () => {
	it("offers the login to visitors", () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("null", { status: 200 })
		);
		render(
			<SessionProvider>
				<Header />
			</SessionProvider>
		);

		expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
			"href",
			"/auth/login"
		);
	});

	it("takes a signed in user back to their dashboard", () => {
		render(
			<SessionProvider session={session}>
				<Header />
			</SessionProvider>
		);

		const link = screen.getByRole("link", { name: /Ir para o painel/ });
		expect(link).toHaveAttribute("href", "/dashboard/fixr/home");
		expect(link).toHaveAttribute("title", "Conectado como Maria");
		expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
	});
});
