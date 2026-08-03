import express from 'express';
import request from 'supertest';
import { z } from 'zod';

import { validateRequest } from './validate-request.js';

describe('validateRequest', () => {
  it('stores parsed query and params in response locals without mutating Express 5 getters', async () => {
    const testApp = express();
    testApp.get(
      '/:roomId',
      validateRequest({
        params: z.object({ roomId: z.string().min(1) }),
        query: z.object({ page: z.coerce.number().int().positive() }),
      }),
      (_req, res) => res.json(res.locals.validated),
    );

    const response = await request(testApp).get('/room-1?page=2');

    expect(response.status).toBe(200);
    expect(response.body.params.roomId).toBe('room-1');
    expect(response.body.query.page).toBe(2);
  });
});
