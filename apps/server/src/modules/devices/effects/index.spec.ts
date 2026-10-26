import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { repo } = vi.hoisted(() => ({ repo: { updateDevice: vi.fn() } }));
vi.mock("../repositories", () => ({ DevicesRepository: repo }));

const { deviceStatusFor, registerDeviceEffects } = await import(".");

const tx = "TX" as unknown as Transaction;

afterEach(() => {
	vi.clearAllMocks();
});

describe("deviceStatusFor", () => {
	it.each([
		["pending", "in_shop"],
		["diagnosing", "in_shop"],
		["waiting_approval", "in_shop"],
		["approved", "in_shop"],
		["fixing", "in_shop"],
		["ready", "ready_for_pickup"],
		["delivered", "with_customer"],
	] as const)("an order %s leaves the device %s", (status, expected) => {
		expect(deviceStatusFor(status)).toBe(expected);
	});
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
		});

		expect(repo.updateDevice).toHaveBeenCalledWith(
			"dv",
			{ status: "with_customer" },
			tx
		);
	});
});
