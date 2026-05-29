import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

// GET all athletes in a club
export const getAthletes = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email,
            ap.date_of_birth, ap.position
     FROM club_users cu
     JOIN users u ON u.id = cu.user_id
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE cu.club_id = $1 AND cu.role = 'athlete'
     ORDER BY u.full_name`,
    [clubId]
  );

  res.json(result.rows);
};

// CREATE athlete (user + athlete profile)
export const createAthlete = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      full_name,
      email,
      date_of_birth,
      height_cm,
      weight_kg,
      position,
      parent_name,
      parent_phone,
      parent_email
    } = req.body;

    await client.query("BEGIN");

    // 1. Create user (temporary password)
    const tempPassword = "temp1234";
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [full_name, email, password_hash]
    );
    const user = userResult.rows[0];

    // 2. Add user to club as athlete
    await client.query(
      `INSERT INTO club_users (club_id, user_id, role)
       VALUES ($1, $2, 'athlete')`,
      [req.params.clubId, user.id]
    );

    // 3. Create athlete profile
    const profileResult = await client.query(
      `INSERT INTO athlete_profiles
       (user_id, date_of_birth, height_cm, weight_kg, position,
        parent_name, parent_phone, parent_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        user.id,
        date_of_birth,
        height_cm,
        weight_kg,
        position,
        parent_name,
        parent_phone,
        parent_email
      ]
    );

    await client.query("COMMIT");

    res.json({
      user,
      profile: profileResult.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create athlete" });
  } finally {
    client.release();
  }
};

// GET athlete profile
export const getAthleteProfile = async (req, res) => {
  const { clubId, athleteId } = req.params;

  const membership = await pool.query(
    `SELECT 1 FROM club_users
     WHERE club_id = $1 AND user_id = $2 AND role = 'athlete'`,
    [clubId, athleteId]
  );

  if (membership.rows.length === 0) {
    return res.status(404).json({ error: "Athlete not found in this club" });
  }

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email,
            ap.date_of_birth, ap.height_cm, ap.weight_kg, ap.position,
            ap.medical_notes, ap.parent_name, ap.parent_phone, ap.parent_email,
            ap.created_at AS profile_created_at, ap.updated_at AS profile_updated_at
     FROM users u
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE u.id = $1`,
    [athleteId]
  );

  res.json(result.rows[0]);
};

// UPDATE athlete profile
export const updateAthleteProfile = async (req, res) => {
  const { athleteId } = req.params;
  const {
    full_name,
    date_of_birth,
    height_cm,
    weight_kg,
    position,
    medical_notes,
    parent_name,
    parent_phone,
    parent_email
  } = req.body;

  if (full_name) {
    await pool.query(
      `UPDATE users SET full_name = $1 WHERE id = $2`,
      [full_name, athleteId]
    );
  }

  const current = await pool.query(
    `SELECT * FROM athlete_profiles WHERE user_id = $1`,
    [athleteId]
  );
  const profile = current.rows[0] || {};

  let result;
  if (current.rows.length === 0) {
    result = await pool.query(
      `INSERT INTO athlete_profiles
       (user_id, date_of_birth, height_cm, weight_kg, position,
        medical_notes, parent_name, parent_phone, parent_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        athleteId,
        date_of_birth ?? null,
        height_cm ?? null,
        weight_kg ?? null,
        position ?? null,
        medical_notes ?? null,
        parent_name ?? null,
        parent_phone ?? null,
        parent_email ?? null,
      ]
    );
  } else {
    result = await pool.query(
      `UPDATE athlete_profiles
       SET date_of_birth=$1, height_cm=$2, weight_kg=$3, position=$4,
           medical_notes=$5, parent_name=$6, parent_phone=$7, parent_email=$8,
           updated_at = NOW()
       WHERE user_id=$9
       RETURNING *`,
      [
        date_of_birth ?? profile.date_of_birth,
        height_cm ?? profile.height_cm,
        weight_kg ?? profile.weight_kg,
        position ?? profile.position,
        medical_notes ?? profile.medical_notes,
        parent_name ?? profile.parent_name,
        parent_phone ?? profile.parent_phone,
        parent_email ?? profile.parent_email,
        athleteId,
      ]
    );
  }

  res.json(result.rows[0]);
};

// GET athlete teams
export const getAthleteTeams = async (req, res) => {
  const { athleteId } = req.params;

  const result = await pool.query(
    `SELECT t.id, t.name, t.category
     FROM team_athletes ta
     JOIN teams t ON t.id = ta.team_id
     WHERE ta.user_id = $1`,
    [athleteId]
  );

  res.json(result.rows);
};

// DELETE athlete from club
export const deleteAthlete = async (req, res) => {
  const { clubId, athleteId } = req.params;

  const membership = await pool.query(
    `SELECT 1 FROM club_users
     WHERE club_id = $1 AND user_id = $2 AND role = 'athlete'`,
    [clubId, athleteId]
  );

  if (membership.rows.length === 0) {
    return res.status(404).json({ error: "Athlete not found in this club" });
  }

  await pool.query(
    `DELETE FROM club_users WHERE club_id = $1 AND user_id = $2`,
    [clubId, athleteId]
  );

  await pool.query(`DELETE FROM users WHERE id = $1`, [athleteId]);

  res.json({ message: "Athlete deleted" });
};
