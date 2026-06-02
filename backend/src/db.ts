import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/expense_tracker",
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
export { pool };
