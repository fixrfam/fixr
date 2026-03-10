import type { EmailJobData } from "@fixr/mail/queue";
import { emails } from "@fixr/mail/services";
import { Worker } from "bullmq";
import chalk from "chalk";
import Redis from "ioredis";

const createEmailWorker = (): Worker<EmailJobData> =>
	new Worker<EmailJobData>(
		"email",
		// biome-ignore lint/suspicious/useAwait: BullMQ worker handler may not need await
		async ({ data }) => {
			const { job, payload } = data;
			const handler = emails[job] as (input: typeof payload) => unknown;
			return handler(payload);
		},
		{
			connection: new Redis(process.env.REDIS_URL!, {
				maxRetriesPerRequest: null,
			}),
		}
	);

const attachEmailWorkerListeners = (worker: Worker<EmailJobData>): void => {
	worker.on("completed", (job) => {
		console.log(`✅ Email sent to "${job.data.payload.to}" JobId:${job.id}`);
	});
	worker.on("failed", (job, err) => {
		console.error(
			`❌ Failed sending email to ${job?.data.payload.to} JobId:${job?.id}:`,
			err
		);
	});
};

export const startEmailWorker = () => {
	const worker = createEmailWorker();
	attachEmailWorkerListeners(worker);
	console.log(chalk.greenBright("📨 Email worker started\n"));
};

export default {
	// biome-ignore lint/suspicious/useAwait: Cloudflare Workers require async handlers
	async fetch(
		_request: Request,
		_env: unknown,
		_ctx: ExecutionContext
	): Promise<Response> {
		return new Response(
			"Fixr Worker - Use wrangler dev for local queue processing"
		);
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
