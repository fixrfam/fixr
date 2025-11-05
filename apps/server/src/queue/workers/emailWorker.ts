import type { EmailJobData } from "@fixr/mail/queue"
import { emails } from "@fixr/mail/services"
import { Worker } from "bullmq"
import chalk from "chalk"
import { FastifyPluginCallback, FastifyPluginOptions } from "fastify"
import type { Redis } from "ioredis"
import { redis } from "@/src/config/redis"
import { FastifyTypedInstance } from "@/src/interfaces/fastify"

/* The email worker processes the queue jobs.
- It listen to any job with the key "email", retrieve the payload and run the corresponding action with it. 
*/
const createEmailWorker = (connection: Redis): Worker<EmailJobData> =>
  new Worker<EmailJobData>(
    "email",
    async ({ data }) => {
      const { job, payload } = data

      const handler = emails[job] as (input: typeof payload) => unknown

      return handler(payload)
    },
    { connection },
  )

const attachEmailWorkerListeners = (worker: Worker<EmailJobData>): void => {
  worker.on("completed", (job) => {
    console.log(`✅ Email sent to "${job.data.payload.to}" JobId:${job.id}`)
  })
  worker.on("failed", (job, err) => {
    console.error(
      `❌ Failed sending email to ${job?.data.payload.to} JobId:${job?.id}:`,
      err,
    )
  })
}

export const startEmailWorker = () => {
  const worker = createEmailWorker(redis)
  attachEmailWorkerListeners(worker)

  console.log(chalk.greenBright("📨 Email worker started\n"))
}
