import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { repo } = vi.hoisted(() => ({ repo: { updateDevice: vi.fn() } }));
vi.mock("../repositories", () => ({ DevicesRepository: repo }));

const { registerDeviceEffects } = await import(".");

const tx = "TX" as unknown as Transaction;

afterEach(() => {
	vi.clearAllMocks();
});

describe("device effects", () => {
	function bus() {
		const instance = new EventBus();
		registerDeviceEffects(instance);
		return instance;
	}

	it("checks the device in when an order is opened", async () => {
		await bus().emit(tx, "serviceOrder.opened", {
			serviceOrderId: "so",
			companyId: "co",
			deviceId: "dv",
			employeeId: "em",
		});

		expect(repo.updateDevice).toHaveBeenCalledWith(
			"dv",
			{ status: "in_shop" },
			tx
		);
	});

	it("moves the device with its order, in the same transaction", async () => {
		await bus().emit(tx, "serviceOrder.statusChanged", {
			serviceOrderId: "so",
			companyId: "co",
			deviceId: "dv",
			from: "fixing",
			to: "delivered",
			employeeId: null,
		});

		expect(repo.updateDevice).toHaveBeenCalledWith(
			"dv",
			{ status: "with_customer" },
			tx
		);
	});
});
