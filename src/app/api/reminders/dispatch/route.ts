import { addDays, birthdayDateForYear, dateKey, escapeHtml } from '@/lib/birthday-reminders';
import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface ReminderRow {
  reminder_id: string;
  title: string;
  days_before: number;
  subject: string | null;
  message: string | null;
  member_name: string;
  birth_date: string;
  recipient_email: string;
  recipient_name: string | null;
}

interface ReminderToSend {
  id: string;
  title: string;
  daysBefore: number;
  subject: string | null;
  message: string | null;
  memberName: string;
  birthDate: string;
  recipients: Array<{ email: string; name: string | null }>;
}

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization');
  return value?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}

function birthdayYearScheduledFor(birthDate: string, daysBefore: number, today: Date): number | null {
  const todayKey = dateKey(today);
  const currentYear = today.getUTCFullYear();
  for (const year of [currentYear, currentYear + 1]) {
    const scheduledFor = addDays(birthdayDateForYear(birthDate, year), -daysBefore);
    if (dateKey(scheduledFor) === todayKey) return year;
  }
  return null;
}

async function dispatch(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || getBearerToken(request) !== expectedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;
  if (!resendKey || !from) {
    return NextResponse.json({
      error: 'El envío de correo no está configurado',
      required: ['RESEND_API_KEY', 'REMINDER_FROM_EMAIL'],
    }, { status: 503 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        r.id AS reminder_id, r.title, r.days_before, r.subject, r.message,
        m.full_name AS member_name, m.birth_date,
        rr.email AS recipient_email, rr.name AS recipient_name
      FROM birthday_reminders r
      JOIN members m ON m.id = r.member_id
      JOIN birthday_reminder_recipients rr ON rr.reminder_id = r.id
      WHERE r.active = true AND m.status = 'active' AND m.birth_date IS NOT NULL
    ` as unknown as ReminderRow[];

    const grouped = new Map<string, ReminderToSend>();
    for (const row of rows) {
      const existing = grouped.get(row.reminder_id) ?? {
        id: row.reminder_id,
        title: row.title,
        daysBefore: Number(row.days_before),
        subject: row.subject,
        message: row.message,
        memberName: row.member_name,
        birthDate: row.birth_date,
        recipients: [],
      };
      existing.recipients.push({ email: row.recipient_email, name: row.recipient_name });
      grouped.set(row.reminder_id, existing);
    }

    const today = new Date();
    const scheduledFor = dateKey(today);
    const due = [...grouped.values()].flatMap(reminder => {
      const birthdayYear = birthdayYearScheduledFor(reminder.birthDate, reminder.daysBefore, today);
      return birthdayYear === null ? [] : [{ reminder, birthdayYear }];
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const { reminder, birthdayYear } of due) {
      const birthday = birthdayDateForYear(reminder.birthDate, birthdayYear);
      const birthdayLabel = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(birthday);

      for (const recipient of reminder.recipients) {
        const claim = await sql`
          INSERT INTO birthday_delivery_log (reminder_id, birthday_year, recipient_email, scheduled_for, status)
          VALUES (${reminder.id}, ${birthdayYear}, ${recipient.email}, ${scheduledFor}, 'pending')
          ON CONFLICT (reminder_id, birthday_year, recipient_email) DO NOTHING
          RETURNING id
        `;
        if (!claim[0]) {
          skipped += 1;
          continue;
        }

        const greeting = recipient.name ? `Hola, ${escapeHtml(recipient.name)}.` : 'Hola.';
        const subject = reminder.subject || `Recordatorio: cumpleaños de ${reminder.memberName}`;
        const body = reminder.message
          ? `${escapeHtml(reminder.message).replace(/\n/g, '<br />')}`
          : `El cumpleaños de <strong>${escapeHtml(reminder.memberName)}</strong> es el ${birthdayLabel}.`;
        const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#28213d"><p>${greeting}</p><p>${body}</p><p style="color:#766b8f;font-size:13px">Recordatorio creado en Shalom App.</p></div>`;

        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to: [recipient.email], subject, html }),
            cache: 'no-store',
          });
          const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
          if (!response.ok) throw new Error(result.message || result.name || `Resend respondió ${response.status}`);

          await sql`
            UPDATE birthday_delivery_log
            SET status = 'sent', provider_message_id = ${result.id ?? null}, sent_at = now(), updated_at = now()
            WHERE id = ${claim[0].id}
          `;
          sent += 1;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message.slice(0, 1000) : 'Error desconocido al enviar';
          await sql`
            UPDATE birthday_delivery_log
            SET status = 'failed', error_message = ${errorMessage}, updated_at = now()
            WHERE id = ${claim[0].id}
          `;
          failed += 1;
        }
      }
    }

    return NextResponse.json({ date: scheduledFor, remindersDue: due.length, sent, failed, skipped });
  } catch (error) {
    console.error('Birthday reminder dispatch failed', error);
    return NextResponse.json({ error: 'No fue posible procesar los recordatorios' }, { status: 500 });
  }
}

// Vercel Cron invokes this endpoint with GET. POST is useful for a trusted external scheduler.
export const GET = dispatch;
export const POST = dispatch;
