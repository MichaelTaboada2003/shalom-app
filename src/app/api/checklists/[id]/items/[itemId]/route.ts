import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { requireChecklistAccess } from '@/lib/checklist-access';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const user = await requireAuth();
    const { id, itemId } = await params;
    const body = await request.json();
    const sql = getDb();
    await requireChecklistAccess(sql, id, user);
    if (typeof body.completed === 'boolean') await sql`UPDATE checklist_items SET completed = ${body.completed} WHERE id = ${itemId} AND checklist_id = ${id}`;
    if (typeof body.text === 'string') await sql`UPDATE checklist_items SET text = ${body.text.trim()} WHERE id = ${itemId} AND checklist_id = ${id}`;
    const rows = await sql`SELECT * FROM checklist_items WHERE id = ${itemId} AND checklist_id = ${id}`;
    if (!rows[0]) return NextResponse.json({ error: 'Elemento no encontrado' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const user = await requireAuth();
    const { id, itemId } = await params;
    const sql = getDb();
    await requireChecklistAccess(sql, id, user);
    await sql`DELETE FROM checklist_items WHERE id = ${itemId} AND checklist_id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
