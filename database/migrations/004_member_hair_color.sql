-- Hair color is a deliberate character preference, not a value derived from a changing name.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS avatar_hair_color VARCHAR(16) NOT NULL DEFAULT 'chestnut';

ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_avatar_hair_color_check,
  ADD CONSTRAINT members_avatar_hair_color_check CHECK (avatar_hair_color IN ('midnight', 'chestnut', 'copper', 'golden', 'silver'));
