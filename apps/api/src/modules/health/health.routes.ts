import { Router } from 'express';

import { sendSuccess } from '../../shared/http/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  sendSuccess(res, { status: 'ok' }, { timestamp: new Date().toISOString() });
});
