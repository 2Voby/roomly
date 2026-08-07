import { CALENDAR_SLOT_MINUTES } from '../../../lib/dates';
import { officeDateTimeToUtc } from '../../../lib/dates';
import { getUserTimezone } from '../../../lib/timezone';
import { formatInTimeZone } from 'date-fns-tz';

export function TimeColumn({
  weekStart,
  workingStartMinutes,
  workingEndMinutes,
}: {
  weekStart: string;
  workingStartMinutes: number;
  workingEndMinutes: number;
}) {
  const slotCount = (workingEndMinutes - workingStartMinutes) / CALENDAR_SLOT_MINUTES;
  const labels = Array.from({ length: slotCount + 1 }, (_, index) => {
    const minutes = workingStartMinutes + index * CALENDAR_SLOT_MINUTES;
    return formatInTimeZone(officeDateTimeToUtc(weekStart, minutes), getUserTimezone(), 'HH:mm');
  });
  return (
    <div className="time-column">
      {labels.map((label, index) => (
        <span
          className={`${index === 0 ? 'time-label-start' : ''} ${index === labels.length - 1 ? 'time-label-end' : ''}`}
          key={label}
          style={{ top: `${(index / (labels.length - 1)) * 100}%` }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
