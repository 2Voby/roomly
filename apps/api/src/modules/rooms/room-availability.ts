import { addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import type { RoomAvailabilityDto } from '@roomly/shared';

interface AvailabilityRoom {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  workStartMinutes: number;
  workEndMinutes: number;
  createdAt: Date;
}

interface AvailabilityBooking {
  startAt: Date;
  endAt: Date;
}

function officeDateTime(date: Date, minutes: number, timezone: string): Date {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const localDate = format(toZonedTime(date, timezone), 'yyyy-MM-dd');
  return fromZonedTime(
    `${localDate}T${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}:00`,
    timezone,
  );
}

export function getRoomAvailability(
  room: AvailabilityRoom,
  bookings: AvailabilityBooking[],
  at: Date,
  timezone: string,
): RoomAvailabilityDto {
  const local = toZonedTime(at, timezone);
  const localMinutes = local.getHours() * 60 + local.getMinutes();
  const activeBooking = bookings.find((booking) => booking.startAt <= at && booking.endAt > at);
  const isClosed = localMinutes < room.workStartMinutes || localMinutes >= room.workEndMinutes;
  const nextOpening =
    localMinutes < room.workStartMinutes
      ? officeDateTime(at, room.workStartMinutes, timezone)
      : officeDateTime(addDays(at, 1), room.workStartMinutes, timezone);

  const status: RoomAvailabilityDto['status'] = isClosed
    ? 'closed'
    : activeBooking
      ? 'occupied'
      : 'available';

  return {
    id: room.id,
    name: room.name,
    floor: room.floor,
    capacity: room.capacity,
    workStartMinutes: room.workStartMinutes,
    workEndMinutes: room.workEndMinutes,
    createdAt: room.createdAt.toISOString(),
    status,
    occupiedUntil: activeBooking?.endAt.toISOString() ?? null,
    nextAvailableAt:
      activeBooking?.endAt.toISOString() ?? (isClosed ? nextOpening.toISOString() : null),
  };
}
