import { NextResponse } from "next/server";
import { pool } from "../../../lib/database";
import { requireUser } from "../../../lib/session";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 100, 500);
  const { rows } = await pool.query(
    `SELECT t.id,t.account_id,t.occurred_on,t.description,t.category,t.amount_cents,a.name AS account_name
     FROM transactions t JOIN financial_accounts a ON a.id=t.account_id
     WHERE t.user_id=$1 ORDER BY t.occurred_on DESC,t.created_at DESC LIMIT $2`, [user.id, limit]
  );
  return NextResponse.json(rows.map((row) => ({ ...row, amount: Number(row.amount_cents) / 100 })));
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const amount = Number(body.amount);
  if (!body.accountId || !body.date || !body.description || !Number.isFinite(amount)) return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
  const owned = await pool.query(`SELECT 1 FROM financial_accounts WHERE id=$1 AND user_id=$2`, [body.accountId, user.id]);
  if (!owned.rowCount) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const { rows } = await pool.query(
    `INSERT INTO transactions (user_id,account_id,occurred_on,description,category,amount_cents)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [user.id, body.accountId, body.date, String(body.description).slice(0, 240), String(body.category ?? "Uncategorized").slice(0, 80), Math.round(amount * 100)]
  );
  await pool.query(`UPDATE financial_accounts SET balance_cents=balance_cents+$1,updated_at=now() WHERE id=$2 AND user_id=$3`, [Math.round(amount * 100), body.accountId, user.id]);
  return NextResponse.json(rows[0], { status: 201 });
}
