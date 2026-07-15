-- Community profiles are intentionally separate from authenticated users.
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(40),
  birth_date DATE,
  avatar_url TEXT,
  avatar_style VARCHAR(24) NOT NULL DEFAULT 'lilac',
  ministry VARCHAR(100),
  bio TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS members_birth_date_idx ON members (birth_date);
CREATE INDEX IF NOT EXISTS members_status_idx ON members (status);

CREATE TABLE IF NOT EXISTS birthday_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(140) NOT NULL,
  days_before INTEGER NOT NULL CHECK (days_before BETWEEN 0 AND 365),
  subject VARCHAR(180),
  message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS birthday_reminders_member_idx ON birthday_reminders (member_id);
CREATE INDEX IF NOT EXISTS birthday_reminders_active_idx ON birthday_reminders (active) WHERE active;

CREATE TABLE IF NOT EXISTS birthday_reminder_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES birthday_reminders(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, email)
);

CREATE TABLE IF NOT EXISTS birthday_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES birthday_reminders(id) ON DELETE CASCADE,
  birthday_year INTEGER NOT NULL,
  recipient_email VARCHAR(320) NOT NULL,
  scheduled_for DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id VARCHAR(160),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, birthday_year, recipient_email)
);

CREATE INDEX IF NOT EXISTS birthday_delivery_log_status_idx ON birthday_delivery_log (status, scheduled_for);
