import type { Booking } from '../../bookings/types';
import {
  BOOKING_MAX_DURATION_MINUTES,
  CALENDAR_END_MINUTES,
  CALENDAR_SLOT_MINUTES,
  CALENDAR_START_MINUTES,
  minutesFromOfficeStart,
  officeDateTimeToUtc,
} from '../../../lib/dates';

export const SLOT_COUNT = (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES;
export const MAX_BOOKING_SLOTS = BOOKING_MAX_DURATION_MINUTES / CALENDAR_SLOT_MINUTES;

export interface BookingColor {
  background: string;
  border: string;
  accent: string;
  text: string;
}

const BOOKING_COLORS: BookingColor[] = [
  { background: '#dcecff', border: '#8dbcf5', accent: '#2563eb', text: '#173b73' },
  { background: '#e6defe', border: '#b9a4f4', accent: '#7c3aed', text: '#452080' },
  { background: '#ffe8d4', border: '#f5b581', accent: '#ea580c', text: '#7c2d12' },
  { background: '#dff5e6', border: '#9ed9ad', accent: '#16a34a', text: '#185c2b' },
  { background: '#ffe0e7', border: '#f3a5b7', accent: '#db2777', text: '#831843' },
  { background: '#fff0c9', border: '#e9c96e', accent: '#ca8a04', text: '#713f12' },
];

export function bookingColorForUser(userId: string): BookingColor {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return BOOKING_COLORS[Math.abs(hash) % BOOKING_COLORS.length]!;
}

export function bookingStyle(booking: Booking): { top: number; height: number } {
  const top = minutesFromOfficeStart(new Date(booking.startAt)) / CALENDAR_SLOT_MINUTES;
  const duration =
    (new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60_000;
  return { top, height: Math.max(1, duration / CALENDAR_SLOT_MINUTES) };
}

export function isSlotBooked(range: { startAt: Date; endAt: Date }, bookings: Booking[]) {
  return bookings.some(
    (booking) => new Date(booking.startAt) < range.endAt && new Date(booking.endAt) > range.startAt,
  );
}

export function slotRange(dayKey: string, slotIndex: number) {
  const startMinutes = CALENDAR_START_MINUTES + slotIndex * CALENDAR_SLOT_MINUTES;
  return {
    startAt: officeDateTimeToUtc(dayKey, startMinutes),
    endAt: officeDateTimeToUtc(dayKey, startMinutes + CALENDAR_SLOT_MINUTES),
  };
}
