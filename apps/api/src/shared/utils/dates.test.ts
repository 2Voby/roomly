import { fromZonedTime } from 'date-fns-tz';
import { describe, expect, it } from 'vitest';

import { isWithinWorkingHours } from './dates.js';

const OFFICE_TIMEZONE = 'Europe/Kyiv';

function officeTime(value: string): Date {
  return fromZonedTime(`2026-08-04T${value}:00`, OFFICE_TIMEZONE);
}

describe('isWithinWorkingHours', () => {
  it('uses the room-specific working hours', () => {
    expect(
      isWithinWorkingHours(
        officeTime('08:00'),
        officeTime('17:00'),
        OFFICE_TIMEZONE,
        8 * 60,
        17 * 60,
      ),
    ).toBe(true);
  });

  it('rejects a booking before the room opens', () => {
    expect(
      isWithinWorkingHours(
        officeTime('07:30'),
        officeTime('08:30'),
        OFFICE_TIMEZONE,
        8 * 60,
        17 * 60,
      ),
    ).toBe(false);
  });

  it('rejects a booking after the room closes', () => {
    expect(
      isWithinWorkingHours(
        officeTime('16:30'),
        officeTime('17:30'),
        OFFICE_TIMEZONE,
        8 * 60,
        17 * 60,
      ),
    ).toBe(false);
  });
});
