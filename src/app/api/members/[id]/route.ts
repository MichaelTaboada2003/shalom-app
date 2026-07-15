import { AuthError, requireAuth } from '@/lib/auth';
import { parseMemberInput } from '@/lib/community';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireAuth();
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT id, full_name, email, phone, birth_date, avatar_url, avatar_style,
             ministry, bio, status, created_at, updated_at
      FROM members WHERE id = ${id}
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible cargar el integrante' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAuth(['admin', 'leader']);
    const { id } = await params;
    const parsed = parseMemberInput(await request.json());
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const input = parsed.value;
    const sql = getDb();
    const rows = await sql`
      UPDATE members SET
        full_name = ${input.fullName}, email = ${input.email}, phone = ${input.phone},
        birth_date = ${input.birthDate}, avatar_url = ${input.avatarUrl}, avatar_style = ${input.avatarStyle},
        ministry = ${input.ministry}, bio = ${input.bio}, status = ${input.status}, updated_at = now()
      WHERE id = ${id}
      RETURNING id, full_name, email, phone, birth_date, avatar_url, avatar_style,
                ministry, bio, status, created_at, updated_at
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible actualizar el integrante' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAuth(['admin', 'leader']);
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`DELETE FROM members WHERE id = ${id} RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible eliminar el integrante' }, { status: 500 });
  }
}
