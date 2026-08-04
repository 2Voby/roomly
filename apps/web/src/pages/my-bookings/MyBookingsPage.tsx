import { differenceInMinutes, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Spinner } from '../../components/ui/Spinner';
import { useCancelBooking, useMyBookings } from '../../features/bookings/hooks/use-bookings';
import type { Booking } from '../../features/bookings/types';

function durationLabel(booking: Booking) {
  const minutes = differenceInMinutes(new Date(booking.endAt), new Date(booking.startAt));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} год${rest ? ` ${rest} хв` : ''}` : `${minutes} хв`;
}

function timeLabel(booking: Booking) {
  return `${new Date(booking.startAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}–${new Date(booking.endAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;
}

function BookingRow({
  booking,
  onCancel,
  onOpen,
}: {
  booking: Booking;
  onCancel: () => void;
  onOpen: () => void;
}) {
  const date = new Date(booking.startAt);
  return (
    <article className={`my-booking-row ${booking.cancelledAt ? 'booking-row-cancelled' : ''}`}>
      <button className="my-booking-main" type="button" onClick={onOpen}>
        <span className="booking-date-block">
          <b>{format(date, 'dd')}</b>
          <small>{format(date, 'MMM', { locale: uk })}</small>
        </span>
        <span className="my-booking-copy">
          <strong>{booking.title}</strong>
          <span>
            {timeLabel(booking)} · {durationLabel(booking)}
          </span>
          <small>
            <i className="room-dot room-dot-blue" /> {booking.roomName} · поверх {booking.roomFloor}{' '}
            · до {booking.roomCapacity} людей
          </small>
        </span>
      </button>
      <div className="my-booking-actions">
        <span className={`booking-status ${booking.cancelledAt ? 'booking-status-cancelled' : ''}`}>
          {booking.cancelledAt ? 'Скасовано' : 'Заплановано'}
        </span>
        {!booking.cancelledAt ? (
          <Button variant="ghost" onClick={onCancel}>
            Скасувати
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function MyBookingsPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<'upcoming' | 'past'>('upcoming');
  const bookings = useMyBookings(type);
  const cancelBooking = useCancelBooking();
  const items = bookings.data ?? [];
  const summary = useMemo(
    () => ({
      next: items[0],
      count: items.length,
      minutes: items.reduce(
        (total, booking) =>
          total + differenceInMinutes(new Date(booking.endAt), new Date(booking.startAt)),
        0,
      ),
    }),
    [items],
  );

  function cancel(booking: Booking) {
    if (window.confirm(`Скасувати бронювання «${booking.title}»?`))
      cancelBooking.mutate(booking.id);
  }

  return (
    <div className="content-wrap narrow-page my-bookings-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">Ваші зустрічі</span>
          <h1>Мої бронювання</h1>
          <p>Переглядайте майбутні та минулі зустрічі</p>
        </div>
        <Button onClick={() => navigate('/schedule')}>+ Створити бронювання</Button>
      </div>
      {type === 'upcoming' && !bookings.isPending && !bookings.isError ? (
        <div className="booking-summary-grid">
          <article className="summary-card summary-card-blue">
            <span>Найближче бронювання</span>
            <strong>
              {summary.next
                ? format(new Date(summary.next.startAt), 'd MMM, HH:mm', { locale: uk })
                : '—'}
            </strong>
            <small>{summary.next?.title ?? 'Час для нової зустрічі'}</small>
          </article>
          <article className="summary-card summary-card-lime">
            <span>Бронювань цього тижня</span>
            <strong>{summary.count}</strong>
            <small>запланованих зустрічей</small>
          </article>
          <article className="summary-card summary-card-purple">
            <span>Загальна тривалість</span>
            <strong>{Math.floor(summary.minutes / 60)} год</strong>
            <small>
              {summary.minutes % 60 ? `${summary.minutes % 60} хв понад це` : 'фокусованої роботи'}
            </small>
          </article>
        </div>
      ) : null}
      <div className="segmented-control bookings-tabs">
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
      ) : items.length ? (
        <div className="my-booking-list">
          {items.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onOpen={() => navigate('/schedule')}
              onCancel={() => cancel(booking)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            type === 'upcoming' ? 'У вас ще немає майбутніх бронювань' : 'Історія поки порожня'
          }
          description="Вільний слот можна забронювати безпосередньо в розкладі."
        />
      )}
    </div>
  );
}
