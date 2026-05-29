import { pool } from "../db/pool.js";

// GET club info
export const getClub = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT * FROM clubs WHERE id = $1`,
    [clubId]
  );

  res.json(result.rows[0]);
};

// UPDATE club info
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

// GET all users in club
export const getClubUsers = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, cu.role, cu.status
     FROM club_users cu
     JOIN users u ON u.id = cu.user_id
     WHERE cu.club_id = $1
     ORDER BY u.full_name`,
    [clubId]
  );

  res.json(result.rows);
};

// Add user to club
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

// Change user role
export const changeUserRole = async (req, res) => {
  const { clubId, userId } = req.params;
  const { role } = req.body;

  const result = await pool.query(
    `UPDATE club_users
     SET role = $1
     WHERE club_id = $2 AND user_id = $3
     RETURNING *`,
    [role, clubId, userId]
  );

  res.json(result.rows[0]);
};
