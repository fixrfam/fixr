import { vi } from "vitest";

/**
 * Chainable stand-in for FastifyReply used by service unit tests. Records the
 * status, body, cookies and redirect so specs can assert on the response.
 */
export function createFakeReply() {
	const state = {
		statusCode: 200,
		body: undefined as unknown,
		cookies: {} as Record<string, { value: string; options: unknown }>,
		redirectUrl: undefined as string | undefined,
	};

	const reply = {
		state,
		status: vi.fn((code: number) => {
			state.statusCode = code;
			return reply;
		}),
		code: vi.fn((code: number) => {
			state.statusCode = code;
			return reply;
		}),
		send: vi.fn((body?: unknown) => {
			state.body = body;
			return reply;
		}),
		setCookie: vi.fn((name: string, value: string, options?: unknown) => {
			state.cookies[name] = { value, options };
			return reply;
		}),
		redirect: vi.fn((url: string) => {
			state.redirectUrl = url;
			return reply;
		}),
	};

	return reply;
}

export type FakeReply = ReturnType<typeof createFakeReply>;

/** Cast helper: services type the reply as FastifyReply. */
export const asReply = (reply: FakeReply) => reply as never;
