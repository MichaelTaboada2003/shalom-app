import { AuthError, requireAuth } from '@/lib/auth';
import { parseMemberInput } from '@/lib/community';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAuth();
    const sql = getDb();
    const rows = await sql`
      SELECT id, full_name, email, phone, birth_date, avatar_style, avatar_gender,
             avatar_skin_tone, avatar_hair_style, ministry, bio, status, created_at, updated_at
      FROM members
      ORDER BY status ASC, full_name ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible cargar los integrantes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth(['admin', 'leader']);
    const parsed = parseMemberInput(await request.json());
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const input = parsed.value;
    const sql = getDb();
    const rows = await sql`
      INSERT INTO members (
        full_name, email, phone, birth_date, avatar_style, avatar_gender,
        avatar_skin_tone, avatar_hair_style, ministry, bio, status
      ) VALUES (
        ${input.fullName}, ${input.email}, ${input.phone}, ${input.birthDate}, ${input.avatarStyle},
        ${input.avatarGender}, ${input.avatarSkinTone}, ${input.avatarHairStyle},
        ${input.ministry}, ${input.bio}, ${input.status}
      )
      RETURNING id, full_name, email, phone, birth_date, avatar_style, avatar_gender,
                avatar_skin_tone, avatar_hair_style, ministry, bio, status, created_at, updated_at
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible crear el integrante' }, { status: 500 });
  }
}
