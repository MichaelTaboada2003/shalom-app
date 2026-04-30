import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET all checklists (any authenticated user)
export async function GET() {
  try {
    await requireAuth();
    const sql = getDb();
    const rows = await sql`
      SELECT c.id, c.title, c.emoji, c.created_at,
        COUNT(ci.id)::int AS total_items,
        COUNT(ci.id) FILTER (WHERE ci.completed)::int AS completed_items
      FROM checklists c
      LEFT JOIN checklist_items ci ON ci.checklist_id = c.id AND ci.parent_id IS NULL
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST create a new checklist (any authenticated user)
export async function POST(request: Request) {
  try {
    await requireAuth();
    const { title, emoji } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO checklists (title, emoji)
      VALUES (${title.trim()}, ${emoji || '📋'})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
