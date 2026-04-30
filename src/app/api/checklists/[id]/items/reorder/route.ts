import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const sql = getDb();
    
    // Sequential update because neon() doesn't have begin()
    for (const item of body.items) {
      await sql`
        UPDATE checklist_items 
        SET position = ${item.position}, parent_id = ${item.parent_id || null}
        WHERE id = ${item.id} AND checklist_id = ${id}
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
