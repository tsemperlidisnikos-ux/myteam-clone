import { pool } from "../db/pool.js";

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

  res.json(result.rows[0]);
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
