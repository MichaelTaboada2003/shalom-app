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
  birth_date: string | Date;
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

function normalizeDatabaseDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
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

  const brevoKey = process.env.BREVO_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;
  const fromName = process.env.REMINDER_FROM_NAME || 'Shalom App';
  if (!brevoKey || !from) {
    return NextResponse.json({
      error: 'El envío de correo no está configurado',
      required: ['BREVO_API_KEY', 'REMINDER_FROM_EMAIL'],
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
        birthDate: normalizeDatabaseDate(row.birth_date),
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
      const birthdayLabel = new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(birthday);
      const advanceLabel = reminder.daysBefore === 0
        ? 'La celebración es hoy.'
        : `Este recordatorio fue programado con ${reminder.daysBefore} ${reminder.daysBefore === 1 ? 'día' : 'días'} de anticipación.`;

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
        const memberName = escapeHtml(reminder.memberName);
        const subject = reminder.subject || `Recordatorio: ${reminder.memberName} cumple el ${birthdayLabel}`;
        const customMessage = reminder.message
          ? `<div style="margin:20px 0 0;padding:16px 18px;border-radius:12px;background:#f7f5ff;color:#4a4065;font-size:15px;line-height:1.65">${escapeHtml(reminder.message).replace(/\n/g, '<br />')}</div>`
          : '';
        const html = `
          <div style="margin:0;padding:32px 16px;background:#f4f2f8;font-family:Arial,sans-serif;color:#28213d">
            <div style="max-width:600px;margin:0 auto;overflow:hidden;border:1px solid #e6e1ef;border-radius:20px;background:#ffffff;box-shadow:0 12px 28px rgba(47,34,82,0.08)">
              <div style="padding:24px 28px;background:linear-gradient(135deg,#5f3dc4,#8566dc);color:#ffffff">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;opacity:0.86">Shalom · Comunidad</p>
                <h1 style="margin:0;font-size:27px;line-height:1.2">Recordatorio de cumpleaños</h1>
              </div>
              <div style="padding:28px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.6">${greeting}</p>
                <p style="margin:0;font-size:16px;line-height:1.6">Te recordamos que el cumpleaños de <strong>${memberName}</strong> se celebra el <strong>${birthdayLabel}</strong>.</p>
                ${customMessage}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0 0;border:1px solid #e9e4f1;border-radius:14px;background:#fbfaff;border-collapse:separate;border-spacing:0;overflow:hidden">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #e9e4f1;color:#776d8b;font-size:13px">Persona que cumple</td>
                    <td style="padding:14px 16px;border-bottom:1px solid #e9e4f1;color:#28213d;font-size:15px;font-weight:700;text-align:right">${memberName}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;color:#776d8b;font-size:13px">Fecha de celebración</td>
                    <td style="padding:14px 16px;color:#28213d;font-size:15px;font-weight:700;text-align:right">${birthdayLabel}</td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;color:#625776;font-size:14px;line-height:1.55">${advanceLabel}</p>
              </div>
              <div style="padding:16px 28px;border-top:1px solid #eeeaf4;color:#857b99;font-size:12px;line-height:1.5">Este recordatorio fue creado desde Shalom App.</div>
            </div>
          </div>`;

        try {
          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'api-key': brevoKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: fromName, email: from },
              to: [{ email: recipient.email, ...(recipient.name ? { name: recipient.name } : {}) }],
              subject,
              htmlContent: html,
            }),
            cache: 'no-store',
          });
          const result = await response.json().catch(() => ({})) as { messageId?: string; message?: string; code?: string };
          if (!response.ok) throw new Error(result.message || result.code || `Brevo respondió ${response.status}`);

          await sql`
            UPDATE birthday_delivery_log
            SET status = 'sent', provider_message_id = ${result.messageId ?? null}, sent_at = now(), updated_at = now()
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
