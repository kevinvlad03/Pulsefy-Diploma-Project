import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateWithMusicGen } from "../services/musicgen.js";

const router = Router();

const generateSchema = z.object({
  prompt: z.string().min(6).max(2000),
  durationSec: z.number().int().min(1).max(30).optional(),
  model: z.string().min(3).max(160).optional(),
});

router.post("/generate", requireAuth, async (req, res) => {
  const parse = generateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { prompt, durationSec, model } = parse.data;
  const created = await pool.query(
    `INSERT INTO ai_generations (user_id, prompt, lyrics, audio_url, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, prompt, lyrics, audio_url, status, created_at`,
    [req.user.id, prompt, null, null, "pending"]
  );
  const generation = created.rows[0];

  try {
    const output = await generateWithMusicGen({
      prompt,
      durationSec,
      model,
    });

    const updated = await pool.query(
      `UPDATE ai_generations
       SET audio_url = $2, status = 'completed'
       WHERE id = $1
       RETURNING id, user_id, prompt, lyrics, audio_url, status, created_at`,
      [generation.id, output.audioUrl]
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
      error:
        "Music generation failed. Verify MusicGen setup (Python env, audiocraft install, model download).",
    });
  }
});

router.get("/generations", requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, user_id, prompt, lyrics, audio_url, status, created_at
     FROM ai_generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 25`,
    [req.user.id]
  );
  return res.json({ generations: result.rows });
});

export default router;
