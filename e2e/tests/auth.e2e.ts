import { cookieKey } from "@fixr/constants/cookies";
import { COMPANY_A, PASSWORD, ROLE_EMAILS } from "../fixtures/data";
import { createUnverifiedAccount, latestToken } from "../fixtures/db";
import { authFile, expect, test, waitForTurnstile } from "../fixtures/test";
import { API_URL } from "../support/env";

const SESSION = cookieKey("session");
const REFRESH = cookieKey("refreshToken");

async function fillLogin(
	page: import("@playwright/test").Page,
	email: string,
	password: string
) {
	await page.goto("/auth/login");
	await waitForTurnstile(page);
	await page.getByLabel("E-mail *").fill(email);
	await page.getByLabel("Senha *").fill(password);
	await page
		.locator("form")
		.getByRole("button", { name: "Entrar", exact: true })
		.click();
}

test.describe("login", () => {
	test("valid credentials land on the company dashboard", async ({ page }) => {
		await fillLogin(page, ROLE_EMAILS.manager, PASSWORD);

		await expect(page).toHaveURL(`/dashboard/${COMPANY_A.subdomain}/account`);
		const cookies = await page.context().cookies();
		expect(cookies.map((c) => c.name)).toEqual(
			expect.arrayContaining([SESSION, REFRESH])
		);
	});

	test("a wrong password shows an error and stays on the login page", async ({
		page,
	}) => {
		await fillLogin(page, ROLE_EMAILS.manager, "Wr0ng!Password");

		await expect(page.getByText("Senha incorreta")).toBeVisible();
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("an unverified account is told to verify the email", async ({
		page,
	}) => {
		await createUnverifiedAccount("unverified@alfa.test");

		await fillLogin(page, "unverified@alfa.test", PASSWORD);

		await expect(page.getByText("Email não verificado")).toBeVisible();
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});

test("email verification link verifies the account and lets the user sign in", async ({
	page,
	request,
}) => {
	const token = await createUnverifiedAccount("verify-me@alfa.test");
	const redirectUrl = encodeURIComponent(
		new URL(
			"/auth/login",
			page.url() === "about:blank" ? "http://localhost:3100" : page.url()
		).toString()
	);

	await page.goto(
		`${API_URL}/auth/verify?token=${encodeURIComponent(token)}&redirectUrl=${redirectUrl}`
	);

	await expect(page).toHaveURL(/\/auth\/login/);
	// The login page must render the success dialog (it used to 500 on the server here).
	await expect(page.getByText("Conta verificada com sucesso!")).toBeVisible();
	const login = await request.post(`${API_URL}/auth/login`, {
		data: {
			email: "verify-me@alfa.test",
			password: PASSWORD,
			cfTurnstileToken: "e2e",
		},
	});
	expect(login.status()).toBe(200);
});

test.describe("protected routes", () => {
	test("redirect to login without a session", async ({ page }) => {
		await page.goto(`/dashboard/${COMPANY_A.subdomain}/employees`);

		await expect(page).toHaveURL(/\/auth\/login/);
	});

	// Not implemented yet (see #95 findings): after login the app always goes to /account.
	test.fixme(
		"return to the originally requested page after login",
		async ({ page }) => {
			await page.goto(`/dashboard/${COMPANY_A.subdomain}/employees`);
			await fillLogin(page, ROLE_EMAILS.admin, PASSWORD);

			await expect(page).toHaveURL(
				`/dashboard/${COMPANY_A.subdomain}/employees`
			);
		}
	);
});

test("logout returns to the public page and back navigation does not restore the session", async ({
	page,
}) => {
	await fillLogin(page, ROLE_EMAILS.technician, PASSWORD);
	await expect(page).toHaveURL(/\/dashboard\/alfa\/account/);

	// The account page has a "Sair" button (the account popover has another one).
	// Retry: a click that lands before hydration submits the form natively and does nothing.
	await expect(async () => {
		await page.getByRole("button", { name: "Sair", exact: true }).click();
		await expect(page).toHaveURL(/\/auth\/login/, { timeout: 3000 });
	}).toPass();
	await page.goBack();
	// Whatever the history shows, reloading it must end on the login page (no session left).
	await expect(async () => {
		await page.reload();
		await expect(page).toHaveURL(/\/auth\/login/, { timeout: 2000 });
	}).toPass();
});

test("forgot password: request, open the emailed link, reset and sign in with the new password", async ({
	page,
	request,
}) => {
	const email = ROLE_EMAILS.warehouse;
	const newPassword = "N3w!E2ePassword";

	await page.goto("/auth/forgot-password");
	await waitForTurnstile(page);
	await page.getByLabel("E-mail *").fill(email);
	await page.getByRole("button", { name: "Redefinir senha" }).click();

	await expect.poll(() => latestToken(email, "password_reset")).not.toBeNull();
	const token = await latestToken(email, "password_reset");

	await page.goto(`/auth/forgot-password/${encodeURIComponent(token!)}`);
	await waitForTurnstile(page);
	await page.getByLabel("Senha *", { exact: true }).fill(newPassword);
	await page.getByLabel("Confirmar senha *").fill(newPassword);
	await page.getByRole("button", { name: "Alterar senha" }).click();
	await expect(page.getByText("Senha alterada! 🎉")).toBeVisible();

	const oldLogin = await request.post(`${API_URL}/auth/login`, {
		data: { email, password: PASSWORD, cfTurnstileToken: "e2e" },
	});
	expect(oldLogin.status()).toBe(401);

	await fillLogin(page, email, newPassword);
	await expect(page).toHaveURL(/\/dashboard\/alfa\/account/);
});

test("an invalid reset link is bounced to the login page", async ({ page }) => {
	await page.goto("/auth/forgot-password/not-a-real-token");

	await expect(page).toHaveURL(/\/auth\/login/);
});

test.describe("expired session", () => {
	test.use({ storageState: authFile("manager") });

	test("is refreshed transparently with the refresh token", async ({
		page,
		context,
	}) => {
		// Simulate the 5-minute JWT cookie expiring while the refresh cookie is still valid.
		const cookies = await context.cookies();
		await context.clearCookies();
		await context.addCookies(cookies.filter((c) => c.name !== SESSION));

		await page.goto(`/dashboard/${COMPANY_A.subdomain}/home`);

		await expect(page).toHaveURL(`/dashboard/${COMPANY_A.subdomain}/home`);
		// The page itself must render on this first request (it used to 500 here).
		await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
		expect((await context.cookies()).some((c) => c.name === SESSION)).toBe(
			true
		);
	});
});
