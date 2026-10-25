import { roleAbilities } from "@fixr/permissions/abilities";
import { COMPANY_A, type SeededRole } from "../fixtures/data";
import { authFile, expect, test } from "../fixtures/test";
import { API_URL } from "../support/env";

const ALFA = `/dashboard/${COMPANY_A.subdomain}`;

test.describe("parts (admin)", () => {
	test.use({ storageState: authFile("admin") });

	test("registers a part and finds it in the table", async ({ page }) => {
		// A part needs a supplier, and none is seeded. 409: a retry already made it.
		const supplier = await page.request.post(
			`${API_URL}/companies/${COMPANY_A.subdomain}/suppliers`,
			{
				data: {
					name: "Fornecedor E2E",
					cnpj: "11222333000181",
					contact: "Carlos",
					phone: "11987654321",
					email: "fornecedor@e2e.test",
				},
			}
		);
		expect([201, 409]).toContain(supplier.status());

		await page.goto(`${ALFA}/parts`);
		await expect(page.getByRole("heading", { name: "Peças" })).toBeVisible();

		await page.getByRole("link", { name: /Nova peça/ }).click();
		await page.getByLabel("SKU").fill("BAT-E2E-001");
		await page.getByLabel("Nome").fill("Bateria E2E");
		await page.getByRole("button", { name: "Baterias", exact: true }).click();
		// The supplier picker is the form's only combobox.
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: /Fornecedor E2E/ }).click();
		await page.getByLabel("Preço de custo (R$)").fill("80");
		await page.getByLabel("Preço de venda (R$)").fill("150");
		await page.getByLabel("Estoque", { exact: true }).fill("5");
		await page.getByLabel("Estoque mínimo").fill("2");
		await page.getByRole("button", { name: /Cadastrar peça/ }).click();

		await expect(page).toHaveURL(`${ALFA}/parts`);
		await expect(page.getByText("Bateria E2E")).toBeVisible();
	});

	test("does not register a part sold below cost", async ({ page }) => {
		await page.goto(`${ALFA}/parts/new`);

		await page.getByLabel("Preço de custo (R$)").fill("200");
		await page.getByLabel("Preço de venda (R$)").fill("100");
		await page.getByRole("button", { name: /Cadastrar peça/ }).click();

		await expect(page).toHaveURL(`${ALFA}/parts/new`);
	});
});

/**
 * Parts, services and suppliers are admin-only for now: every other role is
 * redirected away and does not see them in the menu.
 */
for (const role of Object.keys(roleAbilities) as SeededRole[]) {
	const canSeeParts = roleAbilities[role].includes("parts:read");

	test.describe(`as ${role}`, () => {
		test.use({ storageState: authFile(role) });

		test(`parts area is ${canSeeParts ? "available" : "blocked"}`, async ({
			page,
		}) => {
			await page.goto(`${ALFA}/parts`);

			if (canSeeParts) {
				await expect(page).toHaveURL(`${ALFA}/parts`);
				await expect(page.getByRole("link", { name: "Peças" })).toBeVisible();
			} else {
				await expect(page).not.toHaveURL(/\/parts/);
				await expect(page.getByRole("link", { name: "Peças" })).toHaveCount(0);
			}
		});
	});
}

test.describe("language", () => {
	test.use({ storageState: authFile("admin") });

	test("switches the dashboard to English and keeps it after a reload", async ({
		page,
	}) => {
		await page.goto(`${ALFA}/parts`);
		await expect(page.getByRole("heading", { name: "Peças" })).toBeVisible();

		await page.getByRole("button", { name: "Alterar idioma" }).click();
		await page.getByRole("menuitem", { name: "English" }).click();

		await expect(page.getByRole("heading", { name: "Parts" })).toBeVisible();
		await page.reload();
		await expect(page.getByRole("heading", { name: "Parts" })).toBeVisible();
	});
});
