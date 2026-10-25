import { roleAbilities } from "@fixr/permissions/abilities";
import type { Page } from "@playwright/test";
import {
	COMPANY_A,
	COMPANY_B,
	ROLE_EMAILS,
	type SeededRole,
} from "../fixtures/data";
import { authFile, expect, test } from "../fixtures/test";
import { API_URL } from "../support/env";

const ALFA = `/dashboard/${COMPANY_A.subdomain}`;

/** Collect uncaught page errors and console errors (ignoring network noise). */
function trackErrors(page: Page) {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (message) => {
		const text = message.text();
		if (
			message.type() === "error" &&
			!text.includes("Failed to load resource") &&
			!text.includes("net::ERR")
		) {
			errors.push(text);
		}
	});
	return errors;
}

test.describe("employee management (admin)", () => {
	test.use({ storageState: authFile("admin") });

	test("creates an employee with a role and it shows up in the list", async ({
		page,
	}) => {
		await page.goto(`${ALFA}/employees`);
		await expect(
			page.getByRole("heading", { name: "Funcionários" })
		).toBeVisible();
		await page.getByRole("button", { name: /Cadastrar funcionários/ }).click();

		await page.getByLabel(/Nome do funcionário/).fill("Clara Técnica");
		await page.getByPlaceholder("123.456.789-00").fill("15350946056");
		await page
			.getByPlaceholder("email@funcionario.com")
			.fill("clara@alfa.test");
		await page.getByRole("combobox").click();
		await page.getByRole("option", { name: "Técnico" }).click();
		await page.getByRole("button", { name: "Gerar" }).click();
		await page
			.getByRole("button", { name: /Cadastrar/ })
			.last()
			.click();

		await expect(page).toHaveURL(`${ALFA}/employees`);
		await page.reload();
		await expect(
			page.getByRole("cell", { name: "Clara Técnica" })
		).toBeVisible();
	});

	// No endpoint exists yet to change an employee's role or remove an employee (#95 findings).
	test.fixme("changes an employee's role and the menu follows", async () => {
		// Pending: see the reason above.
	});
	test.fixme("removes an employee and they lose access", async () => {
		// Pending: see the reason above.
	});
});

/**
 * One test per role in roleAbilities: the employees area is visible only to
 * roles with employees:read, and a direct URL is blocked by both the web
 * middleware (redirect) and the API (403).
 */
for (const role of Object.keys(roleAbilities) as SeededRole[]) {
	const canSeeEmployees = roleAbilities[role].includes("employees:read");

	test.describe(`as ${role}`, () => {
		test.use({ storageState: authFile(role) });

		test(`employees area is ${canSeeEmployees ? "available" : "blocked"}`, async ({
			page,
		}) => {
			await page.goto(`${ALFA}/employees`);

			if (canSeeEmployees) {
				await expect(page).toHaveURL(`${ALFA}/employees`);
				await expect(
					page.getByRole("heading", { name: "Funcionários" })
				).toBeVisible();
			} else {
				await expect(page).not.toHaveURL(/\/employees/);
				await expect(
					page.getByRole("link", { name: "Funcionários" })
				).toHaveCount(0);
			}

			const api = await page.request.get(
				`${API_URL}/companies/alfa/employees?page=1`
			);
			expect(api.status()).toBe(canSeeEmployees ? 200 : 403);
		});
	});
}

test.describe("tenant isolation", () => {
	test.use({ storageState: authFile("admin") });

	test("company A cannot open company B's dashboard or data", async ({
		page,
	}) => {
		await page.goto(`/dashboard/${COMPANY_B.subdomain}/employees`);

		await expect(page).toHaveURL(`${ALFA}/employees`);
		await expect(page.getByText(COMPANY_B.admin.name)).toHaveCount(0);

		const api = await page.request.get(
			`${API_URL}/companies/${COMPANY_B.subdomain}/employees?page=1`
		);
		expect(api.status()).toBe(403);
	});
});

test.describe("resilience", () => {
	test("the public site shows a banner instead of breaking when the API is down", async ({
		page,
	}) => {
		await page.route(`${API_URL}/`, (route) =>
			route.abort("connectionrefused")
		);

		await page.goto("/");

		await expect(page.getByText(/API indisponível/)).toBeVisible();
	});

	test.describe("dashboard", () => {
		test.use({ storageState: authFile("admin") });

		test("keeps rendering when an API call fails", async ({ page }) => {
			const errors = trackErrors(page);
			await page.route(`${API_URL}/companies/**`, (route) =>
				route.abort("connectionrefused")
			);

			await page.goto(`${ALFA}/employees`);

			await expect(
				page.getByRole("heading", { name: "Funcionários" })
			).toBeVisible();
			expect(
				errors.filter(
					(e) => !(e.includes("AxiosError") || e.includes("Network Error"))
				)
			).toEqual([]);
		});

		test("main navigation works without errors", async ({ page }) => {
			const errors = trackErrors(page);

			for (const path of [
				"home",
				"account",
				"employees",
				"service-orders",
				"support",
			]) {
				await page.goto(`${ALFA}/${path}`);
				await expect(page).toHaveURL(`${ALFA}/${path}`);
			}

			expect(errors).toEqual([]);
		});
	});

	test.describe("guest", () => {
		test.use({ storageState: authFile("guest") });

		test("lands on a page instead of a redirect loop", async ({ page }) => {
			await page.goto(`${ALFA}/home`);

			await expect(page).toHaveURL(`${ALFA}/support`);
		});
	});
});

test.describe("service orders", () => {
	test.use({ storageState: authFile("manager") });

	// The service order screens still render @fixr/mock data and the create form
	// only logs to the console: they are not wired to the API yet (#95 findings).
	test.fixme("create an order end to end and see it in the list", async () => {
		// Pending: see the reason above.
	});
	test.fixme("advance the status and see it in the list", async () => {
		// Pending: see the reason above.
	});
	test.fixme(
		"assign a technician and the order shows up for them",
		async () => {
			// Pending: see the reason above.
		}
	);
});

test.describe("catalog", () => {
	// There are no maker/model/category screens in apps/web yet (API only).
	test.fixme(
		"create maker -> model -> use it in a new service order",
		async () => {
			// Pending: see the reason above.
		}
	);
	test.fixme("upload a model image", async () => {
		// Pending: see the reason above.
	});
});

// Sanity check that the seeded roles exist for every role in roleAbilities.
test("every role in roleAbilities has a seeded user", () => {
	for (const role of Object.keys(roleAbilities)) {
		expect(ROLE_EMAILS[role as SeededRole]).toBeTruthy();
	}
});
