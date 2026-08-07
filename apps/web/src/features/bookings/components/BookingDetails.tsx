import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useUserSearch } from '../../users/hooks/use-user-search';
import type { DirectoryUser } from '../../users/types';
import {
  OFFICE_TIMEZONE,
  formatUserDate,
  formatUserTime,
  getUserTimezone,
} from '../../../lib/timezone';
import { userDateTimeForTime } from '../utils/booking-time';
import type { Booking, UpdateBookingInput } from '../types';

export function BookingDetails({
  booking,
  isOwner,
  isPending,
  isUpdating,
  updateError,
  onCancel,
  onCancelSeries,
  onUpdateBooking,
  onClose,
}: {
  booking: Booking;
  isOwner: boolean;
  isPending: boolean;
  isUpdating: boolean;
  updateError: Error | null;
  onCancel: () => void;
  onCancelSeries: () => void;
  onUpdateBooking: (input: UpdateBookingInput) => Promise<void>;
  onClose: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [participantQuery, setParticipantQuery] = useState('');
  const [title, setTitle] = useState(booking.title);
  const [startTime, setStartTime] = useState(formatUserTime(new Date(booking.startAt)));
  const [endTime, setEndTime] = useState(formatUserTime(new Date(booking.endAt)));
  const [participants, setParticipants] = useState(booking.participants);
  const [isCopied, setIsCopied] = useState(false);
  const userSearch = useUserSearch(participantQuery);
  const canEdit = isOwner && !booking.cancelledAt && new Date(booking.startAt) > new Date();
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

  useEffect(() => {
    if (isEditing) return;
    setTitle(booking.title);
    setStartTime(formatUserTime(new Date(booking.startAt)));
    setEndTime(formatUserTime(new Date(booking.endAt)));
    setParticipants(booking.participants);
  }, [booking, isEditing]);

  function addParticipant(user: DirectoryUser) {
    if (participants.some((participant) => participant.id === user.id)) return;
    setParticipants([...participants, user]);
    setParticipantQuery('');
  }

  function removeParticipant(userId: string) {
    setParticipants(participants.filter((participant) => participant.id !== userId));
  }

  async function copyBookingDetails() {
    const details = [
      booking.title,
      `${booking.roomName} · поверх ${booking.roomFloor}`,
      `${formatUserDate(startAt)}, ${formatUserTime(startAt)}–${formatUserTime(endAt)}`,
      `Організатор: ${booking.userName}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(details);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2200);
    } catch {
      setIsCopied(false);
    }
  }

  async function save() {
    const nextStartAt = userDateTimeForTime(startAt, startTime);
    const nextEndAt = userDateTimeForTime(startAt, endTime, true, startTime);
    if (!nextStartAt || !nextEndAt) return;
    await onUpdateBooking({
      title: title.trim(),
      startAt: nextStartAt.toISOString(),
      endAt: nextEndAt.toISOString(),
      participantEmails: participants.map((participant) => participant.email),
    });
    setIsEditing(false);
    setParticipantQuery('');
  }

  return (
    <div className="booking-details">
      {isEditing ? (
        <label className="field-label">
          Назва зустрічі
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
      ) : (
        <p className="detail-title">{booking.title}</p>
      )}
      {booking.series ? (
        <p className="series-badge">
          Повтор {booking.series.occurrenceIndex} із {booking.series.occurrenceCount}
          {booking.series.isException ? ' · змінений повтор' : ' · щотижня'}
        </p>
      ) : null}
      <div className="booking-detail-summary">
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
            {isEditing ? (
              <span className="booking-edit-time-fields">
                <input
                  className="input"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
                <span>—</span>
                <input
                  className="input"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </span>
            ) : (
              <strong>
                {formatUserTime(startAt)} — {formatUserTime(endAt)}
              </strong>
            )}
          </p>
          <div className="booking-schedule-meta">
            <strong className="booking-user-timezone">{userTimezone}</strong>
            <span className="booking-office-timezone">Офіс · {OFFICE_TIMEZONE}</span>
            <span className="booking-duration">Тривалість: {durationLabel}</span>
          </div>
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
            ♛
          </span>
        </div>
        {participants.map((participant) => (
          <div className="booking-person" key={participant.id}>
            <span className="booking-person-avatar">
              {participant.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="booking-person-copy">
              <strong>{participant.name}</strong>
              <small>{participant.email}</small>
            </span>
            {isEditing ? (
              <button
                className="participant-remove-button"
                type="button"
                aria-label={`Видалити ${participant.email}`}
                onClick={() => removeParticipant(participant.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {isEditing ? (
        <div className="participant-edit-panel">
          <label className="field-label" htmlFor="booking-participant-search">
            Додати учасника
          </label>
          <input
            id="booking-participant-search"
            className="input participant-search"
            type="email"
            value={participantQuery}
            placeholder="Почніть вводити email"
            onChange={(event) => setParticipantQuery(event.target.value)}
          />
          {participantQuery.trim().length >= 2 ? (
            <div className="participant-results">
              {userSearch.isPending ? (
                <span className="participant-result-hint">Шукаємо користувачів…</span>
              ) : null}
              {userSearch.data?.map((user) => (
                <button
                  className="participant-result"
                  type="button"
                  key={user.id}
                  onClick={() => addParticipant(user)}
                >
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </button>
              ))}
            </div>
          ) : null}
          {updateError ? <p className="field-error">{updateError.message}</p> : null}
        </div>
      ) : null}

      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          Закрити
        </Button>
        {canEdit && !isEditing ? (
          <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
            Редагувати цей повтор
          </Button>
        ) : null}
        {isEditing ? (
          <>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              Не змінювати
            </Button>
            <Button type="button" disabled={isUpdating} onClick={() => void save()}>
              {isUpdating ? 'Зберігаємо…' : 'Зберегти повтор'}
            </Button>
          </>
        ) : null}
        {!isEditing ? (
          <Button type="button" variant="secondary" onClick={() => void copyBookingDetails()}>
            {isCopied ? 'Скопійовано' : 'Скопіювати деталі'}
          </Button>
        ) : null}
        {isOwner && !isEditing ? (
          <Button type="button" variant="danger" disabled={isPending} onClick={onCancel}>
            {isPending ? 'Скасовуємо…' : 'Скасувати цей повтор'}
          </Button>
        ) : null}
        {isOwner && !isEditing && booking.series ? (
          <Button type="button" variant="danger" disabled={isPending} onClick={onCancelSeries}>
            Скасувати всю серію
          </Button>
        ) : null}
      </div>
    </div>
  );
}
