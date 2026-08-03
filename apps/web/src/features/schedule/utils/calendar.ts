import type { Booking } from '../../bookings/types';
import {
  CALENDAR_END_MINUTES,
  CALENDAR_SLOT_MINUTES,
  CALENDAR_START_MINUTES,
  minutesFromOfficeStart,
  officeDateTimeToUtc,
} from '../../../lib/dates';

export const SLOT_COUNT = (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) / CALENDAR_SLOT_MINUTES;

export function bookingStyle(booking: Booking): { top: number; height: number } {
  const top = minutesFromOfficeStart(new Date(booking.startAt)) / CALENDAR_SLOT_MINUTES;
  const duration =
    (new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60_000;
  return { top, height: Math.max(1, duration / CALENDAR_SLOT_MINUTES) };
}

export function slotRange(dayKey: string, slotIndex: number) {
  const startMinutes = CALENDAR_START_MINUTES + slotIndex * CALENDAR_SLOT_MINUTES;
  return {
    startAt: officeDateTimeToUtc(dayKey, startMinutes),
    endAt: officeDateTimeToUtc(dayKey, startMinutes + CALENDAR_SLOT_MINUTES),
  };
}
