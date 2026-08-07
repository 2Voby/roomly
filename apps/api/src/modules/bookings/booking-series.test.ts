import { describe, expect, it, vi } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';

import { BookingsService } from './bookings.service.js';
import type { BookingsRepository } from './bookings.repository.js';
import { generateWeeklyOccurrences } from './booking-series.js';
import type { RoomsRepository } from '../rooms/rooms.repository.js';
import type { UsersRepository } from '../users/users.repository.js';

describe('weekly booking series', () => {
  it('keeps the same local time across a daylight-saving transition', () => {
    const occurrences = generateWeeklyOccurrences(
      new Date('2026-10-20T07:00:00.000Z'),
      60,
      3,
      'Europe/Kyiv',
    );

    expect(
      occurrences.map(({ startAt }) =>
        formatInTimeZone(startAt, 'Europe/Kyiv', 'yyyy-MM-dd HH:mm'),
      ),
    ).toEqual(['2026-10-20 10:00', '2026-10-27 10:00', '2026-11-03 10:00']);
  });

  it('rejects a series when one occurrence conflicts before creating anything', async () => {
    const createWithAvailability = vi.fn();
    const service = new BookingsService(
      {
        findActiveOverlaps: vi.fn().mockResolvedValue([
          {
            startAt: new Date('2099-08-11T07:00:00.000Z'),
            endAt: new Date('2099-08-11T08:00:00.000Z'),
            title: 'Зайнято',
          },
        ]),
        createWithAvailability,
      } as unknown as BookingsRepository,
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
          emailVerifiedAt: new Date(),
        }),
        findByEmails: vi.fn().mockResolvedValue([]),
      } as unknown as UsersRepository,
    );

    await expect(
      service.create('user-id', {
        title: 'Планування',
        roomId: 'room-id',
        startAt: '2099-08-04T07:00:00.000Z',
        endAt: '2099-08-04T08:00:00.000Z',
        participantEmails: [],
        recurrence: { type: 'weekly', occurrences: 2 },
      }),
    ).rejects.toMatchObject({ code: 'BOOKING_SERIES_CONFLICT', statusCode: 409 });
    expect(createWithAvailability).not.toHaveBeenCalled();
  });
});
