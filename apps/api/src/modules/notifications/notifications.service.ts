import type { NotificationDto } from '@roomly/shared';

import { NotificationsRepository } from './notifications.repository.js';
import type { MarkNotificationsReadRequest } from './notifications.schemas.js';

function toNotificationView(notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  seriesId: string | null;
  roomId: string | null;
  createdAt: Date;
  readAt: Date | null;
}): NotificationDto {
  return {
    id: notification.id,
    type: notification.type as NotificationDto['type'],
    title: notification.title,
    message: notification.message,
    bookingId: notification.bookingId,
    seriesId: notification.seriesId,
    roomId: notification.roomId,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

export class NotificationsService {
  constructor(private readonly repository = new NotificationsRepository()) {}

  async list(userId: string, limit: number) {
    const [items, total, unreadCount] = await Promise.all([
      this.repository.listForUser(userId, limit),
      this.repository.countForUser(userId),
      this.repository.countUnreadForUser(userId),
    ]);
    return {
      items: items.map(toNotificationView),
      total,
      unreadCount,
      limit,
    };
  }

  async markRead(userId: string, input: MarkNotificationsReadRequest): Promise<number> {
    const result = await this.repository.markRead(userId, input.ids, new Date());
    return result.count;
  }
}
