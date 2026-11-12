import type { Transaction } from "@fixr/db/connection";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../../core/events/bus";

const { repo } = vi.hoisted(() => ({
	repo: { deleteEstimateSessions: vi.fn() },
}));
vi.mock("../repositories", () => ({ PortalRepository: repo }));

const { registerPortalEffects } = await import(".");

const tx = "TX" as unknown as Transaction;

afterEach(() => {
	vi.clearAllMocks();
});

describe("portal effects", () => {
	it("ends the sessions opened from a revoked estimate link, in the same transaction", async () => {
		const bus = new EventBus();
		registerPortalEffects(bus);

		await bus.emit(tx, "estimate.linkRevoked", {
			estimateId: "es",
			companyId: "co",
		});

		expect(repo.deleteEstimateSessions).toHaveBeenCalledWith("es", tx);
	});
});
