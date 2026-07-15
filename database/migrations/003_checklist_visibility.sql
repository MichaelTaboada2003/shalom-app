-- Checklists can be shared with the whole community or kept private by their creator.
ALTER TABLE checklists
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(16) NOT NULL DEFAULT 'community';

ALTER TABLE checklists
  DROP CONSTRAINT IF EXISTS checklists_visibility_check,
  ADD CONSTRAINT checklists_visibility_check CHECK (visibility IN ('community', 'personal'));

CREATE INDEX IF NOT EXISTS checklists_owner_visibility_idx ON checklists (owner_id, visibility);
