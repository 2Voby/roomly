import { z } from 'zod';

export const userSearchQuerySchema = z.object({
  email: z.string().trim().toLowerCase().min(2).max(100),
});

export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
