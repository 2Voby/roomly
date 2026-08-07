import { addDays, format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { officeDateTimeToUtc } from '../../../lib/dates';
import { getUserTimezone, OFFICE_TIMEZONE } from '../../../lib/timezone';

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function officeDateTimeForTime(dayKey: string, value: string): Date | null {
  const minutes = timeToMinutes(value);
  return minutes === null ? null : officeDateTimeToUtc(dayKey, minutes);
}

export function formatOfficeTime(date: Date): string {
  return formatInTimeZone(date, OFFICE_TIMEZONE, 'HH:mm');
}

export function userDateTimeForTime(
  referenceAt: Date,
  value: string,
  nextDayWhenNeeded = false,
  startValue?: string,
): Date | null {
  const minutes = timeToMinutes(value);
  if (minutes === null) return null;

  const timezone = getUserTimezone();
  let dayKey = formatInTimeZone(referenceAt, timezone, 'yyyy-MM-dd');
  const startMinutes = startValue ? timeToMinutes(startValue) : null;
  if (nextDayWhenNeeded && startMinutes !== null && minutes <= startMinutes) {
    dayKey = format(addDays(parseISO(dayKey), 1), 'yyyy-MM-dd');
  }

  return fromZonedTime(`${dayKey}T${value}:00`, timezone);
}
