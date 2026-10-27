import type { Transaction } from "@fixr/db/connection";
import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./bus";

const tx = "TX" as unknown as Transaction;
const statusChanged = {
	serviceOrderId: "so",
	companyId: "co",
	deviceId: "dv",
	from: "fixing" as const,
	to: "ready" as const,
	employeeId: "em",
};

describe("EventBus", () => {
	it("runs the effects of an event in registration order, with the transaction", async () => {
		const bus = new EventBus();
		const calls: string[] = [];
		bus.on("serviceOrder.statusChanged", "a.first", (payload, { tx: t }) => {
			calls.push(`first ${payload.to} ${t}`);
		});
		bus.on("serviceOrder.statusChanged", "b.second", async () => {
			await Promise.resolve();
			calls.push("second");
		});

		await bus.emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(calls).toEqual(["first ready TX", "second"]);
		expect(bus.effectsOf("serviceOrder.statusChanged")).toEqual([
			"a.first",
			"b.second",
		]);
	});

	it("does nothing for an event without effects", async () => {
		await expect(
			new EventBus().emit(tx, "serviceOrder.statusChanged", statusChanged)
		).resolves.toBeUndefined();
	});

	it("lets an effect emit a follow-up event in the same transaction", async () => {
		const bus = new EventBus();
		const opened = vi.fn();
		bus.on("serviceOrder.statusChanged", "a.reopen", (payload, { emit }) =>
			emit("serviceOrder.opened", {
				serviceOrderId: payload.serviceOrderId,
				companyId: payload.companyId,
				deviceId: payload.deviceId,
				employeeId: "em",
			})
		);
		bus.on("serviceOrder.opened", "b.track", opened);

		await bus.emit(tx, "serviceOrder.statusChanged", statusChanged);

		expect(opened).toHaveBeenCalledWith(
			expect.objectContaining({ serviceOrderId: "so", employeeId: "em" }),
			expect.objectContaining({ tx })
		);
	});

	it("stops at the first failing effect and rethrows its error", async () => {
		const bus = new EventBus();
		const after = vi.fn();
		const failure = new Error("not enough stock");
		bus.on("serviceOrder.statusChanged", "a.fail", () => {
			throw failure;
		});
		bus.on("serviceOrder.statusChanged", "b.after", after);

		await expect(
			bus.emit(tx, "serviceOrder.statusChanged", statusChanged)
		).rejects.toBe(failure);
		expect(after).not.toHaveBeenCalled();
	});

	it("refuses an effect name registered twice on an event", () => {
		const bus = new EventBus();
		bus.on("serviceOrder.opened", "a.same", vi.fn());

		expect(() => bus.on("serviceOrder.opened", "a.same", vi.fn())).toThrow(
			/already registered/
		);
	});

	it("breaks effects that emit each other in a loop", async () => {
		const bus = new EventBus();
		bus.on("serviceOrder.statusChanged", "a.loop", (payload, { emit }) =>
			emit("serviceOrder.statusChanged", payload)
		);

		await expect(
			bus.emit(tx, "serviceOrder.statusChanged", statusChanged)
		).rejects.toThrow(/loop/);
	});

	it("removes one effect or all of them", async () => {
		const bus = new EventBus();
		const kept = vi.fn();
		bus.on("serviceOrder.opened", "a.removed", vi.fn());
		bus.on("serviceOrder.opened", "b.kept", kept);

		bus.off("serviceOrder.opened", "a.removed");
		expect(bus.effectsOf("serviceOrder.opened")).toEqual(["b.kept"]);

		bus.clear();
		expect(bus.effectsOf("serviceOrder.opened")).toEqual([]);
	});
});
