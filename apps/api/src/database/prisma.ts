import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

export const prisma = new PrismaClient();
export const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  await sessionPool.end();
}
