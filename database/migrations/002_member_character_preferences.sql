-- Character customization is kept separate from a member's personal details.
-- avatar_url is intentionally retained for backwards compatibility but is no longer exposed by the app.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS avatar_gender VARCHAR(12) NOT NULL DEFAULT 'woman',
  ADD COLUMN IF NOT EXISTS avatar_skin_tone VARCHAR(12) NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS avatar_hair_style VARCHAR(16) NOT NULL DEFAULT 'waves';

ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_avatar_gender_check,
  ADD CONSTRAINT members_avatar_gender_check CHECK (avatar_gender IN ('woman', 'man')),
  DROP CONSTRAINT IF EXISTS members_avatar_skin_tone_check,
  ADD CONSTRAINT members_avatar_skin_tone_check CHECK (avatar_skin_tone IN ('fair', 'light', 'medium', 'tan', 'deep')),
  DROP CONSTRAINT IF EXISTS members_avatar_hair_style_check,
  ADD CONSTRAINT members_avatar_hair_style_check CHECK (avatar_hair_style IN ('waves', 'long', 'bun', 'braids', 'short', 'fade', 'curls', 'side'));
