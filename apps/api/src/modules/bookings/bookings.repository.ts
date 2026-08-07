import type { BookingSeries, Notification, Prisma } from '@prisma/client';

import { prisma } from '../../database/prisma.js';
import type { NotificationDraft } from '../notifications/notifications.types.js';
import type { BookingOccurrence } from './booking-series.js';

const bookingInclude = {
  user: true,
  room: true,
  participants: { include: { user: true } },
  series: true,
} satisfies Prisma.BookingInclude;

export type BookingRecord = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export class BookingsRepository {
  async findActiveOverlap(
    roomId: string,
    startAt: Date,
    endAt: Date,
  ): Promise<BookingRecord | null> {
    return prisma.booking.findFirst({
      where: {
        roomId,
        cancelledAt: null,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      include: bookingInclude,
    });
  }

  async findActiveOverlaps(roomId: string, startAt: Date, endAt: Date): Promise<BookingRecord[]> {
    return prisma.booking.findMany({
      where: {
        roomId,
        cancelledAt: null,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  async createWithAvailability(data: {
    title: string;
    roomId: string;
    userId: string;
    occurrences: BookingOccurrence[];
    participantUserIds: string[];
    participantNotifications: NotificationDraft[];
    seriesNotifications: NotificationDraft[];
    series?: {
      frequency: string;
      occurrenceCount: number;
      firstStartAt: Date;
      durationMinutes: number;
      timezone: string;
    };
  }): Promise<{
    bookings: BookingRecord[];
    series: BookingSeries | null;
    conflict: boolean;
    notifications: Notification[];
  }> {
    return prisma.$transaction(async (tx) => {
      for (const occurrence of data.occurrences) {
        const overlap = await tx.booking.findFirst({
          where: {
            roomId: data.roomId,
            cancelledAt: null,
            startAt: { lt: occurrence.endAt },
            endAt: { gt: occurrence.startAt },
          },
          include: bookingInclude,
        });
        if (overlap) return { bookings: [], series: null, conflict: true, notifications: [] };
      }

      const series = data.series
        ? await tx.bookingSeries.create({
            data: {
              userId: data.userId,
              roomId: data.roomId,
              frequency: data.series.frequency,
              occurrenceCount: data.series.occurrenceCount,
              firstStartAt: data.series.firstStartAt,
              durationMinutes: data.series.durationMinutes,
              timezone: data.series.timezone,
            },
          })
        : null;
      const bookings: BookingRecord[] = [];
      for (const occurrence of data.occurrences) {
        bookings.push(
          await tx.booking.create({
            data: {
              title: data.title,
              startAt: occurrence.startAt,
              endAt: occurrence.endAt,
              roomId: data.roomId,
              userId: data.userId,
              seriesId: series?.id,
              seriesIndex: series ? occurrence.index : null,
              participants: {
                create: data.participantUserIds.map((userId) => ({ userId })),
              },
            },
            include: bookingInclude,
          }),
        );
      }
      const notifications: Notification[] = [];
      if (series) {
        for (const notification of data.seriesNotifications) {
          notifications.push(
            await tx.notification.create({
              data: {
                ...notification,
                bookingId: null,
                seriesId: series.id,
                roomId: data.roomId,
                dedupeKey: `series:${series.id}:${notification.userId}:${notification.type}`,
              },
            }),
          );
        }
      } else {
        for (const notification of data.participantNotifications) {
          notifications.push(
            await tx.notification.create({
              data: {
                ...notification,
                bookingId: bookings[0]?.id,
                roomId: data.roomId,
              },
            }),
          );
        }
      }
      return { bookings, series, conflict: false, notifications };
    });
  }

  async updateParticipants(data: {
    bookingId: string;
    participantUserIds: string[];
    addedNotifications: NotificationDraft[];
    removedNotifications: NotificationDraft[];
    title?: string;
    startAt?: Date;
    endAt?: Date;
  }): Promise<{ booking: BookingRecord; notifications: Notification[] } | null> {
    return prisma.$transaction(async (tx) => {
      const existingBooking = await tx.booking.findUnique({
        where: { id: data.bookingId },
        include: bookingInclude,
      });
      if (!existingBooking) return null;

      const existingParticipantIds = existingBooking.participants.map(({ userId }) => userId);
      const nextParticipantIds = new Set(data.participantUserIds);
      const removedIds = existingParticipantIds.filter((id) => !nextParticipantIds.has(id));
      const addedIds = data.participantUserIds.filter((id) => !existingParticipantIds.includes(id));

      if (removedIds.length > 0) {
        await tx.bookingParticipant.deleteMany({
          where: { bookingId: data.bookingId, userId: { in: removedIds } },
        });
      }
      if (addedIds.length > 0) {
        await tx.bookingParticipant.createMany({
          data: addedIds.map((userId) => ({ bookingId: data.bookingId, userId })),
        });
      }

      if (data.title !== undefined || data.startAt !== undefined || data.endAt !== undefined) {
        await tx.booking.update({
          where: { id: data.bookingId },
          data: {
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.startAt !== undefined ? { startAt: data.startAt } : {}),
            ...(data.endAt !== undefined ? { endAt: data.endAt } : {}),
            isException:
              data.title !== undefined ||
              data.startAt !== undefined ||
              data.endAt !== undefined ||
              addedIds.length > 0 ||
              removedIds.length > 0,
          },
        });
      }

      const notifications: Notification[] = [];
      for (const notification of [...data.addedNotifications, ...data.removedNotifications]) {
        notifications.push(
          await tx.notification.create({
            data: {
              ...notification,
              bookingId: data.bookingId,
              roomId: existingBooking.roomId,
            },
          }),
        );
      }

      const booking = await tx.booking.findUnique({
        where: { id: data.bookingId },
        include: bookingInclude,
      });
      if (!booking) return null;
      return { booking, notifications };
    });
  }

  findById(id: string): Promise<BookingRecord | null> {
    return prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  }

  findSeriesById(id: string) {
    return prisma.bookingSeries.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            user: true,
            room: true,
            participants: { include: { user: true } },
            series: true,
          },
          orderBy: { startAt: 'asc' },
        },
      },
    });
  }

  async listForRoom(roomId: string, startAt: Date, endAt: Date): Promise<BookingRecord[]> {
    return prisma.booking.findMany({
      where: {
        roomId,
        cancelledAt: null,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      include: bookingInclude,
      orderBy: { startAt: 'asc' },
    });
  }

  async countMine(userId: string, type: 'upcoming' | 'past', now: Date): Promise<number> {
    return prisma.booking.count({ where: this.mineWhere(userId, type, now) });
  }

  async listMine(
    userId: string,
    type: 'upcoming' | 'past',
    now: Date,
    skip: number,
    take: number,
  ): Promise<BookingRecord[]> {
    return prisma.booking.findMany({
      where: this.mineWhere(userId, type, now),
      include: bookingInclude,
      orderBy: { startAt: type === 'upcoming' ? 'asc' : 'desc' },
      skip,
      take,
    });
  }

  listUpcomingForPeriod(userId: string, startAt: Date, endAt: Date, now: Date) {
    return prisma.booking.findMany({
      where: {
        userId,
        cancelledAt: null,
        startAt: { gte: startAt, lt: endAt, gt: now },
      },
      select: { startAt: true, endAt: true },
    });
  }

  async cancelWithNotifications(
    id: string,
    cancelledAt: Date,
    notificationDrafts: NotificationDraft[],
  ): Promise<{ booking: BookingRecord; notifications: Notification[] } | null> {
    return prisma.$transaction(async (tx) => {
      const update = await tx.booking.updateMany({
        where: { id, cancelledAt: null },
        data: { cancelledAt },
      });
      const booking = await tx.booking.findUnique({ where: { id }, include: bookingInclude });
      if (!booking) return null;
      if (update.count === 0) return { booking, notifications: [] };

      const notifications: Notification[] = [];
      for (const notification of notificationDrafts) {
        notifications.push(
          await tx.notification.create({
            data: {
              ...notification,
              bookingId: id,
              roomId: booking.roomId,
            },
          }),
        );
      }
      return { booking, notifications };
    });
  }

  async cancelSeriesWithNotifications(
    seriesId: string,
    cancelledAt: Date,
    now: Date,
    notificationDrafts: NotificationDraft[],
  ): Promise<{ cancelledCount: number; notifications: Notification[] } | null> {
    return prisma.$transaction(async (tx) => {
      const series = await tx.bookingSeries.findUnique({ where: { id: seriesId } });
      if (!series) return null;

      const activeFuture = await tx.booking.findMany({
        where: { seriesId, cancelledAt: null, startAt: { gt: now } },
        select: { id: true },
      });
      const update = await tx.booking.updateMany({
        where: { id: { in: activeFuture.map(({ id }) => id) }, cancelledAt: null },
        data: { cancelledAt },
      });
      const notifications: Notification[] = [];
      if (update.count > 0) {
        for (const notification of notificationDrafts) {
          notifications.push(
            await tx.notification.create({
              data: {
                ...notification,
                bookingId: null,
                seriesId,
                roomId: series.roomId,
                dedupeKey: `series-cancelled:${seriesId}:${notification.userId}`,
              },
            }),
          );
        }
      }
      await tx.bookingSeries.update({ where: { id: seriesId }, data: { cancelledAt } });
      return { cancelledCount: update.count, notifications };
    });
  }

  private mineWhere(
    userId: string,
    type: 'upcoming' | 'past',
    now: Date,
  ): Prisma.BookingWhereInput {
    return type === 'upcoming'
      ? { userId, cancelledAt: null, endAt: { gt: now } }
      : { userId, OR: [{ endAt: { lte: now } }, { cancelledAt: { not: null } }] };
  }
}
