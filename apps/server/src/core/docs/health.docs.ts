import type { FastifySchema } from "fastify";
import { z } from "zod";
import { zodResponseSchema } from "./types";

const healthCheckResultSchema = z.object({
	status: z.enum(["ok", "degraded", "unavailable"]),
	latency_ms: z.number(),
	description: z.string(),
});

const healthResponseSchema = z.object({
	status: z.enum(["ok", "degraded", "unavailable"]),
	timestamp: z.string(),
	uptime: z.number(),
	services: z.object({
		api: healthCheckResultSchema,
		mysql: healthCheckResultSchema,
		redis: healthCheckResultSchema,
		workers: healthCheckResultSchema,
	}),
});

export const healthSchema: FastifySchema = {
	tags: ["Health"],
	description: `
**Returns the health status of the API and its dependencies.**

This endpoint is publicly accessible (no authentication required) and can be used by load balancers, monitoring tools, and container orchestrators (Kubernetes liveness/readiness probes) to verify the system's operational status.

### Health criteria

| Status | Latency | Description |
| --- | --- | --- |
| \`ok\` | < 1s | Service is responding normally |
| \`degraded\` | 1-5s | Service is slow but still responding |
| \`unavailable\` | > 5s or error | Service is not reachable or errored |

### Overall status logic

- **ok**: all services are healthy
- **degraded**: at least one service is degraded, none unavailable
- **unavailable**: at least one service is unavailable`,
	summary: "Health check",
	response: {
		200: healthResponseSchema.describe("System health status"),
		500: zodResponseSchema({
			status: 500,
			error: "Internal Server Error",
			code: "health_check_failed",
			message: "Health check encountered an unexpected error",
			data: null,
		}).describe("Unexpected error while checking health"),
	},
};
