import { formatInTimeZone } from 'date-fns-tz';

import { officeDateTimeToUtc } from '../../../lib/dates';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';

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
