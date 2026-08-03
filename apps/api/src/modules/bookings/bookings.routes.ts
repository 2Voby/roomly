import { Router } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';
import { cancelBooking, createBooking, listMyBookings } from './bookings.controller.js';
import {
  bookingParamsSchema,
  createBookingSchema,
  myBookingsQuerySchema,
} from './bookings.schemas.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);
bookingsRouter.get(
  '/my',
  validateRequest({ query: myBookingsQuerySchema }),
  asyncController(listMyBookings),
);
bookingsRouter.post(
  '/',
  validateRequest({ body: createBookingSchema }),
  asyncController(createBooking),
);
bookingsRouter.delete(
  '/:bookingId',
  validateRequest({ params: bookingParamsSchema }),
  asyncController(cancelBooking),
);
