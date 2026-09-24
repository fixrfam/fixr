import { GetObjectCommand } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

const getSignedUrl = vi.hoisted(() =>
	vi.fn(async () => "https://signed.test/object")
);

vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl }));

const r2 = await import("./r2");

describe("config/r2", () => {
	it("parses the bucket name from R2_BUCKET_URL", () => {
		expect(r2.r2Bucket).toBe("fixr-test");
	});

	it("strips the trailing slash of the public base url", () => {
		expect(r2.r2PublicBaseUrl).toBe("https://cdn.test.local");
		expect(r2.buildObjectPublicUrl("a.jpg")).toBe(
			"https://cdn.test.local/a.jpg"
		);
	});

	it("checks company photo urls against the configured public base url", () => {
		expect(
			r2.isAllowedCompanyPhotoUrl(
				"https://cdn.test.local/companies/c1/service-orders/a.jpg",
				"c1"
			)
		).toBe(true);
	});

	it("presigns GET urls for 24h against the configured bucket", async () => {
		const url = await r2.generatePresignedGetUrl("companies/c1/a.jpg");

		expect(url).toBe("https://signed.test/object");
		const [client, command, options] = getSignedUrl.mock
			.calls[0] as unknown as [
			unknown,
			GetObjectCommand,
			{ expiresIn: number },
		];
		expect(client).toBe(r2.r2Client);
		expect(command).toBeInstanceOf(GetObjectCommand);
		expect(command.input).toEqual({
			Bucket: "fixr-test",
			Key: "companies/c1/a.jpg",
		});
		expect(options).toEqual({ expiresIn: 86_400 });
	});
});
