import { db } from "@fixr/db/connection";
import { uploads } from "@fixr/db/schema";
import { describe, expect, it } from "vitest";
import { makeClient } from "../../factories";
import { createTestApp } from "../../helpers/app";
import {
	authedInject,
	createEmployeeSession,
	signSession,
} from "../../helpers/auth";

const app = await createTestApp();
const file = {
	fileName: "Foto frente.jpg",
	contentType: "image/jpeg",
	size: 2048,
};

describe("POST /uploads/:purpose/presign", () => {
	it("persists a pending service-order upload scoped to the company", async () => {
		const { token, company, employee } = await createEmployeeSession(app, {
			role: "technician",
		});

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/uploads/service-orders/presign",
			payload: file,
		});

		expect(response.statusCode).toBe(200);
		const data = response.json().data;
		expect(data.key).toMatch(
			new RegExp(
				`^companies/${company.id}/service-orders/\\d+-[0-9a-f]{8}-Foto-frente\\.jpg$`
			)
		);
		expect(data.uploadUrl).toContain("X-Amz-Signature");
		const [stored] = await db.select().from(uploads);
		expect(stored).toMatchObject({
			id: data.id,
			companyId: company.id,
			employeeId: employee.id,
			purpose: "service_order",
			status: "pending",
			sizeInBytes: 2048,
		});
	});

	it("presigns an avatar for any signed-in user, without company scope", async () => {
		const { user } = await makeClient();
		const token = signSession(app, { id: user.id, email: user.email });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/uploads/avatar/presign",
			payload: file,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().data.key).toBe(`users/${user.id}/avatar.jpg`);
	});

	it("rejects a file over the size limit before touching R2 or the DB", async () => {
		const { token } = await createEmployeeSession(app, { role: "manager" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/uploads/models/presign",
			payload: { ...file, size: 50 * 1024 * 1024 },
		});

		expect(response.statusCode).toBe(400);
		expect(await db.select().from(uploads)).toHaveLength(0);
	});

	it("rejects an unknown purpose", async () => {
		const { token } = await createEmployeeSession(app, { role: "manager" });

		const response = await authedInject(app, token, {
			method: "POST",
			url: "/uploads/documents/presign",
			payload: file,
		});

		expect(response.statusCode).toBe(400);
	});
});
