import type { User } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export class UsersRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
