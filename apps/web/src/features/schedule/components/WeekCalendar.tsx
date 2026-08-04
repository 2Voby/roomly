import { formatInTimeZone } from 'date-fns-tz';

import type { Booking } from '../../bookings/types';
import { formatDayLabel, getWeekDays, isToday } from '../../../lib/dates';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';
import { DayColumn } from './DayColumn';
import { TimeColumn } from './TimeColumn';

export function WeekCalendar({
  weekStart,
  bookings,
  currentUserId,
  workingStartMinutes,
  workingEndMinutes,
  onSlotSelect,
  onBookingClick,
}: {
  weekStart: string;
  bookings: Booking[];
  currentUserId: string;
  workingStartMinutes: number;
  workingEndMinutes: number;
  onSlotSelect: (startAt: Date, endAt: Date) => void;
  onBookingClick: (booking: Booking) => void;
}) {
  const days = getWeekDays(weekStart);
  return (
    <section className="calendar-card" aria-label="Тижневий розклад">
      <div className="calendar-scroll">
        <div className="calendar-header-row">
          <div className="calendar-corner" />
          {days.map((day) => (
            <div className={`day-header ${isToday(day) ? 'day-header-today' : ''}`} key={day}>
              {formatDayLabel(day)}
            </div>
          ))}
        </div>
        <div className="calendar-board">
          <TimeColumn
            workingStartMinutes={workingStartMinutes}
            workingEndMinutes={workingEndMinutes}
          />
          <div className="calendar-days">
            {days.map((day) => (
              <DayColumn
                key={day}
                dayKey={day}
                bookings={bookings.filter(
                  (booking) =>
                    formatInTimeZone(new Date(booking.startAt), OFFICE_TIMEZONE, 'yyyy-MM-dd') ===
                    day,
                )}
                currentUserId={currentUserId}
                workingStartMinutes={workingStartMinutes}
                workingEndMinutes={workingEndMinutes}
                onSlotSelect={onSlotSelect}
                onBookingClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
