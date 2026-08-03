import { apiRequest } from '../../../lib/api-client';
import type { Booking, CreateBookingInput } from '../types';

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
    apiRequest<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  cancel: (bookingId: string) =>
    apiRequest<Booking>(`/api/bookings/${bookingId}`, { method: 'DELETE' }),
  mine: (type: 'upcoming' | 'past', signal?: AbortSignal) =>
    apiRequest<Booking[]>(`/api/bookings/my?type=${type}&page=1&limit=50`, { signal }),
};
