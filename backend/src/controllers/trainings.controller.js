import { pool } from "../db/pool.js";

// CREATE training
export const createTraining = async (req, res) => {
  const { clubId } = req.params;
  const { team_id, date, start_time, end_time, location, notes } = req.body;

  const result = await pool.query(
    `INSERT INTO trainings
     (club_id, team_id, coach_id, date, start_time, end_time, location, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [clubId, team_id, req.user.user_id, date, start_time, end_time, location, notes]
  );

  res.json(result.rows[0]);
};

// GET trainings for a team
export const getTrainings = async (req, res) => {
  const { clubId } = req.params;
  const { team_id } = req.query;

  const result = await pool.query(
    `SELECT t.*, u.full_name AS coach_name
     FROM trainings t
     JOIN users u ON u.id = t.coach_id
     WHERE t.club_id = $1 AND t.team_id = $2
     ORDER BY date DESC`,
    [clubId, team_id]
  );

  res.json(result.rows);
};

// GET training details
export const getTrainingDetails = async (req, res) => {
  const { trainingId } = req.params;

  const result = await pool.query(
    `SELECT t.*, u.full_name AS coach_name
     FROM trainings t
     JOIN users u ON u.id = t.coach_id
     WHERE t.id = $1`,
    [trainingId]
  );

  res.json(result.rows[0]);
};

// SET attendance
export const setAttendance = async (req, res) => {
  const { trainingId } = req.params;
  const { athlete_id, status, comment } = req.body;

  const result = await pool.query(
    `INSERT INTO training_attendance (training_id, athlete_id, status, comment)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (training_id, athlete_id)
     DO UPDATE SET status = EXCLUDED.status, comment = EXCLUDED.comment
     RETURNING *`,
    [trainingId, athlete_id, status, comment]
  );

  res.json(result.rows[0]);
};

// GET attendance list
export const getAttendance = async (req, res) => {
  const { trainingId } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.full_name,
            COALESCE(ta.status, 'absent') AS status,
            ta.comment
     FROM team_athletes ta2
     JOIN users u ON u.id = ta2.user_id
     LEFT JOIN training_attendance ta
       ON ta.athlete_id = u.id AND ta.training_id = $1
     WHERE ta2.team_id = (
       SELECT team_id FROM trainings WHERE id = $1
     )
     ORDER BY u.full_name`,
    [trainingId]
  );

  res.json(result.rows);
};

// ADD exercise
export const addExercise = async (req, res) => {
  const { trainingId } = req.params;
  const { title, description, duration_minutes } = req.body;

  const result = await pool.query(
    `INSERT INTO training_exercises
     (training_id, title, description, duration_minutes)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [trainingId, title, description, duration_minutes]
  );

  res.json(result.rows[0]);
};

// GET exercises
export const getExercises = async (req, res) => {
  const { trainingId } = req.params;

  const result = await pool.query(
    `SELECT * FROM training_exercises
     WHERE training_id = $1
     ORDER BY id ASC`,
    [trainingId]
  );

  res.json(result.rows);
};
