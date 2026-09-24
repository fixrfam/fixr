import { afterEach, describe, expect, it, vi } from "vitest";
import { asReply, createFakeReply } from "@/test/helpers/fake-reply";

const { repo, pagination } = vi.hoisted(() => ({
	repo: {
		buildListFilter: vi.fn(() => "FILTER"),
		buildOrder: vi.fn(() => "ORDER"),
		queryMakerBySlug: vi.fn(),
	},
	pagination: { getPaginatedRecords: vi.fn(), getPaginatedCount: vi.fn() },
}));

vi.mock("../repositories", async (importOriginal) => ({
	...(await importOriginal<object>()),
	MakersRepository: repo,
}));
vi.mock("../../../core/lib/pagination", () => pagination);

const { MakersService } = await import(".");

const maker = {
	id: "m1",
	name: "Samsung",
	slug: "samsung",
	url: "/makers/samsung",
	deviceCount: 3,
	pageCount: null,
	createdAt: new Date(),
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("MakersService.listMakers", () => {
	const list = (params: Record<string, unknown> = {}) => {
		const reply = createFakeReply();
		return {
			reply,
			promise: MakersService.listMakers({
				page: 1,
				response: asReply(reply),
				...params,
			}),
		};
	};

	it("forwards query and sort to the repository", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount.mockResolvedValue(0);

		await list({ query: "sam", sort: "most_devices" }).promise;

		expect(repo.buildListFilter).toHaveBeenCalledWith("sam");
		expect(repo.buildOrder).toHaveBeenCalledWith("most_devices");
	});

	it("paginates", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([maker, maker]);
		pagination.getPaginatedCount.mockResolvedValue(4);

		const { reply, promise } = list({ perPage: 2 });
		await promise;

		expect(pagination.getPaginatedRecords).toHaveBeenCalledWith(
			expect.objectContaining({ skip: 0, take: 2 })
		);
		expect(reply.state.body).toMatchObject({
			code: "list_makers_success",
			data: { pagination: { total_pages: 2, next_page: 2 } },
		});
	});

	it("returns an empty page and rejects a page past the end", async () => {
		pagination.getPaginatedRecords.mockResolvedValue([]);
		pagination.getPaginatedCount
			.mockResolvedValueOnce(0)
			.mockResolvedValueOnce(1);

		const empty = list();
		await empty.promise;
		expect(empty.reply.state.body).toMatchObject({ data: { records: [] } });

		await expect(list({ page: 3 }).promise).rejects.toMatchObject({
			code: "page_out_of_bounds",
		});
	});
});

describe("MakersService.getMakerBySlug", () => {
	it("returns the maker", async () => {
		repo.queryMakerBySlug.mockResolvedValue(maker);
		const reply = createFakeReply();

		await MakersService.getMakerBySlug({
			slug: "samsung",
			response: asReply(reply),
		});

		expect(reply.state.body).toMatchObject({ data: { slug: "samsung" } });
	});

	it("returns 404 for an unknown slug", async () => {
		repo.queryMakerBySlug.mockResolvedValue(null);

		await expect(
			MakersService.getMakerBySlug({
				slug: "x",
				response: asReply(createFakeReply()),
			})
		).rejects.toMatchObject({ code: "maker_not_found", status: 404 });
	});
});
