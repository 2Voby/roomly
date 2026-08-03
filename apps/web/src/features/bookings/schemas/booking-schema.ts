import { z } from 'zod';

export const bookingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву зустрічі')
    .max(100, 'Назва має бути не довшою за 100 символів'),
  durationMinutes: z
    .number()
    .int()
    .min(30, 'Мінімальна тривалість — 30 хвилин')
    .max(240, 'Максимальна тривалість — 4 години'),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
