import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { repo, assign } = vi.hoisted(() => ({
	repo: { queryStageOwner: vi.fn(), isMember: vi.fn() },
	assign: vi.fn(),
}));
vi.mock("../repositories", () => ({ DepartmentsRepository: repo }));
vi.mock("../../service-orders/services/assign", () => ({
	assignServiceOrder: assign,
}));

const { registerDepartmentEffects } = await import(".");

const tx = "TX" as unknown as Transaction;

afterEach(() => {
	vi.clearAllMocks();
});

function bus() {
	const instance = new EventBus();
	registerDepartmentEffects(instance);
	return instance;
}

const statusChanged = {
	serviceOrderId: "so",
	companyId: "co",
	deviceId: "dv",
	from: "approved" as const,
	to: "fixing" as const,
	employeeId: "em",
};

const owner = (overrides: object) => ({
	departmentId: "bench",
	assigneeMode: "pool",
	employeeId: null,
	leaderId: "lia",
	...overrides,
});

describe("department effects", () => {
	it("sends the order to the pool of the department that owns the stage it entered", async () => {
		repo.queryStageOwner.mockResolvedValue(owner({}));

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(repo.queryStageOwner).toHaveBeenCalledWith(tx, "co", "fixing");
		expect(assign).toHaveBeenCalledWith(tx, {
			serviceOrderId: "so",
			departmentId: "bench",
			assigneeId: null,
		});
	});

	it("assigns the department's leader", async () => {
		repo.queryStageOwner.mockResolvedValue(owner({ assigneeMode: "leader" }));

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(assign).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ assigneeId: "lia" })
		);
	});

	it("assigns the stage's employee while they're in the department", async () => {
		repo.queryStageOwner.mockResolvedValue(
			owner({ assigneeMode: "employee", employeeId: "bia" })
		);
		repo.isMember.mockResolvedValue(true);

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(repo.isMember).toHaveBeenCalledWith("bench", "bia", tx);
		expect(assign).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ assigneeId: "bia" })
		);
	});

	it("falls back to the pool when the stage's employee left the department", async () => {
		repo.queryStageOwner.mockResolvedValue(
			owner({ assigneeMode: "employee", employeeId: "bia" })
		);
		repo.isMember.mockResolvedValue(false);

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(assign).toHaveBeenCalledWith(
			tx,
			expect.objectContaining({ assigneeId: null })
		);
	});

	it("routes a new order by the owner of the first stage", async () => {
		repo.queryStageOwner.mockResolvedValue(owner({}));

		await bus().emit(tx, "serviceOrder.opened", {
			serviceOrderId: "so",
			companyId: "co",
			deviceId: "dv",
			employeeId: "em",
		});

		expect(repo.queryStageOwner).toHaveBeenCalledWith(tx, "co", "pending");
		expect(assign).toHaveBeenCalled();
	});

	it("leaves the order where it was when the stage has no owner", async () => {
		repo.queryStageOwner.mockResolvedValue(null);

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(assign).not.toHaveBeenCalled();
	});
});
