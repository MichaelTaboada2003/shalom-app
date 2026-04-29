import { requireAuth, AuthError } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all users (admin only)
export async function GET() {
  try {
    await requireAuth(['admin']);
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, name, role, active, created_at, last_login
      FROM users ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
