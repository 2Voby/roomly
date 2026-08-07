import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { bookingsApi } from '../api/bookings-api';
import type { CreateBookingInput, UpdateBookingInput } from '../types';

export function useMyBookings(type: 'upcoming' | 'past') {
  return useInfiniteQuery({
    queryKey: ['bookings', 'my', type],
    queryFn: ({ pageParam, signal }) => bookingsApi.mine(type, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    },
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

export function useUpdateBookingParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      participantEmails,
    }: {
      bookingId: string;
      participantEmails: string[];
    }) => bookingsApi.updateParticipants(bookingId, participantEmails),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: UpdateBookingInput }) =>
      bookingsApi.update(bookingId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    },
  });
}

export function useCancelBookingSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seriesId: string) => bookingsApi.cancelSeries(seriesId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] });
    },
  });
}
