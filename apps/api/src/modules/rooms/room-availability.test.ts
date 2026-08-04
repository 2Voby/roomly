import { getRoomAvailability } from './room-availability.js';

const room = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Акваріум',
  floor: 1,
  capacity: 8,
  workStartMinutes: 540,
  workEndMinutes: 1140,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
};

describe('getRoomAvailability', () => {
  it('reports a room as available during working hours without an active booking', () => {
    const result = getRoomAvailability(
      room,
      [],
      new Date('2026-08-04T11:00:00+03:00'),
      'Europe/Kyiv',
    );

    expect(result.status).toBe('available');
    expect(result.occupiedUntil).toBeNull();
    expect(result.nextAvailableAt).toBeNull();
  });

  it('reports the active booking end as the next available time', () => {
    const result = getRoomAvailability(
      room,
      [
        {
          startAt: new Date('2026-08-04T10:30:00+03:00'),
          endAt: new Date('2026-08-04T12:00:00+03:00'),
        },
      ],
      new Date('2026-08-04T11:00:00+03:00'),
      'Europe/Kyiv',
    );

    expect(result.status).toBe('occupied');
    expect(result.nextAvailableAt).toBe('2026-08-04T09:00:00.000Z');
  });

  it('reports the next opening outside working hours', () => {
    const result = getRoomAvailability(
      room,
      [],
      new Date('2026-08-04T20:00:00+03:00'),
      'Europe/Kyiv',
    );

    expect(result.status).toBe('closed');
    expect(result.nextAvailableAt).toBe('2026-08-05T06:00:00.000Z');
  });
});
