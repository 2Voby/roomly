import { apiRequest, apiRequestWithMeta } from '../../../lib/api-client';
import type {
  Booking,
  BookingPage,
  CreateBookingInput,
  CreateBookingResult,
  UpdateBookingInput,
} from '../types';
import type { MyBookingsMetaDto } from '@roomly/shared';

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
    apiRequest<CreateBookingResult>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  cancel: (bookingId: string) =>
    apiRequest<Booking>(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
  updateParticipants: (bookingId: string, participantEmails: string[]) =>
    apiRequest<Booking>(`/api/bookings/${bookingId}/participants`, {
      method: 'PATCH',
      body: JSON.stringify({ participantEmails }),
    }),
  update: (bookingId: string, input: UpdateBookingInput) =>
    apiRequest<Booking>(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  cancelSeries: (seriesId: string) =>
    apiRequest<{ seriesId: string; cancelledCount: number }>(`/api/booking-series/${seriesId}`, {
      method: 'DELETE',
    }),
  mine: (type: 'upcoming' | 'past', page: number, signal?: AbortSignal): Promise<BookingPage> =>
    apiRequestWithMeta<Booking[], MyBookingsMetaDto>(
      `/api/bookings/my?type=${type}&page=${page}&limit=20`,
      { signal },
    ).then((response) => ({ items: response.data, meta: response.meta })),
};
