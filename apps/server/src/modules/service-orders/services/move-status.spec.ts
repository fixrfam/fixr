import type { Transaction } from "@fixr/db/connection";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { repo } = vi.hoisted(() => ({
	repo: { queryStatusForUpdate: vi.fn(), updateStatus: vi.fn() },
}));
vi.mock("../repositories", () => ({ ServiceOrdersRepository: repo }));

const { moveServiceOrder } = await import("./move-status");

const tx = "TX" as unknown as Transaction;
const emit = vi.fn();

beforeEach(() => {
	repo.queryStatusForUpdate.mockResolvedValue({
		companyId: "co",
		deviceId: "dv",
		status: "pending",
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("moveServiceOrder", () => {
	it("updates the status and emits the change in the same transaction", async () => {
		const moved = await moveServiceOrder(tx, emit, {
			serviceOrderId: "so",
			to: "fixing",
		});

		expect(moved).toBe(true);
		expect(repo.queryStatusForUpdate).toHaveBeenCalledWith(tx, "so");
		expect(repo.updateStatus).toHaveBeenCalledWith(tx, "so", "fixing");
		expect(emit).toHaveBeenCalledWith("serviceOrder.statusChanged", {
			serviceOrderId: "so",
			companyId: "co",
			deviceId: "dv",
			from: "pending",
			to: "fixing",
		});
	});

	it.each([
		["the same status", { to: "pending" as const }],
		[
			"a status outside onlyFrom",
			{ to: "approved" as const, onlyFrom: ["diagnosing"] as const },
		],
	])("changes nothing for %s", async (_label, change) => {
		const moved = await moveServiceOrder(tx, emit, {
			serviceOrderId: "so",
			...change,
		});

		expect(moved).toBe(false);
		expect(repo.updateStatus).not.toHaveBeenCalled();
		expect(emit).not.toHaveBeenCalled();
	});

	it("changes nothing for a missing order", async () => {
		repo.queryStatusForUpdate.mockResolvedValue(null);

		expect(
			await moveServiceOrder(tx, emit, { serviceOrderId: "so", to: "ready" })
		).toBe(false);
	});
});
