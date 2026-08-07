import type { BookingDto, CreateBookingResultDto } from '@roomly/shared';

export type BookingView = BookingDto;
export type CreateBookingResult = CreateBookingResultDto;

export interface CreateBookingInput {
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
}

export type BookingListType = 'upcoming' | 'past';
