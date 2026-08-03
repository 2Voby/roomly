import type { ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const log = (req as typeof req & { log?: Logger }).log;

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      log?.error({ err: error, code: error.code }, error.message);
    }
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.') || 'request', issue.message]),
    );
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Перевірте правильність введених даних',
        fields,
      },
    });
    return;
  }

  log?.error({ err: error }, 'Unhandled HTTP error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Внутрішня помилка сервера',
    },
  });
};
