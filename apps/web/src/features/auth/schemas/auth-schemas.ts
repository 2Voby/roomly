import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Введіть коректний email'),
  password: z.string().min(1, 'Введіть пароль'),
});

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Введіть імʼя')
    .max(100, 'Імʼя має бути не довшим за 100 символів'),
  email: z.string().trim().toLowerCase().email('Введіть коректний email'),
  password: z
    .string()
    .min(8, 'Пароль має містити щонайменше 8 символів')
    .max(72, 'Пароль надто довгий'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
