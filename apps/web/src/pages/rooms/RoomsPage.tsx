import { useMemo, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { Spinner } from '../../components/ui/Spinner';
import { useRoomAvailability, useRooms } from '../../features/rooms/hooks/use-rooms';
import type { RoomAvailability } from '../../features/rooms/types';
import { formatClockMinutes } from '../../lib/dates';
import { OFFICE_TIMEZONE } from '../../lib/timezone';

const roomColors = ['blue', 'purple', 'lime', 'yellow', 'cyan', 'coral'];

function availabilityLabel(room: RoomAvailability | undefined): string {
  if (!room) return 'Перевіряємо доступність…';
  if (room.status === 'available') return 'Вільна зараз';
  if (room.status === 'closed') return 'Поза робочими годинами';
  return room.occupiedUntil
    ? `Зайнята до ${formatInTimeZone(new Date(room.occupiedUntil), OFFICE_TIMEZONE, 'HH:mm')}`
    : 'Зайнята';
}

export function RoomsPage() {
  const navigate = useNavigate();
  const rooms = useRooms();
  const availability = useRoomAvailability();
  const [capacity, setCapacity] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const visibleRooms = useMemo(() => {
    if (!rooms.data) return [];
    return rooms.data.filter((room) => {
      if (capacity === 'small') return room.capacity <= 4;
      if (capacity === 'medium') return room.capacity >= 5 && room.capacity <= 8;
      if (capacity === 'large') return room.capacity >= 9;
      return true;
    });
  }, [capacity, rooms.data]);
  const availabilityByRoomId = useMemo(
    () => new Map((availability.data ?? []).map((room) => [room.id, room])),
    [availability.data],
  );

  function openSchedule(roomId: string, action?: 'book') {
    const params = new URLSearchParams({ roomId });
    if (action) params.set('action', action);
    navigate(`/schedule?${params.toString()}`);
  }

  if (rooms.isPending) {
    return (
      <div className="page-center-inline">
        <Spinner label="Завантажуємо переговорні…" />
      </div>
    );
  }
  if (rooms.isError) return <ErrorState onRetry={() => void rooms.refetch()} />;

  return (
    <div className="content-wrap rooms-page">
      <div className="page-heading rooms-heading">
        <div>
          <span className="section-kicker">Ваш простір для зустрічей</span>
          <h1>Переговорні</h1>
          <p>Оберіть кімнату, яка підходить вашій команді.</p>
        </div>
        <div className="capacity-filter" aria-label="Фільтр за місткістю">
          {(
            [
              ['all', 'Усі'],
              ['small', '1–4'],
              ['medium', '5–8'],
              ['large', '9+'],
            ] as const
          ).map(([value, label]) => (
            <button
              className={capacity === value ? 'capacity-filter-active' : ''}
              key={value}
              type="button"
              onClick={() => setCapacity(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {visibleRooms.length ? (
        <div className="room-card-grid">
          {visibleRooms.map((room, index) => (
            <article className="room-card" key={room.id}>
              <div className={`room-card-art room-accent-${roomColors[index % roomColors.length]}`}>
                <span className="room-art-shape" />
                <span className="room-floor-label">Поверх {room.floor}</span>
              </div>
              <div className="room-card-body">
                <div className="room-card-title">
                  <span className={`room-dot room-dot-${roomColors[index % roomColors.length]}`} />
                  <h2>{room.name}</h2>
                </div>
                <p>
                  до {room.capacity} людей · поверх {room.floor}
                </p>
                <span className="room-working-hours">
                  Години: {formatClockMinutes(room.workStartMinutes)}–
                  {formatClockMinutes(room.workEndMinutes)} · Europe/Kyiv
                </span>
                {(() => {
                  const roomStatus = availabilityByRoomId.get(room.id);
                  return (
                    <span
                      className={`room-availability room-status-${roomStatus?.status ?? 'loading'}`}
                    >
                      <i /> {availabilityLabel(roomStatus)}
                      {roomStatus?.status === 'closed' && roomStatus.nextAvailableAt ? (
                        <small>
                          Наступний вільний час —{' '}
                          {formatInTimeZone(
                            new Date(roomStatus.nextAvailableAt),
                            OFFICE_TIMEZONE,
                            'HH:mm',
                          )}
                        </small>
                      ) : null}
                    </span>
                  );
                })()}
                <div className="room-card-actions">
                  <Button variant="secondary" onClick={() => openSchedule(room.id)}>
                    Переглянути розклад
                  </Button>
                  <Button onClick={() => openSchedule(room.id, 'book')}>Забронювати</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="state-panel">
          <span className="state-icon">⌕</span>
          <h2>Переговорних не знайдено</h2>
          <p>Спробуйте змінити фільтр місткості.</p>
          <Button variant="secondary" onClick={() => setCapacity('all')}>
            Скинути фільтр
          </Button>
        </div>
      )}
    </div>
  );
}
