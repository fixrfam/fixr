import type { EmailJobData } from "@fixr/mail/queue";
import { emails } from "@fixr/mail/services";
import { type Job, Worker } from "bullmq";
import chalk from "chalk";
import type { Redis } from "ioredis";
import { redis } from "@/src/config/redis";

export const EMAIL_QUEUE_NAME = "email";

/**
 * Sends the email described by the job. Errors are rethrown on purpose so
 * BullMQ records the failure and applies the retry/backoff configured by the
 * producer (`queueEmail` in @fixr/mail).
 */
export const processEmailJob = async ({
	data,
}: Pick<Job<EmailJobData>, "data">) => {
	const { job, payload } = data;

	if (!Object.keys(emails).includes(job)) {
		throw new Error(`Unknown email job "${String(job)}"`);
	}

	const handler = emails[job] as (input: typeof payload) => Promise<unknown>;

	return await handler(payload);
};

export const createEmailWorker = (connection: Redis): Worker<EmailJobData> =>
	new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, { connection });

export const attachEmailWorkerListeners = (
	worker: Worker<EmailJobData>
): void => {
	worker.on("completed", (job) => {
		console.log(`✅ Email sent to "${job.data.payload.to}" JobId:${job.id}`);
	});
	worker.on("failed", (job, err) => {
		console.error(
			`❌ Failed sending email to ${job?.data?.payload?.to} JobId:${job?.id}:`,
			err
		);
	});
};

export const startEmailWorker = () => {
	const worker = createEmailWorker(redis);
	attachEmailWorkerListeners(worker);

	console.log(chalk.greenBright("📨 Email worker started\n"));

	return worker;
};
