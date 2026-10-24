import { LOCALE_COOKIE } from "@fixr/i18n";
import { createEmailQueue } from "@fixr/mail/queue";
import { afterAll, describe, expect, it } from "vitest";
import { redis } from "@/src/config/redis";
import { makeCustomerAccount } from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();
const queue = createEmailQueue(redis);

afterAll(async () => {
	await queue.close();
});

/** Every job the API pushed to the email queue (nothing consumes it in tests). */
async function queuedJobs() {
	const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"]);
	return jobs.map((job) => job.data);
}

async function requestPasswordReset(
	email: string,
	{
		headers,
		cookies,
	}: { headers?: Record<string, string>; cookies?: Record<string, string> }
) {
	return app.inject({
		method: "POST",
		url: "/credentials/password/reset",
		payload: { email, cfTurnstileToken: "ok" },
		headers,
		cookies,
	});
}

describe("email locale", () => {
	it("writes the password reset in the language the browser asks for", async () => {
		const { user } = await makeCustomerAccount();

		const response = await requestPasswordReset(user.email, {
			headers: { "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
		});

		expect(response.statusCode).toBe(201);
		expect(await queuedJobs()).toEqual([
			expect.objectContaining({
				job: "sendPasswordResetEmail",
				payload: expect.objectContaining({ to: user.email, locale: "pt-BR" }),
			}),
		]);
	});

	it("prefers the language the user picked over the browser's", async () => {
		const { user } = await makeCustomerAccount();

		await requestPasswordReset(user.email, {
			headers: { "accept-language": "pt-BR" },
			cookies: { [LOCALE_COOKIE]: "en" },
		});

		const [job] = await queuedJobs();
		expect(job?.payload).toMatchObject({ locale: "en" });
	});

	it("falls back to English without any hint", async () => {
		const { user } = await makeCustomerAccount();

		await requestPasswordReset(user.email, {});

		const [job] = await queuedJobs();
		expect(job?.payload).toMatchObject({ locale: "en" });
	});

	it("sends the employee invite in the inviter's language", async () => {
		const { token, company } = await createEmployeeSession(app, {
			role: "admin",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/employees`,
			headers: { "accept-language": "pt-BR" },
			payload: {
				name: "Novo Técnico",
				cpf: "52998224725",
				role: "technician",
				email: "novo@fixr.test",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(await queuedJobs()).toEqual([
			expect.objectContaining({
				job: "sendInviteEmail",
				payload: expect.objectContaining({
					to: "novo@fixr.test",
					locale: "pt-BR",
				}),
			}),
		]);
	});
});
