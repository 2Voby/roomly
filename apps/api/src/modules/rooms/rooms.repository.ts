import { prisma } from '../../database/prisma.js';

export class RoomsRepository {
  findAll() {
    return prisma.room.findMany({ orderBy: [{ floor: 'asc' }, { name: 'asc' }] });
  }

  findById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  }
}
