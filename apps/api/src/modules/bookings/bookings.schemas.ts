import { z } from 'zod';

const participantEmailSchema = z.string().trim().toLowerCase().email('Введіть коректний email');

export const createBookingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву бронювання')
    .max(100, 'Назва має бути не довшою за 100 символів'),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  roomId: z.string().uuid(),
  participantEmails: z.array(participantEmailSchema).max(20).default([]),
});

export const bookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const myBookingsQuerySchema = z.object({
  type: z.enum(['upcoming', 'past']).default('upcoming'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;
export type MyBookingsQuery = z.infer<typeof myBookingsQuerySchema>;
