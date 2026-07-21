import { pool } from "./database";
import { decryptSecret } from "./encryption";
import { plaid, plaidConfigured } from "./plaid";

type PlaidItemRow = { id: string; user_id: string; access_token_encrypted: string; cursor: string | null };

function signedBalance(account: { type: string; balances: { current: number | null; available: number | null } }) {
  const current = account.balances.current ?? account.balances.available ?? 0;
  return ["credit", "loan"].includes(String(account.type).toLowerCase()) ? -Math.abs(current) : current;
}

export async function syncPlaidItem(item: PlaidItemRow) {
  const accessToken = decryptSecret(item.access_token_encrypted);
  const accountResponse = await plaid.accountsGet({ access_token: accessToken });
  for (const account of accountResponse.data.accounts) {
    await pool.query(
      `UPDATE financial_accounts SET name=$1,account_type=$2,balance_cents=$3,updated_at=now()
       WHERE user_id=$4 AND provider='plaid' AND external_id=$5`,
      [account.name, String(account.subtype ?? account.type), Math.round(signedBalance(account as never) * 100), item.user_id, account.account_id]
    );
  }

  let cursor = item.cursor ?? undefined;
  let hasMore = true;
  while (hasMore) {
    const response = await plaid.transactionsSync({ access_token: accessToken, cursor, options: { include_personal_finance_category: true } });
    for (const transaction of [...response.data.added, ...response.data.modified]) {
      const account = await pool.query(`SELECT id FROM financial_accounts WHERE user_id=$1 AND provider='plaid' AND external_id=$2`, [item.user_id, transaction.account_id]);
      if (!account.rowCount) continue;
      await pool.query(
        `INSERT INTO transactions(user_id,account_id,occurred_on,description,category,amount_cents,external_id)
         VALUES($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT(user_id,account_id,external_id) DO UPDATE SET occurred_on=excluded.occurred_on,description=excluded.description,category=excluded.category,amount_cents=excluded.amount_cents`,
        [item.user_id, account.rows[0].id, transaction.date, transaction.merchant_name ?? transaction.name, transaction.personal_finance_category?.primary ?? "Uncategorized", Math.round(-transaction.amount * 100), transaction.transaction_id]
      );
    }
    for (const removed of response.data.removed) await pool.query(`DELETE FROM transactions WHERE user_id=$1 AND external_id=$2`, [item.user_id, removed.transaction_id]);
    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }
  await pool.query(`UPDATE plaid_items SET cursor=$1,status='active',error_code=NULL,last_synced_at=now(),updated_at=now() WHERE id=$2`, [cursor, item.id]);
}

export async function syncAllPlaidItems() {
  if (!plaidConfigured()) return { synced: 0, skipped: true };
  const { rows } = await pool.query<PlaidItemRow>(`SELECT id,user_id,access_token_encrypted,cursor FROM plaid_items WHERE status <> 'disconnected'`);
  let synced = 0;
  for (const item of rows) {
    try { await syncPlaidItem(item); synced += 1; }
    catch (error) {
      const code = error instanceof Error ? error.message.slice(0, 120) : "SYNC_FAILED";
      await pool.query(`UPDATE plaid_items SET status='error',error_code=$1,updated_at=now() WHERE id=$2`, [code, item.id]);
    }
  }
  return { synced, skipped: false };
}
