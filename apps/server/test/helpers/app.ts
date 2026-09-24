import { afterAll } from "vitest";
import { buildApp } from "@/src/app";
import type { FastifyTypedInstance } from "@/src/core/interfaces/fastify";

/**
 * Builds a silent app instance (no logger, no docs) ready for `inject()`,
 * and closes it after the current test file.
 */
export async function createTestApp(): Promise<FastifyTypedInstance> {
	const app = await buildApp({ logger: false, docs: false });
	await app.ready();

	afterAll(async () => {
		await app.close();
	});

	return app;
}
