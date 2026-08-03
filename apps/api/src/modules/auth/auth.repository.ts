import type { User } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export class AuthRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return prisma.user.create({ data });
  }
}
