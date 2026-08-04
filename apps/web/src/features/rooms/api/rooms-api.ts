import { apiRequest } from '../../../lib/api-client';
import type { Booking } from '../../bookings/types';
import type { Room, RoomAvailability } from '../types';

export const roomsApi = {
  list: (signal?: AbortSignal) => apiRequest<Room[]>('/api/rooms', { signal }),
  availability: (at: Date, signal?: AbortSignal) =>
    apiRequest<RoomAvailability[]>(
      `/api/rooms/availability?at=${encodeURIComponent(at.toISOString())}`,
      { signal },
    ),
  bookings: (roomId: string, weekStart: string, signal?: AbortSignal) =>
    apiRequest<Booking[]>(
      `/api/rooms/${roomId}/bookings?weekStart=${encodeURIComponent(weekStart)}`,
      { signal },
    ),
};
