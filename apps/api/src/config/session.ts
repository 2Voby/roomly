import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { env } from './env.js';
import { sessionPool } from '../database/prisma.js';

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: false,
  }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 14,
  },
});
