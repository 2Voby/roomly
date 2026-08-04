import { Router } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';
import { listRoomAvailability, listRoomBookings, listRooms } from './rooms.controller.js';
import {
  roomAvailabilityQuerySchema,
  roomBookingsQuerySchema,
  roomParamsSchema,
} from './rooms.schemas.js';

export const roomsRouter = Router();

roomsRouter.use(requireAuth);
roomsRouter.get('/', asyncController(listRooms));
roomsRouter.get(
  '/availability',
  validateRequest({ query: roomAvailabilityQuerySchema }),
  asyncController(listRoomAvailability),
);
roomsRouter.get(
  '/:roomId/bookings',
  validateRequest({ params: roomParamsSchema, query: roomBookingsQuerySchema }),
  asyncController(listRoomBookings),
);
