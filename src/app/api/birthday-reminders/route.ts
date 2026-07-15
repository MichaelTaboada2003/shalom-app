import { AuthError, requireAuth } from '@/lib/auth';
import { parseBirthdayReminderInput } from '@/lib/birthday-reminders';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAuth();
    const sql = getDb();
    const rows = await sql`
      SELECT
        r.id, r.member_id, r.title, r.days_before, r.subject, r.message, r.active,
        r.created_at, r.updated_at, m.full_name AS member_name, m.birth_date AS member_birth_date,
        COALESCE(
          json_agg(json_build_object('id', rr.id, 'email', rr.email, 'name', rr.name)
            ORDER BY rr.created_at) FILTER (WHERE rr.id IS NOT NULL),
          '[]'::json
        ) AS recipients
      FROM birthday_reminders r
      JOIN members m ON m.id = r.member_id
      LEFT JOIN birthday_reminder_recipients rr ON rr.reminder_id = r.id
      GROUP BY r.id, m.id
      ORDER BY r.active DESC, r.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible cargar los recordatorios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['admin', 'leader']);
    const parsed = parseBirthdayReminderInput(await request.json());
    if (!parsed.value) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const input = parsed.value;
    const sql = getDb();

    const member = await sql`SELECT id, birth_date FROM members WHERE id = ${input.memberId}`;
    if (!member[0]) return NextResponse.json({ error: 'El integrante no existe' }, { status: 404 });
    if (!member[0].birth_date) return NextResponse.json({ error: 'Este integrante no tiene cumpleaños asignado' }, { status: 400 });

    const reminderRows = await sql`
      INSERT INTO birthday_reminders (member_id, title, days_before, subject, message, active, created_by)
      VALUES (${input.memberId}, ${input.title}, ${input.daysBefore}, ${input.subject}, ${input.message}, ${input.active}, ${user.id})
      RETURNING id, member_id, title, days_before, subject, message, active, created_at, updated_at
    `;
    const reminder = reminderRows[0];
    const recipients = await Promise.all(input.recipients.map(recipient => sql`
      INSERT INTO birthday_reminder_recipients (reminder_id, email, name)
      VALUES (${reminder.id}, ${recipient.email}, ${recipient.name ?? null})
      RETURNING id, email, name
    `));

    return NextResponse.json({ ...reminder, recipients: recipients.map(row => row[0]) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'No fue posible crear el recordatorio' }, { status: 500 });
  }
}
