import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';

import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { normalizeEmail } from '../../shared/utils/email.js';
import { enqueueEmail } from '../notifications/email-queue.js';
import { createConfirmationEmailJob } from '../notifications/email-templates.js';
import { UsersService } from '../users/users.service.js';
import { AuthRepository } from './auth.repository.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import type { AuthUser } from './auth.types.js';

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueEmailError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export class AuthService {
  constructor(
    private readonly authRepository = new AuthRepository(),
    private readonly usersService = new UsersService(),
  ) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    const email = normalizeEmail(input.email);
    const existing = await this.authRepository.findByEmail(email);
    if (existing) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 'Користувач із таким email уже існує', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    let user;
    try {
      user = await this.authRepository.create({
        name: input.name.trim(),
        email,
        passwordHash,
      });
    } catch (error) {
      if (isUniqueEmailError(error)) {
        throw new AppError('EMAIL_ALREADY_EXISTS', 'Користувач із таким email уже існує', 409);
      }
      throw error;
    }
    const rawToken = randomBytes(32).toString('hex');
    await this.authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash: hashVerificationToken(rawToken),
      expiresAt: new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_HOURS * 60 * 60 * 1000),
    });
    const verificationUrl = `${env.WEB_ORIGIN}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const emailJob = createConfirmationEmailJob(
      user.id,
      { name: user.name, email: user.email },
      verificationUrl,
    );
    if (!env.SMTP_HOST) {
      process.stdout.write(`Email verification link for ${user.email}: ${verificationUrl}\n`);
    }
    void enqueueEmail('email-confirmation', emailJob).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Unable to enqueue email verification for ${user.email}: ${message}\n`);
    });
    return toAuthUser(user);
  }

  async verifyEmail(token: string): Promise<AuthUser> {
    const user = await this.authRepository.verifyEmail(hashVerificationToken(token), new Date());
    if (!user) {
      throw new AppError(
        'EMAIL_VERIFICATION_INVALID',
        'Посилання підтвердження недійсне або вже прострочене',
        400,
      );
    }
    return toAuthUser(user);
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const email = normalizeEmail(input.email);
    const user = await this.authRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('UNAUTHORIZED', 'Неправильний email або пароль', 401);
    }
    return toAuthUser(user);
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    return this.usersService.getById(userId);
  }
}
