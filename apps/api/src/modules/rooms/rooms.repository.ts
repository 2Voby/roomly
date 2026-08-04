import { prisma } from '../../database/prisma.js';

export class RoomsRepository {
  findAll() {
    return prisma.room.findMany({ orderBy: [{ floor: 'asc' }, { name: 'asc' }] });
  }

  findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  }

  findForAvailability(at: Date) {
    return prisma.room.findMany({
      orderBy: [{ floor: 'asc' }, { name: 'asc' }],
      include: {
        bookings: {
          where: { cancelledAt: null, endAt: { gt: at } },
          select: { startAt: true, endAt: true },
          orderBy: { startAt: 'asc' },
        },
      },
    });
  }
}
