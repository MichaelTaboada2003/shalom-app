export const AVATAR_STYLES = ['lilac', 'sky', 'mint', 'sunset', 'rose'] as const;
export type AvatarStyle = (typeof AVATAR_STYLES)[number];
export const AVATAR_GENDERS = ['woman', 'man'] as const;
export type AvatarGender = (typeof AVATAR_GENDERS)[number];
export const AVATAR_SKIN_TONES = ['fair', 'light', 'medium', 'tan', 'deep'] as const;
export type AvatarSkinTone = (typeof AVATAR_SKIN_TONES)[number];
export const AVATAR_HAIR_STYLES = ['waves', 'long', 'bun', 'braids', 'short', 'fade', 'curls', 'side'] as const;
export type AvatarHairStyle = (typeof AVATAR_HAIR_STYLES)[number];
export const AVATAR_HAIR_COLORS = ['midnight', 'chestnut', 'copper', 'golden', 'silver'] as const;
export type AvatarHairColor = (typeof AVATAR_HAIR_COLORS)[number];
export const HAIR_STYLES_BY_GENDER: Record<AvatarGender, readonly AvatarHairStyle[]> = {
  woman: ['waves', 'long', 'bun', 'braids'],
  man: ['short', 'fade', 'curls', 'side'],
};
export type MemberStatus = 'active' | 'inactive';

export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  avatar_style: AvatarStyle;
  avatar_gender: AvatarGender;
  avatar_skin_tone: AvatarSkinTone;
  avatar_hair_style: AvatarHairStyle;
  avatar_hair_color: AvatarHairColor;
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
  avatarStyle: AvatarStyle;
  avatarGender: AvatarGender;
  avatarSkinTone: AvatarSkinTone;
  avatarHairStyle: AvatarHairStyle;
  avatarHairColor: AvatarHairColor;
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

  const avatarStyle = AVATAR_STYLES.includes(record.avatarStyle as AvatarStyle)
    ? (record.avatarStyle as AvatarStyle)
    : 'lilac';
  const avatarGender = AVATAR_GENDERS.includes(record.avatarGender as AvatarGender)
    ? (record.avatarGender as AvatarGender)
    : 'woman';
  const avatarSkinTone = AVATAR_SKIN_TONES.includes(record.avatarSkinTone as AvatarSkinTone)
    ? (record.avatarSkinTone as AvatarSkinTone)
    : 'medium';
  const avatarHairStyle = HAIR_STYLES_BY_GENDER[avatarGender].includes(record.avatarHairStyle as AvatarHairStyle)
    ? (record.avatarHairStyle as AvatarHairStyle)
    : HAIR_STYLES_BY_GENDER[avatarGender][0];
  const avatarHairColor = AVATAR_HAIR_COLORS.includes(record.avatarHairColor as AvatarHairColor)
    ? (record.avatarHairColor as AvatarHairColor)
    : 'chestnut';
  const status: MemberStatus = record.status === 'inactive' ? 'inactive' : 'active';

  return {
    value: {
      fullName,
      email: email?.toLowerCase() ?? null,
      phone: nullableText(record.phone, 40),
      birthDate,
      avatarStyle,
      avatarGender,
      avatarSkinTone,
      avatarHairStyle,
      avatarHairColor,
      ministry: nullableText(record.ministry, 100),
      bio: nullableText(record.bio, 1200),
      status,
    },
  };
}

export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S';
}
