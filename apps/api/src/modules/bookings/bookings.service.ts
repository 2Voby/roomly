import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../shared/errors/error-codes.js';
import {
  getWeekRangeUtc,
  isHalfHour,
  isWithinWorkingHours,
  minutesBetween,
} from '../../shared/utils/dates.js';
import { RoomsRepository } from '../rooms/rooms.repository.js';
import { BookingsRepository, type BookingRecord } from './bookings.repository.js';
import type { CreateBookingRequest } from './bookings.schemas.js';
import type { BookingListType, BookingView } from './bookings.types.js';

function toBookingView(booking: BookingRecord): BookingView {
  return {
    id: booking.id,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    roomId: booking.roomId,
    userId: booking.userId,
    userName: booking.user.name,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
  };
}

function isExclusionConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string; meta?: unknown };
  const diagnostic = `${candidate.message ?? ''} ${JSON.stringify(candidate.meta ?? '')}`;
  return candidate.code === 'P2004' && diagnostic.includes('bookings_active_room_time_excl');
}

export class BookingsService {
  constructor(
    private readonly bookingsRepository = new BookingsRepository(),
    private readonly roomsRepository = new RoomsRepository(),
  ) {}

  async listForRoom(roomId: string, weekStart: string): Promise<BookingView[]> {
    await this.roomsRepository.findById(roomId).then((room) => {
      if (!room) throw new AppError('ROOM_NOT_FOUND', 'Переговорну кімнату не знайдено', 404);
    });
    const range = getWeekRangeUtc(weekStart, env.OFFICE_TIMEZONE);
    const bookings = await this.bookingsRepository.listForRoom(roomId, range.start, range.end);
    return bookings.map(toBookingView);
  }

  async create(userId: string, input: CreateBookingRequest): Promise<BookingView> {
    const room = await this.roomsRepository.findById(input.roomId);
    if (!room) throw new AppError('ROOM_NOT_FOUND', 'Переговорну кімнату не знайдено', 404);

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    const fields: Record<string, string> = {};

    if (startAt >= endAt) fields.endAt = 'Кінець має бути пізніше за початок';
    if (!isHalfHour(startAt, env.OFFICE_TIMEZONE))
      fields.startAt = 'Початок має бути кратним 30 хвилинам';
    if (!isHalfHour(endAt, env.OFFICE_TIMEZONE))
      fields.endAt = 'Кінець має бути кратним 30 хвилинам';
    if (Object.keys(fields).length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Перевірте час бронювання', 400, fields);
    }

    if (startAt <= new Date()) {
      throw new AppError('BOOKING_IN_PAST', 'Не можна бронювати час у минулому', 400);
    }

    const duration = minutesBetween(startAt, endAt);
    if (duration < 30 || duration > 240) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Тривалість має бути від 30 хвилин до 4 годин',
        400,
        {
          endAt: 'Оберіть тривалість від 30 хвилин до 4 годин',
        },
      );
    }

    if (!isWithinWorkingHours(startAt, endAt, env.OFFICE_TIMEZONE)) {
      throw new AppError(
        'OUTSIDE_WORKING_HOURS',
        'Бронювання доступне з 09:00 до 19:00 за Europe/Kyiv',
        400,
      );
    }

    const existing = await this.bookingsRepository.findActiveOverlap(input.roomId, startAt, endAt);
    if (existing) throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);

    try {
      const result = await this.bookingsRepository.createWithAvailability({
        title: input.title.trim(),
        startAt,
        endAt,
        roomId: input.roomId,
        userId,
      });
      if (result.conflict || !result.booking) {
        throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);
      }
      return toBookingView(result.booking);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (isExclusionConstraintError(error)) {
        throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);
      }
      throw error;
    }
  }

  async cancel(userId: string, bookingId: string): Promise<BookingView> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 'Бронювання не знайдено', 404);
    if (booking.userId !== userId)
      throw new AppError('FORBIDDEN', 'Можна скасувати лише власне бронювання', 403);
    if (booking.cancelledAt) return toBookingView(booking);
    return toBookingView(await this.bookingsRepository.cancel(bookingId, new Date()));
  }

  async listMine(
    userId: string,
    type: BookingListType,
    page: number,
    limit: number,
  ): Promise<{ items: BookingView[]; total: number; page: number; limit: number }> {
    const now = new Date();
    const [total, bookings] = await Promise.all([
      this.bookingsRepository.countMine(userId, type, now),
      this.bookingsRepository.listMine(userId, type, now, (page - 1) * limit, limit),
    ]);
    return { items: bookings.map(toBookingView), total, page, limit };
  }
}
