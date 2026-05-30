import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

async function canAccessAthlete(req, clubId, athleteUserId) {
  const role = req.user.role;
  const myId = req.user.user_id;

  if (role === "admin" || role === "coach") return true;
  if (role === "athlete" && Number(athleteUserId) === myId) return true;
  if (role === "parent") {
    const link = await pool.query(
      `SELECT 1 FROM parent_athletes pa
       JOIN athlete_profiles ap ON ap.id = pa.athlete_id
       WHERE pa.user_id = $1 AND pa.club_id = $2 AND ap.user_id = $3`,
      [myId, clubId, athleteUserId]
    );
    return link.rows.length > 0;
  }
  return false;
}

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

  if (!(await canAccessAthlete(req, clubId, athleteId))) {
    return res.status(403).json({ error: "Access denied" });
  }

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
            ap.medical_notes, ap.medical_cert_expires, ap.injury_status, ap.injury_since,
            ap.parent_name, ap.parent_phone, ap.parent_email,
            ap.created_at AS profile_created_at, ap.updated_at AS profile_updated_at
     FROM users u
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE u.id = $1`,
    [athleteId]
  );

  res.json(result.rows[0]);
};

// UPDATE athlete profile (athletes may only edit their own)
export const updateAthleteProfile = async (req, res) => {
  const { clubId, athleteId } = req.params;
  const role = req.user.role;
  const myId = req.user.user_id;

  if (role === "athlete" && Number(athleteId) !== myId) {
    return res.status(403).json({ error: "You can only edit your own profile" });
  }
  if (role === "parent") {
    return res.status(403).json({ error: "Read-only access" });
  }
  if (!(await canAccessAthlete(req, clubId, athleteId))) {
    return res.status(403).json({ error: "Access denied" });
  }
  const {
    full_name,
    date_of_birth,
    height_cm,
    weight_kg,
    position,
    medical_notes,
    medical_cert_expires,
    injury_status,
    injury_since,
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
        medical_notes, medical_cert_expires, injury_status, injury_since,
        parent_name, parent_phone, parent_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        athleteId,
        date_of_birth ?? null,
        height_cm ?? null,
        weight_kg ?? null,
        position ?? null,
        medical_notes ?? null,
        medical_cert_expires ?? null,
        injury_status ?? null,
        injury_since ?? null,
        parent_name ?? null,
        parent_phone ?? null,
        parent_email ?? null,
      ]
    );
  } else {
    result = await pool.query(
      `UPDATE athlete_profiles
       SET date_of_birth=$1, height_cm=$2, weight_kg=$3, position=$4,
           medical_notes=$5, medical_cert_expires=$6, injury_status=$7, injury_since=$8,
           parent_name=$9, parent_phone=$10, parent_email=$11,
           updated_at = NOW()
       WHERE user_id=$12
       RETURNING *`,
      [
        date_of_birth ?? profile.date_of_birth,
        height_cm ?? profile.height_cm,
        weight_kg ?? profile.weight_kg,
        position ?? profile.position,
        medical_notes ?? profile.medical_notes,
        medical_cert_expires ?? profile.medical_cert_expires,
        injury_status ?? profile.injury_status,
        injury_since ?? profile.injury_since,
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
  const { clubId, athleteId } = req.params;

  if (!(await canAccessAthlete(req, clubId, athleteId))) {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = await pool.query(
    `SELECT t.id, t.name, t.category
     FROM team_athletes ta
     JOIN teams t ON t.id = ta.team_id
     WHERE ta.user_id = $1`,
    [athleteId]
  );

  res.json(result.rows);
};

export const getMyAthleteProfile = async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.user_id;

  const membership = await pool.query(
    `SELECT 1 FROM club_users WHERE club_id = $1 AND user_id = $2 AND role = 'athlete'`,
    [clubId, userId]
  );
  if (membership.rows.length === 0) {
    return res.status(404).json({ error: "No athlete profile for this account" });
  }

  req.params.athleteId = String(userId);
  return getAthleteProfile(req, res);
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

export const getMedicalOverview = async (req, res) => {
  const { clubId } = req.params;
  const result = await pool.query(
    `SELECT u.id, u.full_name, ap.position, ap.medical_notes,
            ap.medical_cert_expires, ap.injury_status, ap.injury_since,
            ap.parent_name, ap.parent_phone, ap.parent_email
     FROM club_users cu
     JOIN users u ON u.id = cu.user_id
     LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
     WHERE cu.club_id = $1 AND cu.role = 'athlete'
     ORDER BY u.full_name`,
    [clubId]
  );
  res.json(result.rows);
};

export const bulkImportAthletes = async (req, res) => {
  const { clubId } = req.params;
  const { athletes: rows } = req.body;
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(400).json({ error: "athletes array required" });
  }

  const client = await pool.connect();
  const created = [];
  const errors = [];

  try {
    await client.query("BEGIN");
    for (const row of rows) {
      try {
        if (!row.full_name || !row.email) throw new Error("full_name and email required");
        const hash = await bcrypt.hash("temp1234", 10);
        let userId;
        const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [
          row.email.toLowerCase(),
        ]);
        if (existing.rows[0]) {
          userId = existing.rows[0].id;
          await client.query(`UPDATE users SET full_name = $1 WHERE id = $2`, [
            row.full_name,
            userId,
          ]);
        } else {
          const u = await client.query(
            `INSERT INTO users (full_name, email, password_hash) VALUES ($1,$2,$3) RETURNING id`,
            [row.full_name, row.email.toLowerCase(), hash]
          );
          userId = u.rows[0].id;
        }
        await client.query(
          `INSERT INTO club_users (club_id, user_id, role) VALUES ($1,$2,'athlete')
           ON CONFLICT (club_id, user_id) DO NOTHING`,
          [clubId, userId]
        );
        await client.query(
          `INSERT INTO athlete_profiles (user_id, position) VALUES ($1,$2)
           ON CONFLICT (user_id) DO UPDATE SET position = EXCLUDED.position`,
          [userId, row.position || null]
        );
        created.push({ id: userId, full_name: row.full_name, email: row.email });
      } catch (e) {
        errors.push({ row, error: e.message });
      }
    }
    await client.query("COMMIT");
    res.json({ created: created.length, errors });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};
