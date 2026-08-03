import { z } from 'zod';

export const bookingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Введіть назву зустрічі')
    .max(100, 'Назва має бути не довшою за 100 символів'),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
