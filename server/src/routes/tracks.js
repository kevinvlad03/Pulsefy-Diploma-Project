import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { genre, search } = req.query;
  const values = [];
  const where = [];

  if (genre) {
    values.push(genre);
    where.push(`genre = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    where.push(`(title ILIKE $${values.length} OR artist ILIKE $${values.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT id, title, artist, album, genre, duration_sec, audio_url, cover_url, created_at
     FROM tracks
     ${whereClause}
     ORDER BY created_at DESC`,
    values
  );
  return res.json({ tracks: result.rows });
});

router.get("/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT id, title, artist, album, genre, duration_sec, audio_url, cover_url, created_at FROM tracks WHERE id = $1",
    [req.params.id]
  );
  const track = result.rows[0];
  if (!track) {
    return res.status(404).json({ error: "Track not found" });
  }
  return res.json({ track });
});

export default router;
