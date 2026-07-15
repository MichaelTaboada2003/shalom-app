import type { AuthUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

const DEFAULT_DAYS_BEFORE = 7;

/** Creates the first reminder for a member with a birthday, without replacing custom reminders. */
export async function createDefaultBirthdayReminder(member: { id: string; fullName: string }, creator: AuthUser) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO birthday_reminders (member_id, title, days_before, subject, message, active, created_by)
    SELECT
      ${member.id},
      ${`Cumpleaños de ${member.fullName}`},
      ${DEFAULT_DAYS_BEFORE},
      NULL,
      NULL,
      true,
      ${creator.id}
    WHERE NOT EXISTS (
      SELECT 1 FROM birthday_reminders WHERE member_id = ${member.id}
    )
    RETURNING id
  `;
  const reminder = rows[0];
  if (!reminder) return null;

  await sql`
    INSERT INTO birthday_reminder_recipients (reminder_id, email, name)
    VALUES (${reminder.id}, ${creator.email}, ${creator.name})
  `;
  return reminder;
}
