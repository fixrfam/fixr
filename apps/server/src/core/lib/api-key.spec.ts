import { describe, expect, it } from "vitest";
import {
	generateApiKey,
	hashApiKeySecret,
	parseApiKey,
	verifyApiKeySecret,
} from "./api-key";

describe("parseApiKey", () => {
	it("round-trips every generated token", () => {
		// The prefix and the secret are base64url, so a share of the generated
		// tokens carry a "_" inside one of the parts. Parsing used to split on
		// the separator, which rejected those and left the keys unusable.
		for (let i = 0; i < 2000; i++) {
			const key = generateApiKey();
			const parsed = parseApiKey(key.token);

			expect(parsed).toEqual({
				prefix: key.prefix,
				secret: expect.any(String),
			});
			expect(verifyApiKeySecret(parsed?.secret ?? "", key.keyHash)).toBe(true);
		}
	});

	it("parses a token whose parts contain the separator", () => {
		// 12 and 43 characters: the encoded length of 9 and 32 random bytes.
		const prefix = `aa_${"b".repeat(9)}`;
		const secret = `cc-${"d".repeat(40)}`;
		const parsed = parseApiKey(`fxr_${prefix}_${secret}`);

		expect(parsed).toEqual({ prefix, secret });
	});

	it("rejects tokens that are not API keys", () => {
		const jwt =
			"eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFiYyJ9.Kx_8Qb-1wZk_of4jsomethingelse";

		expect(parseApiKey(jwt)).toBeNull();
		expect(parseApiKey("")).toBeNull();
		expect(parseApiKey("fxr_short_secret")).toBeNull();
		expect(parseApiKey("ghp_aaaaaaaaaaaa_bbbb")).toBeNull();
	});

	it("rejects a token missing the separator at the expected offset", () => {
		const key = generateApiKey();
		const withoutSeparator = key.token.replace(
			`_${key.prefix}_`,
			`_${key.prefix}x`
		);

		expect(parseApiKey(withoutSeparator)).toBeNull();
	});
});

describe("verifyApiKeySecret", () => {
	it("accepts the matching secret and refuses anything else", () => {
		const key = generateApiKey();
		const secret = parseApiKey(key.token)?.secret ?? "";

		expect(verifyApiKeySecret(secret, key.keyHash)).toBe(true);
		expect(verifyApiKeySecret(`${secret}x`, key.keyHash)).toBe(false);
		expect(verifyApiKeySecret(secret, hashApiKeySecret("other"))).toBe(false);
	});

	it("refuses a hash of the wrong size without throwing", () => {
		// timingSafeEqual throws on mismatched lengths, so the guard matters: a
		// truncated row would turn into a 500 instead of a failed credential.
		expect(verifyApiKeySecret("whatever", "abcd")).toBe(false);
	});
});
