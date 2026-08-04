import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { toZonedTime } from 'date-fns-tz';

import type { Booking } from '../../bookings/types';
import { BOOKING_MAX_DURATION_MINUTES, CALENDAR_SLOT_MINUTES, isToday } from '../../../lib/dates';
import { OFFICE_TIMEZONE } from '../../../lib/timezone';
import { BookingCard } from './BookingCard';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { isSlotBooked, slotRange } from '../utils/calendar';

interface SlotSelection {
  startIndex: number;
  endIndex: number;
}

interface DragState {
  startIndex: number;
  pointerId: number;
}

export function DayColumn({
  dayKey,
  bookings,
  currentUserId,
  workingStartMinutes,
  workingEndMinutes,
  onSlotSelect,
  onBookingClick,
}: {
  dayKey: string;
  bookings: Booking[];
  currentUserId: string;
  workingStartMinutes: number;
  workingEndMinutes: number;
  onSlotSelect: (startAt: Date, endAt: Date) => void;
  onBookingClick: (booking: Booking) => void;
}) {
  const slotCount = (workingEndMinutes - workingStartMinutes) / CALENDAR_SLOT_MINUTES;
  const maxBookingSlots = BOOKING_MAX_DURATION_MINUTES / CALENDAR_SLOT_MINUTES;
  const dayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const current = toZonedTime(new Date(), OFFICE_TIMEZONE);
  const localMinutes = current.getHours() * 60 + current.getMinutes();
  const currentTop =
    ((localMinutes - workingStartMinutes) / (workingEndMinutes - workingStartMinutes)) * 100;

  const blockedSlots = Array.from({ length: slotCount }, (_, index) =>
    isSlotBooked(slotRange(dayKey, index, workingStartMinutes), bookings),
  );

  function clampSlotIndex(index: number) {
    return Math.max(0, Math.min(slotCount - 1, index));
  }

  function getSlotIndexFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = dayRef.current?.getBoundingClientRect();
    if (!bounds || bounds.height <= 0) return 0;
    return clampSlotIndex(Math.floor(((event.clientY - bounds.top) / bounds.height) * slotCount));
  }

  function getContiguousSelection(startIndex: number, targetIndex: number): SlotSelection {
    const direction = targetIndex >= startIndex ? 1 : -1;
    let endIndex = targetIndex;

    for (
      let index = startIndex;
      direction === 1 ? index <= targetIndex : index >= targetIndex;
      index += direction
    ) {
      if (blockedSlots[index] || Math.abs(index - startIndex) >= maxBookingSlots) {
        endIndex = index - direction;
        break;
      }
    }

    return {
      startIndex: Math.min(startIndex, endIndex),
      endIndex: Math.max(startIndex, endIndex),
    };
  }

  function emitSelection(selected: SlotSelection) {
    const start = slotRange(dayKey, selected.startIndex, workingStartMinutes);
    const end = slotRange(dayKey, selected.endIndex + 1, workingStartMinutes);
    onSlotSelect(start.startAt, end.endAt);
  }

  function handlePointerDown(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (blockedSlots[index]) {
      event.preventDefault();
      return;
    }

    if (event.pointerType !== 'mouse') {
      event.preventDefault();
      suppressClickRef.current = true;
      emitSelection({ startIndex: index, endIndex: index });
      return;
    }

    event.preventDefault();
    dayRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { startIndex: index, pointerId: event.pointerId };
    setSelection({ startIndex: index, endIndex: index });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setSelection(getContiguousSelection(drag.startIndex, getSlotIndexFromPointer(event)));
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const selected = getContiguousSelection(drag.startIndex, getSlotIndexFromPointer(event));
    dragRef.current = null;
    suppressClickRef.current = true;
    setSelection(null);
    if (dayRef.current?.hasPointerCapture(event.pointerId)) {
      dayRef.current.releasePointerCapture(event.pointerId);
    }
    emitSelection(selected);
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    suppressClickRef.current = true;
    setSelection(null);
    if (dayRef.current?.hasPointerCapture(event.pointerId)) {
      dayRef.current.releasePointerCapture(event.pointerId);
    }
  }

  function handleSlotClick(index: number) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!blockedSlots[index]) emitSelection({ startIndex: index, endIndex: index });
  }

  return (
    <div
      className={`day-column ${isToday(dayKey) ? 'day-column-today' : ''}`}
      ref={dayRef}
      style={{ '--calendar-slot-size': `${100 / slotCount}%` } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={cancelDrag}
    >
      {Array.from({ length: slotCount }, (_, index) => {
        const range = slotRange(dayKey, index, workingStartMinutes);
        const isSelected =
          selection !== null && index >= selection.startIndex && index <= selection.endIndex;
        const isBlocked = blockedSlots[index];

        return (
          <button
            className={`slot-button ${isSelected ? 'slot-button-selected' : ''} ${isBlocked ? 'slot-button-blocked' : ''}`}
            style={{
              top: `${(index / slotCount) * 100}%`,
              height: `${100 / slotCount}%`,
            }}
            type="button"
            key={range.startAt.toISOString()}
            aria-disabled={isBlocked}
            aria-label={
              isBlocked
                ? `Зайнятий слот ${range.startAt.toLocaleString('uk-UA')}`
                : `Вільний слот ${range.startAt.toLocaleString('uk-UA')}`
            }
            onPointerDown={(event) => handlePointerDown(index, event)}
            onClick={() => handleSlotClick(index)}
          />
        );
      })}
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          isMine={booking.userId === currentUserId}
          workingStartMinutes={workingStartMinutes}
          workingEndMinutes={workingEndMinutes}
          onClick={() => onBookingClick(booking)}
        />
      ))}
      {isToday(dayKey) && currentTop >= 0 && currentTop <= 100 ? (
        <CurrentTimeIndicator top={currentTop} />
      ) : null}
    </div>
  );
}
