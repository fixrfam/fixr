import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildAvatarObjectKey,
	buildModelObjectKey,
	buildObjectPublicUrl,
	buildUploadObjectKey,
	isAllowedCompanyPhotoUrl,
	sanitizeUploadFileName,
} from "./r2";

vi.mock("node:crypto", async (importOriginal) => ({
	...(await importOriginal<typeof import("node:crypto")>()),
	randomUUID: () => "12345678-aaaa-bbbb-cccc-dddddddddddd",
}));

describe("sanitizeUploadFileName", () => {
	it.each([
		["photo.jpg", "photo.jpg"],
		["my photo (1).png", "my-photo-1-.png"],
		["../../etc/passwd", "passwd"],
		["C:\\Users\\me\\pic.jpg", "pic.jpg"],
		// NFKD splits accents into combining marks, which are replaced by dashes.
		["çãé.jpg", "c-a-e-.jpg"],
		["---", "upload"],
		["", "upload"],
	])("sanitizes %j to %j", (input, expected) => {
		expect(sanitizeUploadFileName(input)).toBe(expected);
	});

	it("caps the name at 200 chars", () => {
		expect(sanitizeUploadFileName(`${"a".repeat(300)}.jpg`)).toHaveLength(200);
	});
});

describe("object keys", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(1_700_000_000_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("scopes service order uploads by company", () => {
		expect(buildUploadObjectKey({ companyId: "c1", fileName: "a b.jpg" })).toBe(
			"companies/c1/service-orders/1700000000000-12345678-a-b.jpg"
		);
	});

	it("scopes model images by company", () => {
		expect(buildModelObjectKey({ companyId: "c1", fileName: "x.png" })).toBe(
			"companies/c1/models/1700000000000-12345678-x.png"
		);
	});

	it("uses a deterministic avatar key per user and keeps the extension", () => {
		expect(buildAvatarObjectKey({ userId: "u1", fileName: "me.png" })).toBe(
			"users/u1/avatar.png"
		);
		expect(buildAvatarObjectKey({ userId: "u1", fileName: "noext" })).toBe(
			"users/u1/avatar.jpg"
		);
	});
});

describe("public URLs", () => {
	const base = "https://cdn.test";

	it("joins the base url and key", () => {
		expect(buildObjectPublicUrl(base, "a/b.jpg")).toBe(
			"https://cdn.test/a/b.jpg"
		);
	});

	it("only allows photos from the company's own service-order prefix", () => {
		expect(
			isAllowedCompanyPhotoUrl(
				base,
				`${base}/companies/c1/service-orders/x.jpg`,
				"c1"
			)
		).toBe(true);
		expect(
			isAllowedCompanyPhotoUrl(
				base,
				`${base}/companies/c2/service-orders/x.jpg`,
				"c1"
			)
		).toBe(false);
		expect(
			isAllowedCompanyPhotoUrl(
				base,
				"https://evil.test/companies/c1/service-orders/x.jpg",
				"c1"
			)
		).toBe(false);
	});
});
