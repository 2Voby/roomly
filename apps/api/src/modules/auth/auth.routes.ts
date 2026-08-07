import { Router } from 'express';

import { asyncController, login, logout, me, register, verifyEmail } from './auth.controller.js';
import { loginSchema, registerSchema, verifyEmailQuerySchema } from './auth.schemas.js';
import { requireAuth } from '../../shared/middleware/require-auth.js';
import { validateRequest } from '../../shared/middleware/validate-request.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest({ body: registerSchema }), asyncController(register));
authRouter.post('/login', validateRequest({ body: loginSchema }), asyncController(login));
authRouter.get(
  '/verify-email',
  validateRequest({ query: verifyEmailQuerySchema }),
  asyncController(verifyEmail),
);
authRouter.post('/logout', asyncController(logout));
authRouter.get('/me', requireAuth, asyncController(me));
