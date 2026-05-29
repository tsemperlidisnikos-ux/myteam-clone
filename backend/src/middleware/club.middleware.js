import { pool } from "../db/pool.js";

export const clubAccessMiddleware = async (req, res, next) => {
  const { clubId } = req.params;
  const userId = req.user.user_id;

  const result = await pool.query(
    `SELECT * FROM club_users
     WHERE club_id = $1 AND user_id = $2`,
    [clubId, userId]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ error: "No access to this club" });
  }

  req.user.role = result.rows[0].role;
  next();
};
