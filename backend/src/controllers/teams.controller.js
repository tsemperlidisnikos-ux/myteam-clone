import { pool } from "../db/pool.js";

// GET all teams in a club
export const getTeams = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT * FROM teams WHERE club_id = $1 ORDER BY name`,
    [clubId]
  );

  res.json(result.rows);
};

// UPDATE team
export const updateTeam = async (req, res) => {
  const { clubId, teamId } = req.params;
  const { name, category } = req.body;

  const result = await pool.query(
    `UPDATE teams
     SET name = $1, category = $2, updated_at = NOW()
     WHERE id = $3 AND club_id = $4
     RETURNING *`,
    [name, category ?? null, teamId, clubId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Team not found" });
  }

  res.json(result.rows[0]);
};

// DELETE team
export const deleteTeam = async (req, res) => {
  const { clubId, teamId } = req.params;

  const result = await pool.query(
    `DELETE FROM teams WHERE id = $1 AND club_id = $2 RETURNING id`,
    [teamId, clubId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Team not found" });
  }

  res.json({ message: "Team deleted" });
};

// CREATE a new team
export const createTeam = async (req, res) => {
  const { clubId } = req.params;
  const { name, category } = req.body;

  const result = await pool.query(
    `INSERT INTO teams (club_id, name, category)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [clubId, name, category]
  );

  res.json(result.rows[0]);
};

// GET team details (team + coaches + athletes)
export const getTeamDetails = async (req, res) => {
  const { teamId } = req.params;

  const team = await pool.query(
    `SELECT * FROM teams WHERE id = $1`,
    [teamId]
  );

  const coaches = await pool.query(
    `SELECT u.id, u.full_name, u.email
     FROM team_coaches tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.team_id = $1`,
    [teamId]
  );

  const athletes = await pool.query(
    `SELECT u.id, u.full_name, u.email
     FROM team_athletes ta
     JOIN users u ON u.id = ta.user_id
     WHERE ta.team_id = $1`,
    [teamId]
  );

  res.json({
    team: team.rows[0],
    coaches: coaches.rows,
    athletes: athletes.rows
  });
};

// ADD coach to team
export const addCoachToTeam = async (req, res) => {
  const { teamId } = req.params;
  const { user_id } = req.body;

  const result = await pool.query(
    `INSERT INTO team_coaches (team_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [teamId, user_id]
  );

  res.json(result.rows[0] || { message: "Coach already assigned" });
};

// ADD athlete to team
export const addAthleteToTeam = async (req, res) => {
  const { teamId } = req.params;
  const { user_id } = req.body;

  const result = await pool.query(
    `INSERT INTO team_athletes (team_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [teamId, user_id]
  );

  res.json(result.rows[0] || { message: "Athlete already assigned" });
};

// REMOVE coach
export const removeCoachFromTeam = async (req, res) => {
  const { teamId, userId } = req.params;

  await pool.query(
    `DELETE FROM team_coaches
     WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );

  res.json({ message: "Coach removed" });
};

// REMOVE athlete
export const removeAthleteFromTeam = async (req, res) => {
  const { teamId, userId } = req.params;

  await pool.query(
    `DELETE FROM team_athletes
     WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );

  res.json({ message: "Athlete removed" });
};
