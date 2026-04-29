import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    const sql = getDb();
    const posResult = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM checklist_items WHERE checklist_id = ${id}`;
    const rows = await sql`INSERT INTO checklist_items (checklist_id, text, position) VALUES (${id}, ${text.trim()}, ${posResult[0].next_pos}) RETURNING *`;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
