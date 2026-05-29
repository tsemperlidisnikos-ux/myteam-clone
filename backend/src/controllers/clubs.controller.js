import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

export const getClub = async (req, res) => {
  const { clubId } = req.params;
  const result = await pool.query(`SELECT * FROM clubs WHERE id = $1`, [clubId]);
  res.json(result.rows[0]);
};

export const updateClub = async (req, res) => {
  const { clubId } = req.params;
  const { name, logo_url, primary_color, secondary_color, country, city } = req.body;

  const result = await pool.query(
    `UPDATE clubs
     SET name=$1, logo_url=$2, primary_color=$3, secondary_color=$4, country=$5, city=$6
     WHERE id=$7
     RETURNING *`,
    [name, logo_url, primary_color, secondary_color, country, city, clubId]
  );

  res.json(result.rows[0]);
};

export const getClubUsers = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, cu.role, cu.status
     FROM club_users cu
     JOIN users u ON u.id = cu.user_id
     WHERE cu.club_id = $1
     ORDER BY cu.role, u.full_name`,
    [clubId]
  );

  res.json(result.rows);
};

export const createStaffUser = async (req, res) => {
  const { clubId } = req.params;
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (!["coach", "admin"].includes(role)) {
    return res.status(400).json({ error: "Role must be coach or admin" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const password_hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [full_name, email, password_hash]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, $3)`,
      [clubId, user.id, role]
    );

    await client.query("COMMIT");
    res.status(201).json({ user, role });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create staff user" });
  } finally {
    client.release();
  }
};

export const addUserToClub = async (req, res) => {
  const { clubId } = req.params;
  const { user_id, role } = req.body;

  const result = await pool.query(
    `INSERT INTO club_users (club_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (club_id, user_id) DO NOTHING
     RETURNING *`,
    [clubId, user_id, role]
  );

  res.json(result.rows[0] || { message: "User already in club" });
};

export const changeUserRole = async (req, res) => {
  const { clubId, userId } = req.params;
  const { role } = req.body;

  const result = await pool.query(
    `UPDATE club_users SET role = $1 WHERE club_id = $2 AND user_id = $3 RETURNING *`,
    [role, clubId, userId]
  );

  res.json(result.rows[0]);
};
