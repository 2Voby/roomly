import { Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../database/prisma.js';
import { createNotificationDraft } from './notification-content.js';

const POLL_INTERVAL_MS = 30_000;

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function processDueReminders(now: Date): Promise<void> {
  const target = new Date(now.getTime() + env.NOTIFY_BEFORE_MINUTES * 60_000);
  const bookings = await prisma.booking.findMany({
    where: {
      cancelledAt: null,
      endAt: {
        gt: now,
        gte: new Date(target.getTime() - POLL_INTERVAL_MS),
        lte: new Date(target.getTime() + POLL_INTERVAL_MS),
      },
    },
    include: {
      room: true,
      user: true,
    },
  });

  for (const booking of bookings) {
    const nextBooking = await prisma.booking.findFirst({
      where: {
        roomId: booking.roomId,
        startAt: booking.endAt,
        cancelledAt: null,
      },
      select: { id: true },
    });
    if (!nextBooking) continue;

    const draft = createNotificationDraft(booking.userId, 'booking_ending', {
      roomId: booking.roomId,
      roomName: booking.room.name,
      title: booking.title,
      organizerName: booking.user.name,
      startAt: booking.startAt,
      endAt: booking.endAt,
    });
    try {
      await prisma.notification.create({
        data: {
          ...draft,
          bookingId: booking.id,
          roomId: booking.roomId,
          dedupeKey: `booking-ending:${booking.id}`,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
}

export function startEndReminderWorker(): { stop: () => void } {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await processDueReminders(new Date());
    } catch (error) {
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      process.stderr.write(`End reminder worker failed: ${message}\n`);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), POLL_INTERVAL_MS);
  timer.unref();

  return {
    stop: () => clearInterval(timer),
  };
}
