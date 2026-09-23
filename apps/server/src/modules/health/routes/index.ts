import { healthSchema } from "../../../core/docs/health.docs";
import type { FastifyTypedInstance } from "../../../core/interfaces/fastify";
import { HealthController } from "../controllers";

export function healthRoutes(fastify: FastifyTypedInstance) {
	fastify.get(
		"/health",
		// Exempt: load balancer and orchestrator probes must never be throttled.
		{ schema: healthSchema, config: { rateLimit: false } },
		async (_, response) => {
			await HealthController.check(response);
		}
	);
}
