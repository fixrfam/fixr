import "@/test/mocks";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import CookieDialog from "./cookie-dialog";

const props = {
	cookieKey: "__showVerifiedDialog__fixr",
	close: { cta: "Iniciar", toast: { text: "ok", description: "ok" } },
};

afterEach(() => {
	document.cookie = `${props.cookieKey}=; max-age=0; path=/`;
});

describe("CookieDialog", () => {
	it("renders on the server while open (no document access during render)", () => {
		const originalDocument = globalThis.document;
		// Simulate the Node server render, where `document` doesn't exist.
		Reflect.deleteProperty(globalThis, "document");
		try {
			expect(() =>
				renderToString(
					<CookieDialog {...props} open>
						<p>Conta verificada com sucesso!</p>
					</CookieDialog>
				)
			).not.toThrow();
		} finally {
			globalThis.document = originalDocument;
		}
	});

	it("shows its content and clears the one-shot cookie once mounted", () => {
		document.cookie = `${props.cookieKey}=true; path=/`;

		render(
			<CookieDialog {...props} open>
				<p>Conta verificada com sucesso!</p>
			</CookieDialog>
		);

		expect(
			screen.getByText("Conta verificada com sucesso!")
		).toBeInTheDocument();
		expect(document.cookie).not.toContain(`${props.cookieKey}=true`);
	});

	it("leaves the cookie alone when closed", () => {
		document.cookie = `${props.cookieKey}=true; path=/`;

		render(
			<CookieDialog {...props} open={false}>
				<p>hidden</p>
			</CookieDialog>
		);

		expect(screen.queryByText("hidden")).not.toBeInTheDocument();
		expect(document.cookie).toContain(`${props.cookieKey}=true`);
	});
});
