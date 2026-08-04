import { Router } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';
import { searchUsers } from './users.controller.js';
import { userSearchQuerySchema } from './users.schemas.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get(
  '/',
  validateRequest({ query: userSearchQuerySchema }),
  asyncController(searchUsers),
);
