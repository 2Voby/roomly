import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { env } from '../../config/env.js';

export const EMAIL_QUEUE_NAME = 'roomly-email';

export type EmailJobName =
  | 'participant-added'
  | 'participant-removed'
  | 'booking-cancelled'
  | 'email-confirmation'
  | 'series-participant-added'
  | 'series-cancelled';

export interface EmailJobData {
  eventId: string;
  to: string;
  recipientName: string;
  subject: string;
  text: string;
  html: string;
  confirmationUrl?: string;
}

let connection: Redis | undefined;
let queue: Queue<EmailJobData> | undefined;

function getConnection(): Redis {
  connection ??= new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

function getQueue(): Queue<EmailJobData> {
  queue ??= new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 2_592_000, count: 5_000 },
    },
  });
  return queue;
}

export async function enqueueEmail(name: EmailJobName, data: EmailJobData): Promise<void> {
  await getQueue().add(name, data, { jobId: data.eventId });
}

export async function closeEmailQueue(): Promise<void> {
  await queue?.close();
  await connection?.quit();
  queue = undefined;
  connection = undefined;
}
