import request from 'supertest';

import { app } from './app.js';

describe('health API', () => {
  it('returns the standard success envelope', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.meta.timestamp).toEqual(expect.any(String));
  });
});
