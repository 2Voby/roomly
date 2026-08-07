import type { User } from '@prisma/client';

import { prisma } from '../../database/prisma.js';

export class AuthRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return prisma.user.create({ data });
  }

  createEmailVerificationToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    return prisma.emailVerificationToken.create({ data }).then(() => undefined);
  }

  async verifyEmail(tokenHash: string, verifiedAt: Date): Promise<User | null> {
    return prisma.$transaction(async (tx) => {
      const token = await tx.emailVerificationToken.findUnique({ where: { tokenHash } });
      if (!token || token.usedAt || token.expiresAt <= verifiedAt) return null;

      const user = await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: verifiedAt },
      });
      await tx.emailVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: verifiedAt },
      });
      return user;
    });
  }
}
