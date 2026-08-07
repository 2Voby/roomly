import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createRequire } from 'node:module';
import type { RequestHandler } from 'express';

import { env } from './config/env.js';
import { sessionMiddleware } from './config/session.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { bookingSeriesRouter, bookingsRouter } from './modules/bookings/bookings.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { roomsRouter } from './modules/rooms/rooms.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { notFound } from './shared/middleware/not-found.js';

const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http') as (options?: Record<string, unknown>) => RequestHandler;

export const app = express();

app.set('trust proxy', 1);
app.use(pinoHttp());
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(sessionMiddleware);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/booking-series', bookingSeriesRouter);
app.use('/api/notifications', notificationsRouter);

app.use(notFound);
app.use(errorHandler);
