import type { Request, Response } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { UsersService } from './users.service.js';
import type { UserSearchQuery } from './users.schemas.js';

const usersService = new UsersService();

export async function searchUsers(req: Request, res: Response): Promise<void> {
  const { query } = getValidated<{
    body: unknown;
    params: Record<string, unknown>;
    query: UserSearchQuery;
  }>(res);
  const users = await usersService.searchByEmail(query.email, req.session.userId as string);
  sendSuccess(res, users);
}
