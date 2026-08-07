import { Router } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';
import { listNotifications, markNotificationsRead } from './notifications.controller.js';
import { markNotificationsReadSchema, notificationsQuerySchema } from './notifications.schemas.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get(
  '/',
  validateRequest({ query: notificationsQuerySchema }),
  asyncController(listNotifications),
);
notificationsRouter.post(
  '/read',
  validateRequest({ body: markNotificationsReadSchema }),
  asyncController(markNotificationsRead),
);
