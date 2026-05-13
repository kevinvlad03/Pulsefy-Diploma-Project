import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const GENRE_REASONS = [
  (genre, count) => `Your top genre right now — ${count} ${genre} plays`,
  (genre, count) => `You keep coming back to ${genre} (${count} plays)`,
  (genre)        => `Expanding your ${genre} taste`,
];

async function fetchJamendoByGenre(genre, limit, clientId) {
  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: String(limit),
    include: "musicinfo",
    audioformat: "mp32",
    tags: genre,
  });
  try {
    const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((t) => ({
      title: t.name,
      artist: t.artist_name,
      album: t.album_name || null,
      genre,
      duration_sec: t.duration || 0,
      audio_url: t.audio,
      cover_url: t.image || null,
    }));
  } catch {
    return [];
  }
}

// Upsert a track by audio_url, return its local UUID
async function upsertTrack(client, track) {
  const existing = await client.query(
    "SELECT id FROM tracks WHERE audio_url = $1 LIMIT 1",
    [track.audio_url]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await client.query(
    `INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [track.title, track.artist, track.album, track.genre,
     track.duration_sec, track.audio_url, track.cover_url]
  );
  return inserted.rows[0].id;
}

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.reason, r.created_at,
            t.id AS track_id, t.title, t.artist, t.album, t.genre,
            t.duration_sec, t.audio_url, t.cover_url
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
}));

router.post("/refresh", requireAuth, asyncHandler(async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;

  // 1. Determine top genres from listening history
  const topGenreResult = await pool.query(
    `SELECT t.genre, COUNT(*) AS play_count
     FROM listening_events le
     JOIN tracks t ON t.id = le.track_id
     WHERE le.user_id = $1 AND t.genre IS NOT NULL
     GROUP BY t.genre
     ORDER BY play_count DESC
     LIMIT 3`,
    [req.user.id]
  );

  const genres = topGenreResult.rows; // [{genre, play_count}]

  // 2. Collect candidates — from Jamendo if available, else local DB
  let candidates = []; // [{trackData, reason}]

  if (clientId && genres.length > 0) {
    // Fetch ~8 tracks per genre from Jamendo
    for (let i = 0; i < genres.length; i++) {
      const { genre, play_count } = genres[i];
      const reasonFn = GENRE_REASONS[i] || GENRE_REASONS[GENRE_REASONS.length - 1];
      const reason = reasonFn(genre, Number(play_count));
      const tracks = await fetchJamendoByGenre(genre, 8, clientId);
      for (const t of tracks) {
        candidates.push({ trackData: t, reason });
      }
    }
  } else if (genres.length > 0) {
    // Jamendo unavailable — fall back to local tracks in matching genres
    const genreNames = genres.map((g) => g.genre);
    const localResult = await pool.query(
      `SELECT t.id, t.title, t.artist, t.album, t.genre,
              t.duration_sec, t.audio_url, t.cover_url
       FROM tracks t
       WHERE t.genre = ANY($1::text[])
         AND NOT EXISTS (
           SELECT 1 FROM listening_events le
           WHERE le.user_id = $2 AND le.track_id = t.id
         )
       ORDER BY t.created_at DESC
       LIMIT 12`,
      [genreNames, req.user.id]
    );
    for (let i = 0; i < localResult.rows.length; i++) {
      const t = localResult.rows[i];
      const genreIndex = genreNames.indexOf(t.genre);
      const reasonFn = GENRE_REASONS[genreIndex] || GENRE_REASONS[GENRE_REASONS.length - 1];
      const playCount = genres[genreIndex]?.play_count || 0;
      candidates.push({
        trackData: { ...t, cover_url: t.cover_url, audio_url: t.audio_url },
        reason: reasonFn(t.genre, Number(playCount)),
        existingId: t.id,
      });
    }
  } else {
    // No listening history at all — return most recent local tracks
    const fallback = await pool.query(
      "SELECT id, title, artist, album, genre, duration_sec, audio_url, cover_url FROM tracks ORDER BY created_at DESC LIMIT 12"
    );
    for (const t of fallback.rows) {
      candidates.push({
        trackData: t,
        reason: "Popular in the Pulsefy library",
        existingId: t.id,
      });
    }
  }

  // 3. Resolve each candidate to a local track UUID + filter already-played
  const client = await pool.connect();
  let count = 0;
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM recommendations WHERE user_id = $1", [req.user.id]);

    const seen = new Set(); // deduplicate by audio_url

    for (const { trackData, reason, existingId } of candidates) {
      if (seen.has(trackData.audio_url)) continue;
      seen.add(trackData.audio_url);

      const trackId = existingId ?? (await upsertTrack(client, trackData));

      // Skip if user already played this track
      const played = await client.query(
        "SELECT 1 FROM listening_events WHERE user_id = $1 AND track_id = $2 LIMIT 1",
        [req.user.id, trackId]
      );
      if (played.rows.length > 0) continue;

      await client.query(
        "INSERT INTO recommendations (user_id, track_id, reason) VALUES ($1,$2,$3)",
        [req.user.id, trackId, reason]
      );
      count++;
      if (count >= 12) break;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return res.json({ refreshed: true, count });
}));

export default router;
