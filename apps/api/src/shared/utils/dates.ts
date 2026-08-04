import { addDays, differenceInMinutes, isSameDay, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

export const WORKDAY_START_MINUTES = 9 * 60;
export const WORKDAY_END_MINUTES = 19 * 60;

export function getWeekRangeUtc(weekStart: string, timezone: string): { start: Date; end: Date } {
  const localStart = parseISO(`${weekStart}T00:00:00`);
  const start = fromZonedTime(localStart, timezone);
  const localEnd = addDays(localStart, 7);
  return { start, end: fromZonedTime(localEnd, timezone) };
}

export function isHalfHour(date: Date, timezone: string): boolean {
  const local = toZonedTime(date, timezone);
  return local.getSeconds() === 0 && local.getMilliseconds() === 0 && local.getMinutes() % 30 === 0;
}

export function isWithinWorkingHours(
  start: Date,
  end: Date,
  timezone: string,
  workStartMinutes = WORKDAY_START_MINUTES,
  workEndMinutes = WORKDAY_END_MINUTES,
): boolean {
  const localStart = toZonedTime(start, timezone);
  const localEnd = toZonedTime(end, timezone);
  const startMinutes = localStart.getHours() * 60 + localStart.getMinutes();
  const endMinutes = localEnd.getHours() * 60 + localEnd.getMinutes();

  return (
    isSameDay(localStart, localEnd) &&
    startMinutes >= workStartMinutes &&
    endMinutes <= workEndMinutes
  );
}

export function formatClockMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function minutesBetween(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

export function formatOfficeDate(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}
