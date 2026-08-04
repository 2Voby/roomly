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

describe('API error contracts', () => {
  it('returns a predictable validation error for invalid registration input', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: ' ',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toEqual(
      expect.objectContaining({ name: expect.any(String), email: expect.any(String) }),
    );
  });

  it('protects room availability behind the session middleware', async () => {
    const response = await request(app).get('/api/rooms/availability');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns a predictable not-found response for unknown API routes', async () => {
    const response = await request(app).get('/api/not-a-real-route');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
