import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth();
    const { itemId } = await params;
    const body = await request.json();
    const sql = getDb();
    if (typeof body.completed === 'boolean') await sql`UPDATE checklist_items SET completed = ${body.completed} WHERE id = ${itemId}`;
    if (typeof body.text === 'string') await sql`UPDATE checklist_items SET text = ${body.text.trim()} WHERE id = ${itemId}`;
    const rows = await sql`SELECT * FROM checklist_items WHERE id = ${itemId}`;
    return NextResponse.json(rows[0]);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    await requireAuth();
    const { itemId } = await params;
    const sql = getDb();
    await sql`DELETE FROM checklist_items WHERE id = ${itemId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
