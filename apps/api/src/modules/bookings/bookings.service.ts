import type { Notification } from '@prisma/client';
import { format, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../shared/errors/error-codes.js';
import {
  formatClockMinutes,
  formatOfficeDate,
  getWeekRangeUtc,
  isHalfHour,
  isWithinWorkingHours,
  minutesBetween,
} from '../../shared/utils/dates.js';
import { createEmailJob } from '../notifications/email-templates.js';
import { enqueueEmail, type EmailJobName } from '../notifications/email-queue.js';
import { createNotificationDraft } from '../notifications/notification-content.js';
import {
  createSeriesEmailJob,
  createSeriesNotificationDraft,
  type SeriesNotificationContext,
} from '../notifications/series-notifications.js';
import type { BookingNotificationContext } from '../notifications/notifications.types.js';
import { RoomsRepository } from '../rooms/rooms.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { exceedsRoomCapacity } from './booking-capacity.js';
import {
  generateWeeklyOccurrences,
  MAX_SERIES_OCCURRENCES,
  WEEKLY_FREQUENCY,
} from './booking-series.js';
import { BookingsRepository, type BookingRecord } from './bookings.repository.js';
import type {
  CreateBookingRequest,
  UpdateBookingParticipantsRequest,
  UpdateBookingRequest,
} from './bookings.schemas.js';
import type { BookingListType, BookingView, CreateBookingResult } from './bookings.types.js';

function toBookingView(booking: BookingRecord): BookingView {
  return {
    id: booking.id,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    roomId: booking.roomId,
    roomName: booking.room.name,
    roomFloor: booking.room.floor,
    roomCapacity: booking.room.capacity,
    userId: booking.userId,
    userName: booking.user.name,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    participants: booking.participants.map(({ user }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
    series:
      booking.series && booking.seriesIndex !== null
        ? {
            id: booking.series.id,
            frequency: booking.series.frequency as 'weekly',
            occurrenceCount: booking.series.occurrenceCount,
            occurrenceIndex: booking.seriesIndex + 1,
            isException: booking.isException,
            firstStartAt: booking.series.firstStartAt.toISOString(),
            timezone: booking.series.timezone,
          }
        : null,
  };
}

function isExclusionConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string; meta?: unknown };
  const diagnostic = `${candidate.message ?? ''} ${JSON.stringify(candidate.meta ?? '')}`;
  return candidate.code === 'P2004' && diagnostic.includes('bookings_active_room_time_excl');
}

function emailJobName(type: Notification['type']): EmailJobName | null {
  if (type === 'participant_added') return 'participant-added';
  if (type === 'participant_removed') return 'participant-removed';
  if (type === 'booking_cancelled') return 'booking-cancelled';
  return null;
}

function queueEmailJobs(
  notifications: Notification[],
  recipients: Array<{ id: string; name: string; email: string }>,
  context: BookingNotificationContext,
): void {
  const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]));
  for (const notification of notifications) {
    const name = emailJobName(notification.type);
    const recipient = recipientsById.get(notification.userId);
    if (!name || !recipient) continue;
    const job = createEmailJob(name, notification.id, recipient, context);
    void enqueueEmail(name, job).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Unable to enqueue email ${notification.id}: ${message}\n`);
    });
  }
}

function queueSeriesEmailJobs(
  notifications: Notification[],
  recipients: Array<{ id: string; name: string; email: string }>,
  type: Extract<EmailJobName, 'series-participant-added' | 'series-cancelled'>,
  context: SeriesNotificationContext,
): void {
  const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]));
  for (const notification of notifications) {
    const recipient = recipientsById.get(notification.userId);
    if (!recipient) continue;
    const job = createSeriesEmailJob(type, notification.id, recipient, context);
    void enqueueEmail(type, job).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Unable to enqueue series email ${notification.id}: ${message}\n`);
    });
  }
}

function uniqueUsers(users: Array<{ id: string; name: string; email: string }>) {
  return [...new Map(users.map((user) => [user.id, user])).values()];
}

export class BookingsService {
  constructor(
    private readonly bookingsRepository = new BookingsRepository(),
    private readonly roomsRepository = new RoomsRepository(),
    private readonly usersRepository = new UsersRepository(),
  ) {}

  async listForRoom(roomId: string, weekStart: string): Promise<BookingView[]> {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new AppError('ROOM_NOT_FOUND', 'Переговорну кімнату не знайдено', 404);
    const range = getWeekRangeUtc(weekStart, env.OFFICE_TIMEZONE);
    const bookings = await this.bookingsRepository.listForRoom(roomId, range.start, range.end);
    return bookings.map(toBookingView);
  }

  async create(userId: string, input: CreateBookingRequest): Promise<CreateBookingResult> {
    const room = await this.roomsRepository.findById(input.roomId);
    if (!room) throw new AppError('ROOM_NOT_FOUND', 'Переговорну кімнату не знайдено', 404);

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    const organizer = await this.usersRepository.findById(userId);
    if (!organizer) throw new AppError('UNAUTHORIZED', 'Сесію користувача не знайдено', 401);
    if (!organizer.emailVerifiedAt) {
      throw new AppError(
        ERROR_CODES.EMAIL_NOT_VERIFIED,
        'Підтвердіть email перед створенням бронювання',
        403,
      );
    }

    const participantEmails = [...new Set(input.participantEmails)];
    const participantUsers = await this.usersRepository.findByEmails(participantEmails);
    const missingParticipantEmails = participantEmails.filter(
      (email) => !participantUsers.some((user) => user.email === email),
    );
    if (missingParticipantEmails.length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Перевірте email учасників зустрічі', 400, {
        participantEmails: `Користувача не знайдено: ${missingParticipantEmails.join(', ')}`,
      });
    }
    const participantUserIds = participantUsers
      .filter((user) => user.id !== userId)
      .map((user) => user.id);
    if (exceedsRoomCapacity(room.capacity, participantUserIds.length)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Кількість людей перевищує місткість переговорної',
        400,
        {
          participantEmails: `У кімнаті може бути не більше ${room.capacity} людей разом з організатором`,
        },
      );
    }

    const duration = minutesBetween(startAt, endAt);
    if (duration < 30 || duration > 240) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Тривалість має бути від 30 хвилин до 4 годин',
        400,
        { endAt: 'Оберіть тривалість від 30 хвилин до 4 годин' },
      );
    }
    if (input.recurrence && input.recurrence.occurrences > MAX_SERIES_OCCURRENCES) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Серія може містити не більше 52 зустрічей',
        400,
      );
    }

    const occurrences = input.recurrence
      ? generateWeeklyOccurrences(
          startAt,
          duration,
          input.recurrence.occurrences,
          env.OFFICE_TIMEZONE,
        )
      : [{ index: 0, startAt, endAt }];
    const firstOccurrence = occurrences[0]!;
    const lastOccurrence = occurrences.at(-1)!;
    const fields: Record<string, string> = {};
    const now = new Date();
    for (const occurrence of occurrences) {
      if (occurrence.startAt >= occurrence.endAt)
        fields.endAt = 'Кінець має бути пізніше за початок';
      if (!isHalfHour(occurrence.startAt, env.OFFICE_TIMEZONE))
        fields.startAt = 'Початок має бути кратним 30 хвилинам';
      if (!isHalfHour(occurrence.endAt, env.OFFICE_TIMEZONE))
        fields.endAt = 'Кінець має бути кратним 30 хвилинам';
      if (occurrence.startAt <= now) fields.startAt = 'Не можна бронювати час у минулому';
      if (
        !isWithinWorkingHours(
          occurrence.startAt,
          occurrence.endAt,
          env.OFFICE_TIMEZONE,
          room.workStartMinutes,
          room.workEndMinutes,
        )
      ) {
        fields.endAt = `Бронювання доступне з ${formatClockMinutes(room.workStartMinutes)} до ${formatClockMinutes(room.workEndMinutes)} за ${env.OFFICE_TIMEZONE}`;
      }
    }
    if (Object.keys(fields).length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Перевірте час бронювання', 400, fields);
    }

    const existing = await this.bookingsRepository.findActiveOverlaps(
      input.roomId,
      firstOccurrence.startAt,
      lastOccurrence.endAt,
    );
    const conflicts = occurrences
      .map((occurrence) => ({
        occurrence,
        booking: existing.find(
          (booking) => booking.startAt < occurrence.endAt && booking.endAt > occurrence.startAt,
        ),
      }))
      .filter((item) => item.booking);
    if (conflicts.length > 0) {
      if (!input.recurrence) throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);
      throw new AppError(
        ERROR_CODES.BOOKING_SERIES_CONFLICT,
        'Один або кілька повторів уже зайняті',
        409,
        undefined,
        {
          conflicts: conflicts.map(({ occurrence, booking }) => ({
            startAt: occurrence.startAt.toISOString(),
            endAt: occurrence.endAt.toISOString(),
            title: booking!.title,
          })),
        },
      );
    }

    const context: BookingNotificationContext = {
      roomId: room.id,
      roomName: room.name,
      title: input.title.trim(),
      organizerName: organizer.name,
      startAt: firstOccurrence.startAt,
      endAt: firstOccurrence.endAt,
    };
    const participantRecipients = participantUsers.filter((user) => user.id !== userId);
    const participantNotifications = input.recurrence
      ? []
      : participantRecipients.map((user) =>
          createNotificationDraft(user.id, 'participant_added', context),
        );
    const seriesContext: SeriesNotificationContext | null = input.recurrence
      ? {
          roomName: room.name,
          title: input.title.trim(),
          organizerName: organizer.name,
          firstStartAt: firstOccurrence.startAt,
          lastStartAt: lastOccurrence.startAt,
          occurrenceCount: occurrences.length,
        }
      : null;
    const seriesNotifications = seriesContext
      ? participantRecipients.map((user) =>
          createSeriesNotificationDraft(user.id, 'series_participant_added', seriesContext),
        )
      : [];

    try {
      const result = await this.bookingsRepository.createWithAvailability({
        title: input.title.trim(),
        roomId: input.roomId,
        userId,
        occurrences,
        participantUserIds,
        participantNotifications,
        seriesNotifications,
        series: input.recurrence
          ? {
              frequency: WEEKLY_FREQUENCY,
              occurrenceCount: occurrences.length,
              firstStartAt: firstOccurrence.startAt,
              durationMinutes: duration,
              timezone: env.OFFICE_TIMEZONE,
            }
          : undefined,
      });
      if (result.conflict || result.bookings.length === 0) {
        if (input.recurrence) {
          throw new AppError(
            ERROR_CODES.BOOKING_SERIES_CONFLICT,
            'Один із повторів щойно зайняли. Серію не створено.',
            409,
          );
        }
        throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);
      }
      if (seriesContext) {
        queueSeriesEmailJobs(
          result.notifications,
          participantRecipients,
          'series-participant-added',
          seriesContext,
        );
      } else {
        queueEmailJobs(result.notifications, participantRecipients, context);
      }
      const bookings = result.bookings.map(toBookingView);
      const firstBooking = bookings[0];
      if (!firstBooking)
        throw new AppError('BOOKING_NOT_FOUND', 'Створене бронювання не знайдено', 500);
      return { booking: firstBooking, bookings, series: firstBooking.series };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (isExclusionConstraintError(error)) {
        if (input.recurrence) {
          throw new AppError(
            ERROR_CODES.BOOKING_SERIES_CONFLICT,
            'Один із повторів щойно зайняли. Серію не створено.',
            409,
          );
        }
        throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);
      }
      throw error;
    }
  }

  async updateBooking(
    userId: string,
    bookingId: string,
    input: UpdateBookingRequest,
  ): Promise<BookingView> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 'Бронювання не знайдено', 404);
    if (booking.userId !== userId)
      throw new AppError('FORBIDDEN', 'Змінювати можна лише власне бронювання', 403);
    if (booking.cancelledAt || booking.startAt <= new Date()) {
      throw new AppError(
        'BOOKING_PARTICIPANTS_LOCKED',
        'Змінювати можна лише майбутню зустріч',
        409,
      );
    }

    const startAt = input.startAt ? new Date(input.startAt) : booking.startAt;
    const endAt = input.endAt ? new Date(input.endAt) : booking.endAt;
    if (
      formatOfficeDate(startAt, env.OFFICE_TIMEZONE) !==
      formatOfficeDate(booking.startAt, env.OFFICE_TIMEZONE)
    ) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Окремий повтор не можна переносити на іншу дату',
        400,
      );
    }
    const duration = minutesBetween(startAt, endAt);
    if (
      startAt >= endAt ||
      !isHalfHour(startAt, env.OFFICE_TIMEZONE) ||
      !isHalfHour(endAt, env.OFFICE_TIMEZONE) ||
      duration < 30 ||
      duration > 240 ||
      !isWithinWorkingHours(
        startAt,
        endAt,
        env.OFFICE_TIMEZONE,
        booking.room.workStartMinutes,
        booking.room.workEndMinutes,
      )
    ) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Перевірте час окремого повтору', 400);
    }
    if (startAt <= new Date())
      throw new AppError('BOOKING_IN_PAST', 'Не можна бронювати час у минулому', 400);

    const overlap = (
      await this.bookingsRepository.findActiveOverlaps(booking.roomId, startAt, endAt)
    ).find((item) => item.id !== bookingId);
    if (overlap) throw new AppError('BOOKING_CONFLICT', 'Цей час уже зайнятий', 409);

    const participants = input.participantEmails
      ? await this.usersRepository.findByEmails([...new Set(input.participantEmails)])
      : booking.participants.map(({ user }) => user);
    if (input.participantEmails) {
      const missing = [...new Set(input.participantEmails)].filter(
        (email) => !participants.some((user) => user.email === email),
      );
      if (missing.length > 0) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Перевірте email учасників зустрічі',
          400,
          {
            participantEmails: `Користувача не знайдено: ${missing.join(', ')}`,
          },
        );
      }
    }
    const nextParticipants = participants.filter((user) => user.id !== userId);
    if (exceedsRoomCapacity(booking.room.capacity, nextParticipants.length)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Кількість людей перевищує місткість переговорної',
        400,
      );
    }
    const currentIds = new Set(booking.participants.map(({ userId: id }) => id));
    const nextIds = new Set(nextParticipants.map(({ id }) => id));
    const added = nextParticipants.filter(({ id }) => !currentIds.has(id));
    const removed = booking.participants
      .map(({ user }) => user)
      .filter(({ id }) => !nextIds.has(id));
    const context: BookingNotificationContext = {
      roomId: booking.roomId,
      roomName: booking.room.name,
      title: input.title?.trim() ?? booking.title,
      organizerName: booking.user.name,
      startAt,
      endAt,
    };
    const result = await this.bookingsRepository.updateParticipants({
      bookingId,
      participantUserIds: nextParticipants.map(({ id }) => id),
      addedNotifications: added.map((user) =>
        createNotificationDraft(user.id, 'participant_added', context),
      ),
      removedNotifications: removed.map((user) =>
        createNotificationDraft(user.id, 'participant_removed', context),
      ),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.startAt !== undefined || input.endAt !== undefined ? { startAt, endAt } : {}),
    });
    if (!result) throw new AppError('BOOKING_NOT_FOUND', 'Бронювання не знайдено', 404);
    queueEmailJobs(result.notifications, [...added, ...removed], context);
    return toBookingView(result.booking);
  }

  async updateParticipants(
    userId: string,
    bookingId: string,
    input: UpdateBookingParticipantsRequest,
  ): Promise<BookingView> {
    return this.updateBooking(userId, bookingId, { participantEmails: input.participantEmails });
  }

  async cancel(userId: string, bookingId: string): Promise<BookingView> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new AppError('BOOKING_NOT_FOUND', 'Бронювання не знайдено', 404);
    if (booking.userId !== userId)
      throw new AppError('FORBIDDEN', 'Можна скасувати лише власне бронювання', 403);
    if (booking.cancelledAt) return toBookingView(booking);
    if (booking.startAt <= new Date())
      throw new AppError('BOOKING_IN_PAST', 'Зустріч уже розпочалася', 409);
    const context: BookingNotificationContext = {
      roomId: booking.roomId,
      roomName: booking.room.name,
      title: booking.title,
      organizerName: booking.user.name,
      startAt: booking.startAt,
      endAt: booking.endAt,
    };
    const participantNotifications = booking.participants.map(({ user }) =>
      createNotificationDraft(user.id, 'booking_cancelled', context),
    );
    const result = await this.bookingsRepository.cancelWithNotifications(
      bookingId,
      new Date(),
      participantNotifications,
    );
    if (!result) throw new AppError('BOOKING_NOT_FOUND', 'Бронювання не знайдено', 404);
    queueEmailJobs(
      result.notifications,
      booking.participants.map(({ user }) => user),
      context,
    );
    return toBookingView(result.booking);
  }

  async cancelSeries(
    userId: string,
    seriesId: string,
  ): Promise<{ seriesId: string; cancelledCount: number }> {
    const series = await this.bookingsRepository.findSeriesById(seriesId);
    if (!series) throw new AppError('BOOKING_NOT_FOUND', 'Серію бронювань не знайдено', 404);
    if (series.userId !== userId)
      throw new AppError('FORBIDDEN', 'Можна скасувати лише власну серію', 403);
    const allParticipants = uniqueUsers(
      series.bookings.flatMap((booking) => booking.participants.map(({ user }) => user)),
    );
    const firstBooking = series.bookings[0];
    const lastBooking = series.bookings.at(-1) ?? firstBooking;
    const context: SeriesNotificationContext = {
      roomName: series.bookings[0]?.room.name ?? 'переговорній',
      title: firstBooking?.title ?? 'зустріч',
      organizerName: firstBooking?.user.name ?? '',
      firstStartAt: series.firstStartAt,
      lastStartAt: lastBooking?.startAt ?? series.firstStartAt,
      occurrenceCount: series.occurrenceCount,
    };
    const notifications = allParticipants.map((user) =>
      createSeriesNotificationDraft(user.id, 'series_cancelled', context),
    );
    const result = await this.bookingsRepository.cancelSeriesWithNotifications(
      seriesId,
      new Date(),
      new Date(),
      notifications,
    );
    if (!result) throw new AppError('BOOKING_NOT_FOUND', 'Серію бронювань не знайдено', 404);
    if (result.notifications.length > 0) {
      queueSeriesEmailJobs(result.notifications, allParticipants, 'series-cancelled', context);
    }
    return { seriesId, cancelledCount: result.cancelledCount };
  }

  async listMine(
    userId: string,
    type: BookingListType,
    page: number,
    limit: number,
  ): Promise<{
    items: BookingView[];
    total: number;
    page: number;
    limit: number;
    summary: { upcomingThisWeek: number; upcomingDurationMinutes: number };
  }> {
    const now = new Date();
    const weekStart = startOfWeek(toZonedTime(now, env.OFFICE_TIMEZONE), { weekStartsOn: 1 });
    const weekRange = getWeekRangeUtc(format(weekStart, 'yyyy-MM-dd'), env.OFFICE_TIMEZONE);
    const [total, bookings, upcomingThisWeek] = await Promise.all([
      this.bookingsRepository.countMine(userId, type, now),
      this.bookingsRepository.listMine(userId, type, now, (page - 1) * limit, limit),
      this.bookingsRepository.listUpcomingForPeriod(userId, weekRange.start, weekRange.end, now),
    ]);
    return {
      items: bookings.map(toBookingView),
      total,
      page,
      limit,
      summary: {
        upcomingThisWeek: upcomingThisWeek.length,
        upcomingDurationMinutes: upcomingThisWeek.reduce(
          (minutes, booking) => minutes + minutesBetween(booking.startAt, booking.endAt),
          0,
        ),
      },
    };
  }
}
