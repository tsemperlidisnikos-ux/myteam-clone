ALTER TABLE athlete_profiles
  ADD COLUMN IF NOT EXISTS medical_cert_expires DATE,
  ADD COLUMN IF NOT EXISTS injury_status VARCHAR(120),
  ADD COLUMN IF NOT EXISTS injury_since DATE;

CREATE TABLE IF NOT EXISTS athlete_payments (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  athlete_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending',
  period_label VARCHAR(80),
  stripe_session_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_payments_club ON athlete_payments(club_id);
CREATE INDEX IF NOT EXISTS idx_athlete_payments_athlete ON athlete_payments(athlete_user_id);

CREATE TABLE IF NOT EXISTS gallery_items (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_club ON gallery_items(club_id);
