import { AppError } from '../../shared/errors/app-error.js';
import { normalizeEmail } from '../../shared/utils/email.js';
import { UsersRepository } from './users.repository.js';
import type { PublicUser } from './users.types.js';

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getById(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Користувача не знайдено', 401);
    }
    return toPublicUser(user);
  }

  async searchByEmail(email: string, currentUserId: string): Promise<PublicUser[]> {
    const users = await this.usersRepository.searchByEmail(normalizeEmail(email), currentUserId);
    return users.map(toPublicUser);
  }
}
