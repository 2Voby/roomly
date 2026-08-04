import { apiRequest, apiRequestWithMeta } from '../../../lib/api-client';
import type { Booking, BookingPage, CreateBookingInput } from '../types';
import type { MyBookingsMetaDto } from '@roomly/shared';

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
    apiRequest<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  cancel: (bookingId: string) =>
    apiRequest<Booking>(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
  mine: (type: 'upcoming' | 'past', page: number, signal?: AbortSignal): Promise<BookingPage> =>
    apiRequestWithMeta<Booking[], MyBookingsMetaDto>(
      `/api/bookings/my?type=${type}&page=${page}&limit=20`,
      { signal },
    ).then((response) => ({ items: response.data, meta: response.meta })),
};
