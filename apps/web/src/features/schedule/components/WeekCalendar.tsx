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
  onSlotClick,
  onBookingClick,
}: {
  weekStart: string;
  bookings: Booking[];
  currentUserId: string;
  onSlotClick: (startAt: Date, endAt: Date) => void;
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
          <TimeColumn />
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
                onSlotClick={onSlotClick}
                onBookingClick={onBookingClick}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="legend-dot legend-own" />
          Ваше бронювання
        </span>
        <span>
          <i className="legend-dot legend-other" />
          Інші бронювання
        </span>
        <span>
          <i className="legend-dot legend-free" />
          Доступно для бронювання
        </span>
        <span className="legend-hint">Натисніть на слот, щоб забронювати</span>
      </div>
    </section>
  );
}
