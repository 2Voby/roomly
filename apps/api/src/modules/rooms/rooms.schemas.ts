import { z } from 'zod';

export const roomParamsSchema = z.object({
  roomId: z.string().uuid(),
});

export const roomBookingsQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart має бути у форматі YYYY-MM-DD'),
});
