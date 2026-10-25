import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { request } from "@playwright/test";
import {
	ALFA_EMPLOYEES,
	COMPANY_A,
	COMPANY_B,
	PASSWORD,
	ROLE_EMAILS,
	type SeededRole,
} from "./fixtures/data";
import { resetDatabase, seedCompanies } from "./fixtures/db";
import { authFile } from "./fixtures/test";
import { API_URL } from "./support/env";

async function login(email: string) {
	const context = await request.newContext({ baseURL: API_URL });
	const response = await context.post("/auth/login", {
		data: { email, password: PASSWORD, cfTurnstileToken: "e2e" },
	});
	if (!response.ok()) {
		throw new Error(
			`Login failed for ${email}: ${response.status()} ${await response.text()}`
		);
	}
	return context;
}

/**
 * Seeds one employee per role in company "alfa" THROUGH THE API (as the
 * company admin) and stores a logged-in storageState per role, so tests
 * don't have to go through the login form every time.
 */
export default async function globalSetup() {
	mkdirSync(".auth", { recursive: true });

	// Fresh data on every run, even when Playwright reuses running servers.
	await resetDatabase();
	await seedCompanies();
	execFileSync(
		"docker",
		[
			"compose",
			"-f",
			"docker-compose.yml",
			"exec",
			"-T",
			"redis",
			"redis-cli",
			"FLUSHALL",
		],
		{
			stdio: "ignore",
		}
	);

	const admin = await login(COMPANY_A.admin.email);
	for (const employee of ALFA_EMPLOYEES) {
		const response = await admin.post(
			`/companies/${COMPANY_A.subdomain}/employees`,
			{
				data: { ...employee, password: PASSWORD },
			}
		);
		if (response.status() !== 201) {
			throw new Error(
				`Seeding ${employee.email} failed: ${response.status()} ${await response.text()}`
			);
		}
	}
	await admin.storageState({ path: authFile("admin") });
	await admin.dispose();

	for (const role of Object.keys(ROLE_EMAILS) as SeededRole[]) {
		if (role === "admin") continue;
		const context = await login(ROLE_EMAILS[role]);
		await context.storageState({ path: authFile(role) });
		await context.dispose();
	}

	const betaAdmin = await login(COMPANY_B.admin.email);
	await betaAdmin.storageState({ path: authFile("beta-admin") });
	await betaAdmin.dispose();
}
