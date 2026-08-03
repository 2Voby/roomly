import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';
import { BookingsService } from './bookings.service.js';
import type { CreateBookingRequest, MyBookingsQuery } from './bookings.schemas.js';

const bookingsService = new BookingsService();

export async function createBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingsService.create(
    req.session.userId as string,
    req.body as CreateBookingRequest,
  );
  sendSuccess(res, booking);
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingsService.cancel(
    req.session.userId as string,
    String(req.params.bookingId),
  );
  sendSuccess(res, booking);
}

export async function listMyBookings(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as MyBookingsQuery;
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
  });
}
