import type { RequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError('VALIDATION_ERROR', 'Маршрут не знайдено', 404));
};
