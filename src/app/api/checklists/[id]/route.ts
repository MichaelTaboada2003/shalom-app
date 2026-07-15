import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { requireChecklistAccess } from '@/lib/checklist-access';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sql = getDb();
    await requireChecklistAccess(sql, id, user);
    const lists = await sql`SELECT * FROM checklists WHERE id = ${id}`;
    const items = await sql`SELECT * FROM checklist_items WHERE checklist_id = ${id} ORDER BY position, created_at`;
    return NextResponse.json({ ...lists[0], items });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const sql = getDb();
    await requireChecklistAccess(sql, id, user);
    await sql`DELETE FROM checklists WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
