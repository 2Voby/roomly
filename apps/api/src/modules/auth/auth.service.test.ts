import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import type { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import type { UsersService } from '../users/users.service.js';

describe('AuthService email verification', () => {
  it('hashes the raw token before looking it up', async () => {
    const user = {
      id: 'user-id',
      name: 'Олена',
      email: 'olena@example.com',
      emailVerifiedAt: new Date('2026-08-04T10:00:00.000Z'),
      createdAt: new Date('2026-08-04T09:00:00.000Z'),
    };
    const verifyEmail = vi.fn().mockResolvedValue(user);
    const authRepository = { verifyEmail } as unknown as AuthRepository;
    const usersService = {} as UsersService;
    const service = new AuthService(authRepository, usersService);
    const rawToken = 'a'.repeat(64);

    await expect(service.verifyEmail(rawToken)).resolves.toMatchObject({
      id: 'user-id',
      emailVerifiedAt: '2026-08-04T10:00:00.000Z',
    });
    expect(verifyEmail).toHaveBeenCalledWith(
      createHash('sha256').update(rawToken).digest('hex'),
      expect.any(Date),
    );
  });

  it('rejects an expired or unknown token', async () => {
    const authRepository = {
      verifyEmail: vi.fn().mockResolvedValue(null),
    } as unknown as AuthRepository;
    const service = new AuthService(authRepository, {} as UsersService);

    await expect(service.verifyEmail('b'.repeat(64))).rejects.toMatchObject({
      code: 'EMAIL_VERIFICATION_INVALID',
      statusCode: 400,
    });
  });
});
