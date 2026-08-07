import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must contain at least 32 characters'),
  OFFICE_TIMEZONE: z.string().min(1).default('Europe/Kyiv'),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  NOTIFY_BEFORE_MINUTES: z.coerce.number().int().nonnegative().default(10),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  SMTP_HOST: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().default('no-reply@roomly.local'),
  EMAIL_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  EMAIL_VERIFICATION_EXPIRES_HOURS: z.coerce.number().int().positive().default(24),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsedEnv.data;
