import { Router } from "express";

const router = Router();

router.get("/tracks", async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Jamendo client ID is not configured" });
  }

  const {
    search = "",
    genre = "",
    limit = "12",
    offset = "0",
  } = req.query;

  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: String(limit),
    offset: String(offset),
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
    const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params.toString()}`);
    if (!response.ok) {
      return res.status(502).json({ error: "Jamendo API error" });
    }
    const data = await response.json();
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
    return res.json({ tracks, total: data.headers?.results_full || tracks.length });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch Jamendo tracks" });
  }
});

export default router;
