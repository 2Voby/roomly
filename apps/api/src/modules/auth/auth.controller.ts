import type { Request, Response } from 'express';

import { asyncController } from '../../shared/http/async-controller.js';
import { sendSuccess } from '../../shared/http/api-response.js';
import { getValidated } from '../../shared/middleware/validate-request.js';
import { AuthService } from './auth.service.js';
import type { LoginInput, RegisterInput, VerifyEmailQuery } from './auth.schemas.js';

const authService = new AuthService();

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { body } = getValidated<{
    body: RegisterInput;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
  }>(res);
  const user = await authService.register(body);
  await regenerateSession(req);
  req.session.userId = user.id;
  sendSuccess(res, user);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { body } = getValidated<{
    body: LoginInput;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
  }>(res);
  const user = await authService.login(body);
  await regenerateSession(req);
  req.session.userId = user.id;
  sendSuccess(res, user);
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { query } = getValidated<{
    body: unknown;
    params: Record<string, unknown>;
    query: VerifyEmailQuery;
  }>(res);
  const user = await authService.verifyEmail(query.token);
  sendSuccess(res, user);
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.session.userId) await destroySession(req);
  res.clearCookie('connect.sid');
  sendSuccess(res, null);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.session.userId as string);
  sendSuccess(res, user);
}

export { asyncController };
