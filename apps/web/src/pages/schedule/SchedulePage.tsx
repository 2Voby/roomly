import { addMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { BookingDetails } from '../../features/bookings/components/BookingDetails';
import { BookingForm } from '../../features/bookings/components/BookingForm';
import {
  useCancelBooking,
  useCancelBookingSeries,
  useCreateBooking,
  useUpdateBooking,
} from '../../features/bookings/hooks/use-bookings';
import type {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
} from '../../features/bookings/types';
import { useCurrentUser } from '../../features/auth/hooks/use-auth';
import { useRoomBookings, useRooms } from '../../features/rooms/hooks/use-rooms';
import { CalendarLegend } from '../../features/schedule/components/CalendarLegend';
import { WeekCalendar } from '../../features/schedule/components/WeekCalendar';
import {
  CALENDAR_END_MINUTES,
  CALENDAR_START_MINUTES,
  formatClockMinutes,
  formatWeekLabel,
  getWeekStartKey,
  shiftWeek,
} from '../../lib/dates';
import { formatUserDateTime, formatUserTime, timezoneNote } from '../../lib/timezone';

interface SlotSelection {
  startAt: Date;
  endAt: Date;
}

export function SchedulePage() {
  const { data: user } = useCurrentUser();
  const rooms = useRooms();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const requestedWeekStart = searchParams.get('weekStart');
  const initialWeekStart = requestedWeekStart ?? getWeekStartKey();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [seriesToCancel, setSeriesToCancel] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const bookings = useRoomBookings(selectedRoomId, weekStart);
  const createBooking = useCreateBooking();
  const cancelBooking = useCancelBooking();
  const cancelBookingSeries = useCancelBookingSeries();
  const updateBooking = useUpdateBooking();
  const requestedRoomId = searchParams.get('roomId');
  const requestedBookingId = searchParams.get('bookingId');
  const isBookingPromptVisible = searchParams.get('action') === 'book';
  const repeatTitle = searchParams.get('repeatTitle') ?? '';
  const requestedRepeatDuration = Number(searchParams.get('repeatDuration'));
  const repeatDurationMinutes =
    requestedRepeatDuration >= 30 && requestedRepeatDuration <= 240
      ? requestedRepeatDuration
      : null;

  useEffect(() => {
    const roomFromQuery = rooms.data?.find((room) => room.id === requestedRoomId);
    if (roomFromQuery && roomFromQuery.id !== selectedRoomId) {
      setSelectedRoomId(roomFromQuery.id);
    } else if (!selectedRoomId && rooms.data?.[0]) {
      setSelectedRoomId(rooms.data[0].id);
    }
  }, [rooms.data, requestedRoomId, selectedRoomId]);

  useEffect(() => {
    const nextWeekStart = requestedWeekStart ?? getWeekStartKey();
    if (nextWeekStart !== weekStart) setWeekStart(nextWeekStart);
  }, [requestedWeekStart, weekStart]);

  useEffect(() => {
    if (!requestedBookingId || !bookings.data) return;
    const booking = bookings.data.find((item) => item.id === requestedBookingId);
    if (!booking) return;
    setSelectedBooking(booking);
  }, [bookings.data, requestedBookingId, searchParams, setSearchParams]);

  const selectedRoom = rooms.data?.find((room) => room.id === selectedRoomId);
  const workingStartMinutes = selectedRoom?.workStartMinutes ?? CALENDAR_START_MINUTES;
  const workingEndMinutes = selectedRoom?.workEndMinutes ?? CALENDAR_END_MINUTES;

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function submitBooking(input: CreateBookingInput) {
    if (!selectedRoomId) return;
    createBooking.mutate(
      { ...input, roomId: selectedRoomId },
      {
        onSuccess: (result) => {
          const booking = result.booking;
          setSlot(null);
          clearRepeatQuery();
          setToast(
            result.series
              ? `Створено серію з ${result.bookings.length} зустрічей · ${booking.title}`
              : `Переговорну заброньовано · ${booking.title} · ${formatUserTime(new Date(booking.startAt))}–${formatUserTime(new Date(booking.endAt))}`,
          );
        },
      },
    );
  }

  function handleCancel() {
    if (selectedBooking) setBookingToCancel(selectedBooking);
  }

  async function handleUpdateBooking(input: UpdateBookingInput) {
    if (!selectedBooking) return;
    const booking = await updateBooking.mutateAsync({
      bookingId: selectedBooking.id,
      input,
    });
    setSelectedBooking(booking);
    setToast('Зустріч оновлено');
  }

  function handleCancelSeries() {
    if (selectedBooking?.series) setSeriesToCancel(selectedBooking);
  }

  function confirmCancel() {
    if (!bookingToCancel) return;
    cancelBooking.mutate(bookingToCancel.id, {
      onSuccess: () => {
        setBookingToCancel(null);
        setSelectedBooking(null);
        clearBookingQuery();
        setToast('Бронювання скасовано');
      },
    });
  }

  function confirmCancelSeries() {
    if (!seriesToCancel?.series) return;
    cancelBookingSeries.mutate(seriesToCancel.series.id, {
      onSuccess: (result) => {
        setSeriesToCancel(null);
        setSelectedBooking(null);
        clearBookingQuery();
        setToast(`Скасовано ${result.cancelledCount} повторів`);
      },
    });
  }

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('roomId', roomId);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }

  function selectWeek(nextWeekStart: string) {
    setWeekStart(nextWeekStart);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('weekStart', nextWeekStart);
    setSearchParams(nextParams, { replace: true });
  }

  function dismissBookingPrompt() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }

  function clearRepeatQuery() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    nextParams.delete('repeatTitle');
    nextParams.delete('repeatDuration');
    setSearchParams(nextParams, { replace: true });
  }

  function clearBookingQuery() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('bookingId');
    setSearchParams(nextParams, { replace: true });
  }

  if (rooms.isPending)
    return (
      <div className="page-center">
        <Spinner label="Завантажуємо кімнати…" />
      </div>
    );
  if (rooms.isError)
    return (
      <div className="content-wrap">
        <ErrorState onRetry={() => void rooms.refetch()} />
      </div>
    );
  if (!rooms.data?.length)
    return (
      <div className="content-wrap">
        <EmptyState
          title="Кімнати ще не налаштовані"
          description="Зверніться до адміністратора офісу."
        />
      </div>
    );

  return (
    <div className="content-wrap schedule-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">Тижневий огляд</span>
          <h1>Розклад переговорних</h1>
          <p>Оберіть кімнату та забронюйте зручний час</p>
        </div>
        <span className="timezone-note">◉ {timezoneNote()}</span>
      </div>
      <section className="schedule-controls">
        <div className="room-control">
          <label className="room-select">
            <span className="sr-only">Переговорна кімната</span>
            <select value={selectedRoomId} onChange={(event) => selectRoom(event.target.value)}>
              {rooms.data.map((room) => (
                <option value={room.id} key={room.id}>
                  {room.name} · поверх {room.floor} · до {room.capacity} людей ·{' '}
                  {formatClockMinutes(room.workStartMinutes)}–
                  {formatClockMinutes(room.workEndMinutes)}
                </option>
              ))}
            </select>
          </label>
          <span className="room-hours-note">
            Години кімнати: {formatClockMinutes(workingStartMinutes)}–
            {formatClockMinutes(workingEndMinutes)} · Europe/Kyiv
          </span>
        </div>
        <div className="week-controls">
          <Button
            variant="secondary"
            onClick={() => selectWeek(shiftWeek(weekStart, -1))}
            aria-label="Попередній тиждень"
          >
            ‹
          </Button>
          <strong>{formatWeekLabel(weekStart)}</strong>
          <Button
            variant="secondary"
            onClick={() => selectWeek(shiftWeek(weekStart, 1))}
            aria-label="Наступний тиждень"
          >
            ›
          </Button>
          <Button variant="secondary" onClick={() => selectWeek(getWeekStartKey())}>
            Сьогодні
          </Button>
        </div>
      </section>
      {isBookingPromptVisible ? (
        <div className="booking-prompt" role="status">
          <span className="booking-prompt-icon">+</span>
          <span>
            <strong>Кімнату обрано</strong>
            Виберіть вільний час у календарі, щоб створити бронювання
          </span>
          <button type="button" aria-label="Закрити підказку" onClick={dismissBookingPrompt}>
            ×
          </button>
        </div>
      ) : null}
      <CalendarLegend />
      {bookings.isPending ? (
        <div className="calendar-loading">
          <Spinner label="Завантажуємо розклад…" />
        </div>
      ) : bookings.isError ? (
        <ErrorState onRetry={() => void bookings.refetch()} />
      ) : (
        <WeekCalendar
          weekStart={weekStart}
          bookings={bookings.data ?? []}
          currentUserId={user?.id ?? ''}
          workingStartMinutes={workingStartMinutes}
          workingEndMinutes={workingEndMinutes}
          onSlotSelect={(startAt, endAt) => {
            createBooking.reset();
            dismissBookingPrompt();
            setSlot({
              startAt,
              endAt: repeatDurationMinutes ? addMinutes(startAt, repeatDurationMinutes) : endAt,
            });
          }}
          onBookingClick={setSelectedBooking}
        />
      )}
      {slot && selectedRoom ? (
        <Modal title="Нове бронювання" onClose={() => setSlot(null)}>
          {user?.emailVerifiedAt ? (
            <BookingForm
              startAt={slot.startAt}
              endAt={slot.endAt}
              roomName={selectedRoom.name}
              roomCapacity={selectedRoom.capacity}
              initialTitle={repeatTitle}
              workingStartMinutes={workingStartMinutes}
              workingEndMinutes={workingEndMinutes}
              currentUserEmail={user.email}
              bookings={bookings.data ?? []}
              isPending={createBooking.isPending}
              error={createBooking.error}
              onSubmit={submitBooking}
              onCancel={() => setSlot(null)}
            />
          ) : (
            <div className="verification-prompt">
              <div className="verification-prompt-icon" aria-hidden="true">
                @
              </div>
              <h2>Підтвердіть email</h2>
              <p>
                Бронювання стане доступним після підтвердження адреси. У dev-режимі посилання
                зʼявиться в логах API/worker.
              </p>
              <Button type="button" variant="ghost" onClick={() => setSlot(null)}>
                Закрити
              </Button>
            </div>
          )}
        </Modal>
      ) : null}
      {selectedBooking ? (
        <Modal
          title={selectedBooking.userId === user?.id ? 'Ваше бронювання' : 'Деталі бронювання'}
          onClose={() => {
            setSelectedBooking(null);
            clearBookingQuery();
          }}
        >
          <BookingDetails
            booking={selectedBooking}
            isOwner={selectedBooking.userId === user?.id}
            isPending={cancelBooking.isPending}
            isUpdating={updateBooking.isPending}
            updateError={updateBooking.error}
            onCancel={handleCancel}
            onCancelSeries={handleCancelSeries}
            onUpdateBooking={handleUpdateBooking}
            onClose={() => {
              setSelectedBooking(null);
              clearBookingQuery();
            }}
          />
        </Modal>
      ) : null}
      {bookingToCancel ? (
        <Modal title="Скасувати бронювання?" onClose={() => setBookingToCancel(null)}>
          <div className="cancel-dialog">
            <div className="cancel-dialog-icon">!</div>
            <p>
              Бронювання «{bookingToCancel.title}» на{' '}
              {formatUserDateTime(new Date(bookingToCancel.startAt))}–
              {formatUserTime(new Date(bookingToCancel.endAt))} буде скасовано.
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
              Будуть скасовані всі майбутні активні повтори серії «{seriesToCancel.title}». Минулі
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
                onClick={confirmCancelSeries}
              >
                {cancelBookingSeries.isPending ? 'Скасовуємо…' : 'Скасувати всю серію'}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
      {toast ? (
        <div className="toast" role="status">
          <span className="toast-icon">✓</span>
          <span>{toast}</span>
          <button type="button" aria-label="Закрити повідомлення" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
