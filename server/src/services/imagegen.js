import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const defaultOutputDir = path.join(projectRoot, "public", "media", "generated", "images");

// Aspect ratios per ad format
const DIMENSIONS = {
  "9:16": { width: 720,  height: 1280 }, // TikTok / Instagram Stories / Reels
  "1:1":  { width: 1080, height: 1080 }, // Instagram square
  "16:9": { width: 1280, height: 720  }, // YouTube
};

// Scene prompts — each scene gives a different visual angle of the product
const SCENE_ANGLES = [
  "product hero shot, centered, clean background",
  "lifestyle context, in use, natural environment",
  "close-up detail shot, texture and quality",
  "brand moment, aspirational, wide establishing shot",
];

// Visual style modifiers
const STYLE_MODIFIERS = {
  minimalist: "minimalist, clean white background, studio lighting, simple elegant",
  vibrant:    "vibrant colors, bold, energetic, dynamic composition, saturated",
  cinematic:  "cinematic, dramatic lighting, moody atmosphere, film grain, wide angle",
  corporate:  "professional, corporate, clean modern office, business aesthetic",
  lifestyle:  "warm lifestyle photography, natural light, authentic, candid",
};

/**
 * Generate and download scene images for an ad.
 *
 * @param {{
 *   productName:        string,
 *   productDescription: string,
 *   style?:             keyof STYLE_MODIFIERS,
 *   aspectRatio?:       "9:16" | "1:1" | "16:9",
 *   sceneCount?:        number,   // 1-4
 *   seed?:              number,
 * }} opts
 *
 * @returns {Promise<{ imagePaths: string[], imageUrls: string[] }>}
 */
export async function generateAdImages({
  productName,
  productDescription,
  style       = "vibrant",
  aspectRatio = "9:16",
  sceneCount  = 3,
  seed,
}) {
  const outputDir = process.env.IMAGEGEN_OUTPUT_DIR || defaultOutputDir;
  await fs.mkdir(outputDir, { recursive: true });

  const dims      = DIMENSIONS[aspectRatio] ?? DIMENSIONS["9:16"];
  const modifier  = STYLE_MODIFIERS[style] ?? STYLE_MODIFIERS.vibrant;
  const count     = Math.min(Math.max(1, sceneCount), 4);
  const baseSeed  = seed ?? Math.floor(Math.random() * 100_000);

  const imagePaths = [];
  const imageUrls  = [];

  for (let i = 0; i < count; i++) {
    const angle  = SCENE_ANGLES[i] ?? SCENE_ANGLES[0];
    const prompt = buildPrompt({ productName, productDescription, angle, modifier });
    const url    = buildPollinationsUrl({ prompt, ...dims, seed: baseSeed + i });

    const filename   = `img-${Date.now()}-${crypto.randomUUID()}.jpg`;
    const outputPath = path.join(outputDir, filename);
    const publicUrl  = `/media/generated/images/${filename}`;

    await downloadImage(url, outputPath);

    imagePaths.push(outputPath);
    imageUrls.push(publicUrl);

    // Delay between requests — Pollinations rate-limits rapid bursts
    if (i < count - 1) await sleep(6000);
  }

  return { imagePaths, imageUrls };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function buildPrompt({ productName, productDescription, angle, modifier }) {
  return [
    productName,
    productDescription,
    angle,
    modifier,
    "professional advertising photography, high quality, sharp focus, commercial",
  ]
    .filter(Boolean)
    .join(", ");
}

function buildPollinationsUrl({ prompt, width, height, seed }) {
  const encoded = encodeURIComponent(prompt);
  // No model param — use Pollinations default (faster than flux)
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

async function downloadImage(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(120_000), // 2 min — AI generation can be slow
      });

      if (res.status === 429) {
        if (attempt === retries) {
          throw new Error(`Pollinations.ai rate limited after ${retries} attempts — try again in a minute`);
        }
        const wait = attempt * 10_000; // 10s, 20s, 30s
        console.warn(`[imagegen] rate limited, retrying in ${wait / 1000}s (attempt ${attempt}/${retries})`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Pollinations.ai returned ${res.status}`);
      }

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 1000) {
        throw new Error("Response too small — likely a Pollinations error page");
      }

      await fs.writeFile(destPath, Buffer.from(buffer));
      return; // success
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 3000);
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
