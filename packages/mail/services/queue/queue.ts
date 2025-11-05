// emailQueue.ts
import { Queue } from "bullmq"
import type { Redis } from "ioredis"
import { emails } from "../mailing"

/* Turn the emails into a string key object */
type QueueAbleEmails = typeof emails

/* Based on the job key (email string key), we can extract the parameters and add it to the payload */
export type EmailJobData = {
  [K in keyof QueueAbleEmails]: {
    job: K
    payload: Parameters<QueueAbleEmails[K]>[0]
  }
}[keyof QueueAbleEmails]

/* Uses a factory-like pattern to create the queue, so we dont depend on the env credentials to consume the connection
- This creates a queue with the key "email", so it can be later referenced on the workers.
*/
export const createEmailQueue = (connection: Redis): Queue<EmailJobData> =>
  new Queue<EmailJobData>("email", { connection })

export const queueEmail = async (
  queue: Queue<EmailJobData>,
  job: EmailJobData,
): Promise<void> => {
  await queue.add("send", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  })
}
