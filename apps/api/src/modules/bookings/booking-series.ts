import { addMinutes, addWeeks } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const MAX_SERIES_OCCURRENCES = 52;
export const WEEKLY_FREQUENCY = 'weekly' as const;

export interface BookingOccurrence {
  index: number;
  startAt: Date;
  endAt: Date;
}

export function generateWeeklyOccurrences(
  firstStartAt: Date,
  durationMinutes: number,
  occurrenceCount: number,
  timezone: string,
): BookingOccurrence[] {
  const firstLocalStart = toZonedTime(firstStartAt, timezone);

  return Array.from({ length: occurrenceCount }, (_, index) => {
    const localStart = addWeeks(firstLocalStart, index);
    const localEnd = addMinutes(localStart, durationMinutes);

    return {
      index,
      startAt: fromZonedTime(localStart, timezone),
      endAt: fromZonedTime(localEnd, timezone),
    };
  });
}
