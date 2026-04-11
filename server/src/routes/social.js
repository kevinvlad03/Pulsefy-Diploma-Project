import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
        u.id,
        u.email,
        u.name,
        u.bio,
        u.created_at,
        COALESCE(followers.count, 0)::int AS followers_count,
        COALESCE(following.count, 0)::int AS following_count,
        COALESCE(public_playlists.count, 0)::int AS public_playlists_count
     FROM users u
     LEFT JOIN (
       SELECT following_id, COUNT(*) AS count
       FROM follows
       GROUP BY following_id
     ) followers ON followers.following_id = u.id
     LEFT JOIN (
       SELECT follower_id, COUNT(*) AS count
       FROM follows
       GROUP BY follower_id
     ) following ON following.follower_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS count
       FROM playlists
       WHERE is_public = TRUE
       GROUP BY user_id
     ) public_playlists ON public_playlists.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  return res.json({ profile: result.rows[0] || null });
}));

router.get("/discover", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.bio,
        u.created_at,
        COALESCE(followers.count, 0)::int AS followers_count,
        COALESCE(following.count, 0)::int AS following_count,
        COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
        EXISTS (
          SELECT 1
          FROM follows f
          WHERE f.follower_id = $1 AND f.following_id = u.id
        ) AS is_following
     FROM users u
     LEFT JOIN (
       SELECT following_id, COUNT(*) AS count
       FROM follows
       GROUP BY following_id
     ) followers ON followers.following_id = u.id
     LEFT JOIN (
       SELECT follower_id, COUNT(*) AS count
       FROM follows
       GROUP BY follower_id
     ) following ON following.follower_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS count
       FROM playlists
       WHERE is_public = TRUE
       GROUP BY user_id
     ) public_playlists ON public_playlists.user_id = u.id
     WHERE u.id <> $1
     ORDER BY followers_count DESC, u.created_at DESC
     LIMIT 12`,
    [req.user.id]
  );

  return res.json({ users: result.rows });
}));

router.get("/following", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.bio,
        u.created_at,
        COALESCE(followers.count, 0)::int AS followers_count,
        COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
        TRUE AS is_following
     FROM follows f
     JOIN users u ON u.id = f.following_id
     LEFT JOIN (
       SELECT following_id, COUNT(*) AS count
       FROM follows
       GROUP BY following_id
     ) followers ON followers.following_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS count
       FROM playlists
       WHERE is_public = TRUE
       GROUP BY user_id
     ) public_playlists ON public_playlists.user_id = u.id
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id]
  );

  return res.json({ users: result.rows });
}));

router.get("/users/:id", requireAuth, asyncHandler(async (req, res) => {
  const profileResult = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.bio,
        u.created_at,
        COALESCE(followers.count, 0)::int AS followers_count,
        COALESCE(following.count, 0)::int AS following_count,
        COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
        EXISTS (
          SELECT 1
          FROM follows f
          WHERE f.follower_id = $1 AND f.following_id = u.id
        ) AS is_following
     FROM users u
     LEFT JOIN (
       SELECT following_id, COUNT(*) AS count
       FROM follows
       GROUP BY following_id
     ) followers ON followers.following_id = u.id
     LEFT JOIN (
       SELECT follower_id, COUNT(*) AS count
       FROM follows
       GROUP BY follower_id
     ) following ON following.follower_id = u.id
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS count
       FROM playlists
       WHERE is_public = TRUE
       GROUP BY user_id
     ) public_playlists ON public_playlists.user_id = u.id
     WHERE u.id = $2`,
    [req.user.id, req.params.id]
  );

  const profile = profileResult.rows[0];
  if (!profile) {
    return res.status(404).json({ error: "User not found" });
  }

  const playlistsResult = await pool.query(
    `SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.is_public,
        p.created_at,
        COUNT(pt.track_id)::int AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     WHERE p.user_id = $1 AND p.is_public = TRUE
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [profile.id]
  );

  return res.json({ profile, playlists: playlistsResult.rows });
}));

router.post("/follow/:id", requireAuth, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [req.params.id]);
  if (!userResult.rows[0]) {
    return res.status(404).json({ error: "User not found" });
  }

  await pool.query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [req.user.id, req.params.id]
  );

  return res.status(201).json({ ok: true });
}));

router.delete("/follow/:id", requireAuth, asyncHandler(async (req, res) => {
  await pool.query(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
    [req.user.id, req.params.id]
  );
  return res.status(204).send();
}));

export default router;
