CREATE TABLE IF NOT EXISTS retreat_activities (
  id UUID PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  component VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (component IN ('none', 'raffles')),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retreat_movements (
  id UUID PRIMARY KEY,
  activity_id UUID REFERENCES retreat_activities(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  concept VARCHAR(180) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  movement_date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retreat_raffles (
  id UUID PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES retreat_activities(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  prize TEXT NOT NULL DEFAULT '',
  goal NUMERIC(14, 2) NOT NULL CHECK (goal > 0),
  ticket_price NUMERIC(14, 2) NOT NULL CHECK (ticket_price > 0),
  ticket_count INTEGER NOT NULL CHECK (ticket_count > 0),
  draw_date DATE,
  status VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  completed_at DATE,
  settlement_movement_id UUID REFERENCES retreat_movements(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retreat_raffle_sellers (
  id UUID PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES retreat_raffles(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retreat_raffle_sales (
  id UUID PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES retreat_raffles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES retreat_raffle_sellers(id) ON DELETE RESTRICT,
  tickets INTEGER NOT NULL CHECK (tickets > 0),
  sale_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retreat_movements_activity_idx ON retreat_movements(activity_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS retreat_raffles_activity_idx ON retreat_raffles(activity_id, status);
CREATE INDEX IF NOT EXISTS retreat_raffle_sellers_raffle_idx ON retreat_raffle_sellers(raffle_id);
CREATE INDEX IF NOT EXISTS retreat_raffle_sales_raffle_idx ON retreat_raffle_sales(raffle_id, sale_date DESC);
