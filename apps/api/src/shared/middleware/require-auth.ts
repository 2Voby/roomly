import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) {
    next(new AppError('UNAUTHORIZED', 'Потрібно увійти в систему', 401));
    return;
  }
  next();
};
