import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { env } from './config/env.js';
import { EMAIL_QUEUE_NAME, type EmailJobData } from './modules/notifications/email-queue.js';
import { sendEmail } from './modules/notifications/mailer.js';

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const worker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    await sendEmail(job.data);
  },
  {
    connection,
    concurrency: env.EMAIL_WORKER_CONCURRENCY,
  },
);

worker.on('completed', (job) => {
  process.stdout.write(`Email job ${job.id ?? job.name} completed\n`);
});
worker.on('failed', (job, error) => {
  process.stderr.write(`Email job ${job?.id ?? job?.name ?? 'unknown'} failed: ${error.message}\n`);
});

process.stdout.write(`Roomly email worker listening on ${EMAIL_QUEUE_NAME}\n`);

async function shutdown(signal: string): Promise<void> {
  process.stdout.write(`Received ${signal}, stopping email worker\n`);
  await worker.close();
  await connection.quit();
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
