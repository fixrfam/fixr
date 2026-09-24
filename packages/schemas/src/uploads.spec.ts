import { describe, expect, it } from "vitest";
import { issuePaths } from "./test-utils";
import {
	createAvatarUploadPresignSchema,
	createUploadPresignSchema,
	MAX_AVATAR_UPLOAD_SIZE_BYTES,
	MAX_UPLOAD_SIZE_BYTES,
	presignParamsSchema,
} from "./uploads";

const validUpload = {
	fileName: "a.jpg",
	contentType: "image/jpeg",
	size: 1024,
};

describe("createUploadPresignSchema", () => {
	it("accepts a valid upload", () => {
		expect(createUploadPresignSchema.safeParse(validUpload).success).toBe(true);
	});

	it.each([
		["contentType", "jpeg"],
		["contentType", "image/jpeg/x"],
		["size", 0],
		["size", 1.5],
		["size", MAX_UPLOAD_SIZE_BYTES + 1],
		["fileName", ""],
		["fileName", "a".repeat(256)],
	])("rejects %s = %s", (field, value) => {
		expect(
			issuePaths(createUploadPresignSchema, { ...validUpload, [field]: value })
		).toEqual([field]);
	});

	it("accepts exactly the max size", () => {
		expect(
			createUploadPresignSchema.safeParse({
				...validUpload,
				size: MAX_UPLOAD_SIZE_BYTES,
			}).success
		).toBe(true);
	});
});

describe("createAvatarUploadPresignSchema", () => {
	it("uses the smaller avatar size limit", () => {
		expect(
			issuePaths(createAvatarUploadPresignSchema, {
				...validUpload,
				size: MAX_AVATAR_UPLOAD_SIZE_BYTES + 1,
			})
		).toEqual(["size"]);
	});
});

describe("presignParamsSchema", () => {
	it.each(["avatar", "service-orders", "models"])("accepts %s", (purpose) => {
		expect(presignParamsSchema.safeParse({ purpose }).success).toBe(true);
	});

	it("rejects an unknown purpose", () => {
		expect(issuePaths(presignParamsSchema, { purpose: "documents" })).toEqual([
			"purpose",
		]);
	});
});
