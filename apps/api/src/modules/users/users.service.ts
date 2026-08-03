import { AppError } from '../../shared/errors/app-error.js';
import { UsersRepository } from './users.repository.js';
import type { PublicUser } from './users.types.js';

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getById(id: string): Promise<PublicUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Користувача не знайдено', 401);
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
