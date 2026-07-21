import { Pool } from "pg";

const globalForDb = globalThis as unknown as { vaultyraPool?: Pool };

export const pool = globalForDb.vaultyraPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});

if (process.env.NODE_ENV !== "production") globalForDb.vaultyraPool = pool;
