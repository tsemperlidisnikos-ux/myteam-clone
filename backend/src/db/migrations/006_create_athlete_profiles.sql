CREATE TABLE IF NOT EXISTS athlete_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  height_cm INTEGER,
  weight_kg INTEGER,
  position VARCHAR(50),
  medical_notes TEXT,
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  parent_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
