export interface BookingInterval {
  startAt: Date;
  endAt: Date;
}

export function intervalsOverlap(existing: BookingInterval, next: BookingInterval): boolean {
  return existing.startAt < next.endAt && existing.endAt > next.startAt;
}

export function bookingsConflict(
  existingRoomId: string,
  existing: BookingInterval,
  nextRoomId: string,
  next: BookingInterval,
): boolean {
  return existingRoomId === nextRoomId && intervalsOverlap(existing, next);
}
