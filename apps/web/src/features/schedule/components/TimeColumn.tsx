import {
  CALENDAR_END_MINUTES,
  CALENDAR_SLOT_MINUTES,
  CALENDAR_START_MINUTES,
} from '../../../lib/dates';

export function TimeColumn() {
  const labels = Array.from(
    { length: (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES + 1 },
    (_, index) => {
      const minutes = CALENDAR_START_MINUTES + index * CALENDAR_SLOT_MINUTES;
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    },
  );
  return (
    <div className="time-column">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}
