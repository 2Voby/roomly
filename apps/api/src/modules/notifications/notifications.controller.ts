import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { NotificationsService } from './notifications.service.js';
import type { MarkNotificationsReadRequest, NotificationsQuery } from './notifications.schemas.js';

const notificationsService = new NotificationsService();

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const { query } = getValidated<{
    body: unknown;
    params: Record<string, unknown>;
    query: NotificationsQuery;
  }>(res);
  const result = await notificationsService.list(req.session.userId as string, query.limit);
  sendSuccess(res, result.items, {
    limit: result.limit,
    total: result.total,
    unreadCount: result.unreadCount,
  });
}

export async function markNotificationsRead(req: Request, res: Response): Promise<void> {
  const { body } = getValidated<{
    body: MarkNotificationsReadRequest;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
  }>(res);
  const updated = await notificationsService.markRead(req.session.userId as string, body);
  sendSuccess(res, { updated });
}
