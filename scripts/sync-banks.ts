import { syncAllPlaidItems } from "../lib/plaid-sync";
import { pool } from "../lib/database";

const result = await syncAllPlaidItems();
process.stdout.write(`${new Date().toISOString()} bank sync: ${JSON.stringify(result)}\n`);
await pool.end();
