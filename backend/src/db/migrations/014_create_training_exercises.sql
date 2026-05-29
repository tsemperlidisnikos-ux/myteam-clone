CREATE TABLE IF NOT EXISTS training_exercises (
  id SERIAL PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
