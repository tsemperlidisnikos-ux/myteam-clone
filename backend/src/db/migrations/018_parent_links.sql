ALTER TABLE club_invites
  ADD COLUMN IF NOT EXISTS athlete_id INTEGER REFERENCES athlete_profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS parent_athletes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athlete_id INTEGER NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_athletes_user ON parent_athletes(user_id);
