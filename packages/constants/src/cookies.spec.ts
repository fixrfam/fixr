import { describe, expect, it } from "vitest";
import { cookieKey } from "./cookies";

describe("cookieKey", () => {
	it("prefixes the cookie name with a sanitized app name", () => {
		expect(cookieKey("session")).toBe("__session__fixr");
		expect(cookieKey("refreshToken")).toBe("__refreshToken__fixr");
	});

	it("produces distinct keys for distinct names", () => {
		expect(cookieKey("a")).not.toBe(cookieKey("b"));
	});
});
