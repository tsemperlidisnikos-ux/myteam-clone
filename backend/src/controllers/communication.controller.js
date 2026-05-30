import { pool } from "../db/pool.js";
import { sendPushToUser, sendPushToUsers } from "../services/push.service.js";

//
// ANNOUNCEMENTS
//

export const createAnnouncement = async (req, res) => {
  const { clubId } = req.params;
  const { title, message, target_type, target_id } = req.body;

  const result = await pool.query(
    `INSERT INTO announcements
     (club_id, author_id, title, message, target_type, target_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [clubId, req.user.user_id, title, message, target_type, target_id]
  );

  const announcement = result.rows[0];

  if (target_type === "club") {
    const notify = await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       SELECT cu.user_id, $1, $2
       FROM club_users cu
       WHERE cu.club_id = $3 AND cu.user_id != $4
       RETURNING user_id`,
      [title, message, clubId, req.user.user_id]
    );
    await sendPushToUsers(
      notify.rows.map((r) => r.user_id),
      { title, body: message }
    );
  } else if (target_type === "team" && target_id) {
    const notify = await pool.query(
      `INSERT INTO notifications (user_id, title, body)
       SELECT ta.user_id, $1, $2
       FROM team_athletes ta
       WHERE ta.team_id = $3 AND ta.user_id != $4
       RETURNING user_id`,
      [title, message, target_id, req.user.user_id]
    );
    await sendPushToUsers(
      notify.rows.map((r) => r.user_id),
      { title, body: message }
    );
  }

  res.json(announcement);
};

export const getAnnouncements = async (req, res) => {
  const { clubId } = req.params;
  const userId = req.user.user_id;
  const role = req.user.role;

  if (role === "admin" || role === "coach") {
    const result = await pool.query(
      `SELECT a.*, u.full_name AS author_name
       FROM announcements a
       LEFT JOIN users u ON u.id = a.author_id
       WHERE a.club_id = $1
       ORDER BY a.created_at DESC`,
      [clubId]
    );
    return res.json(result.rows);
  }

  if (role === "parent") {
    const result = await pool.query(
      `SELECT a.*, u.full_name AS author_name
       FROM announcements a
       LEFT JOIN users u ON u.id = a.author_id
       WHERE a.club_id = $1
         AND (
           a.target_type = 'club'
           OR (a.target_type = 'team' AND a.target_id IN (
               SELECT ta.team_id FROM parent_athletes pa
               JOIN athlete_profiles ap ON ap.id = pa.athlete_id
               JOIN team_athletes ta ON ta.user_id = ap.user_id
               WHERE pa.user_id = $2
           ))
         )
       ORDER BY a.created_at DESC`,
      [clubId, userId]
    );
    return res.json(result.rows);
  }

  const result = await pool.query(
    `SELECT a.*, u.full_name AS author_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.author_id
     WHERE a.club_id = $1
       AND (
         a.target_type = 'club'
         OR (a.target_type = 'team' AND a.target_id IN (
             SELECT team_id FROM team_athletes WHERE user_id = $2
         ))
         OR (a.target_type = 'athlete' AND a.target_id = $2)
       )
     ORDER BY a.created_at DESC`,
    [clubId, userId]
  );

  res.json(result.rows);
};

//
// MESSAGES
//

export const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;

  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [req.user.user_id, receiver_id, content]
  );

  await sendPushToUser(receiver_id, {
    title: "Νέο μήνυμα",
    body: content?.slice(0, 120) || "MyTeam",
  });

  res.json(result.rows[0]);
};

export const getConversation = async (req, res) => {
  const { userId } = req.params;
  const myId = req.user.user_id;

  const result = await pool.query(
    `SELECT *
     FROM messages
     WHERE (sender_id = $1 AND receiver_id = $2)
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [myId, userId]
  );

  res.json(result.rows);
};

//
// NOTIFICATIONS
//

export const createNotification = async (req, res) => {
  const { user_id, title, body } = req.body;

  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, body)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [user_id, title, body]
  );

  await sendPushToUser(user_id, { title, body });

  res.json(result.rows[0]);
};

export const getNotifications = async (req, res) => {
  const userId = req.user.user_id;

  const result = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.json(result.rows);
};

export const markNotificationRead = async (req, res) => {
  const { notificationId } = req.params;

  await pool.query(
    `UPDATE notifications SET is_read = true
     WHERE id = $1 AND user_id = $2`,
    [notificationId, req.user.user_id]
  );

  res.json({ message: "Marked as read" });
};

export const markAllNotificationsRead = async (req, res) => {
  await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1`,
    [req.user.user_id]
  );

  res.json({ message: "All marked as read" });
};

export const getMessageContacts = async (req, res) => {
  const { clubId } = req.params;

  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, cu.role
     FROM club_users cu
     JOIN users u ON u.id = cu.user_id
     WHERE cu.club_id = $1 AND u.id != $2
     ORDER BY u.full_name`,
    [clubId, req.user.user_id]
  );

  res.json(result.rows);
};
