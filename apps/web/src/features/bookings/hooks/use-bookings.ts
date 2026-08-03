import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bookingsApi } from '../api/bookings-api';
import type { CreateBookingInput } from '../types';

export function useMyBookings(type: 'upcoming' | 'past') {
  return useQuery({
    queryKey: ['bookings', 'my', type],
    queryFn: ({ signal }) => bookingsApi.mine(type, signal),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    },
  });
}
