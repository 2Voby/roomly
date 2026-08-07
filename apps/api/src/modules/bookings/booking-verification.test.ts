import { describe, expect, it, vi } from 'vitest';

import { BookingsService } from './bookings.service.js';
import type { BookingsRepository } from './bookings.repository.js';
import type { RoomsRepository } from '../rooms/rooms.repository.js';
import type { UsersRepository } from '../users/users.repository.js';

describe('BookingsService email verification gate', () => {
  it('blocks an unverified organizer before creating a booking', async () => {
    const service = new BookingsService(
      {} as BookingsRepository,
      {
        findById: vi.fn().mockResolvedValue({
          id: 'room-id',
          name: 'Акваріум',
          floor: 1,
          capacity: 8,
          workStartMinutes: 540,
          workEndMinutes: 1140,
        }),
      } as unknown as RoomsRepository,
      {
        findById: vi.fn().mockResolvedValue({
          id: 'user-id',
          name: 'Олена',
          email: 'olena@example.com',
          emailVerifiedAt: null,
        }),
      } as unknown as UsersRepository,
    );

    await expect(
      service.create('user-id', {
        title: 'Планування',
        roomId: 'room-id',
        startAt: '2099-08-04T10:00:00.000Z',
        endAt: '2099-08-04T11:00:00.000Z',
        participantEmails: [],
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 });
  });
});
