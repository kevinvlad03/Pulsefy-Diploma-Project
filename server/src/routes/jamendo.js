import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

async function fetchJamendo(params) {
  const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params.toString()}`);
  if (!response.ok) return null;
  return response.json();
}

async function fetchLocalTracks({ limit, offset, search, genre }) {
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

  values.push(limit);
  const limitIndex = values.length;
  values.push(offset);
  const offsetIndex = values.length;

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT id, title, artist, album, genre, duration_sec, audio_url, cover_url
     FROM tracks
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${limitIndex}
     OFFSET $${offsetIndex}`,
    values
  );

  return result.rows.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    duration_sec: track.duration_sec,
    audio_url: track.audio_url,
    image_url: track.cover_url,
    license_url: null,
  }));
}

router.get("/tracks", async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;

  const {
    search = "",
    genre = "",
    limit = "12",
    offset = "0",
  } = req.query;
  const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 12));
  const parsedOffset = Math.max(0, Number(offset) || 0);

  const params = new URLSearchParams({
    format: "json",
    limit: String(parsedLimit),
    offset: String(parsedOffset),
    include: "musicinfo",
    audioformat: "mp32",
    type: "single albumtrack",
  });

  if (search) {
    params.set("namesearch", String(search));
  }
  if (genre) {
    params.set("tags", String(genre));
  }

  try {
    if (!clientId) {
      const localTracks = await fetchLocalTracks({
        limit: parsedLimit,
        offset: parsedOffset,
        search: String(search || ""),
        genre: String(genre || ""),
      });
      return res.json({
        tracks: localTracks,
        total: localTracks.length,
        source: "local-fallback",
        reason: "missing_jamendo_client_id",
      });
    }
    params.set("client_id", clientId);

    let data = await fetchJamendo(params);
    if (!data) {
      const localTracks = await fetchLocalTracks({
        limit: parsedLimit,
        offset: parsedOffset,
        search: String(search || ""),
        genre: String(genre || ""),
      });
      return res.json({
        tracks: localTracks,
        total: localTracks.length,
        source: "local-fallback",
        reason: "jamendo_api_error",
      });
    }
    if ((data.results || []).length === 0 && parsedOffset > 0) {
      params.set("offset", "0");
      const fallback = await fetchJamendo(params);
      if (fallback) {
        data = fallback;
      }
    }

    const tracks = (data.results || []).map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artist_name,
      album: track.album_name,
      duration_sec: track.duration,
      audio_url: track.audio,
      image_url: track.image,
      license_url: track.license_ccurl,
    }));
    if (tracks.length > 0) {
      return res.json({ tracks, total: data.headers?.results_full || tracks.length, source: "jamendo" });
    }

    const localTracks = await fetchLocalTracks({
      limit: parsedLimit,
      offset: parsedOffset,
      search: String(search || ""),
      genre: String(genre || ""),
    });
    return res.json({ tracks: localTracks, total: localTracks.length, source: "local-fallback" });
  } catch (err) {
    try {
      const localTracks = await fetchLocalTracks({
        limit: parsedLimit,
        offset: parsedOffset,
        search: String(search || ""),
        genre: String(genre || ""),
      });
      return res.json({ tracks: localTracks, total: localTracks.length, source: "local-fallback" });
    } catch {
      return res.status(500).json({ error: "Failed to fetch Jamendo tracks" });
    }
  }
});

export default router;
