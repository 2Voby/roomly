import { useEffect, useState } from 'react';

import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { BookingDetails } from '../../features/bookings/components/BookingDetails';
import { BookingForm } from '../../features/bookings/components/BookingForm';
import { useCancelBooking, useCreateBooking } from '../../features/bookings/hooks/use-bookings';
import type { Booking } from '../../features/bookings/types';
import { useCurrentUser } from '../../features/auth/hooks/use-auth';
import { useRoomBookings, useRooms } from '../../features/rooms/hooks/use-rooms';
import { WeekCalendar } from '../../features/schedule/components/WeekCalendar';
import { formatWeekLabel, getWeekStartKey, shiftWeek } from '../../lib/dates';
import { timezoneNote } from '../../lib/timezone';

interface SlotSelection {
  startAt: Date;
  endAt: Date;
}

export function SchedulePage() {
  const { data: user } = useCurrentUser();
  const rooms = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>();
  const [weekStart, setWeekStart] = useState(getWeekStartKey());
  const [slot, setSlot] = useState<SlotSelection | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const bookings = useRoomBookings(selectedRoomId, weekStart);
  const createBooking = useCreateBooking();
  const cancelBooking = useCancelBooking();

  useEffect(() => {
    if (!selectedRoomId && rooms.data?.[0]) setSelectedRoomId(rooms.data[0].id);
  }, [rooms.data, selectedRoomId]);

  const selectedRoom = rooms.data?.find((room) => room.id === selectedRoomId);

  function submitBooking(input: { title: string; startAt: string; endAt: string; roomId: string }) {
    if (!selectedRoomId) return;
    createBooking.mutate({ ...input, roomId: selectedRoomId }, { onSuccess: () => setSlot(null) });
  }

  function handleCancel() {
    if (!selectedBooking || !window.confirm('Скасувати це бронювання?')) return;
    cancelBooking.mutate(selectedBooking.id, { onSuccess: () => setSelectedBooking(null) });
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
          <h1>Розклад</h1>
          <p>Оберіть кімнату та вільний час для зустрічі.</p>
        </div>
        <span className="timezone-note">◉ {timezoneNote()}</span>
      </div>
      <section className="schedule-controls">
        <label className="room-select">
          <span className="sr-only">Переговорна кімната</span>
          <select
            value={selectedRoomId}
            onChange={(event) => setSelectedRoomId(event.target.value)}
          >
            {rooms.data.map((room) => (
              <option value={room.id} key={room.id}>
                {room.name} · поверх {room.floor} · до {room.capacity} людей
              </option>
            ))}
          </select>
        </label>
        <div className="week-controls">
          <Button
            variant="secondary"
            onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
            aria-label="Попередній тиждень"
          >
            ‹
          </Button>
          <strong>{formatWeekLabel(weekStart)}</strong>
          <Button
            variant="secondary"
            onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
            aria-label="Наступний тиждень"
          >
            ›
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(getWeekStartKey())}>
            Сьогодні
          </Button>
        </div>
      </section>
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
          onSlotClick={(startAt, endAt) => {
            createBooking.reset();
            setSlot({ startAt, endAt });
          }}
          onBookingClick={setSelectedBooking}
        />
      )}
      <div className="schedule-footnote">
        <span>Робочі години: 09:00–19:00 за Europe/Kyiv</span>
        <span>Крок календаря: 30 хвилин</span>
      </div>

      {slot && selectedRoom ? (
        <Modal title="Нове бронювання" onClose={() => setSlot(null)}>
          <BookingForm
            startAt={slot.startAt}
            endAt={slot.endAt}
            roomName={selectedRoom.name}
            isPending={createBooking.isPending}
            error={createBooking.error}
            onSubmit={submitBooking}
            onCancel={() => setSlot(null)}
          />
        </Modal>
      ) : null}
      {selectedBooking ? (
        <Modal
          title={selectedBooking.userId === user?.id ? 'Ваше бронювання' : 'Деталі бронювання'}
          onClose={() => setSelectedBooking(null)}
        >
          <BookingDetails
            booking={selectedBooking}
            isOwner={selectedBooking.userId === user?.id}
            isPending={cancelBooking.isPending}
            onCancel={handleCancel}
            onClose={() => setSelectedBooking(null)}
          />
        </Modal>
      ) : null}
    </div>
  );
}
