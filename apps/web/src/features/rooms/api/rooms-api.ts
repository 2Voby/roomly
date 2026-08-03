import { apiRequest } from '../../../lib/api-client';
import type { Booking } from '../../bookings/types';
import type { Room } from '../types';

export const roomsApi = {
  list: (signal?: AbortSignal) => apiRequest<Room[]>('/api/rooms', { signal }),
  bookings: (roomId: string, weekStart: string, signal?: AbortSignal) =>
    apiRequest<Booking[]>(
      `/api/rooms/${roomId}/bookings?weekStart=${encodeURIComponent(weekStart)}`,
      { signal },
    ),
};
