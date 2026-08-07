import type { BookingDto, CreateBookingResultDto, MyBookingsMetaDto } from '@roomly/shared';

export type Booking = BookingDto;
export type CreateBookingResult = CreateBookingResultDto;

export interface UpdateBookingInput {
  title?: string;
  startAt?: string;
  endAt?: string;
  participantEmails?: string[];
}

export interface CreateBookingInput {
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
  participantEmails: string[];
  recurrence?: {
    type: 'weekly';
    occurrences: number;
  };
}

export interface BookingPage {
  items: Booking[];
  meta: MyBookingsMetaDto;
}
