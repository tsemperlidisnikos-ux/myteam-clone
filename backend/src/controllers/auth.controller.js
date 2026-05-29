import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { signToken } from "../utils/jwt.js";

export const registerClub = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { full_name, email, password, club_name, country, city } = req.body;

    await client.query("BEGIN");

    const password_hash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [full_name, email, password_hash]
    );
    const user = userResult.rows[0];

    const clubResult = await client.query(
      `INSERT INTO clubs (name, country, city)
       VALUES ($1, $2, $3)
       RETURNING id, name`,
      [club_name, country, city]
    );
    const club = clubResult.rows[0];

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [club.id, user.id]
    );

    await client.query("COMMIT");

    const token = signToken({ user_id: user.id, email: user.email });

    res.json({
      token,
      user,
      club
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    console.error(err);

    if (err.code === "28P01") {
      return res.status(503).json({
        error: "Database connection failed. Check PostgreSQL password in backend/.env",
      });
    }
    if (err.code === "42P01") {
      return res.status(503).json({
        error: "Database tables missing. Run: npm run migrate",
      });
    }
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }

    res.status(500).json({ error: "Registration failed" });
  } finally {
    client?.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const userResult = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = userResult.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const clubsResult = await pool.query(
    `SELECT cu.club_id, cu.role, c.name AS club_name, c.logo_url
     FROM club_users cu
     JOIN clubs c ON c.id = cu.club_id
     WHERE cu.user_id = $1`,
    [user.id]
  );

  const token = signToken({ user_id: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email
    },
    clubs: clubsResult.rows
  });
};

export const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.user_id;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Current and new password are required" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  const user = userResult.rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });

  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Current password is incorrect" });

  const password_hash = await bcrypt.hash(new_password, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, userId]);

  res.json({ message: "Password updated" });
};
