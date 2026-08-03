import { Button } from '../../../components/ui/Button';
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
  return (
    <div className="booking-details">
      <p className="detail-title">{booking.title}</p>
      <p>
        {new Date(booking.startAt).toLocaleString('uk-UA', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}{' '}
        — {new Date(booking.endAt).toLocaleTimeString('uk-UA', { timeStyle: 'short' })}
      </p>
      <p>Забронював: {booking.userName}</p>
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
