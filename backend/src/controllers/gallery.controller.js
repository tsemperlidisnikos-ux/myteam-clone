import { pool } from "../db/pool.js";

export const listGallery = async (req, res) => {
  const { clubId } = req.params;
  const result = await pool.query(
    `SELECT g.*, u.full_name AS uploader_name, tm.name AS team_name
     FROM gallery_items g
     LEFT JOIN users u ON u.id = g.uploaded_by
     LEFT JOIN teams tm ON tm.id = g.team_id
     WHERE g.club_id = $1
     ORDER BY g.created_at DESC`,
    [clubId]
  );
  res.json(result.rows);
};

export const createGalleryItem = async (req, res) => {
  const { clubId } = req.params;
  if (!req.file) return res.status(400).json({ error: "Image required" });

  const fileUrl = `/uploads/${req.file.filename}`;
  const { caption, team_id } = req.body;

  const result = await pool.query(
    `INSERT INTO gallery_items (club_id, team_id, uploaded_by, file_url, caption)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clubId, team_id ? Number(team_id) : null, req.user.user_id, fileUrl, caption || null]
  );
  res.json(result.rows[0]);
};

export const deleteGalleryItem = async (req, res) => {
  const { clubId, itemId } = req.params;
  await pool.query(`DELETE FROM gallery_items WHERE id = $1 AND club_id = $2`, [itemId, clubId]);
  res.json({ message: "Deleted" });
};
