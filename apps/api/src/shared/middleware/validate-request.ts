import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params)
        req.params = schemas.params.parse(req.params) as unknown as typeof req.params;
      if (schemas.query) req.query = schemas.query.parse(req.query) as unknown as typeof req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
}
