import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Введіть коректний email');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Введіть імʼя')
    .max(100, 'Імʼя має бути не довшим за 100 символів'),
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Пароль має містити щонайменше 8 символів')
    .max(72, 'Пароль надто довгий'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Введіть пароль'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
