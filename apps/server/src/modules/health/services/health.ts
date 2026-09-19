import { db, sql } from "@fixr/db/connection";
import { Queue } from "bullmq";
import { redis } from "@/src/config/redis";

type ServiceStatus = "ok" | "degraded" | "unavailable";

interface ServiceHealth {
	status: ServiceStatus;
	latency_ms: number;
	description: string;
}

interface HealthResponse {
	status: ServiceStatus;
	timestamp: string;
	uptime: number;
	services: {
		api: ServiceHealth;
		mysql: ServiceHealth;
		redis: ServiceHealth;
		workers: ServiceHealth;
	};
}

const HEALTHY_THRESHOLD_MS = 1000;
const DEGRADED_THRESHOLD_MS = 5000;

function computeStatus(latencyMs: number, hasError: boolean): ServiceStatus {
	if (hasError) return "unavailable";
	if (latencyMs < HEALTHY_THRESHOLD_MS) return "ok";
	if (latencyMs < DEGRADED_THRESHOLD_MS) return "degraded";
	return "unavailable";
}

function roundLatency(ms: number): number {
	return Math.round(ms * 10) / 10;
}

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown error";
}

function unreachableService(error: unknown, latencyMs: number): ServiceHealth {
	return {
		status: "unavailable",
		latency_ms: roundLatency(latencyMs),
		description: formatError(error),
	};
}

function measure<T>(
	fn: () => Promise<T>
): Promise<{ latencyMs: number; result: T }> {
	const start = performance.now();
	return fn().then((result) => ({
		latencyMs: performance.now() - start,
		result,
	}));
}

/**
 * @description Pings MySQL by running SELECT 1
 */
async function pingMysql(): Promise<ServiceHealth> {
	try {
		const { latencyMs } = await measure(() => db.execute(sql`SELECT 1`));
		return {
			status: computeStatus(latencyMs, false),
			latency_ms: roundLatency(latencyMs),
			description: "MySQL connection successful",
		};
	} catch (error) {
		return unreachableService(error, 0);
	}
}

/**
 * @description Pings Redis using the PING command
 */
async function pingRedis(): Promise<ServiceHealth> {
	try {
		const { latencyMs } = await measure(() => redis.ping());
		return {
			status: computeStatus(latencyMs, false),
			latency_ms: roundLatency(latencyMs),
			description: "Redis connection successful",
		};
	} catch (error) {
		return unreachableService(error, 0);
	}
}

let emailQueue: Queue | null = null;

function getEmailQueue(): Queue {
	if (!emailQueue) {
		emailQueue = new Queue("email", { connection: redis });
	}
	return emailQueue;
}

/**
 * @description Checks if the BullMQ email queue is responsive
 */
async function pingWorkers(): Promise<ServiceHealth> {
	try {
		const { latencyMs } = await measure(() => getEmailQueue().getJobCounts());
		return {
			status: computeStatus(latencyMs, false),
			latency_ms: roundLatency(latencyMs),
			description: "BullMQ email queue responsive",
		};
	} catch (error) {
		return unreachableService(error, 0);
	}
}

function pickServiceResult(
	settled: PromiseSettledResult<ServiceHealth>
): ServiceHealth {
	if (settled.status === "fulfilled") {
		return settled.value;
	}
	return {
		status: "unavailable",
		latency_ms: 0,
		description: "Health check threw unexpectedly",
	};
}

function computeOverallStatus(
	services: HealthResponse["services"]
): ServiceStatus {
	const statuses = Object.values(services).map((s) => s.status);

	if (statuses.some((s) => s === "unavailable")) return "unavailable";
	if (statuses.some((s) => s === "degraded")) return "degraded";
	return "ok";
}

/**
 * @description Runs all health checks in parallel and returns the aggregated health status
 */
export async function getHealth(): Promise<HealthResponse> {
	const startedAt = performance.now();

	const [mysqlHealth, redisHealth, workersHealth] = await Promise.allSettled([
		pingMysql(),
		pingRedis(),
		pingWorkers(),
	]);

	const responseTime = roundLatency(performance.now() - startedAt);

	const services = {
		api: {
			status: "ok" as ServiceStatus,
			latency_ms: responseTime,
			description: "API is running",
		},
		mysql: pickServiceResult(mysqlHealth),
		redis: pickServiceResult(redisHealth),
		workers: pickServiceResult(workersHealth),
	};

	return {
		status: computeOverallStatus(services),
		timestamp: new Date().toISOString(),
		uptime: Math.floor(process.uptime()),
		services,
	};
}
