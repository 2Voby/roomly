import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { BookingsService } from './bookings.service.js';
import type {
  CreateBookingRequest,
  MyBookingsQuery,
  UpdateBookingParticipantsRequest,
  UpdateBookingRequest,
} from './bookings.schemas.js';

const bookingsService = new BookingsService();

export async function createBooking(req: Request, res: Response): Promise<void> {
  const { body } = getValidated<{
    body: CreateBookingRequest;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
  }>(res);
  const booking = await bookingsService.create(req.session.userId as string, body);
  sendSuccess(res, booking);
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const { params } = getValidated<{
    body: unknown;
    params: { bookingId: string };
    query: Record<string, unknown>;
  }>(res);
  const booking = await bookingsService.cancel(req.session.userId as string, params.bookingId);
  sendSuccess(res, booking);
}

export async function cancelBookingSeries(req: Request, res: Response): Promise<void> {
  const { params } = getValidated<{
    body: unknown;
    params: { seriesId: string };
    query: Record<string, unknown>;
  }>(res);
  const result = await bookingsService.cancelSeries(req.session.userId as string, params.seriesId);
  sendSuccess(res, result);
}

export async function updateBooking(req: Request, res: Response): Promise<void> {
  const { body, params } = getValidated<{
    body: UpdateBookingRequest;
    params: { bookingId: string };
    query: Record<string, unknown>;
  }>(res);
  const booking = await bookingsService.updateBooking(
    req.session.userId as string,
    params.bookingId,
    body,
  );
  sendSuccess(res, booking);
}

export async function updateBookingParticipants(req: Request, res: Response): Promise<void> {
  const { body, params } = getValidated<{
    body: UpdateBookingParticipantsRequest;
    params: { bookingId: string };
    query: Record<string, unknown>;
  }>(res);
  const booking = await bookingsService.updateParticipants(
    req.session.userId as string,
    params.bookingId,
    body,
  );
  sendSuccess(res, booking);
}

export async function listMyBookings(req: Request, res: Response): Promise<void> {
  const { query } = getValidated<{
    body: unknown;
    params: Record<string, unknown>;
    query: MyBookingsQuery;
  }>(res);
  const result = await bookingsService.listMine(
    req.session.userId as string,
    query.type,
    query.page,
    query.limit,
  );
  sendSuccess(res, result.items, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
    summary: result.summary,
  });
}
