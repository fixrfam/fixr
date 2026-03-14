import type { EmailJobData } from "@fixr/mail/queue";
import { emails } from "@fixr/mail/services";
import { Worker } from "bullmq";
import chalk from "chalk";
import type { Redis } from "ioredis";
import { redis } from "@/src/config/redis";

const createEmailWorker = (connection: Redis): Worker<EmailJobData> =>
	new Worker<EmailJobData>(
		"email",
		// biome-ignore lint/suspicious/useAwait: <>
		async ({ data }) => {
			const { job, payload } = data;

			const handler = emails[job] as (input: typeof payload) => unknown;

			return handler(payload);
		},
		{ connection }
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
	const worker = createEmailWorker(redis);
	attachEmailWorkerListeners(worker);

	console.log(chalk.greenBright("📨 Email worker started\n"));
};
