import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { requireChecklistAccess } from '@/lib/checklist-access';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { text, parent_id } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    const sql = getDb();
    await requireChecklistAccess(sql, id, user);
    
    let posResult;
    if (parent_id) {
      posResult = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM checklist_items WHERE checklist_id = ${id} AND parent_id = ${parent_id}`;
    } else {
      posResult = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM checklist_items WHERE checklist_id = ${id} AND parent_id IS NULL`;
    }
    
    const rows = await sql`INSERT INTO checklist_items (checklist_id, text, position, parent_id) VALUES (${id}, ${text.trim()}, ${posResult[0].next_pos}, ${parent_id || null}) RETURNING *`;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
