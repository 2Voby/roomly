import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectDatabase } from './database/prisma.js';
import { closeEmailQueue } from './modules/notifications/email-queue.js';
import { startEndReminderWorker } from './modules/notifications/end-reminder.worker.js';

const server = app.listen(env.PORT, () => {
  process.stdout.write(`Roomly API listening on port ${env.PORT}\n`);
});
const endReminderWorker = startEndReminderWorker();

async function shutdown(signal: string): Promise<void> {
  process.stdout.write(`Received ${signal}, shutting down gracefully\n`);
  endReminderWorker.stop();
  server.close(async (error) => {
    if (error) {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    }
    await closeEmailQueue();
    await disconnectDatabase();
  });
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
