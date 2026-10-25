import { afterAll, beforeEach, inject, vi } from "vitest";

// Must run before anything imports `@fixr/env/*` / `@fixr/db/connection`.
process.env.DB_URL = inject("DB_URL");
process.env.REDIS_URL = inject("REDIS_URL");

/**
 * Cloudflare Turnstile is a third-party HTTP check, not part of our stack.
 * Integration tests stub it so they never depend on the network; the real
 * verification is covered by `src/core/lib/turnstile.spec.ts`.
 */
vi.mock("@/src/core/lib/turnstile", () => ({
	verifyTurnstileToken: vi.fn(async () => undefined),
}));

/** Email sending goes through Resend. Stub it so no mail ever leaves the suite. */
vi.mock("@fixr/mail/services", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@fixr/mail/services")>();
	return {
		...actual,
		sendAccountVerificationEmail: vi.fn(async () => undefined),
		sendAccountDeletionEmail: vi.fn(async () => undefined),
	};
});

const { resetState, closeConnections } = await import("./helpers/db");

beforeEach(async () => {
	await resetState();
});

afterAll(async () => {
	await closeConnections();
});
