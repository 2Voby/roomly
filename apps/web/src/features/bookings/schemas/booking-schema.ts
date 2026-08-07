import { z } from 'zod';

import { timeToMinutes } from '../utils/booking-time';

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Оберіть час у форматі HH:MM');

export const bookingFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Введіть назву зустрічі')
      .max(100, 'Назва має бути не довшою за 100 символів'),
    startTime: timeSchema,
    endTime: timeSchema,
    participantEmails: z.array(z.string().email()).max(20),
    recurrenceEnabled: z.boolean(),
    occurrences: z.number().int().min(2).max(52),
  })
  .superRefine((values, context) => {
    const startMinutes = timeToMinutes(values.startTime);
    const endMinutes = timeToMinutes(values.endTime);

    if (startMinutes !== null && startMinutes % 30 !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startTime'],
        message: 'Початок має бути кратним 30 хвилинам',
      });
    }
    if (endMinutes !== null && endMinutes % 30 !== 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Кінець має бути кратним 30 хвилинам',
      });
    }
    if (startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Кінець має бути пізніше за початок',
      });
    }
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
