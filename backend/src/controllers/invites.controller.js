import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import { sendEmail } from "../services/email.service.js";
import { signToken } from "../utils/jwt.js";

const INVITE_ROLES = new Set(["athlete", "coach", "parent"]);

async function resolveAthleteProfileId(clubId, athleteRef) {
  if (!athleteRef) return null;
  const byProfile = await pool.query(`SELECT id FROM athlete_profiles WHERE id = $1`, [athleteRef]);
  if (byProfile.rows[0]) return byProfile.rows[0].id;

  const byUser = await pool.query(
    `SELECT ap.id FROM athlete_profiles ap
     JOIN club_users cu ON cu.user_id = ap.user_id
     WHERE ap.user_id = $1 AND cu.club_id = $2 AND cu.role = 'athlete'`,
    [athleteRef, clubId]
  );
  return byUser.rows[0]?.id || null;
}

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
  return { token, user, clubs: clubsResult.rows };
}

export const createInvite = async (req, res) => {
  const { clubId } = req.params;
  const { email, role = "athlete", full_name, athlete_id } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  if (!INVITE_ROLES.has(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (role === "parent" && !athlete_id) {
    return res.status(400).json({ error: "athlete_id required for parent invite" });
  }

  let profileId = null;
  if (role === "parent") {
    profileId = await resolveAthleteProfileId(clubId, athlete_id);
    if (!profileId) {
      return res.status(400).json({ error: "Athlete not found in club" });
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 86400000);

  await pool.query(
    `INSERT INTO club_invites (club_id, email, role, token, invited_by, expires_at, athlete_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [clubId, email.toLowerCase(), role, token, req.user.user_id, expires, profileId]
  );

  const inviteUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/accept-invite?token=${token}`;
  await sendEmail({
    to: email,
    subject: "MyTeam — πρόσκληση συλλόγου",
    text: `Προσκλήθηκες στον σύλλογο. Άνοιξε: ${inviteUrl}`,
    html: `<p>Προσκλήθηκες στον σύλλογο.</p><p><a href="${inviteUrl}">Αποδοχή πρόσκλησης</a></p>`,
  });

  res.json({
    message: "Invite sent",
    ...(process.env.NODE_ENV !== "production" ? { invite_url: inviteUrl, token } : {}),
  });
};

export const acceptInvite = async (req, res) => {
  const { token, password, full_name } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password required" });
  }

  const row = await pool.query(
    `SELECT * FROM club_invites WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
    [token]
  );
  const invite = row.rows[0];
  if (!invite) return res.status(400).json({ error: "Invalid or expired invite" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let userId;
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [invite.email]);
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);
      }
    } else {
      const hash = await bcrypt.hash(password, 10);
      const u = await client.query(
        `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [full_name || invite.email.split("@")[0], invite.email, hash]
      );
      userId = u.rows[0].id;
    }

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [invite.club_id, userId, invite.role]
    );

    if (invite.role === "parent" && invite.athlete_id) {
      await client.query(
        `INSERT INTO parent_athletes (user_id, athlete_id, club_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, athlete_id) DO NOTHING`,
        [userId, invite.athlete_id, invite.club_id]
      );
    }

    await client.query(`UPDATE club_invites SET accepted_at = NOW() WHERE id = $1`, [invite.id]);
    await client.query("COMMIT");

    const auth = await authPayloadForUser(userId);
    res.json({
      message: "Invite accepted",
      club_id: invite.club_id,
      ...auth,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("acceptInvite:", e.message);
    res.status(500).json({ error: "Failed to accept invite" });
  } finally {
    client.release();
  }
};

export const listInvites = async (req, res) => {
  const { clubId } = req.params;
  const result = await pool.query(
    `SELECT id, email, role, expires_at, accepted_at, created_at
     FROM club_invites WHERE club_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [clubId]
  );
  res.json(result.rows);
};
