import { useState } from 'react';

import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Spinner } from '../../components/ui/Spinner';
import { useMyBookings } from '../../features/bookings/hooks/use-bookings';
import type { Booking } from '../../features/bookings/types';

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <article className={`booking-row ${booking.cancelledAt ? 'booking-row-cancelled' : ''}`}>
      <div>
        <strong>{booking.title}</strong>
        <span>
          {new Date(booking.startAt).toLocaleString('uk-UA', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}{' '}
          — {new Date(booking.endAt).toLocaleTimeString('uk-UA', { timeStyle: 'short' })}
        </span>
      </div>
      <div>
        <span>{booking.cancelledAt ? 'Скасовано' : booking.userName}</span>
      </div>
    </article>
  );
}

export function MyBookingsPage() {
  const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
  const bookings = useMyBookings(type);
  return (
    <div className="content-wrap narrow-page">
      <div className="page-heading">
        <div>
          <h1>Мої бронювання</h1>
          <p>Керуйте запланованими зустрічами та переглядайте історію.</p>
        </div>
      </div>
      <div className="segmented-control">
        <Button
          variant={type === 'upcoming' ? 'primary' : 'ghost'}
          onClick={() => setType('upcoming')}
        >
          Майбутні
        </Button>
        <Button variant={type === 'past' ? 'primary' : 'ghost'} onClick={() => setType('past')}>
          Минулі
        </Button>
      </div>
      {bookings.isPending ? (
        <div className="page-center-inline">
          <Spinner label="Завантажуємо бронювання…" />
        </div>
      ) : bookings.isError ? (
        <ErrorState onRetry={() => void bookings.refetch()} />
      ) : bookings.data?.length ? (
        <div className="booking-list">
          {bookings.data.map((booking) => (
            <BookingRow booking={booking} key={booking.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={type === 'upcoming' ? 'Немає майбутніх бронювань' : 'Історія поки порожня'}
          description="Вільний слот можна забронювати безпосередньо в розкладі."
        />
      )}
    </div>
  );
}
