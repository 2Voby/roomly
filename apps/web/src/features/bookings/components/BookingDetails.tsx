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
      <p>Забронював: {booking.userName}</p>
      {booking.participants.length > 0 ? (
        <div className="booking-participants-details">
          <span>Учасники</span>
          <div>
            {booking.participants.map((participant) => (
              <span key={participant.id}>
                {participant.name} · {participant.email}
              </span>
            ))}
          </div>
        </div>
      ) : null}
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
