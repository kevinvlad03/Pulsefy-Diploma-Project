import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.reason, r.created_at,
            t.id AS track_id, t.title, t.artist, t.album, t.genre, t.duration_sec, t.audio_url, t.cover_url
     FROM recommendations r
     JOIN tracks t ON t.id = r.track_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 30`,
    [req.user.id]
  );

  const recommendations = result.rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    created_at: row.created_at,
    track: {
      id: row.track_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      genre: row.genre,
      duration_sec: row.duration_sec,
      audio_url: row.audio_url,
      image_url: row.cover_url,
    },
  }));

  return res.json({ recommendations });
});

router.post("/refresh", requireAuth, async (req, res) => {
  const topGenreResult = await pool.query(
    `SELECT t.genre
     FROM listening_events le
     JOIN tracks t ON t.id = le.track_id
     WHERE le.user_id = $1 AND t.genre IS NOT NULL
     GROUP BY t.genre
     ORDER BY COUNT(*) DESC
     LIMIT 3`,
    [req.user.id]
  );

  const genres = topGenreResult.rows.map((row) => row.genre);

  let candidateResult;
  if (genres.length) {
    candidateResult = await pool.query(
      `SELECT t.id, t.title, t.artist, t.album, t.genre, t.duration_sec, t.audio_url, t.cover_url
       FROM tracks t
       WHERE t.genre = ANY($1::text[])
       AND NOT EXISTS (
         SELECT 1 FROM listening_events le
         WHERE le.user_id = $2 AND le.track_id = t.id
       )
       ORDER BY t.created_at DESC
       LIMIT 12`,
      [genres, req.user.id]
    );
  } else {
    candidateResult = await pool.query(
      `SELECT id, title, artist, album, genre, duration_sec, audio_url, cover_url
       FROM tracks
       ORDER BY created_at DESC
       LIMIT 12`
    );
  }

  await pool.query("DELETE FROM recommendations WHERE user_id = $1", [req.user.id]);

  for (const track of candidateResult.rows) {
    const reason = genres.length
      ? `Because you often listen to ${track.genre || "similar"} tracks`
      : "Popular in your library";
    await pool.query(
      `INSERT INTO recommendations (user_id, track_id, reason)
       VALUES ($1, $2, $3)`,
      [req.user.id, track.id, reason]
    );
  }

  return res.json({ refreshed: true, count: candidateResult.rows.length });
});

export default router;
