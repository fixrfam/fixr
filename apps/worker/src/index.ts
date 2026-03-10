// @ts-nocheck
import { startEmailWorker } from "./workers/email-worker";

if (process.env.CF_WORKER !== "true") {
	startEmailWorker();
}

export default {
	// biome-ignore lint/suspicious/useAwait: Cloudflare Workers require async handlers
	async fetch(
		_request: Request,
		_env: unknown,
		_ctx: ExecutionContext
	): Promise<Response> {
		return new Response("Fixr Worker");
	},
	// biome-ignore lint/suspicious/useAwait: Cloudflare Workers require async handlers
	async scheduled(
		_event: unknown,
		_env: unknown,
		_ctx: ExecutionContext
	): Promise<void> {
		console.log("Scheduled trigger fired");
	},
};
