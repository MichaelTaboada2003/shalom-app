export interface ReminderRecipientInput {
  email: string;
  name?: string | null;
}

export interface BirthdayReminderInput {
  memberId: string;
  title: string;
  daysBefore: number;
  subject: string | null;
  message: string | null;
  active: boolean;
  recipients: ReminderRecipientInput[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

export function parseBirthdayReminderInput(body: unknown): { value?: BirthdayReminderInput; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'Datos inválidos' };
  const record = body as Record<string, unknown>;
  const memberId = optionalText(record.memberId, 64);
  const title = optionalText(record.title, 140);
  const daysBefore = Number(record.daysBefore);

  if (!memberId) return { error: 'Selecciona un integrante' };
  if (!title) return { error: 'Ponle un nombre al recordatorio' };
  if (!Number.isInteger(daysBefore) || daysBefore < 0 || daysBefore > 365) {
    return { error: 'Los días de anticipación deben estar entre 0 y 365' };
  }
  if (!Array.isArray(record.recipients) || record.recipients.length === 0) {
    return { error: 'Selecciona al menos un correo destinatario' };
  }

  const uniqueRecipients = new Map<string, ReminderRecipientInput>();
  for (const item of record.recipients) {
    if (!item || typeof item !== 'object') return { error: 'Destinatario inválido' };
    const recipient = item as Record<string, unknown>;
    const email = optionalText(recipient.email, 320)?.toLowerCase();
    if (!email || !EMAIL_RE.test(email)) return { error: 'Hay un correo destinatario no válido' };
    uniqueRecipients.set(email, { email, name: optionalText(recipient.name, 120) });
  }

  return {
    value: {
      memberId,
      title,
      daysBefore,
      subject: optionalText(record.subject, 180),
      message: optionalText(record.message, 4000),
      active: record.active !== false,
      recipients: [...uniqueRecipients.values()],
    },
  };
}

export function birthdayDateForYear(birthDate: string, year: number): Date {
  const [, month, day] = birthDate.slice(0, 10).split('-').map(Number);
  // A Feb 29 birthday is celebrated on Feb 28 in non-leap years for scheduling.
  const result = new Date(Date.UTC(year, month - 1, day));
  if (result.getUTCMonth() !== month - 1) return new Date(Date.UTC(year, 1, 28));
  return result;
}

export function addDays(date: Date, amount: number): Date {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return value;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] ?? char));
}
