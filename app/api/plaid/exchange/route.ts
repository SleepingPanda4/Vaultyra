import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/session";
import { pool } from "../../../../lib/database";
import { encryptSecret } from "../../../../lib/encryption";
import { plaid, plaidConfigured } from "../../../../lib/plaid";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!plaidConfigured()) return NextResponse.json({ error: "Bank connections are not configured." }, { status: 503 });
  const body = await request.json();
  if (!body.publicToken) return NextResponse.json({ error: "Missing bank authorization" }, { status: 400 });
  const exchange = await plaid.itemPublicTokenExchange({ public_token: body.publicToken });
  const accessToken = exchange.data.access_token;
  const accountsResponse = await plaid.accountsGet({ access_token: accessToken });
  const selected = new Set<string>(Array.isArray(body.selectedAccountIds) ? body.selectedAccountIds : []);
  const permitted = selected.size ? accountsResponse.data.accounts.filter((account) => selected.has(account.account_id)) : accountsResponse.data.accounts;
  const institution = String(body.institutionName ?? "Connected institution").slice(0, 120);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const item = await client.query(
      `INSERT INTO plaid_items(user_id,item_id,access_token_encrypted,institution_name) VALUES($1,$2,$3,$4)
       ON CONFLICT(item_id) DO UPDATE SET access_token_encrypted=excluded.access_token_encrypted,status='active',updated_at=now()
       WHERE plaid_items.user_id=excluded.user_id
       RETURNING id`, [user.id, exchange.data.item_id, encryptSecret(accessToken), institution]
    );
    if (!item.rowCount) throw new Error("This bank connection belongs to a different Vaultyra user");
    for (const account of permitted) {
      const current = account.balances.current ?? account.balances.available ?? 0;
      const liability = ["credit", "loan"].includes(String(account.type).toLowerCase());
      await client.query(
        `INSERT INTO financial_accounts(user_id,name,institution,account_type,balance_cents,currency,color,provider,external_id,plaid_item_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,'plaid',$8,$9)
         ON CONFLICT(user_id,provider,external_id) DO UPDATE SET name=excluded.name,institution=excluded.institution,account_type=excluded.account_type,balance_cents=excluded.balance_cents,plaid_item_id=excluded.plaid_item_id,updated_at=now()`,
        [user.id, account.name, institution, String(account.subtype ?? account.type), Math.round((liability ? -Math.abs(current) : current) * 100), account.balances.iso_currency_code ?? "USD", "#48e6bd", account.account_id, item.rows[0].id]
      );
    }
    await client.query(`INSERT INTO audit_events(user_id,event_type,metadata) VALUES($1,'bank.connected',$2)`, [user.id, JSON.stringify({ itemId: exchange.data.item_id, accounts: permitted.length })]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  return NextResponse.json({ accountsAdded: permitted.length });
}
