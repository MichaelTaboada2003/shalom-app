export const AVATAR_STYLES = ['lilac', 'sky', 'mint', 'sunset', 'rose'] as const;
export type AvatarStyle = (typeof AVATAR_STYLES)[number];
export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  avatar_style: AvatarStyle;
  ministry: string | null;
  bio: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  fullName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  avatarStyle: AvatarStyle;
  ministry: string | null;
  bio: string | null;
  status: MemberStatus;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function nullableText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function parseMemberInput(body: unknown): { value?: MemberInput; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'Datos inválidos' };
  const record = body as Record<string, unknown>;
  const fullName = nullableText(record.fullName, 120);
  if (!fullName) return { error: 'El nombre es requerido' };

  const email = nullableText(record.email, 320);
  if (email && !EMAIL_RE.test(email)) return { error: 'El correo no es válido' };

  const birthDate = nullableText(record.birthDate, 10);
  if (birthDate && !DATE_RE.test(birthDate)) return { error: 'La fecha de cumpleaños no es válida' };

  const avatarUrl = nullableText(record.avatarUrl, 2048);
  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return { error: 'La URL del avatar no es válida' };
    }
  }

  const avatarStyle = AVATAR_STYLES.includes(record.avatarStyle as AvatarStyle)
    ? (record.avatarStyle as AvatarStyle)
    : 'lilac';
  const status: MemberStatus = record.status === 'inactive' ? 'inactive' : 'active';

  return {
    value: {
      fullName,
      email: email?.toLowerCase() ?? null,
      phone: nullableText(record.phone, 40),
      birthDate,
      avatarUrl,
      avatarStyle,
      ministry: nullableText(record.ministry, 100),
      bio: nullableText(record.bio, 1200),
      status,
    },
  };
}

export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S';
}
