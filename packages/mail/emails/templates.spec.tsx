import { createTranslator, type Locale } from "@fixr/i18n";
import { describe, expect, it } from "vitest";
import { renderEmail as renderDeletion } from "./account-deletion";
import { renderEmail as renderEstimate } from "./estimate";
import { renderEmail as renderInvite } from "./invite";
import { renderEmail as renderPasswordReset } from "./password-reset";
import { renderEmail as renderVerification } from "./verification";

const linkProps = {
	displayName: "maria",
	appName: "Fixr",
	verificationUrl: "https://fixr.test/confirm?token=abc123",
};

describe.each([
	["verification", renderVerification, "emails.verification.cta"],
	["account deletion", renderDeletion, "emails.accountDeletion.cta"],
	["password reset", renderPasswordReset, "emails.passwordReset.cta"],
] as const)("%s email", (_name, render, ctaKey) => {
	it("renders HTML with the name and the action link", async () => {
		const html = await render(linkProps);

		expect(html).toContain("<html");
		expect(html).toContain("maria");
		expect(html).toContain("https://fixr.test/confirm?token=abc123");
	});

	it.each([
		"en",
		"pt-BR",
	] as Locale[])("renders the call to action in %s", async (locale) => {
		const html = await render({ ...linkProps, locale });

		expect(html).toContain(createTranslator(locale).t(ctaKey));
	});

	it("defaults to English when no locale is given", async () => {
		const html = await render(linkProps);

		expect(html).toContain(createTranslator("en").t(ctaKey));
		expect(html).not.toContain(createTranslator("pt-BR").t(ctaKey));
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

	it("renders in Portuguese for a pt-BR recipient", async () => {
		const html = await renderInvite({ ...props, locale: "pt-BR" });

		expect(html).toContain(createTranslator("pt-BR").t("emails.invite.cta"));
	});
});

describe("estimate email", () => {
	const props = {
		clientName: "Maria",
		companyName: "Assistência Central",
		number: "0042",
		device: "Galaxy S21",
		total: "R$ 450,00",
		validUntil: "23/11/2026",
		ctaUrl: "https://fixr.test/estimate/tok3n",
	};

	it("renders the estimate summary and the approval link", async () => {
		const html = await renderEstimate(props);

		expect(html).toContain("Assistência Central");
		expect(html).toContain("0042");
		expect(html).toContain("R$ 450,00");
		expect(html).toContain("https://fixr.test/estimate/tok3n");
	});

	it("escapes values that carry markup", async () => {
		const html = await renderEstimate({
			...props,
			clientName: "<script>x</script>",
		});

		expect(html).not.toContain("<script>x</script>");
	});

	it("renders in Portuguese for a pt-BR recipient", async () => {
		const html = await renderEstimate({ ...props, locale: "pt-BR" });

		expect(html).toContain(createTranslator("pt-BR").t("emails.estimate.cta"));
	});
});
