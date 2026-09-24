import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateOneTimeToken, generateRefreshToken } from "./tokens";

describe("generateRefreshToken", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("expires in exactly 7 days", () => {
		expect(generateRefreshToken().expires.toISOString()).toBe(
			"2024-01-08T00:00:00.000Z"
		);
	});

	it("returns a url-safe token that fits the refresh_tokens column (128)", () => {
		const { token } = generateRefreshToken();

		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(token.length).toBeLessThanOrEqual(128);
	});
});

describe("generateOneTimeToken", () => {
	it("returns unique url-safe tokens that fit the one_time_tokens column (128)", () => {
		const tokens = new Set(
			Array.from({ length: 50 }, () => generateOneTimeToken())
		);

		expect(tokens.size).toBe(50);
		for (const token of tokens) {
			expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
			expect(token.length).toBeLessThanOrEqual(128);
		}
	});
});
