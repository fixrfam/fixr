import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const repo = vi.hoisted(() => ({
	queryAllCategories: vi.fn(),
	queryCategoryBySlug: vi.fn(),
}));

vi.mock("../repositories", () => ({ CategoriesRepository: repo }));

const { CategoriesService } = await import(".");

const category = { id: "c1", name: "Smartphone", slug: "smartphone" };

afterEach(() => {
	vi.clearAllMocks();
});

describe("CategoriesService.listCategories", () => {
	it("forwards the name filter and returns the categories", async () => {
		repo.queryAllCategories.mockResolvedValue([category]);
		const reply = createFakeReply();

		await CategoriesService.listCategories({
			query: "smart",
			response: asReply(reply),
		});

		expect(repo.queryAllCategories).toHaveBeenCalledWith("smart");
		expect(reply.state.body).toMatchObject({
			code: "list_categories_success",
			data: [category],
		});
	});

	it("returns an empty list", async () => {
		repo.queryAllCategories.mockResolvedValue([]);
		const reply = createFakeReply();

		await CategoriesService.listCategories({ response: asReply(reply) });

		expect(reply.state.body).toMatchObject({ data: [] });
	});
});

describe("CategoriesService.getCategoryBySlug", () => {
	it("returns the category", async () => {
		repo.queryCategoryBySlug.mockResolvedValue(category);
		const reply = createFakeReply();

		await CategoriesService.getCategoryBySlug({
			slug: "smartphone",
			response: asReply(reply),
		});

		expect(reply.state.body).toMatchObject({ data: category });
	});

	it("returns 404 for an unknown slug", async () => {
		repo.queryCategoryBySlug.mockResolvedValue(null);

		await expect(
			CategoriesService.getCategoryBySlug({
				slug: "x",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "category_not_found", status: 404 });
	});
});
