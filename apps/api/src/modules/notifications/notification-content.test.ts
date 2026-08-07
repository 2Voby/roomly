import { describe, expect, it } from 'vitest';

import { createNotificationDraft } from './notification-content.js';

const context = {
  roomId: 'room-id',
  roomName: 'Акваріум',
  title: 'Планування кварталу',
  organizerName: 'Олена Коваль',
  startAt: new Date('2026-08-10T08:00:00.000Z'),
  endAt: new Date('2026-08-10T09:00:00.000Z'),
};

describe('createNotificationDraft', () => {
  it('creates an added-participant notification with room and time details', () => {
    expect(createNotificationDraft('user-id', 'participant_added', context)).toMatchObject({
      userId: 'user-id',
      type: 'participant_added',
      title: 'Вас додали до зустрічі',
    });
    expect(createNotificationDraft('user-id', 'participant_added', context).message).toContain(
      'Акваріум',
    );
  });

  it('creates distinct removal and cancellation messages', () => {
    const removed = createNotificationDraft('user-id', 'participant_removed', context);
    const cancelled = createNotificationDraft('user-id', 'booking_cancelled', context);

    expect(removed.title).toBe('Вас видалили із зустрічі');
    expect(cancelled.title).toBe('Зустріч скасовано');
    expect(removed.message).not.toBe(cancelled.message);
  });
});
