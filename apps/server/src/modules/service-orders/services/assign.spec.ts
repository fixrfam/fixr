import type { Transaction } from "@fixr/db/connection";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { repo } = vi.hoisted(() => ({
	repo: {
		queryAssignmentForUpdate: vi.fn(),
		updateAssignment: vi.fn(),
		insertAssignmentHistory: vi.fn(),
	},
}));
vi.mock("../repositories", () => ({ ServiceOrdersRepository: repo }));

const { assignServiceOrder } = await import("./assign");

const tx = "TX" as unknown as Transaction;

beforeEach(() => {
	repo.queryAssignmentForUpdate.mockResolvedValue({
		sectorId: "front-desk",
		assigneeId: "ana",
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe("assignServiceOrder", () => {
	it("updates the sector and assignee and records who changed them, in the same transaction", async () => {
		const changed = await assignServiceOrder(tx, {
			serviceOrderId: "so",
			sectorId: "bench",
			assigneeId: "bia",
			employeeId: "manager",
		});

		expect(changed).toBe(true);
		expect(repo.queryAssignmentForUpdate).toHaveBeenCalledWith(tx, "so");
		expect(repo.updateAssignment).toHaveBeenCalledWith(tx, "so", {
			sectorId: "bench",
			assigneeId: "bia",
		});
		expect(repo.insertAssignmentHistory).toHaveBeenCalledWith(tx, {
			serviceOrderId: "so",
			fromSectorId: "front-desk",
			toSectorId: "bench",
			fromAssigneeId: "ana",
			toAssigneeId: "bia",
			employeeId: "manager",
		});
	});

	it("records nobody when a stage's default reassigned it", async () => {
		await assignServiceOrder(tx, {
			serviceOrderId: "so",
			sectorId: "bench",
			assigneeId: null,
		});

		expect(repo.insertAssignmentHistory).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ toAssigneeId: null, employeeId: null })
		);
	});

	it("changes nothing when the sector and assignee are the same", async () => {
		const changed = await assignServiceOrder(tx, {
			serviceOrderId: "so",
			sectorId: "front-desk",
			assigneeId: "ana",
		});

		expect(changed).toBe(false);
		expect(repo.updateAssignment).not.toHaveBeenCalled();
		expect(repo.insertAssignmentHistory).not.toHaveBeenCalled();
	});

	it("changes nothing when the order doesn't exist", async () => {
		repo.queryAssignmentForUpdate.mockResolvedValue(null);

		expect(
			await assignServiceOrder(tx, {
				serviceOrderId: "so",
				sectorId: "bench",
				assigneeId: null,
			})
		).toBe(false);
		expect(repo.updateAssignment).not.toHaveBeenCalled();
	});
});
