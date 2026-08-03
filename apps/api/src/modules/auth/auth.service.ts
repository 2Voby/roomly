import bcrypt from 'bcrypt';

import { AppError } from '../../shared/errors/app-error.js';
import { normalizeEmail } from '../../shared/utils/email.js';
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
    const user = await this.authRepository.create({
      name: input.name.trim(),
      email,
      passwordHash,
    });
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
