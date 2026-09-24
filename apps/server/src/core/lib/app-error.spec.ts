import { describe, expect, it, vi } from "vitest";
import { errors } from "../errors";
import { AppError } from "./app-error";

function fakeReply() {
	const reply = {
		status: vi.fn(() => reply),
		send: vi.fn(() => reply),
	};
	return reply;
}

describe("AppError", () => {
	it("takes code, message and status from the registry key", () => {
		const error = new AppError("MISSING_PERMISSIONS");

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe("AppError");
		expect(error.code).toBe(errors.MISSING_PERMISSIONS.code);
		expect(error.message).toBe(errors.MISSING_PERMISSIONS.message);
		expect(error.status).toBe(403);
		expect(error.details).toBeUndefined();
	});

	it("keeps optional details", () => {
		expect(new AppError("BAD_REQUEST", { field: "x" }).details).toEqual({
			field: "x",
		});
	});

	it("sends the standard error envelope", () => {
		const reply = fakeReply();

		new AppError("AUTH_JWT_INVALID").send(reply as never);

		expect(reply.status).toHaveBeenCalledWith(401);
		expect(reply.send).toHaveBeenCalledWith({
			status: 401,
			error: "Unauthorized",
			code: "auth_jwt_invalid",
			message: errors.AUTH_JWT_INVALID.message,
			data: null,
		});
	});

	it("sends details as data", () => {
		const reply = fakeReply();

		new AppError("BAD_REQUEST", [{ path: "a" }]).send(reply as never);

		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({ data: [{ path: "a" }] })
		);
	});
});
