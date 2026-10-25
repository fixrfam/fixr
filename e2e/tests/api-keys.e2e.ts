import { COMPANY_A } from "../fixtures/data";
import { authFile, expect, test } from "../fixtures/test";
import { API_URL } from "../support/env";

const ALFA = `/dashboard/${COMPANY_A.subdomain}`;

test.use({ storageState: authFile("manager") });

test("create an API key, use it, revoke it and it stops working", async ({
	page,
	playwright,
}) => {
	await page.goto(`${ALFA}/settings/api-keys`);
	await expect(
		page.getByRole("heading", { name: "Chaves de API" })
	).toBeVisible();

	await page.getByRole("button", { name: "Nova chave" }).click();
	await page.getByPlaceholder("Integração com o ERP").fill("ERP e2e");
	await page.getByRole("button", { name: /Criar chave/ }).click();

	await expect(page.getByText(/não será exibido de novo/)).toBeVisible();
	// The full token (the table also shows a masked "fxr_<prefix>_••••" version).
	const secret = (
		await page
			.getByText(/^fxr_[A-Za-z0-9_-]{12}_[A-Za-z0-9_-]{43}$/)
			.textContent()
	)?.trim();
	expect(secret).toMatch(/^fxr_/);

	// The key authenticates on its own, without the browser session cookies.
	const integration = await playwright.request.newContext({
		baseURL: API_URL,
		extraHTTPHeaders: { "x-api-key": secret! },
	});
	const url = `/companies/${COMPANY_A.subdomain}/employees?page=1`;
	expect((await integration.get(url)).status()).toBe(200);

	await page.getByRole("button", { name: "Já copiei, fechar" }).click();
	await expect(page.getByRole("cell", { name: /ERP e2e/ })).toBeVisible();
	await page.getByRole("button", { name: "Abrir menu" }).first().click();
	await page.getByRole("menuitem", { name: "Revogar" }).click();
	await page
		.getByRole("alertdialog")
		.getByRole("button", { name: "Revogar" })
		.click();

	await expect
		.poll(async () => (await integration.get(url)).status())
		.toBe(401);
	await integration.dispose();
});
