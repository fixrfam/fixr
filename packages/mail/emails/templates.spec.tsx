import { describe, expect, it } from "vitest";
import { renderEmail as renderDeletion } from "./account-deletion";
import { renderEmail as renderInvite } from "./invite";
import { renderEmail as renderPasswordReset } from "./password-reset";
import { renderEmail as renderVerification } from "./verification";

const linkProps = {
	displayName: "maria",
	appName: "Fixr",
	verificationUrl: "https://fixr.test/confirm?token=abc123",
};

describe.each([
	["verification", renderVerification],
	["account deletion", renderDeletion],
	["password reset", renderPasswordReset],
])("%s email", (_name, render) => {
	it("renders HTML with the name and the action link", async () => {
		const html = await render(linkProps);

		expect(html).toContain("<html");
		expect(html).toContain("maria");
		expect(html).toContain("https://fixr.test/confirm?token=abc123");
	});

	it("escapes interpolated values", async () => {
		const html = await render({
			...linkProps,
			displayName: "<script>x</script>",
		});

		expect(html).not.toContain("<script>x</script>");
	});

	it("never prints 'undefined' when a prop is missing", async () => {
		const html = await render({
			...linkProps,
			displayName: undefined as never,
		});

		expect(html).not.toContain("undefined");
	});
});

describe("invite email", () => {
	const props = {
		displayName: "João",
		companyName: "Assistência Central",
		appName: "Fixr",
		password: "Gen3rated!Pw",
		ctaUrl: "https://fixr.test/auth/login",
	};

	it("renders the company, the temporary password and the login link", async () => {
		const html = await renderInvite(props);

		expect(html).toContain("Assistência Central");
		expect(html).toContain("Gen3rated!Pw");
		expect(html).toContain("https://fixr.test/auth/login");
	});
});
