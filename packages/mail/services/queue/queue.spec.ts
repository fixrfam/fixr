import { describe, expect, it, vi } from "vitest";

const Queue = vi.hoisted(() =>
	vi.fn(function Queue(this: Record<string, unknown>) {
		this.add = vi.fn(async () => ({ id: "1" }));
	})
);

vi.mock("bullmq", () => ({ Queue }));

const { createEmailQueue, queueEmail } = await import("./queue");

describe("createEmailQueue", () => {
	it("creates the 'email' queue on the given connection (same name the worker consumes)", () => {
		const connection = { redis: true } as never;

		createEmailQueue(connection);

		expect(Queue).toHaveBeenCalledWith("email", { connection });
	});
});

describe("queueEmail", () => {
	it("adds a 'send' job with the payload, 3 attempts and exponential backoff", async () => {
		const queue = createEmailQueue({} as never);
		const job = {
			job: "sendPasswordResetEmail" as const,
			payload: {
				to: "a@fixr.test",
				appName: "Fixr",
				verificationUrl: "https://x",
				displayName: "a",
			},
		};

		await queueEmail(queue, job);

		expect(queue.add).toHaveBeenCalledWith("send", job, {
			attempts: 3,
			backoff: { type: "exponential", delay: 5000 },
		});
	});
});
