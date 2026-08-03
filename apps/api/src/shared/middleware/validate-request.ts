import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export type ValidatedRequestData = {
  body: unknown;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
};

export function getValidated<T extends ValidatedRequestData>(res: {
  locals: { validated?: ValidatedRequestData };
}): T {
  if (!res.locals.validated) throw new Error('Validated request data is not available');
  return res.locals.validated as T;
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      res.locals.validated = {
        body: schemas.body ? schemas.body.parse(req.body) : req.body,
        params: (schemas.params ? schemas.params.parse(req.params) : req.params) as Record<
          string,
          unknown
        >,
        query: (schemas.query ? schemas.query.parse(req.query) : req.query) as Record<
          string,
          unknown
        >,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
