import type { Request, Response } from 'express';

import { env } from '../../config/env.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { RoomsService } from './rooms.service.js';

const roomsService = new RoomsService();
const bookingsService = new BookingsService();

export async function listRooms(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await roomsService.list());
}

export async function listRoomAvailability(req: Request, res: Response): Promise<void> {
  const { query } = getValidated<{
    body: unknown;
    params: Record<string, unknown>;
    query: { at?: string };
  }>(res);
  const at = query.at ? new Date(query.at) : new Date();
  sendSuccess(res, await roomsService.availability(at), {
    timezone: env.OFFICE_TIMEZONE,
    at: at.toISOString(),
  });
}

export async function listRoomBookings(req: Request, res: Response): Promise<void> {
  const { params, query } = getValidated<{
    body: unknown;
    params: { roomId: string };
    query: { weekStart: string };
  }>(res);
  const bookings = await bookingsService.listForRoom(params.roomId, query.weekStart);
  sendSuccess(res, bookings);
}
