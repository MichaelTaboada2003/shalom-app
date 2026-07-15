import { AuthError, requireAuth } from '@/lib/auth';
import { parseBirthdayReminderInput } from '@/lib/birthday-reminders';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAuth(['admin', 'leader']);
    const { id } = await params;
    const parsed = parseBirthdayReminderInput(await request.json());
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input = parsed.value;
    const sql = getDb();

    const member = await sql`SELECT id, birth_date FROM members WHERE id = ${input.memberId}`;
    if (!member[0]) return NextResponse.json({ error: 'El integrante no existe' }, { status: 404 });
    if (!member[0].birth_date) return NextResponse.json({ error: 'Este integrante no tiene cumpleaños asignado' }, { status: 400 });

    const rows = await sql`
      UPDATE birthday_reminders SET
        member_id = ${input.memberId}, title = ${input.title}, days_before = ${input.daysBefore},
        subject = ${input.subject}, message = ${input.message}, active = ${input.active}, updated_at = now()
      WHERE id = ${id}
      RETURNING id, member_id, title, days_before, subject, message, active, created_at, updated_at
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });

    await sql`DELETE FROM birthday_reminder_recipients WHERE reminder_id = ${id}`;
    const recipients = await Promise.all(input.recipients.map(recipient => sql`
      INSERT INTO birthday_reminder_recipients (reminder_id, email, name)
      VALUES (${id}, ${recipient.email}, ${recipient.name ?? null})
      RETURNING id, email, name
    `));
    return NextResponse.json({ ...rows[0], recipients: recipients.map(row => row[0]) });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible actualizar el recordatorio' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAuth(['admin', 'leader']);
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`DELETE FROM birthday_reminders WHERE id = ${id} RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: 'Recordatorio no encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible eliminar el recordatorio' }, { status: 500 });
  }
}
