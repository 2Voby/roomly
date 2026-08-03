import type { BookingDto } from '@roomly/shared';

export type BookingView = BookingDto;

export interface CreateBookingInput {
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
}

export type BookingListType = 'upcoming' | 'past';
