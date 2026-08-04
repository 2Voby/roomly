import { Button } from '../../../components/ui/Button';
import {
  OFFICE_TIMEZONE,
  formatUserDateTime,
  formatUserTime,
  getUserTimezone,
} from '../../../lib/timezone';
import type { Booking } from '../types';

export function BookingDetails({
  booking,
  isOwner,
  isPending,
  onCancel,
  onClose,
}: {
  booking: Booking;
  isOwner: boolean;
  isPending: boolean;
  onCancel: () => void;
  onClose: () => void;
}) {
  const ownBooking = isOwner;
  const duration = Math.round(
    (new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60000,
  );
  const durationLabel =
    duration >= 60
      ? `${Math.floor(duration / 60)} год${duration % 60 ? ` ${duration % 60} хв` : ''}`
      : `${duration} хв`;
  return (
    <div className="booking-details">
      <p className="detail-title">{booking.title}</p>
      <div className="booking-detail-room">
        <span className="room-detail-icon">⌂</span>
        <span>
          <strong>{booking.roomName}</strong>
          <small>
            Поверх {booking.roomFloor} · до {booking.roomCapacity} людей
          </small>
        </span>
      </div>
      <p>
        {formatUserDateTime(new Date(booking.startAt))} — {formatUserTime(new Date(booking.endAt))}
      </p>
      <p>
        Тривалість: {durationLabel} · часова зона {getUserTimezone()}
        {getUserTimezone() !== OFFICE_TIMEZONE ? ` · офісний час ${OFFICE_TIMEZONE}` : ''}
      </p>
      <div className="booking-people-list">
        <div className="booking-person booking-person-organizer">
          <span className="booking-person-avatar">
            {booking.userName.trim().charAt(0).toUpperCase()}
          </span>
          <span className="booking-person-copy">
            <strong>{booking.userName}</strong>
            <small>Організатор</small>
          </span>
          <span className="booking-person-crown" aria-label="Організатор" title="Організатор">
            👑
          </span>
        </div>
        {booking.participants.map((participant) => (
          <div className="booking-person" key={participant.id}>
            <span className="booking-person-avatar">
              {participant.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="booking-person-copy">
              <strong>{participant.name}</strong>
              <small>{participant.email}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          Закрити
        </Button>
        {ownBooking ? (
          <Button type="button" variant="danger" disabled={isPending} onClick={onCancel}>
            {isPending ? 'Скасовуємо…' : 'Скасувати бронювання'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
