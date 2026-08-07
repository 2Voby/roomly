import { differenceInMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { uk } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import {
  useCancelBooking,
  useCancelBookingSeries,
  useMyBookings,
} from '../../features/bookings/hooks/use-bookings';
import type { Booking } from '../../features/bookings/types';
import { getWeekStartKey } from '../../lib/dates';
import { formatUserDateTime, formatUserTime, getUserTimezone } from '../../lib/timezone';

function durationLabel(booking: Booking) {
  const minutes = differenceInMinutes(new Date(booking.endAt), new Date(booking.startAt));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} год${rest ? ` ${rest} хв` : ''}` : `${minutes} хв`;
}

function timeLabel(booking: Booking) {
  return `${formatUserTime(new Date(booking.startAt))}–${formatUserTime(new Date(booking.endAt))}`;
}

function BookingRow({
  booking,
  onCancel,
  onCancelSeries,
  onRepeat,
  canRepeat,
  onOpen,
}: {
  booking: Booking;
  onCancel: () => void;
  onCancelSeries: () => void;
  onRepeat: () => void;
  canRepeat: boolean;
  onOpen: () => void;
}) {
  const date = new Date(booking.startAt);
  return (
    <article className={`my-booking-row ${booking.cancelledAt ? 'booking-row-cancelled' : ''}`}>
      <button className="my-booking-main" type="button" onClick={onOpen}>
        <span className="booking-date-block">
          <b>{formatInTimeZone(date, getUserTimezone(), 'dd')}</b>
          <small>{formatInTimeZone(date, getUserTimezone(), 'MMM', { locale: uk })}</small>
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
          {booking.series ? (
            <small className="series-row-label">
              Повтор {booking.series.occurrenceIndex} із {booking.series.occurrenceCount}
            </small>
          ) : null}
        </span>
      </button>
      <div className="my-booking-actions">
        <span className={`booking-status ${booking.cancelledAt ? 'booking-status-cancelled' : ''}`}>
          {booking.cancelledAt ? 'Скасовано' : 'Заплановано'}
        </span>
        {canRepeat ? (
          <Button variant="ghost" onClick={onRepeat}>
            Повторити
          </Button>
        ) : null}
        {!booking.cancelledAt ? (
          <>
            <Button variant="ghost" onClick={onCancel}>
              Скасувати
            </Button>
            {booking.series ? (
              <Button variant="ghost" onClick={onCancelSeries}>
                Усю серію
              </Button>
            ) : null}
          </>
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
  const cancelBookingSeries = useCancelBookingSeries();
  const items = bookings.data?.pages.flatMap((page) => page.items) ?? [];
  const summaryMeta = bookings.data?.pages[0]?.meta.summary;
  const summary = useMemo(
    () => ({
      next: items[0],
      count: summaryMeta?.upcomingThisWeek ?? 0,
      minutes: summaryMeta?.upcomingDurationMinutes ?? 0,
    }),
    [items, summaryMeta],
  );
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [seriesToCancel, setSeriesToCancel] = useState<Booking | null>(null);

  function openBooking(booking: Booking) {
    const params = new URLSearchParams({
      roomId: booking.roomId,
      weekStart: getWeekStartKey(new Date(booking.startAt)),
    });
    if (!booking.cancelledAt) params.set('bookingId', booking.id);
    navigate(`/schedule?${params.toString()}`);
  }

  function repeatBooking(booking: Booking) {
    const duration = differenceInMinutes(new Date(booking.endAt), new Date(booking.startAt));
    const params = new URLSearchParams({
      roomId: booking.roomId,
      action: 'book',
      repeatTitle: booking.title,
      repeatDuration: String(duration),
    });
    navigate(`/schedule?${params.toString()}`);
  }

  function cancel(booking: Booking) {
    setBookingToCancel(booking);
  }

  function cancelSeries(booking: Booking) {
    setSeriesToCancel(booking);
  }

  function confirmCancel() {
    if (!bookingToCancel) return;
    cancelBooking.mutate(bookingToCancel.id, {
      onSuccess: () => setBookingToCancel(null),
    });
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
              {summary.next ? formatUserDateTime(new Date(summary.next.startAt)) : '—'}
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
              onOpen={() => openBooking(booking)}
              onCancel={() => cancel(booking)}
              onCancelSeries={() => cancelSeries(booking)}
              onRepeat={() => repeatBooking(booking)}
              canRepeat={type === 'past'}
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
      {bookings.hasNextPage ? (
        <div className="load-more-actions">
          <Button
            variant="secondary"
            disabled={bookings.isFetchingNextPage}
            onClick={() => void bookings.fetchNextPage()}
          >
            {bookings.isFetchingNextPage ? 'Завантажуємо…' : 'Показати ще'}
          </Button>
        </div>
      ) : null}
      {bookingToCancel ? (
        <Modal title="Скасувати бронювання?" onClose={() => setBookingToCancel(null)}>
          <div className="cancel-dialog">
            <div className="cancel-dialog-icon">!</div>
            <p>
              Бронювання «{bookingToCancel.title}» буде скасовано. Вільний слот одразу стане
              доступним для інших.
            </p>
            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={() => setBookingToCancel(null)}>
                Не скасовувати
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={cancelBooking.isPending}
                onClick={confirmCancel}
              >
                {cancelBooking.isPending ? 'Скасовуємо…' : 'Так, скасувати'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
      {seriesToCancel?.series ? (
        <Modal title="Скасувати всю серію?" onClose={() => setSeriesToCancel(null)}>
          <div className="cancel-dialog">
            <div className="cancel-dialog-icon">!</div>
            <p>
              Будуть скасовані всі майбутні активні повтори «{seriesToCancel.title}». Минулі
              зустрічі залишаться в історії.
            </p>
            <div className="modal-actions">
              <Button type="button" variant="ghost" onClick={() => setSeriesToCancel(null)}>
                Не скасовувати
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={cancelBookingSeries.isPending}
                onClick={() => {
                  if (!seriesToCancel.series) return;
                  cancelBookingSeries.mutate(seriesToCancel.series.id, {
                    onSuccess: () => setSeriesToCancel(null),
                  });
                }}
              >
                {cancelBookingSeries.isPending ? 'Скасовуємо…' : 'Скасувати всю серію'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
