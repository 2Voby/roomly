import type { User } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export class UsersRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findByEmails(emails: string[]): Promise<User[]> {
    return prisma.user.findMany({ where: { email: { in: emails } } });
  }

  searchByEmail(email: string, excludedUserId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        id: { not: excludedUserId },
        email: { contains: email, mode: 'insensitive' },
      },
      orderBy: { email: 'asc' },
      take: 8,
    });
  }
}
