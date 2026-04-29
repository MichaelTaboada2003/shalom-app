import { requireAuth, AuthError, type UserRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// PATCH update user role or active status (admin only)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const body = await request.json();
    const sql = getDb();

    if (body.role) {
      const validRoles: UserRole[] = ['admin', 'leader', 'member'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
      }
      await sql`UPDATE users SET role = ${body.role} WHERE id = ${id}`;
    }

    if (typeof body.active === 'boolean') {
      await sql`UPDATE users SET active = ${body.active} WHERE id = ${id}`;
    }

    const rows = await sql`SELECT id, email, name, role, active, created_at, last_login FROM users WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json(rows[0]);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
