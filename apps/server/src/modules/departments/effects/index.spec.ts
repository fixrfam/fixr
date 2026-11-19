import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { repo, assign } = vi.hoisted(() => ({
	repo: { queryStageOwner: vi.fn(), queryEmployeeOfCompany: vi.fn() },
	assign: vi.fn(),
}));
vi.mock("../repositories", () => ({ SectorsRepository: repo }));
vi.mock("../../service-orders/services/assign", () => ({
	assignServiceOrder: assign,
}));

const { registerSectorEffects } = await import(".");

const tx = "TX" as unknown as Transaction;

afterEach(() => {
	vi.clearAllMocks();
});

function bus() {
	const instance = new EventBus();
	registerSectorEffects(instance);
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

describe("sector effects", () => {
	it("sends the order to the pool of the sector that owns the stage it entered", async () => {
		repo.queryStageOwner.mockResolvedValue({
			sectorId: "bench",
			employeeId: null,
		});

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(repo.queryStageOwner).toHaveBeenCalledWith(tx, "co", "fixing");
		expect(assign).toHaveBeenCalledWith(tx, {
			serviceOrderId: "so",
			sectorId: "bench",
			assigneeId: null,
		});
	});

	it("assigns the stage's employee, in their sector when the stage names none", async () => {
		repo.queryStageOwner.mockResolvedValue({
			sectorId: null,
			employeeId: "bia",
		});
		repo.queryEmployeeOfCompany.mockResolvedValue({
			id: "bia",
			sectorId: "bench",
		});

		await bus().emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(repo.queryEmployeeOfCompany).toHaveBeenCalledWith("bia", "co", tx);
		expect(assign).toHaveBeenCalledWith(tx, {
			serviceOrderId: "so",
			sectorId: "bench",
			assigneeId: "bia",
		});
	});

	it("routes a new order by the owner of the first stage", async () => {
		repo.queryStageOwner.mockResolvedValue({
			sectorId: "front-desk",
			employeeId: null,
		});

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
