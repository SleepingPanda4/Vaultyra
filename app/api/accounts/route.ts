import { NextResponse } from "next/server";
import { pool } from "../../../lib/database";
import { requireUser } from "../../../lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { rows } = await pool.query(
    `SELECT id, name, institution, account_type AS type, balance_cents, currency, color AS accent, provider
     FROM financial_accounts WHERE user_id = $1 ORDER BY created_at`, [user.id]
  );
  return NextResponse.json(rows.map((row) => ({ ...row, balance: Number(row.balance_cents) / 100 })));
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const institution = String(body.institution ?? "Manual").trim().slice(0, 100);
  const type = String(body.type ?? "Custom").trim().slice(0, 40);
  const balance = Number(body.balance);
  if (!name || !Number.isFinite(balance)) return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  const { rows } = await pool.query(
    `INSERT INTO financial_accounts (user_id, name, institution, account_type, balance_cents, color)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, institution, account_type AS type, balance_cents, currency, color AS accent, provider`,
    [user.id, name, institution, type, Math.round(balance * 100), body.accent ?? "#48e6bd"]
  );
  await pool.query(`INSERT INTO audit_events (user_id,event_type,metadata) VALUES ($1,'account.created',$2)`, [user.id, JSON.stringify({ accountId: rows[0].id })]);
  return NextResponse.json({ ...rows[0], balance: Number(rows[0].balance_cents) / 100 }, { status: 201 });
}
