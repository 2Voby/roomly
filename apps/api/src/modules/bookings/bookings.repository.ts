import type { Prisma } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

const bookingInclude = {
  user: true,
  room: true,
  participants: { include: { user: true } },
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

  async createWithAvailability(data: {
    title: string;
    startAt: Date;
    endAt: Date;
    roomId: string;
    userId: string;
    participantUserIds: string[];
  }): Promise<{ booking: BookingRecord | null; conflict: boolean }> {
    return prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          roomId: data.roomId,
          cancelledAt: null,
          startAt: { lt: data.endAt },
          endAt: { gt: data.startAt },
        },
        include: bookingInclude,
      });
      if (overlap) return { booking: null, conflict: true };

      const booking = await tx.booking.create({
        data: {
          title: data.title,
          startAt: data.startAt,
          endAt: data.endAt,
          roomId: data.roomId,
          userId: data.userId,
          participants: {
            create: data.participantUserIds.map((userId) => ({ userId })),
          },
        },
        include: bookingInclude,
      });
      return { booking, conflict: false };
    });
  }

  findById(id: string): Promise<BookingRecord | null> {
    return prisma.booking.findUnique({ where: { id }, include: bookingInclude });
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

  cancel(id: string, cancelledAt: Date): Promise<BookingRecord> {
    return prisma.booking.update({
      where: { id },
      data: { cancelledAt },
      include: bookingInclude,
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
