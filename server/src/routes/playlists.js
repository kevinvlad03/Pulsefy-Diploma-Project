import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const createPlaylistSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  isPublic: z.boolean().optional(),
});

const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
});

const addTrackSchema = z.object({
  trackId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

async function getOwnedPlaylist(playlistId, userId) {
  const result = await pool.query(
    "SELECT id, user_id, name, description, is_public, created_at FROM playlists WHERE id = $1 AND user_id = $2",
    [playlistId, userId]
  );
  return result.rows[0] || null;
}

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, name, description, is_public, created_at
     FROM playlists
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  return res.json({ playlists: result.rows });
}));

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const parse = createPlaylistSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { name, description, isPublic } = parse.data;
  const result = await pool.query(
    `INSERT INTO playlists (user_id, name, description, is_public)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, name, description, is_public, created_at`,
    [req.user.id, name, description || null, Boolean(isPublic)]
  );
  return res.status(201).json({ playlist: result.rows[0] });
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const playlist = await getOwnedPlaylist(req.params.id, req.user.id);
  if (!playlist) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  const tracksResult = await pool.query(
    `SELECT t.id, t.title, t.artist, t.album, t.genre, t.duration_sec, t.audio_url, t.cover_url, t.created_at, pt.position
     FROM playlist_tracks pt
     JOIN tracks t ON t.id = pt.track_id
     WHERE pt.playlist_id = $1
     ORDER BY pt.position ASC, t.created_at DESC`,
    [playlist.id]
  );

  return res.json({ playlist, tracks: tracksResult.rows });
}));

router.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const parse = updatePlaylistSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const playlist = await getOwnedPlaylist(req.params.id, req.user.id);
  if (!playlist) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  const updates = [];
  const values = [];

  if (typeof parse.data.name === "string") {
    values.push(parse.data.name);
    updates.push(`name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(parse.data, "description")) {
    values.push(parse.data.description || null);
    updates.push(`description = $${values.length}`);
  }

  if (typeof parse.data.isPublic === "boolean") {
    values.push(parse.data.isPublic);
    updates.push(`is_public = $${values.length}`);
  }

  if (!updates.length) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  values.push(playlist.id);
  const result = await pool.query(
    `UPDATE playlists
     SET ${updates.join(", ")}
     WHERE id = $${values.length}
     RETURNING id, user_id, name, description, is_public, created_at`,
    values
  );

  return res.json({ playlist: result.rows[0] });
}));

router.post("/:id/tracks", requireAuth, asyncHandler(async (req, res) => {
  const parse = addTrackSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const playlist = await getOwnedPlaylist(req.params.id, req.user.id);
  if (!playlist) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  const trackResult = await pool.query("SELECT id FROM tracks WHERE id = $1", [parse.data.trackId]);
  if (!trackResult.rows[0]) {
    return res.status(404).json({ error: "Track not found" });
  }

  let nextPosition = parse.data.position;
  if (typeof nextPosition !== "number") {
    const countResult = await pool.query(
      "SELECT COALESCE(MAX(position), -1) AS max_position FROM playlist_tracks WHERE playlist_id = $1",
      [playlist.id]
    );
    nextPosition = Number(countResult.rows[0]?.max_position ?? -1) + 1;
  }

  await pool.query(
    `INSERT INTO playlist_tracks (playlist_id, track_id, position)
     VALUES ($1, $2, $3)
     ON CONFLICT (playlist_id, track_id)
     DO UPDATE SET position = EXCLUDED.position`,
    [playlist.id, parse.data.trackId, nextPosition]
  );

  return res.status(201).json({ ok: true });
}));

router.delete("/:id/tracks/:trackId", requireAuth, asyncHandler(async (req, res) => {
  const playlist = await getOwnedPlaylist(req.params.id, req.user.id);
  if (!playlist) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  await pool.query("DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2", [
    playlist.id,
    req.params.trackId,
  ]);
  return res.status(204).send();
}));

export default router;
