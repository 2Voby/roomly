import type { BookingDto } from '@roomly/shared';

export type Booking = BookingDto;

export interface CreateBookingInput {
  title: string;
  startAt: string;
  endAt: string;
  roomId: string;
  participantEmails: string[];
}
