import { describe, expect, it, vi } from 'vitest';

import { NotificationsService } from './notifications.service.js';
import type { NotificationsRepository } from './notifications.repository.js';

function notification(readAt: Date | null = null) {
  return {
    id: 'notification-id',
    type: 'participant_added',
    title: 'Вас додали',
    message: 'Повідомлення',
    bookingId: 'booking-id',
    roomId: 'room-id',
    createdAt: new Date('2026-08-10T08:00:00.000Z'),
    readAt,
  };
}

describe('NotificationsService', () => {
  it('returns notification items and unread metadata', async () => {
    const repository = {
      listForUser: vi.fn().mockResolvedValue([notification()]),
      countForUser: vi.fn().mockResolvedValue(3),
      countUnreadForUser: vi.fn().mockResolvedValue(2),
    } as unknown as NotificationsRepository;
    const service = new NotificationsService(repository);

    await expect(service.list('user-id', 50)).resolves.toMatchObject({
      total: 3,
      unreadCount: 2,
      limit: 50,
      items: [{ id: 'notification-id', readAt: null }],
    });
  });

  it('marks only the requested user notifications as read', async () => {
    const markRead = vi.fn().mockResolvedValue({ count: 2 });
    const repository = { markRead } as unknown as NotificationsRepository;
    const service = new NotificationsService(repository);

    await expect(service.markRead('user-id', { ids: ['one', 'two'] })).resolves.toBe(2);
    expect(markRead).toHaveBeenCalledWith('user-id', ['one', 'two'], expect.any(Date));
  });
});
