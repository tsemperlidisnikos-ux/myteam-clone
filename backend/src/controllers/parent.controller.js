import { pool } from "../db/pool.js";

async function parentOwnsAthlete(userId, clubId, athleteId) {
  const r = await pool.query(
    `SELECT 1 FROM parent_athletes
     WHERE user_id = $1 AND club_id = $2 AND athlete_id = $3`,
    [userId, clubId, athleteId]
  );
  return r.rows.length > 0;
}

export const getMyChildren = async (req, res) => {
  const { clubId } = req.params;
  if (req.user.role !== "parent") {
    return res.status(403).json({ error: "Parent access only" });
  }

  const result = await pool.query(
    `SELECT DISTINCT ap.id, ap.user_id AS athlete_user_id, u.full_name, ap.date_of_birth, ap.position,
            tm.name AS team_name, tm.id AS team_id
     FROM parent_athletes pa
     JOIN athlete_profiles ap ON ap.id = pa.athlete_id
     JOIN users u ON u.id = ap.user_id
     LEFT JOIN team_athletes ta ON ta.user_id = ap.user_id
     LEFT JOIN teams tm ON tm.id = ta.team_id AND tm.club_id = $2
     WHERE pa.user_id = $1 AND pa.club_id = $2
     ORDER BY u.full_name`,
    [req.user.user_id, clubId]
  );
  res.json(result.rows);
};

export const getChildTrainings = async (req, res) => {
  const { clubId, athleteId } = req.params;
  if (req.user.role !== "parent") {
    return res.status(403).json({ error: "Parent access only" });
  }
  if (!(await parentOwnsAthlete(req.user.user_id, clubId, athleteId))) {
    return res.status(403).json({ error: "Not linked to this athlete" });
  }

  const result = await pool.query(
    `SELECT t.*, u.full_name AS coach_name, tm.name AS team_name
     FROM trainings t
     JOIN team_athletes ta ON ta.team_id = t.team_id
     JOIN athlete_profiles ap ON ap.user_id = ta.user_id AND ap.id = $3
     JOIN teams tm ON tm.id = t.team_id
     JOIN users u ON u.id = t.coach_id
     WHERE t.club_id = $1
     ORDER BY t.date DESC`,
    [clubId, req.user.user_id, athleteId]
  );
  res.json(result.rows);
};

export const getChildMatches = async (req, res) => {
  const { clubId, athleteId } = req.params;
  if (req.user.role !== "parent") {
    return res.status(403).json({ error: "Parent access only" });
  }
  if (!(await parentOwnsAthlete(req.user.user_id, clubId, athleteId))) {
    return res.status(403).json({ error: "Not linked to this athlete" });
  }

  const result = await pool.query(
    `SELECT m.*, tm.name AS team_name
     FROM matches m
     JOIN team_athletes ta ON ta.team_id = m.team_id
     JOIN athlete_profiles ap ON ap.user_id = ta.user_id AND ap.id = $3
     JOIN teams tm ON tm.id = m.team_id
     WHERE m.club_id = $1
     ORDER BY m.date DESC`,
    [clubId, req.user.user_id, athleteId]
  );
  res.json(result.rows);
};

export const listParentLinks = async (req, res) => {
  const { clubId } = req.params;
  const result = await pool.query(
    `SELECT pa.id, pa.user_id, pa.athlete_id,
            ap.user_id AS athlete_user_id,
            pu.full_name AS parent_name, pu.email AS parent_email,
            au.full_name AS athlete_name
     FROM parent_athletes pa
     JOIN users pu ON pu.id = pa.user_id
     JOIN athlete_profiles ap ON ap.id = pa.athlete_id
     JOIN users au ON au.id = ap.user_id
     WHERE pa.club_id = $1
     ORDER BY au.full_name`,
    [clubId]
  );
  res.json(result.rows);
};

export const linkParent = async (req, res) => {
  let { clubId, athleteId } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  const member = await pool.query(
    `SELECT role FROM club_users WHERE club_id = $1 AND user_id = $2`,
    [clubId, user_id]
  );
  if (member.rows[0]?.role !== "parent") {
    return res.status(400).json({ error: "User must have parent role in this club" });
  }

  let profileId = Number(athleteId);
  const athlete = await pool.query(
    `SELECT ap.id FROM athlete_profiles ap
     JOIN team_athletes ta ON ta.user_id = ap.user_id
     JOIN teams t ON t.id = ta.team_id
     WHERE ap.id = $1 AND t.club_id = $2`,
    [profileId, clubId]
  );
  if (!athlete.rows[0]) {
    const resolved = await pool.query(
      `SELECT ap.id FROM athlete_profiles ap
       JOIN team_athletes ta ON ta.user_id = ap.user_id
       JOIN teams t ON t.id = ta.team_id
       WHERE ap.user_id = $1 AND t.club_id = $2`,
      [profileId, clubId]
    );
    if (!resolved.rows[0]) {
      return res.status(404).json({ error: "Athlete not found in club" });
    }
    profileId = resolved.rows[0].id;
  }

  await pool.query(
    `INSERT INTO parent_athletes (user_id, athlete_id, club_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, athlete_id) DO NOTHING`,
    [user_id, profileId, clubId]
  );
  res.json({ message: "Parent linked" });
};
