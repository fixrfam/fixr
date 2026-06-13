import type { FastifyReply } from "fastify";
import { getHealth } from "../services/health";

/** @description Health check request handler */
export class HealthController {
	/**
	 * @description Runs health checks for all services and returns the aggregated status
	 */
	static async check(response: FastifyReply) {
		const health = await getHealth();
		return response.status(200).send(health);
	}
}
