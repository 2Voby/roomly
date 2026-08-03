import { bookingsConflict, intervalsOverlap } from './booking-overlap.js';

function interval(startAt: string, endAt: string) {
  return { startAt: new Date(startAt), endAt: new Date(endAt) };
}

describe('intervalsOverlap', () => {
  it('detects a full match', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
      ),
    ).toBe(true);
  });

  it('detects a partial overlap from the left', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
        interval('2026-08-03T09:30:00Z', '2026-08-03T10:30:00Z'),
      ),
    ).toBe(true);
  });

  it('detects a partial overlap from the right', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
        interval('2026-08-03T10:30:00Z', '2026-08-03T11:30:00Z'),
      ),
    ).toBe(true);
  });

  it('detects a new interval inside an existing interval', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:00:00Z', '2026-08-03T12:00:00Z'),
        interval('2026-08-03T10:30:00Z', '2026-08-03T11:00:00Z'),
      ),
    ).toBe(true);
  });

  it('detects an existing interval inside a new interval', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:30:00Z', '2026-08-03T11:00:00Z'),
        interval('2026-08-03T10:00:00Z', '2026-08-03T12:00:00Z'),
      ),
    ).toBe(true);
  });

  it('allows touching intervals', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
        interval('2026-08-03T11:00:00Z', '2026-08-03T12:00:00Z'),
      ),
    ).toBe(false);
  });

  it('allows adjacent days', () => {
    expect(
      intervalsOverlap(
        interval('2026-08-03T23:00:00Z', '2026-08-04T00:00:00Z'),
        interval('2026-08-04T00:00:00Z', '2026-08-04T01:00:00Z'),
      ),
    ).toBe(false);
  });

  it('does not conflict when the rooms are different', () => {
    expect(
      bookingsConflict(
        'room-a',
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
        'room-b',
        interval('2026-08-03T10:00:00Z', '2026-08-03T11:00:00Z'),
      ),
    ).toBe(false);
  });
});
