import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const handlers: Record<string, (...args: unknown[]) => void> = {};
	return {
		handlers,
		Worker: vi.fn(function Worker(this: Record<string, unknown>) {
			this.on = vi.fn(
				(event: string, handler: (...args: unknown[]) => void) => {
					handlers[event] = handler;
				}
			);
		}),
		emails: {
			sendInviteEmail: vi.fn(),
			sendAccountVerificationEmail: vi.fn(),
			sendAccountDeletionEmail: vi.fn(),
			sendPasswordResetEmail: vi.fn(),
		},
	};
});

vi.mock("bullmq", () => ({ Worker: mocks.Worker }));
vi.mock("@/src/config/redis", () => ({ redis: { fake: "redis" } }));
vi.mock("@fixr/mail/services", () => ({ emails: mocks.emails }));

const {
	EMAIL_QUEUE_NAME,
	attachEmailWorkerListeners,
	createEmailWorker,
	processEmailJob,
	startEmailWorker,
} = await import("./email-worker");

const payload = {
	to: "user@fixr.test",
	appName: "Fixr",
	verificationUrl: "https://fixr.test/verify",
	displayName: "user",
};

afterEach(() => {
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("processEmailJob", () => {
	it("calls the matching mail sender with the job payload", async () => {
		mocks.emails.sendPasswordResetEmail.mockResolvedValue({ id: "email-1" });

		const result = await processEmailJob({
			data: { job: "sendPasswordResetEmail", payload },
		});

		expect(mocks.emails.sendPasswordResetEmail).toHaveBeenCalledWith(payload);
		expect(result).toEqual({ id: "email-1" });
	});

	it("rejects an unknown job with a clear error instead of crashing", async () => {
		await expect(
			processEmailJob({ data: { job: "sendSpam", payload } as never })
		).rejects.toThrow('Unknown email job "sendSpam"');
	});

	it("does not resolve prototype keys as handlers", async () => {
		await expect(
			processEmailJob({ data: { job: "constructor", payload } as never })
		).rejects.toThrow("Unknown email job");
	});

	it("propagates send failures so BullMQ can retry the job", async () => {
		mocks.emails.sendInviteEmail.mockRejectedValue(new Error("Resend 500"));

		await expect(
			processEmailJob({ data: { job: "sendInviteEmail", payload } as never })
		).rejects.toThrow("Resend 500");
	});
});

describe("createEmailWorker", () => {
	it("consumes the email queue with processEmailJob", () => {
		const connection = { redis: true } as never;

		createEmailWorker(connection);

		expect(mocks.Worker).toHaveBeenCalledWith(
			EMAIL_QUEUE_NAME,
			processEmailJob,
			{
				connection,
			}
		);
		expect(EMAIL_QUEUE_NAME).toBe("email");
	});
});

describe("event listeners", () => {
	it("log completed and failed jobs without throwing", () => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		const worker = createEmailWorker({} as never);

		attachEmailWorkerListeners(worker);

		expect(() =>
			mocks.handlers.completed?.({ id: "1", data: { payload } })
		).not.toThrow();
		expect(() =>
			mocks.handlers.failed?.({ id: "1", data: { payload } }, new Error("x"))
		).not.toThrow();
		// BullMQ may call "failed" without a job (e.g. stalled job lost).
		expect(() =>
			mocks.handlers.failed?.(undefined, new Error("x"))
		).not.toThrow();
		expect(console.error).toHaveBeenCalled();
	});
});

describe("startEmailWorker", () => {
	it("starts a worker on the shared Redis connection and returns it", () => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);

		const worker = startEmailWorker();

		expect(mocks.Worker).toHaveBeenCalledWith("email", processEmailJob, {
			connection: { fake: "redis" },
		});
		expect(worker.on).toHaveBeenCalledWith("completed", expect.any(Function));
		expect(worker.on).toHaveBeenCalledWith("failed", expect.any(Function));
	});
});
