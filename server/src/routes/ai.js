import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateWithMusicGen, generateWithMusicGenFree } from "../services/musicgen.js";
import { processUploadedVideo } from "../services/videoupload.js";
import multer from "multer";
import { generateTTS } from "../services/tts.js";
import { generateVideo } from "../services/videogen.js";
import { asyncHandler } from "../utils/async-handler.js";

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

/** Convert a /media/... URL to an absolute filesystem path. */
function resolveMediaPath(mediaUrl) {
  const relative = mediaUrl.replace(/^https?:\/\/[^/]+/, "");
  const resolved = path.resolve(path.join(projectRoot, "public", relative));
  // Safety guard: must stay within public/media/generated
  const allowed = path.join(projectRoot, "public", "media", "generated");
  if (!resolved.startsWith(allowed)) throw new Error("Invalid media path");
  return resolved;
}

const router = Router();

// Multer for video uploads
const uploadDir = path.join(projectRoot, "public", "media", "uploads", "videos");
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/avi"];
    cb(null, allowed.includes(file.mimetype));
  },
});

const generateSchema = z.object({
  prompt: z.string().min(6).max(2000),
  durationSec: z.number().int().min(1).max(30).optional(),
  model: z.string().min(3).max(160).optional(),
  modelChoice: z.enum(["pulsefy", "musicgen"]).optional(),
});

router.post("/generate", requireAuth, asyncHandler(async (req, res) => {
  const parse = generateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { prompt, durationSec, model, modelChoice } = parse.data;
  const isPremium = req.user.subscription_tier === "premium";

  // Explicit choice takes priority; default: premium → musicgen, free → pulsefy
  const useMusicGen = modelChoice === "musicgen" || (!modelChoice && isPremium);

  if (useMusicGen && !isPremium) {
    return res.status(402).json({ error: "MusicGen requires a Premium subscription", code: "PREMIUM_REQUIRED" });
  }

  const modelTier = useMusicGen ? "premium" : "free";

  const created = await pool.query(
    `INSERT INTO ai_generations (user_id, prompt, lyrics, audio_url, status, model_tier)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, prompt, lyrics, audio_url, status, model_tier, created_at`,
    [req.user.id, prompt, null, null, "pending", modelTier]
  );
  const generation = created.rows[0];

  try {
    const output = useMusicGen
      ? await generateWithMusicGen({ prompt, durationSec, model })
      : await generateWithMusicGenFree({ prompt, durationSec });

    const updated = await pool.query(
      `UPDATE ai_generations
       SET audio_url = $2, status = 'completed', lyrics = $3
       WHERE id = $1
       RETURNING id, user_id, prompt, lyrics, audio_url, status, model_tier, created_at`,
      [generation.id, output.audioUrl, output.model ?? null]
    );
    return res.status(201).json({ generation: updated.rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Music generation failed";
    await pool.query(
      `UPDATE ai_generations
       SET status = 'failed', lyrics = $2
       WHERE id = $1`,
      [generation.id, `Generation failed: ${message.slice(0, 1500)}`]
    );
    return res.status(500).json({
      error: useMusicGen
        ? "Music generation failed. Verify MusicGen setup (Python env, audiocraft install, model download)."
        : "Music generation failed. Ensure Python 3 with numpy and scipy is available.",
    });
  }
}));

router.get("/generations", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, prompt, lyrics, audio_url, status, created_at
     FROM ai_generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 25`,
    [req.user.id]
  );
  return res.json({ generations: result.rows });
}));

// ── TTS ──────────────────────────────────────────────────────────────────────

const ttsSchema = z.object({
  text: z.string().min(1).max(2000),
  lang: z.string().min(2).max(10).optional().default("en"),
  slow: z.boolean().optional().default(false),
});

router.post("/tts", requireAuth, asyncHandler(async (req, res) => {
  const parse = ttsSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
  }

  const { text, lang, slow } = parse.data;

  if (req.user.subscription_tier !== "premium" && lang !== "en") {
    return res.status(402).json({ error: "TTS in languages other than English requires Premium", code: "PREMIUM_REQUIRED" });
  }

  try {
    const result = await generateTTS({ text, lang, slow });

    const saved = await pool.query(
      `INSERT INTO tts_generations (user_id, text, lang, slow, audio_url, duration_sec)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, text, lang, slow, audio_url, duration_sec, created_at`,
      [req.user.id, text, lang, slow, result.audioUrl, result.durationSec ?? 0]
    );
    const row = saved.rows[0];

    return res.status(201).json({
      id:          row.id,
      text:        row.text,
      audioUrl:    row.audio_url,
      durationSec: parseFloat(row.duration_sec),
      lang:        row.lang,
      createdAt:   row.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS generation failed";
    console.error("[TTS]", message);
    return res.status(500).json({ error: "TTS generation failed.", detail: message });
  }
}));

router.get("/tts", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, text, lang, slow, audio_url, duration_sec, created_at
     FROM tts_generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 25`,
    [req.user.id]
  );
  const items = result.rows.map((row) => ({
    id:          row.id,
    text:        row.text,
    audioUrl:    row.audio_url,
    durationSec: parseFloat(row.duration_sec),
    lang:        row.lang,
    createdAt:   row.created_at,
  }));
  return res.json({ items });
}));

// ── Video generation (Veo 2) ──────────────────────────────────────────────────

const videoSchema = z.object({
  productName:        z.string().min(2).max(200),
  productDescription: z.string().min(6).max(2000),
  style:              z.enum(["minimalist", "vibrant", "cinematic", "corporate", "lifestyle"]).optional().default("vibrant"),
  aspectRatio:        z.enum(["16:9", "9:16"]).optional().default("16:9"),
  sceneCount:         z.number().int().min(2).max(4).optional().default(3),
  musicUrl:           z.string().nullable().optional(),
  ttsUrl:             z.string().nullable().optional(),
});

router.post("/video", requireAuth, asyncHandler(async (req, res) => {
  const parse = videoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
  }

  const { productName, productDescription, style, aspectRatio, musicUrl, ttsUrl } = parse.data;
  const sceneCount = req.user.subscription_tier !== "premium" ? Math.min(parse.data.sceneCount, 2) : parse.data.sceneCount;

  const created = await pool.query(
    `INSERT INTO video_generations
       (user_id, prompt, product_description, style, scene_count, aspect_ratio, music_url, tts_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING id, user_id, prompt, product_description, style, scene_count,
               aspect_ratio, music_url, tts_url, video_url, status, created_at`,
    [req.user.id, productName, productDescription, style, sceneCount, aspectRatio, musicUrl ?? null, ttsUrl ?? null]
  );
  const record = created.rows[0];

  (async () => {
    try {
      const result = await generateVideo({
        productName,
        productDescription,
        style,
        aspectRatio,
        sceneCount,
        musicUrl,
        ttsUrl,
      });
      await pool.query(
        `UPDATE video_generations SET video_url = $2, status = 'completed' WHERE id = $1`,
        [record.id, result.videoUrl]
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Video generation failed";
      console.error("[VideoGen]", msg);
      await pool.query(
        `UPDATE video_generations SET status = 'failed', error_message = $2 WHERE id = $1`,
        [record.id, msg.slice(0, 1000)]
      );
    }
  })();

  return res.status(202).json({ video: record });
}));

router.get("/videos", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, prompt, product_description, style, scene_count,
            aspect_ratio, music_url, tts_url, video_url, status, error_message,
            source, uploaded_video_url, created_at
     FROM video_generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.user.id]
  );
  return res.json({ videos: result.rows });
}));

// ── Delete endpoints ──────────────────────────────────────────────────────────

router.delete("/generations/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `DELETE FROM ai_generations WHERE id = $1 AND user_id = $2 RETURNING audio_url`,
    [req.params.id, req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });

  const audioUrl = result.rows[0].audio_url;
  if (audioUrl) await fs.unlink(resolveMediaPath(audioUrl)).catch(() => {});
  return res.json({ deleted: true });
}));

router.delete("/tts/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `DELETE FROM tts_generations WHERE id = $1 AND user_id = $2 RETURNING audio_url`,
    [req.params.id, req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });

  const audioUrl = result.rows[0].audio_url;
  if (audioUrl) await fs.unlink(resolveMediaPath(audioUrl)).catch(() => {});
  return res.json({ deleted: true });
}));

router.delete("/videos/:id", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `DELETE FROM video_generations WHERE id = $1 AND user_id = $2 RETURNING video_url`,
    [req.params.id, req.user.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });

  const videoUrl = result.rows[0].video_url;
  if (videoUrl) await fs.unlink(resolveMediaPath(videoUrl)).catch(() => {});
  return res.json({ deleted: true });
}));

// ── Video Upload ──────────────────────────────────────────────────────────────

router.post("/video/upload",
  requireAuth,
  videoUpload.single("video"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided or unsupported format (mp4, mov, webm)" });
    }

    const ttsUrl   = req.body.ttsUrl   && req.body.ttsUrl   !== "none" ? req.body.ttsUrl   : null;
    const musicUrl = req.body.musicUrl && req.body.musicUrl !== "none" ? req.body.musicUrl : null;
    const uploadedVideoPath = req.file.path;
    const uploadedVideoUrl  = `/media/uploads/videos/${req.file.filename}`;

    const created = await pool.query(
      `INSERT INTO video_generations
         (user_id, prompt, product_description, style, scene_count, aspect_ratio,
          music_url, tts_url, status, source, uploaded_video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'uploaded', $9)
       RETURNING id, user_id, prompt, status, source, uploaded_video_url, music_url, tts_url, created_at`,
      [req.user.id, "User Upload", null, "uploaded", 0, "16:9", musicUrl, ttsUrl, uploadedVideoUrl]
    );
    const record = created.rows[0];

    (async () => {
      try {
        const result = await processUploadedVideo({ uploadedVideoPath, ttsUrl, musicUrl });
        await pool.query(
          `UPDATE video_generations SET video_url = $2, status = 'completed' WHERE id = $1`,
          [record.id, result.videoUrl]
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload processing failed";
        console.error("[VideoUpload]", msg);
        await pool.query(
          `UPDATE video_generations SET status = 'failed', error_message = $2 WHERE id = $1`,
          [record.id, msg.slice(0, 1000)]
        );
      }
    })();

    return res.status(202).json({ video: record });
  })
);

export default router;
