import { afterEach, describe, expect, it, vi } from "vitest";
import { registerGracefulShutdown } from "./shutdown";

describe("registerGracefulShutdown", () => {
	afterEach(() => {
		process.removeAllListeners("SIGUSR2");
	});

	it("closes every worker (waiting for in-flight jobs) before exiting 0", async () => {
		const order: string[] = [];
		let finishJob: () => void = () => undefined;
		const worker = {
			close: vi.fn(
				() =>
					new Promise<void>((resolve) => {
						finishJob = () => {
							order.push("job finished");
							resolve();
						};
					})
			),
		};
		const exit = vi.fn((code: number) => {
			order.push(`exit ${code}`);
		});
		const shutdown = registerGracefulShutdown([worker], { signals: [], exit });

		const pending = shutdown();
		expect(exit).not.toHaveBeenCalled();
		finishJob();
		await pending;

		expect(worker.close).toHaveBeenCalledTimes(1);
		expect(order).toEqual(["job finished", "exit 0"]);
	});

	it("exits with 1 when a worker fails to close", async () => {
		const exit = vi.fn();
		const shutdown = registerGracefulShutdown(
			[
				{ close: vi.fn().mockRejectedValue(new Error("x")) },
				{ close: vi.fn(async () => undefined) },
			],
			{ signals: [], exit }
		);

		await shutdown();

		expect(exit).toHaveBeenCalledWith(1);
	});

	it("runs on the configured signal, only once", async () => {
		const worker = { close: vi.fn(async () => undefined) };
		const exit = vi.fn();
		registerGracefulShutdown([worker], { signals: ["SIGUSR2"], exit });

		process.emit("SIGUSR2");
		process.emit("SIGUSR2");
		await vi.waitFor(() => expect(exit).toHaveBeenCalled());

		expect(worker.close).toHaveBeenCalledTimes(1);
	});
});
