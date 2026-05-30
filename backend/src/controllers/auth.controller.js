import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { pool } from "../db/pool.js";
import { signToken } from "../utils/jwt.js";
import { sendEmail } from "../services/email.service.js";

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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  const user = userResult.rows[0];

  if (!user) {
    return res.json({ message: "If that email exists, a reset link was sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, token, expires]
  );

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "MyTeam — επαναφορά κωδικού",
    text: `Άνοιξε για νέο κωδικό: ${resetUrl}`,
    html: `<p><a href="${resetUrl}">Επαναφορά κωδικού</a></p>`,
  });

  res.json({
    message: "If that email exists, a reset link was sent.",
    ...(process.env.NODE_ENV !== "production" ? { reset_url: resetUrl, token } : {}),
  });
};

export const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: "Token and new password are required" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const row = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [token]
  );
  const reset = row.rows[0];
  if (!reset) return res.status(400).json({ error: "Invalid or expired reset token" });

  const password_hash = await bcrypt.hash(new_password, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    password_hash,
    reset.user_id,
  ]);
  await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [reset.id]);

  res.json({ message: "Password reset successful. You can log in now." });
};

async function authPayloadForUser(userId) {
  const userResult = await pool.query(
    `SELECT id, full_name, email FROM users WHERE id = $1`,
    [userId]
  );
  const user = userResult.rows[0];
  const clubsResult = await pool.query(
    `SELECT cu.club_id, cu.role, c.name AS club_name, c.logo_url
     FROM club_users cu
     JOIN clubs c ON c.id = cu.club_id
     WHERE cu.user_id = $1`,
    [userId]
  );
  const token = signToken({ user_id: user.id, email: user.email });
  return {
    token,
    user,
    clubs: clubsResult.rows,
  };
}

export const registerParent = async (req, res) => {
  const { code, full_name, email, password } = req.body;
  if (!code || !email || !password) {
    return res.status(400).json({ error: "code, email and password required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const row = await pool.query(
    `SELECT * FROM parent_registration_codes
     WHERE UPPER(code) = UPPER($1) AND used_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [String(code).trim()]
  );
  const reg = row.rows[0];
  if (!reg) return res.status(400).json({ error: "Invalid or expired code" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const normalizedEmail = email.toLowerCase().trim();
    let userId;

    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [normalizedEmail]);
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      const hash = await bcrypt.hash(password, 10);
      await client.query(
        `UPDATE users SET password_hash = $1, full_name = COALESCE(NULLIF($2, ''), full_name) WHERE id = $3`,
        [hash, full_name?.trim(), userId]
      );
    } else {
      const hash = await bcrypt.hash(password, 10);
      const u = await client.query(
        `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [full_name?.trim() || normalizedEmail.split("@")[0], normalizedEmail, hash]
      );
      userId = u.rows[0].id;
    }

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, 'parent')
       ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'parent'`,
      [reg.club_id, userId]
    );

    await client.query(
      `INSERT INTO parent_athletes (user_id, athlete_id, club_id) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, athlete_id) DO NOTHING`,
      [userId, reg.athlete_id, reg.club_id]
    );

    await client.query(
      `UPDATE parent_registration_codes SET used_at = NOW(), used_by = $1 WHERE id = $2`,
      [userId, reg.id]
    );

    await client.query("COMMIT");

    const auth = await authPayloadForUser(userId);
    res.json({ message: "Parent registered", ...auth });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("registerParent:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: "Registration failed" });
  } finally {
    client.release();
  }
};
