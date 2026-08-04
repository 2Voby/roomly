import { Button } from '../../../components/ui/Button';
import {
  OFFICE_TIMEZONE,
  formatUserDate,
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
  const startAt = new Date(booking.startAt);
  const endAt = new Date(booking.endAt);
  const userTimezone = getUserTimezone();

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
      <div className="booking-schedule-summary">
        <p className="booking-date-time">
          <span>{formatUserDate(startAt)},</span>
          <strong>
            {formatUserTime(startAt)} — {formatUserTime(endAt)}
          </strong>
        </p>
        <div className="booking-schedule-meta">
          <strong className="booking-user-timezone">{userTimezone}</strong>
          <span className="booking-office-timezone">Офіс · {OFFICE_TIMEZONE}</span>
          <span className="booking-duration">Тривалість: {durationLabel}</span>
        </div>
      </div>
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
