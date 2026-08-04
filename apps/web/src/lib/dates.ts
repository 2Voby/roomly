import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';
import { fromZonedTime, formatInTimeZone, toZonedTime } from 'date-fns-tz';

import { OFFICE_TIMEZONE } from './timezone';

export const CALENDAR_START_MINUTES = 9 * 60;
export const CALENDAR_END_MINUTES = 19 * 60;
export const CALENDAR_SLOT_MINUTES = 30;
export const BOOKING_MIN_DURATION_MINUTES = 30;
export const BOOKING_MAX_DURATION_MINUTES = 4 * 60;

export function getBookingDurationOptions(
  startAt: Date,
  workingEndMinutes = CALENDAR_END_MINUTES,
): number[] {
  const local = toZonedTime(startAt, OFFICE_TIMEZONE);
  const startMinutes = local.getHours() * 60 + local.getMinutes();
  const maxDuration = Math.min(BOOKING_MAX_DURATION_MINUTES, workingEndMinutes - startMinutes);

  if (maxDuration < CALENDAR_SLOT_MINUTES) return [];

  return Array.from(
    { length: Math.floor(maxDuration / CALENDAR_SLOT_MINUTES) },
    (_, index) => (index + 1) * CALENDAR_SLOT_MINUTES,
  );
}

export function getWeekStartKey(date = new Date()): string {
  const local = toZonedTime(date, OFFICE_TIMEZONE);
  return format(startOfWeek(local, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function shiftWeek(weekStart: string, amount: number): string {
  return format(addDays(parseISO(weekStart), amount * 7), 'yyyy-MM-dd');
}

export function officeDateTimeToUtc(dayKey: string, minutes: number): Date {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return fromZonedTime(
    `${dayKey}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`,
    OFFICE_TIMEZONE,
  );
}

export function formatWeekLabel(weekStart: string): string {
  const utc = fromZonedTime(`${weekStart}T00:00:00`, OFFICE_TIMEZONE);
  const end = addDays(utc, 6);
  return `${formatInTimeZone(utc, OFFICE_TIMEZONE, 'd MMMM', { locale: uk })} — ${formatInTimeZone(end, OFFICE_TIMEZONE, 'd MMMM yyyy', { locale: uk })}`;
}

export function formatDayLabel(dayKey: string): string {
  const date = parseISO(dayKey);
  return format(date, 'EEE, d MMMM', { locale: uk });
}

export function getWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(parseISO(weekStart), index), 'yyyy-MM-dd'),
  );
}

export function minutesFromOfficeStart(
  date: Date,
  workingStartMinutes = CALENDAR_START_MINUTES,
): number {
  const local = toZonedTime(date, OFFICE_TIMEZONE);
  return local.getHours() * 60 + local.getMinutes() - workingStartMinutes;
}

export function formatClockMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function isToday(dayKey: string): boolean {
  return formatInTimeZone(new Date(), OFFICE_TIMEZONE, 'yyyy-MM-dd') === dayKey;
}
