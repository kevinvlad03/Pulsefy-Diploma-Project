import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// ─── SQL helpers ─────────────────────────────────────────────────────────────

const USER_STATS_JOINS = `
  LEFT JOIN (
    SELECT following_id, COUNT(*) AS count FROM follows GROUP BY following_id
  ) followers ON followers.following_id = u.id
  LEFT JOIN (
    SELECT follower_id, COUNT(*) AS count FROM follows GROUP BY follower_id
  ) following ON following.follower_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS count FROM playlists WHERE is_public = TRUE GROUP BY user_id
  ) public_playlists ON public_playlists.user_id = u.id`;

const GENERATIONS_COUNT = `(
  SELECT COALESCE(SUM(cnt), 0)::int FROM (
    SELECT COUNT(*) AS cnt FROM ai_generations    WHERE user_id = u.id AND status = 'completed'
    UNION ALL
    SELECT COUNT(*) AS cnt FROM video_generations WHERE user_id = u.id AND status = 'completed'
    UNION ALL
    SELECT COUNT(*) AS cnt FROM tts_generations   WHERE user_id = u.id
  ) g
) AS generations_count`;

// ─── GET /me ─────────────────────────────────────────────────────────────────

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u.bio, u.created_at,
            COALESCE(followers.count, 0)::int        AS followers_count,
            COALESCE(following.count, 0)::int        AS following_count,
            COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
            ${GENERATIONS_COUNT}
     FROM users u
     ${USER_STATS_JOINS}
     WHERE u.id = $1`,
    [req.user.id]
  );
  return res.json({ profile: rows[0] || null });
}));

// ─── GET /discover ────────────────────────────────────────────────────────────

router.get("/discover", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.bio, u.created_at,
            COALESCE(followers.count, 0)::int        AS followers_count,
            COALESCE(following.count, 0)::int        AS following_count,
            COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
            ${GENERATIONS_COUNT},
            EXISTS (
              SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = u.id
            ) AS is_following
     FROM users u
     ${USER_STATS_JOINS}
     WHERE u.id <> $1
     ORDER BY followers_count DESC, u.created_at DESC
     LIMIT 12`,
    [req.user.id]
  );
  return res.json({ users: rows });
}));

// ─── GET /following ───────────────────────────────────────────────────────────

router.get("/following", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.bio, u.created_at,
            COALESCE(followers.count, 0)::int        AS followers_count,
            COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
            ${GENERATIONS_COUNT},
            TRUE AS is_following
     FROM follows fol
     JOIN users u ON u.id = fol.following_id
     ${USER_STATS_JOINS}
     WHERE fol.follower_id = $1
     ORDER BY fol.created_at DESC`,
    [req.user.id]
  );
  return res.json({ users: rows });
}));

// ─── GET /users/:id ───────────────────────────────────────────────────────────

router.get("/users/:id", requireAuth, asyncHandler(async (req, res) => {
  const { rows: profileRows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.bio, u.created_at,
            COALESCE(followers.count, 0)::int        AS followers_count,
            COALESCE(following.count, 0)::int        AS following_count,
            COALESCE(public_playlists.count, 0)::int AS public_playlists_count,
            ${GENERATIONS_COUNT},
            EXISTS (
              SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.following_id = u.id
            ) AS is_following
     FROM users u
     ${USER_STATS_JOINS}
     WHERE u.id = $2`,
    [req.user.id, req.params.id]
  );

  const profile = profileRows[0];
  if (!profile) return res.status(404).json({ error: "User not found" });

  const { rows: playlists } = await pool.query(
    `SELECT p.id, p.name, p.description, p.is_public, p.created_at,
            COUNT(DISTINCT pt.track_id)::int AS track_count,
            COUNT(DISTINCT pl.user_id)::int  AS likes_count,
            EXISTS (
              SELECT 1 FROM playlist_likes pl2
              WHERE pl2.user_id = $1 AND pl2.playlist_id = p.id
            ) AS liked_by_me
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     LEFT JOIN playlist_likes  pl ON pl.playlist_id = p.id
     WHERE p.user_id = $2 AND p.is_public = TRUE
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [req.user.id, profile.id]
  );

  return res.json({ profile, playlists });
}));

// ─── POST /follow/:id ─────────────────────────────────────────────────────────

router.post("/follow/:id", requireAuth, asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const { rows } = await pool.query("SELECT id FROM users WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "User not found" });

  const result = await pool.query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING follower_id`,
    [req.user.id, req.params.id]
  );

  if (result.rows[0]) {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, action_type)
       VALUES ($1, $2, 'follow')`,
      [req.params.id, req.user.id]
    );
  }

  return res.status(201).json({ ok: true });
}));

// ─── DELETE /follow/:id ───────────────────────────────────────────────────────

router.delete("/follow/:id", requireAuth, asyncHandler(async (req, res) => {
  await pool.query(
    "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
    [req.user.id, req.params.id]
  );
  return res.status(204).send();
}));

// ─── POST /playlists/:id/like ─────────────────────────────────────────────────

router.post("/playlists/:id/like", requireAuth, asyncHandler(async (req, res) => {
  const { rows: pl } = await pool.query(
    "SELECT id, user_id FROM playlists WHERE id = $1 AND is_public = TRUE",
    [req.params.id]
  );
  if (!pl[0]) return res.status(404).json({ error: "Playlist not found" });

  const result = await pool.query(
    `INSERT INTO playlist_likes (user_id, playlist_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING RETURNING user_id`,
    [req.user.id, req.params.id]
  );

  if (result.rows[0] && pl[0].user_id !== req.user.id) {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, action_type, target_id)
       VALUES ($1, $2, 'like', $3)`,
      [pl[0].user_id, req.user.id, req.params.id]
    );
  }

  return res.status(201).json({ ok: true });
}));

// ─── DELETE /playlists/:id/like ───────────────────────────────────────────────

router.delete("/playlists/:id/like", requireAuth, asyncHandler(async (req, res) => {
  await pool.query(
    "DELETE FROM playlist_likes WHERE user_id = $1 AND playlist_id = $2",
    [req.user.id, req.params.id]
  );
  return res.status(204).send();
}));

// ─── GET /playlists/:id/comments ──────────────────────────────────────────────

router.get("/playlists/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.user_id, u.name AS user_name, c.body, c.created_at
     FROM playlist_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.playlist_id = $1
     ORDER BY c.created_at ASC`,
    [req.params.id]
  );
  return res.json({ comments: rows });
}));

// ─── POST /playlists/:id/comments ─────────────────────────────────────────────

router.post("/playlists/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const { body } = req.body;
  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return res.status(400).json({ error: "Comment body is required" });
  }
  if (body.trim().length > 500) {
    return res.status(400).json({ error: "Comment too long (max 500 chars)" });
  }

  const { rows: pl } = await pool.query(
    "SELECT id, user_id FROM playlists WHERE id = $1 AND is_public = TRUE",
    [req.params.id]
  );
  if (!pl[0]) return res.status(404).json({ error: "Playlist not found" });

  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO playlist_comments (user_id, playlist_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, playlist_id, body, created_at
     )
     SELECT i.id, i.user_id, u.name AS user_name, i.body, i.created_at
     FROM inserted i
     JOIN users u ON u.id = i.user_id`,
    [req.user.id, req.params.id, body.trim()]
  );

  if (pl[0].user_id !== req.user.id) {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, action_type, target_id)
       VALUES ($1, $2, 'comment', $3)`,
      [pl[0].user_id, req.user.id, req.params.id]
    );
  }

  return res.status(201).json({ comment: rows[0] });
}));

// ─── DELETE /comments/:id ─────────────────────────────────────────────────────

router.delete("/comments/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    "DELETE FROM playlist_comments WHERE id = $1 AND user_id = $2 RETURNING id",
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Comment not found" });
  return res.status(204).send();
}));

// ─── GET /notifications ───────────────────────────────────────────────────────

router.get("/notifications", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.id, n.actor_id, u.name AS actor_name, n.action_type, n.target_id, n.is_read, n.created_at
     FROM notifications n
     JOIN users u ON u.id = n.actor_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [req.user.id]
  );
  return res.json({ notifications: rows });
}));

// ─── PATCH /notifications/read ────────────────────────────────────────────────

router.patch("/notifications/read", requireAuth, asyncHandler(async (req, res) => {
  await pool.query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
    [req.user.id]
  );
  return res.json({ ok: true });
}));

// ─── GET /leaderboard ─────────────────────────────────────────────────────────

router.get("/leaderboard", requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.bio, u.created_at,
            COALESCE(followers.count, 0)::int AS followers_count,
            ${GENERATIONS_COUNT}
     FROM users u
     LEFT JOIN (
       SELECT following_id, COUNT(*) AS count FROM follows GROUP BY following_id
     ) followers ON followers.following_id = u.id
     ORDER BY generations_count DESC, followers_count DESC
     LIMIT 20`
  );
  return res.json({ users: rows });
}));

export default router;
