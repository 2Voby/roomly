import { CALENDAR_SLOT_MINUTES } from '../../../lib/dates';

export function TimeColumn({
  workingStartMinutes,
  workingEndMinutes,
}: {
  workingStartMinutes: number;
  workingEndMinutes: number;
}) {
  const slotCount = (workingEndMinutes - workingStartMinutes) / CALENDAR_SLOT_MINUTES;
  const labels = Array.from({ length: slotCount + 1 }, (_, index) => {
    const minutes = workingStartMinutes + index * CALENDAR_SLOT_MINUTES;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
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
