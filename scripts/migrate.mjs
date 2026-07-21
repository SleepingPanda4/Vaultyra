import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const files = ["db/init.sql", ...(await readdir(resolve("db/migrations"))).sort().map((file) => `db/migrations/${file}`)];
const client = await pool.connect();

try {
  await client.query("SELECT pg_advisory_lock(87952341)");
  await client.query(`CREATE TABLE IF NOT EXISTS vaultyra_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  for (const file of files) {
    const exists = await client.query(`SELECT 1 FROM vaultyra_migrations WHERE name=$1`, [file]);
    if (exists.rowCount) continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(resolve(file), "utf8"));
      await client.query(`INSERT INTO vaultyra_migrations(name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      process.stdout.write(`Applied ${file}\n`);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  }
} finally { await client.query("SELECT pg_advisory_unlock(87952341)"); client.release(); }
await pool.end();
