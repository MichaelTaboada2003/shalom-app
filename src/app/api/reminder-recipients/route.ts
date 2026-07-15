import { AuthError, requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

/** Contacts with an email that can be selected as a reminder recipient. */
export async function GET() {
  try {
    await requireAuth(['admin', 'leader']);
    const sql = getDb();
    const rows = await sql`
      SELECT DISTINCT ON (email) email, name, source
      FROM (
        SELECT lower(email) AS email, full_name AS name, 'integrante'::text AS source
        FROM members
        WHERE email IS NOT NULL AND email <> '' AND status = 'active'
        UNION ALL
        SELECT lower(email) AS email, name, 'usuario'::text AS source
        FROM users
        WHERE active = true
      ) contacts
      ORDER BY email, source DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible cargar los destinatarios' }, { status: 500 });
  }
}
