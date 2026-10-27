import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { moveServiceOrder } = vi.hoisted(() => ({
	moveServiceOrder: vi.fn(async () => true),
}));
vi.mock("../services/move-status", () => ({ moveServiceOrder }));

const { BEFORE_APPROVAL, registerServiceOrderEffects } = await import(".");

const tx = "TX" as unknown as Transaction;
const estimate = {
	estimateId: "es",
	serviceOrderId: "so",
	companyId: "co",
	employeeId: "em",
};

afterEach(() => {
	vi.clearAllMocks();
});

function bus() {
	const instance = new EventBus();
	registerServiceOrderEffects(instance);
	return instance;
}

describe("service order effects", () => {
	it.each([
		["estimate.sent", "waiting_approval"],
		["estimate.approved", "approved"],
	] as const)("%s moves the order to %s, if it wasn't answered yet", async (event, to) => {
		await bus().emit(tx, event, estimate);

		expect(moveServiceOrder).toHaveBeenCalledWith(tx, expect.any(Function), {
			serviceOrderId: "so",
			to,
			onlyFrom: BEFORE_APPROVAL,
			employeeId: "em",
		});
	});

	it("records an answer from the customer's link as nobody's", async () => {
		await bus().emit(tx, "estimate.approved", {
			...estimate,
			employeeId: null,
		});

		expect(moveServiceOrder).toHaveBeenCalledWith(
			tx,
			expect.any(Function),
			expect.objectContaining({ employeeId: null })
		);
	});
});
