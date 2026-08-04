import { zodResolver } from '@hookform/resolvers/zod';
import { addMinutes, differenceInMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ApiError } from '../../../lib/api-client';
import { formatClockMinutes, getBookingDurationOptions } from '../../../lib/dates';
import { OFFICE_TIMEZONE, formatUserDateTime, formatUserTime } from '../../../lib/timezone';
import { useUserSearch } from '../../users/hooks/use-user-search';
import type { DirectoryUser } from '../../users/types';
import { TimeInput } from './TimeInput';
import { findBookingConflict } from '../utils/booking-conflict';
import { formatOfficeTime, officeDateTimeForTime, timeToMinutes } from '../utils/booking-time';
import { bookingFormSchema, type BookingFormValues } from '../schemas/booking-schema';
import type { Booking, CreateBookingInput } from '../types';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} год` : `${hours} год ${rest} хв`;
}

export function BookingForm({
  startAt,
  endAt,
  roomName,
  roomCapacity,
  workingStartMinutes,
  workingEndMinutes,
  currentUserEmail,
  bookings,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  startAt: Date;
  endAt: Date;
  roomName: string;
  roomCapacity: number;
  workingStartMinutes: number;
  workingEndMinutes: number;
  currentUserEmail: string;
  bookings: Booking[];
  isPending: boolean;
  error: Error | null;
  onSubmit: (input: CreateBookingInput) => void;
  onCancel: () => void;
}) {
  const dayKey = formatInTimeZone(startAt, OFFICE_TIMEZONE, 'yyyy-MM-dd');
  const initialStartTime = formatOfficeTime(startAt);
  const initialEndTime = formatOfficeTime(endAt);
  const [participantQuery, setParticipantQuery] = useState('');
  const [participants, setParticipants] = useState<DirectoryUser[]>([]);
  const userSearch = useUserSearch(participantQuery);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      startTime: initialStartTime,
      endTime: initialEndTime,
      participantEmails: [],
    },
  });

  const selectedStartTime = watch('startTime');
  const selectedEndTime = watch('endTime');
  const selectedStartAt = officeDateTimeForTime(dayKey, selectedStartTime);
  const selectedEndAt = officeDateTimeForTime(dayKey, selectedEndTime);
  const previewStartAt = selectedStartAt ?? startAt;
  const previewEndAt = selectedEndAt ?? endAt;
  const duration =
    selectedStartAt && selectedEndAt && selectedStartAt < selectedEndAt
      ? differenceInMinutes(selectedEndAt, selectedStartAt)
      : null;
  const durationOptions = getBookingDurationOptions(previewStartAt, workingEndMinutes);
  const conflict = findBookingConflict(bookings, selectedStartAt, selectedEndAt);
  const selectedStartMinutes = timeToMinutes(selectedStartTime);
  const selectedEndMinutes = timeToMinutes(selectedEndTime);
  const hasInvalidStartTime = Boolean(
    selectedStartTime && selectedEndTime && timeToMinutes(selectedStartTime) === null,
  );
  const outsideWorkingHours = Boolean(
    selectedStartMinutes !== null &&
    selectedEndMinutes !== null &&
    (selectedStartMinutes < workingStartMinutes || selectedEndMinutes > workingEndMinutes),
  );
  const normalizedCurrentUserEmail = currentUserEmail.trim().toLowerCase();
  const exceedsCapacity = participants.length + 1 > roomCapacity;

  function setQuickDuration(minutes: number) {
    const nextEndAt = addMinutes(previewStartAt, minutes);
    setValue('endTime', formatOfficeTime(nextEndAt), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addParticipant(user: DirectoryUser) {
    const email = user.email.toLowerCase();
    if (
      email === normalizedCurrentUserEmail ||
      participants.some((participant) => participant.email.toLowerCase() === email) ||
      participants.length >= 20
    ) {
      return;
    }
    const nextParticipants = [...participants, user];
    setParticipants(nextParticipants);
    setValue(
      'participantEmails',
      nextParticipants.map((participant) => participant.email),
      { shouldDirty: true, shouldValidate: true },
    );
    setParticipantQuery('');
  }

  function removeParticipant(email: string) {
    const nextParticipants = participants.filter((participant) => participant.email !== email);
    setParticipants(nextParticipants);
    setValue(
      'participantEmails',
      nextParticipants.map((participant) => participant.email),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function submit(values: BookingFormValues) {
    if (conflict) {
      const message = 'Цей час недоступний: у кімнаті вже є інша зустріч';
      setError('startTime', { type: 'conflict', message });
      setError('endTime', { type: 'conflict', message });
      return;
    }
    if (outsideWorkingHours) {
      const message = `Оберіть час з ${formatClockMinutes(workingStartMinutes)} до ${formatClockMinutes(workingEndMinutes)}`;
      setError('startTime', { type: 'working-hours', message });
      setError('endTime', { type: 'working-hours', message });
      return;
    }
    if (exceedsCapacity) return;
    if (!selectedStartAt || !selectedEndAt) return;
    if (error instanceof ApiError && error.fields) {
      for (const [field, message] of Object.entries(error.fields))
        setError(field as keyof BookingFormValues, { type: 'server', message });
    }
    onSubmit({
      title: values.title,
      startAt: selectedStartAt.toISOString(),
      endAt: selectedEndAt.toISOString(),
      participantEmails: values.participantEmails,
      roomId: '',
    });
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="booking-summary">
        <span>{roomName}</span>
        <strong>
          {formatUserDateTime(previewStartAt)} — {formatUserTime(previewEndAt)}
        </strong>
        <small>
          Години кімнати: {formatClockMinutes(workingStartMinutes)}–
          {formatClockMinutes(workingEndMinutes)} за Europe/Kyiv
        </small>
      </div>

      <div className="time-range-field">
        <div className="time-range-inputs">
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimeInput label="Початок" error={errors.startTime?.message} {...field} />
            )}
          />
          <span className="time-range-arrow" aria-hidden="true">
            →
          </span>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TimeInput label="Кінець" error={errors.endTime?.message} rounding="up" {...field} />
            )}
          />
        </div>
        <div
          className={`time-range-validation-slot ${conflict || hasInvalidStartTime || outsideWorkingHours ? 'time-range-validation-slot-visible' : ''}`}
          aria-live="polite"
        >
          {conflict ? (
            <p className="time-range-conflict" role="alert">
              Не можна обрати цей час — тут уже є зустріч «{conflict.title}» ({' '}
              {formatOfficeTime(new Date(conflict.startAt))}–
              {formatOfficeTime(new Date(conflict.endAt))})
            </p>
          ) : null}
          {hasInvalidStartTime ? (
            <p className="field-error">Оберіть коректний час початку</p>
          ) : null}
          {outsideWorkingHours ? (
            <p className="field-error">
              Оберіть час з {formatClockMinutes(workingStartMinutes)} до{' '}
              {formatClockMinutes(workingEndMinutes)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="duration-field">
        <span className="field-label">Швидкий вибір тривалості</span>
        <div className="duration-options" role="radiogroup" aria-label="Тривалість зустрічі">
          {durationOptions.map((minutes) => (
            <button
              className={`duration-option ${duration === minutes ? 'duration-option-active' : ''}`}
              key={minutes}
              type="button"
              onClick={() => setQuickDuration(minutes)}
            >
              {formatDuration(minutes)}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Назва зустрічі"
        placeholder="Наприклад, Планування спринту"
        autoFocus
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="participant-field">
        <span className="field-label">Учасники</span>
        <div className="participant-picker">
          {participants.length > 0 ? (
            <div className="participant-list">
              {participants.map((participant) => (
                <span className="participant-chip" key={participant.id}>
                  <span>
                    <strong>{participant.name}</strong>
                    <small>{participant.email}</small>
                  </span>
                  <button
                    type="button"
                    aria-label={`Видалити ${participant.email}`}
                    onClick={() => removeParticipant(participant.email)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <input
            className="input participant-search"
            type="email"
            value={participantQuery}
            placeholder="Почніть вводити email"
            aria-label="Email учасника"
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
              {!userSearch.isPending && !userSearch.data?.length ? (
                <span className="participant-result-hint">
                  Користувача з таким email не знайдено
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <small className="field-hint">
          {participants.length + 1} з {roomCapacity} місць зайнято · додайте колег, які вже
          зареєстровані в Roomly
        </small>
        {exceedsCapacity ? (
          <p className="field-error">
            У кімнаті може бути не більше {roomCapacity} людей разом з вами
          </p>
        ) : errors.participantEmails?.message ? (
          <p className="field-error">{errors.participantEmails.message}</p>
        ) : null}
      </div>

      {error && !(error instanceof ApiError && error.fields) ? (
        <p className="form-error">{error.message}</p>
      ) : null}
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Скасувати
        </Button>
        <Button
          type="submit"
          disabled={isPending || Boolean(conflict) || outsideWorkingHours || exceedsCapacity}
        >
          {isPending ? 'Бронюємо…' : 'Забронювати'}
        </Button>
      </div>
    </form>
  );
}
