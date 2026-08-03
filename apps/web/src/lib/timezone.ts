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
