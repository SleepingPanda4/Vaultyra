import { NextResponse } from "next/server";
import { pool } from "../../../../lib/database";
import { requireUser } from "../../../../lib/session";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const result = await pool.query(`DELETE FROM financial_accounts WHERE id = $1 AND user_id = $2`, [id, user.id]);
  if (!result.rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
