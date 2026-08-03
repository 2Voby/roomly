import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { ApiError } from '../../../lib/api-client';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { bookingFormSchema, type BookingFormValues } from '../schemas/booking-schema';
import type { CreateBookingInput } from '../types';

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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({ resolver: zodResolver(bookingFormSchema) });

  function submit(values: BookingFormValues) {
    if (error instanceof ApiError && error.fields) {
      for (const [field, message] of Object.entries(error.fields))
        setError(field as keyof BookingFormValues, { type: 'server', message });
    }
    onSubmit({
      title: values.title,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      roomId: '',
    });
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="booking-summary">
        <span>{roomName}</span>
        <strong>
          {startAt.toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })} —{' '}
          {endAt.toLocaleTimeString('uk-UA', { timeStyle: 'short' })}
        </strong>
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
