import { pool } from "../db/pool.js";

export const registerPushToken = async (req, res) => {
  const { token, platform = "expo" } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  await pool.query(
    `INSERT INTO push_tokens (user_id, token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, token) DO NOTHING`,
    [req.user.user_id, token, platform]
  );
  res.json({ message: "Token registered" });
};

export const getMyPushTokens = async (req, res) => {
  const result = await pool.query(
    `SELECT id, platform, created_at FROM push_tokens WHERE user_id = $1`,
    [req.user.user_id]
  );
  res.json(result.rows);
};
