import type { Notification, Prisma } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export class NotificationsRepository {
  async listForUser(userId: string, limit: number): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  countForUser(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId } });
  }

  countUnreadForUser(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  markRead(userId: string, ids: string[], readAt: Date): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: { userId, id: { in: ids }, readAt: null },
      data: { readAt },
    });
  }
}
