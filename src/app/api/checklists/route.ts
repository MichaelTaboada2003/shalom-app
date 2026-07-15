import { getDb } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET all checklists (any authenticated user)
export async function GET() {
  try {
    const user = await requireAuth();
    const sql = getDb();
    const rows = await sql`
      SELECT c.id, c.title, c.emoji, c.created_at, c.visibility, c.owner_id,
        COUNT(ci.id)::int AS total_items,
        COUNT(ci.id) FILTER (WHERE ci.completed)::int AS completed_items
      FROM checklists c
      LEFT JOIN checklist_items ci ON ci.checklist_id = c.id AND ci.parent_id IS NULL
      WHERE c.visibility = 'community' OR c.owner_id = ${user.id}
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
    const user = await requireAuth();
    const { title, icon, visibility } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const safeVisibility = visibility === 'personal' ? 'personal' : 'community';
    const sql = getDb();
    const rows = await sql`
      INSERT INTO checklists (title, emoji, owner_id, visibility)
      VALUES (${title.trim().slice(0, 120)}, ${typeof icon === 'string' ? icon.slice(0, 40) : 'clipboard'}, ${user.id}, ${safeVisibility})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
