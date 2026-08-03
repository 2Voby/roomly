import { formatInTimeZone } from 'date-fns-tz';

import type { Booking } from '../../bookings/types';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';
import { bookingStyle } from '../utils/calendar';

export function BookingCard({
  booking,
  isMine,
  onClick,
}: {
  booking: Booking;
  isMine: boolean;
  onClick: () => void;
}) {
  const style = bookingStyle(booking);
  return (
    <button
      className={`booking-card ${isMine ? 'booking-card-own' : 'booking-card-other'}`}
      style={{ top: `${style.top * 5}%`, height: `calc(${style.height * 5}% - 4px)` }}
      type="button"
      onClick={onClick}
    >
      <strong>{booking.title}</strong>
      <span>
        {formatInTimeZone(new Date(booking.startAt), OFFICE_TIMEZONE, 'HH:mm')} —{' '}
        {formatInTimeZone(new Date(booking.endAt), OFFICE_TIMEZONE, 'HH:mm')}
      </span>
      <small>{isMine ? 'Ваше бронювання' : booking.userName}</small>
    </button>
  );
}
