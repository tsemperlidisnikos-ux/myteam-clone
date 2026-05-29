CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  location VARCHAR(255),
  competition VARCHAR(255),
  our_score INTEGER,
  opponent_score INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
