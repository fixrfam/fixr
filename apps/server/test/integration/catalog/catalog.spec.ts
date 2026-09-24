import { db, eq } from "@fixr/db/connection";
import { modelImages, models } from "@fixr/db/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { r2Client } from "@/src/config/r2";
import {
	makeCategory,
	makeCompany,
	makeMaker,
	makeModel,
	makeUpload,
} from "../../factories";
import { createTestApp } from "../../helpers/app";
import { authedInject, createEmployeeSession } from "../../helpers/auth";

const app = await createTestApp();

beforeEach(() => {
	// Presigning is local crypto; only real network calls to R2 are stubbed.
	vi.spyOn(r2Client, "send").mockResolvedValue({} as never);
});

afterEach(() => {
	vi.restoreAllMocks();
});

async function managerSession() {
	return await createEmployeeSession(app, { role: "manager" });
}

describe("categories", () => {
	it("lists (with name filter) and reads by slug", async () => {
		const { token, company } = await managerSession();
		await makeCategory({ name: "Smartphone" });
		await makeCategory({ name: "Tablet" });

		const all = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/categories`,
		});
		const filtered = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/categories?query=Tab`,
		});
		const bySlug = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/categories/smartphone`,
		});
		const missing = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/categories/nope`,
		});

		expect(all.json().data.map((c: { name: string }) => c.name)).toEqual([
			"Smartphone",
			"Tablet",
		]);
		expect(filtered.json().data).toHaveLength(1);
		expect(bySlug.json().data.name).toBe("Smartphone");
		expect(missing.statusCode).toBe(404);
	});
});

describe("makers", () => {
	it("lists with pagination/sort and reads by slug", async () => {
		const { token, company } = await managerSession();
		await makeMaker({ name: "Samsung" });
		await makeMaker({ name: "Apple" });
		await makeMaker({ name: "Motorola" });

		const page = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/makers?page=1&perPage=2&sort=name`,
		});
		const bySlug = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/makers/apple`,
		});

		expect(page.statusCode).toBe(200);
		expect(
			page.json().data.records.map((m: { name: string }) => m.name)
		).toEqual(["Apple", "Motorola"]);
		expect(page.json().data.pagination).toMatchObject({
			total_records: 3,
			next_page: 2,
		});
		expect(bySlug.json().data.slug).toBe("apple");
	});
});

describe("models", () => {
	it("maker -> model chain: create, read by slug, patch, delete", async () => {
		const { token, company } = await managerSession();
		const maker = await makeMaker({ name: "Samsung" });
		const category = await makeCategory({ name: "Smartphone" });
		const base = `/companies/${company.subdomain}/models`;

		const created = await authedInject(app, token, {
			method: "POST",
			url: base,
			payload: {
				name: "Galaxy S24",
				makerId: maker.id,
				categoryId: category.id,
				chipset: "Exynos",
				weightGrams: 167,
			},
		});
		expect(created.statusCode).toBe(201);
		const { id, slug } = created.json().data;
		expect(slug).toBe("galaxy-s24");

		const read = await authedInject(app, token, {
			method: "GET",
			url: `${base}/${slug}`,
		});
		expect(read.statusCode).toBe(200);
		expect(read.json().data).toMatchObject({
			companyId: company.id,
			maker: { id: maker.id },
			category: { id: category.id },
			chipset: "Exynos",
			weightGrams: 167,
		});

		const patched = await authedInject(app, token, {
			method: "PATCH",
			url: `${base}/${id}`,
			payload: { price: "R$ 3.999" },
		});
		expect(patched.statusCode).toBe(200);
		expect(patched.json().data).toMatchObject({
			price: "R$ 3.999",
			chipset: "Exynos",
		});

		const deleted = await authedInject(app, token, {
			method: "DELETE",
			url: `${base}/${id}`,
		});
		expect(deleted.statusCode).toBe(200);
		expect(
			await db.select().from(models).where(eq(models.id, id))
		).toHaveLength(0);
	});

	it("rejects a duplicate model name in the same company", async () => {
		const { token, company } = await managerSession();
		const maker = await makeMaker();
		const create = () =>
			authedInject(app, token, {
				method: "POST",
				url: `/companies/${company.subdomain}/models`,
				payload: { name: "Pixel 9", makerId: maker.id },
			});

		await create();
		const duplicate = await create();

		expect(duplicate.statusCode).toBe(409);
	});

	it("allows the same model name in two different companies", async () => {
		const maker = await makeMaker();
		const a = await managerSession();
		const b = await managerSession();

		for (const session of [a, b]) {
			const response = await authedInject(app, session.token, {
				method: "POST",
				url: `/companies/${session.company.subdomain}/models`,
				payload: { name: "Pixel 9", makerId: maker.id },
			});
			expect(response.statusCode).toBe(201);
		}
	});

	it("rejects an unknown maker", async () => {
		const { token, company } = await managerSession();

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/models`,
			payload: { name: "Ghost", makerId: "does-not-exist" },
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().code).toBe("maker_not_found");
	});

	it("lists own + shared catalog models with filters, search and pagination", async () => {
		const { token, company } = await managerSession();
		const other = await makeCompany();
		const samsung = await makeMaker({ name: "Samsung" });
		const apple = await makeMaker({ name: "Apple" });
		await makeModel({
			makerId: samsung.id,
			companyId: company.id,
			name: "Galaxy A55",
		});
		await makeModel({
			makerId: samsung.id,
			companyId: null,
			name: "Galaxy S24",
		});
		await makeModel({
			makerId: apple.id,
			companyId: company.id,
			name: "iPhone 15",
			status: "Discontinued",
		});
		await makeModel({
			makerId: apple.id,
			companyId: other.id,
			name: "iPhone 16",
		});
		const list = async (query: string) =>
			(
				await authedInject(app, token, {
					method: "GET",
					url: `/companies/${company.subdomain}/models?page=1&${query}`,
				})
			).json().data;

		const all = await list("sort=name");
		expect(all.records.map((m: { name: string }) => m.name)).toEqual([
			"Galaxy A55",
			"Galaxy S24",
			"iPhone 15",
		]);

		const bySamsung = await list(`makerId=${samsung.id}`);
		expect(bySamsung.pagination.total_records).toBe(2);

		const discontinued = await list("status=Discontinued");
		expect(discontinued.records.map((m: { name: string }) => m.name)).toEqual([
			"iPhone 15",
		]);

		const search = await list("query=galaxy");
		expect(search.pagination.total_records).toBe(2);

		const combined = await list(`query=galaxy&makerId=${apple.id}`);
		expect(combined.records).toEqual([]);

		const paged = await list("perPage=2&sort=name");
		expect(paged.records).toHaveLength(2);
		expect(paged.pagination).toMatchObject({ total_pages: 2, next_page: 2 });
	});

	it("does not read another company's model by slug", async () => {
		const other = await makeCompany();
		const maker = await makeMaker();
		await makeModel({
			makerId: maker.id,
			companyId: other.id,
			name: "Secret Device",
		});
		const { token, company } = await managerSession();

		const response = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/models/secret-device`,
		});

		expect(response.statusCode).toBe(404);
	});

	it.each([
		"PATCH",
		"DELETE",
	] as const)("%s cannot touch another company's model (404)", async (method) => {
		const other = await makeCompany();
		const maker = await makeMaker();
		const foreign = await makeModel({ makerId: maker.id, companyId: other.id });
		const { token, company } = await managerSession();

		const response = await authedInject(app, token, {
			method,
			url: `/companies/${company.subdomain}/models/${foreign.id}`,
			payload: method === "PATCH" ? { name: "hijacked" } : undefined,
		});

		expect(response.statusCode).toBe(404);
		const [stored] = await db
			.select()
			.from(models)
			.where(eq(models.id, foreign.id));
		expect(stored?.name).toBe(foreign.name);
	});

	it("attaches and removes model images", async () => {
		const { token, company, employee } = await managerSession();
		const maker = await makeMaker();
		const model = await makeModel({ makerId: maker.id, companyId: company.id });
		const upload = await makeUpload({
			companyId: company.id,
			employeeId: employee.id,
			purpose: "model_image",
		});
		const base = `/companies/${company.subdomain}/models/${model.id}/images`;

		const created = await authedInject(app, token, {
			method: "POST",
			url: base,
			payload: { uploadId: upload.id, isPrimary: true },
		});
		expect(created.statusCode).toBe(201);
		expect(created.json().data.presignedUrl).toContain(upload.key);

		const read = await authedInject(app, token, {
			method: "GET",
			url: `/companies/${company.subdomain}/models/${model.slug}`,
		});
		expect(read.json().data.imageUrl).toContain(upload.key);

		const imageId = created.json().data.id;
		const removed = await authedInject(app, token, {
			method: "DELETE",
			url: `${base}/${imageId}`,
		});
		expect(removed.statusCode).toBe(200);
		expect(r2Client.send).toHaveBeenCalled();
		expect(await db.select().from(modelImages)).toHaveLength(0);
	});

	it("refuses to attach another company's upload", async () => {
		const other = await makeCompany();
		const foreignUpload = await makeUpload({
			companyId: other.id,
			purpose: "model_image",
		});
		const { token, company } = await managerSession();
		const maker = await makeMaker();
		const model = await makeModel({ makerId: maker.id, companyId: company.id });

		const response = await authedInject(app, token, {
			method: "POST",
			url: `/companies/${company.subdomain}/models/${model.id}/images`,
			payload: { uploadId: foreignUpload.id },
		});

		expect(response.statusCode).toBe(403);
	});

	it("deleting a maker that still has models is refused by the database", async () => {
		const maker = await makeMaker();
		const company = await makeCompany();
		await makeModel({ makerId: maker.id, companyId: company.id });
		const { modelMakers } = await import("@fixr/db/schema");

		// There is no maker delete endpoint yet; the FK (no cascade) is what protects the data.
		await expect(
			db.delete(modelMakers).where(eq(modelMakers.id, maker.id))
		).rejects.toThrow();
	});
});
