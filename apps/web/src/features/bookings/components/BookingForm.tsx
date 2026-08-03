import { zodResolver } from '@hookform/resolvers/zod';
import { addMinutes, differenceInMinutes } from 'date-fns';
import { useForm } from 'react-hook-form';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ApiError } from '../../../lib/api-client';
import { getBookingDurationOptions } from '../../../lib/dates';
import { bookingFormSchema, type BookingFormValues } from '../schemas/booking-schema';
import type { CreateBookingInput } from '../types';

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
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  startAt: Date;
  endAt: Date;
  roomName: string;
  isPending: boolean;
  error: Error | null;
  onSubmit: (input: CreateBookingInput) => void;
  onCancel: () => void;
}) {
  const durationOptions = getBookingDurationOptions(startAt);
  const draggedDuration = differenceInMinutes(endAt, startAt);
  const initialDuration = durationOptions.includes(draggedDuration)
    ? draggedDuration
    : (durationOptions[0] ?? 30);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { durationMinutes: initialDuration },
  });
  const selectedDuration = watch('durationMinutes') || initialDuration;
  const previewEndAt = addMinutes(startAt, selectedDuration);

  function submit(values: BookingFormValues) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, message] of Object.entries(error.fields))
        setError(field as keyof BookingFormValues, { type: 'server', message });
    }
    onSubmit({
      title: values.title,
      startAt: startAt.toISOString(),
      endAt: addMinutes(startAt, values.durationMinutes).toISOString(),
      roomId: '',
    });
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="booking-summary">
        <span>{roomName}</span>
        <strong>
          {startAt.toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
          {previewEndAt.toLocaleTimeString('uk-UA', { timeStyle: 'short' })}
        </strong>
        <small>Часова зона: Europe/Kyiv</small>
      </div>
      <div className="duration-field">
        <span className="field-label">Тривалість зустрічі</span>
        <div className="duration-options" role="radiogroup" aria-label="Тривалість зустрічі">
          {durationOptions.map((minutes) => (
            <label
              className={`duration-option ${selectedDuration === minutes ? 'duration-option-active' : ''}`}
              key={minutes}
            >
              <input
                type="radio"
                value={minutes}
                {...register('durationMinutes', { valueAsNumber: true })}
              />
              <span>{formatDuration(minutes)}</span>
            </label>
          ))}
        </div>
        {errors.durationMinutes?.message ? (
          <p className="field-error">{errors.durationMinutes.message}</p>
        ) : null}
      </div>
      <Input
        label="Назва зустрічі"
        placeholder="Наприклад, Планування спринту"
        autoFocus
        error={errors.title?.message}
        {...register('title')}
      />
      {error && !(error instanceof ApiError && error.fields) ? (
        <p className="form-error">{error.message}</p>
      ) : null}
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Бронюємо…' : 'Забронювати'}
        </Button>
      </div>
    </form>
  );
}
