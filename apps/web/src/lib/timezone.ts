import { formatInTimeZone } from 'date-fns-tz';
import { uk } from 'date-fns/locale';

export const OFFICE_TIMEZONE = import.meta.env.VITE_OFFICE_TIMEZONE || 'Europe/Kyiv';

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function timezoneNote(): string {
  const userTimezone = getUserTimezone();
  return userTimezone === OFFICE_TIMEZONE
    ? OFFICE_TIMEZONE
    : `Ваш час: ${userTimezone} · розклад у ${OFFICE_TIMEZONE}`;
}

export function formatUserTime(date: Date): string {
  return formatInTimeZone(date, getUserTimezone(), 'HH:mm');
}

export function formatUserDate(date: Date): string {
  return formatInTimeZone(date, getUserTimezone(), 'dd MMM', { locale: uk });
}

export function formatUserDateTime(date: Date): string {
  return formatInTimeZone(date, getUserTimezone(), 'd MMMM, HH:mm', { locale: uk });
}
