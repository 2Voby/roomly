import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { RoomsService } from './rooms.service.js';

const roomsService = new RoomsService();
const bookingsService = new BookingsService();

export async function listRooms(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await roomsService.list());
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
