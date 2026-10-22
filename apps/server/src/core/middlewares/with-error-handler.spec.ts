import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiddlewareApp } from "@/test/helpers/middleware-app";
import { AppError } from "../lib/app-error";
import { withErrorHandler } from "./with-error-handler";

async function appThrowing(error: unknown) {
	const app = await createMiddlewareApp();
	app.get(
		"/",
		withErrorHandler(async () => {
			throw error;
		})
	);
	return app;
}

describe("withErrorHandler", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("sends AppErrors with their own status and code", async () => {
		const app = await appThrowing(new AppError("MISSING_PERMISSIONS"));

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(403);
		expect(response.json()).toMatchObject({
			status: 403,
			code: "missing_required_permissions",
		});
	});

	it("turns unexpected errors into a 500 internal_error", async () => {
		const app = await appThrowing(new Error("db exploded"));

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(500);
		expect(response.json()).toMatchObject({
			status: 500,
			code: "internal_error",
			error: "Internal Server Error",
		});
	});

	it("does not leak the stack trace in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.resetModules();
		const { withErrorHandler: handler } = await import("./with-error-handler");
		const app = await createMiddlewareApp();
		app.get(
			"/",
			handler(async () => {
				throw new Error("secret internals");
			})
		);

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(500);
		expect(response.json().data).not.toHaveProperty("stack");
	});

	it("handles non-Error throws", async () => {
		const app = await appThrowing({ weird: true });

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(500);
		expect(response.json().message).toBe("Something went wrong.");
	});

	it("does nothing when the handler already replied", async () => {
		const app = await createMiddlewareApp();
		app.get(
			"/",
			withErrorHandler(async (_request, reply) => {
				await reply.status(201).send({ ok: true });
				throw new Error("after send");
			})
		);

		const response = await app.inject({ method: "GET", url: "/" });

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({ ok: true });
	});

	it("passes through a successful handler", async () => {
		const app = await createMiddlewareApp();
		app.get(
			"/",
			withErrorHandler(async (_request, reply) => {
				await reply.send({ ok: true });
			})
		);

		expect((await app.inject({ method: "GET", url: "/" })).json()).toEqual({
			ok: true,
		});
	});
});
