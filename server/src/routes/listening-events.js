import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const payloadSchema = z.object({
  trackId: z.string().uuid().optional(),
  playedAt: z.coerce.date().optional(),
  secondsListened: z.number().int().min(0).max(60 * 60 * 24).default(0),
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
    if (existing.rows[0]) {
      return existing.rows[0].id;
    }
  }

  if (!inputTrack?.audio_url) {
    return null;
  }

  const byAudio = await pool.query("SELECT id FROM tracks WHERE audio_url = $1 LIMIT 1", [inputTrack.audio_url]);
  if (byAudio.rows[0]) {
    return byAudio.rows[0].id;
  }

  const created = await pool.query(
    `INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
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

router.post("/", requireAuth, async (req, res) => {
  const parse = payloadSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { trackId, track, secondsListened, playedAt } = parse.data;
  const resolvedTrackId = await resolveTrackId(trackId, track);
  if (!resolvedTrackId) {
    return res.status(400).json({ error: "Track reference is required" });
  }

  const result = await pool.query(
    `INSERT INTO listening_events (user_id, track_id, played_at, seconds_listened)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, track_id, played_at, seconds_listened`,
    [req.user.id, resolvedTrackId, playedAt || new Date(), secondsListened]
  );
  return res.status(201).json({ event: result.rows[0] });
});

export default router;
