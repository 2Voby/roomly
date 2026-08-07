import { Router } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';
import {
  cancelBooking,
  cancelBookingSeries,
  createBooking,
  listMyBookings,
  updateBooking,
  updateBookingParticipants,
} from './bookings.controller.js';
import {
  bookingParamsSchema,
  createBookingSchema,
  myBookingsQuerySchema,
  seriesParamsSchema,
  updateBookingSchema,
  updateBookingParticipantsSchema,
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
bookingsRouter.patch(
  '/:bookingId',
  validateRequest({ params: bookingParamsSchema, body: updateBookingSchema }),
  asyncController(updateBooking),
);
bookingsRouter.patch(
  '/:bookingId/participants',
  validateRequest({ params: bookingParamsSchema, body: updateBookingParticipantsSchema }),
  asyncController(updateBookingParticipants),
);
bookingsRouter.delete(
  '/:bookingId',
  validateRequest({ params: bookingParamsSchema }),
  asyncController(cancelBooking),
);

export const bookingSeriesRouter = Router();
bookingSeriesRouter.use(requireAuth);
bookingSeriesRouter.delete(
  '/:seriesId',
  validateRequest({ params: seriesParamsSchema }),
  asyncController(cancelBookingSeries),
);
