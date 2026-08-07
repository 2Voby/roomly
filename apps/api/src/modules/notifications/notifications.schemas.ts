import { z } from 'zod';

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().uuid()).max(100).default([]),
});

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;
export type MarkNotificationsReadRequest = z.infer<typeof markNotificationsReadSchema>;
