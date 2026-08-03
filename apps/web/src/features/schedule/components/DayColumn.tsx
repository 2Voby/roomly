import { toZonedTime } from 'date-fns-tz';

import type { Booking } from '../../bookings/types';
import { CALENDAR_END_MINUTES, CALENDAR_START_MINUTES } from '../../../lib/dates';
import { isToday } from '../../../lib/dates';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';
import { BookingCard } from './BookingCard';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { slotRange, SLOT_COUNT } from '../utils/calendar';

export function DayColumn({
  dayKey,
  bookings,
  currentUserId,
  onSlotClick,
  onBookingClick,
}: {
  dayKey: string;
  bookings: Booking[];
  currentUserId: string;
  onSlotClick: (startAt: Date, endAt: Date) => void;
  onBookingClick: (booking: Booking) => void;
}) {
  const current = toZonedTime(new Date(), OFFICE_TIMEZONE);
  const localMinutes = current.getHours() * 60 + current.getMinutes();
  const currentTop =
    ((localMinutes - CALENDAR_START_MINUTES) / (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES)) *
    100;
  return (
    <div className={`day-column ${isToday(dayKey) ? 'day-column-today' : ''}`}>
      {Array.from({ length: SLOT_COUNT }, (_, index) => {
        const range = slotRange(dayKey, index);
        return (
          <button
            className="slot-button"
            style={{ top: `${(index / SLOT_COUNT) * 100}%` }}
            type="button"
            key={range.startAt.toISOString()}
            onClick={() => onSlotClick(range.startAt, range.endAt)}
            aria-label={`Вільний слот ${range.startAt.toLocaleString('uk-UA')}`}
          />
        );
      })}
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          isMine={booking.userId === currentUserId}
          onClick={() => onBookingClick(booking)}
        />
      ))}
      {isToday(dayKey) && currentTop >= 0 && currentTop <= 100 ? (
        <CurrentTimeIndicator top={currentTop} />
      ) : null}
    </div>
  );
}
