process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '4000';
process.env.DATABASE_URL ??= 'postgresql://roomly:roomly@localhost:5432/roomly?schema=public';
process.env.SESSION_SECRET ??= 'test-secret-that-is-long-enough-for-runtime-validation';
process.env.WEB_ORIGIN ??= 'http://localhost:5173';
process.env.OFFICE_TIMEZONE ??= 'Europe/Kyiv';
process.env.NOTIFY_BEFORE_MINUTES ??= '10';
