import type { Booking } from '../types';

export function findBookingConflict(
  bookings: Booking[],
  startAt: Date | null,
  endAt: Date | null,
): Booking | null {
  if (!startAt || !endAt || startAt >= endAt) return null;
  return (
    bookings.find(
      (booking) => new Date(booking.startAt) < endAt && new Date(booking.endAt) > startAt,
    ) ?? null
  );
}
