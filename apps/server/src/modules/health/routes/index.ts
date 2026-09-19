import { healthSchema } from "../../../core/docs/health.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { HealthController } from "../controllers";

export function healthRoutes(fastify: FastifyTypedInstance) {
	fastify.get("/health", { schema: healthSchema }, async (_, response) => {
		await HealthController.check(response);
	});
}
