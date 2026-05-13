import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const trackPayloadSchema = z.object({
  trackId: z.string().uuid().optional(),
  track: z
    .object({
      title: z.string().min(1).max(255),
      artist: z.string().min(1).max(255),
      album: z.string().max(255).optional().nullable(),
      genre: z.string().max(120).optional().nullable(),
      duration_sec: z.number().int().min(0).max(60 * 60 * 12).optional(),
      audio_url: z.string().url(),
      cover_url: z.string().url().optional().nullable(),
    })
    .optional(),
});

async function resolveTrackId(inputTrackId, inputTrack) {
  if (inputTrackId) {
    const existing = await pool.query("SELECT id FROM tracks WHERE id = $1", [inputTrackId]);
    if (existing.rows[0]) return existing.rows[0].id;
  }
  if (!inputTrack?.audio_url) return null;
  const byAudio = await pool.query("SELECT id FROM tracks WHERE audio_url = $1 LIMIT 1", [inputTrack.audio_url]);
  if (byAudio.rows[0]) return byAudio.rows[0].id;
  const created = await pool.query(
    `INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      inputTrack.title,
      inputTrack.artist,
      inputTrack.album || null,
      inputTrack.genre || null,
      inputTrack.duration_sec || 0,
      inputTrack.audio_url,
      inputTrack.cover_url || null,
    ]
  );
  return created.rows[0].id;
}

// GET /track-likes — returns [{track_id, audio_url}] for the current user
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT tl.track_id, t.audio_url
     FROM track_likes tl
     JOIN tracks t ON t.id = tl.track_id
     WHERE tl.user_id = $1`,
    [req.user.id]
  );
  return res.json({ liked: result.rows });
}));

// POST /track-likes — like a track
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const parse = trackPayloadSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid payload" });
  const { trackId, track } = parse.data;
  const resolvedId = await resolveTrackId(trackId, track);
  if (!resolvedId) return res.status(400).json({ error: "Track reference required" });

  await pool.query(
    "INSERT INTO track_likes (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.user.id, resolvedId]
  );
  return res.json({ liked: true, trackId: resolvedId });
}));

// DELETE /track-likes — unlike a track
router.delete("/", requireAuth, asyncHandler(async (req, res) => {
  const parse = trackPayloadSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid payload" });
  const { trackId, track } = parse.data;
  const resolvedId = await resolveTrackId(trackId, track);
  if (!resolvedId) return res.status(400).json({ error: "Track reference required" });

  await pool.query(
    "DELETE FROM track_likes WHERE user_id = $1 AND track_id = $2",
    [req.user.id, resolvedId]
  );
  return res.json({ liked: false, trackId: resolvedId });
}));

export default router;
