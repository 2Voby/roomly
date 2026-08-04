import { useQuery } from '@tanstack/react-query';

import { roomsApi } from '../api/rooms-api';

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: ({ signal }) => roomsApi.list(signal) });
}

export function useRoomAvailability() {
  return useQuery({
    queryKey: ['rooms', 'availability'],
    queryFn: ({ signal }) => roomsApi.availability(new Date(), signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRoomBookings(roomId: string | undefined, weekStart: string) {
  return useQuery({
    queryKey: ['rooms', roomId, 'bookings', weekStart],
    queryFn: ({ signal }) => roomsApi.bookings(roomId as string, weekStart, signal),
    enabled: Boolean(roomId),
  });
}
