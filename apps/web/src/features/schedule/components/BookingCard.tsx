import { formatInTimeZone } from 'date-fns-tz';
import type { CSSProperties } from 'react';

import type { Booking } from '../../bookings/types';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';
import { bookingColorForUser, bookingStyle } from '../utils/calendar';

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
  const color = bookingColorForUser(booking.userId);
  const isCompact = style.height < 2;
  const cardStyle = {
    top: `${style.top * 5}%`,
    height: `calc(${style.height * 5}% - 2px)`,
    '--booking-background': color.background,
    '--booking-border': color.border,
    '--booking-accent': color.accent,
    '--booking-text': color.text,
  } as CSSProperties;

  return (
    <button
      className={`booking-card ${isMine ? 'booking-card-own' : 'booking-card-other'} ${isCompact ? 'booking-card-compact' : ''}`}
      style={cardStyle}
      type="button"
      onClick={onClick}
    >
      <strong>{booking.title}</strong>
      {!isCompact ? (
        <span>
          {formatInTimeZone(new Date(booking.startAt), OFFICE_TIMEZONE, 'HH:mm')} —{' '}
          {formatInTimeZone(new Date(booking.endAt), OFFICE_TIMEZONE, 'HH:mm')}
        </span>
      ) : null}
      {style.height >= 3 ? <small>{isMine ? 'Ваше бронювання' : booking.userName}</small> : null}
    </button>
  );
}
