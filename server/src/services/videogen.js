import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAdImages } from "./imagegen.js";

const __filename  = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const outputDir   = path.join(projectRoot, "public", "media", "generated", "videos");

const FPS          = 25;
const SEC_PER_CLIP = 5;

// Target output dimensions per aspect ratio
const DIMS = {
  "16:9": { w: 1280, h: 720  },
  "9:16": { w: 720,  h: 1280 },
};

/**
 * Ken Burns via scale-then-crop.
 * Scale the image to 125% of target, then animate the crop window over time.
 * Uses ffmpeg's `t` variable (seconds elapsed) — reliable on all ffmpeg builds.
 *
 * Returns a vf filter string.
 */
function kenBurnsFilter(index, sec, w, h) {
  const ow = Math.round(w * 1.25); // overscale width
  const oh = Math.round(h * 1.25); // overscale height
  const mx = ow - w;               // max x offset (pixels of room to pan)
  const my = oh - h;               // max y offset

  const scale = `scale=${ow}:${oh}`;

  // Four movements, cycling per scene index
  const crops = [
    // pan left → right, centred vertically
    `crop=${w}:${h}:x='${mx}*t/${sec}':y='${Math.round(my / 2)}'`,
    // pan right → left, centred vertically
    `crop=${w}:${h}:x='${mx}*(1-t/${sec})':y='${Math.round(my / 2)}'`,
    // pan top → bottom, centred horizontally
    `crop=${w}:${h}:x='${Math.round(mx / 2)}':y='${my}*t/${sec}'`,
    // pan bottom → top, centred horizontally
    `crop=${w}:${h}:x='${Math.round(mx / 2)}':y='${my}*(1-t/${sec})'`,
  ];

  return `${scale},${crops[index % crops.length]},format=yuv420p`;
}

/**
 * Generate a slideshow video from ad images, animated with Ken Burns effects,
 * optionally merged with background music and a TTS voiceover.
 */
export async function generateVideo({
  productName,
  productDescription,
  style       = "vibrant",
  aspectRatio = "16:9",
  sceneCount  = 3,
  musicUrl,
  ttsUrl,
}) {
  await fs.mkdir(outputDir, { recursive: true });

  const id   = crypto.randomUUID();
  const dims = DIMS[aspectRatio] ?? DIMS["16:9"];

  // ── 1. Generate scene images via Pollinations.ai ──────────────────────────
  console.log("[VideoGen] Generating scene images…");
  const { imagePaths, imageUrls } = await generateAdImages({
    productName,
    productDescription,
    style,
    aspectRatio,
    sceneCount,
  });

  // ── 2. Animate each image (Ken Burns: scale + crop with t-based offset) ───
  console.log("[VideoGen] Animating images…");
  const clipPaths = [];

  for (let i = 0; i < imagePaths.length; i++) {
    const vf       = kenBurnsFilter(i, SEC_PER_CLIP, dims.w, dims.h);
    const clipPath = path.join(outputDir, `clip-${id}-${i}.mp4`);

    await runFfmpeg([
      "-loop", "1",
      "-i", imagePaths[i],
      "-vf", vf,
      "-t", String(SEC_PER_CLIP),
      "-r", String(FPS),
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-pix_fmt", "yuv420p",
      "-y", clipPath,
    ]);

    clipPaths.push(clipPath);
  }

  // ── 3. Concatenate clips ──────────────────────────────────────────────────
  console.log("[VideoGen] Concatenating clips…");
  const listPath    = path.join(outputDir, `list-${id}.txt`);
  const listContent = clipPaths.map((p) => `file '${p}'`).join("\n");
  await fs.writeFile(listPath, listContent, "utf8");

  const concatPath = path.join(outputDir, `concat-${id}.mp4`);
  await runFfmpeg([
    "-f", "concat",
    "-safe", "0",
    "-i", listPath,
    "-c", "copy",
    "-y", concatPath,
  ]);

  // ── 4. Build audio mix (optional) ────────────────────────────────────────
  let finalInputPath = concatPath;

  if (musicUrl || ttsUrl) {
    const audioParts = [ttsUrl, musicUrl]
      .filter(Boolean)
      .map(resolveLocalPath);

    let mixedAudioPath;
    if (audioParts.length === 1) {
      mixedAudioPath = audioParts[0];
    } else {
      // Voiceover (index 0) at full volume, music (index 1) ducked to 35%
      mixedAudioPath = path.join(outputDir, `mix-${id}.wav`);
      await runFfmpeg([
        "-i", audioParts[0],
        "-i", audioParts[1],
        "-filter_complex", "[1]volume=0.35[bg];[0][bg]amix=inputs=2:duration=longest",
        "-y", mixedAudioPath,
      ]);
    }

    // ── 5. Merge video + audio ──────────────────────────────────────────────
    console.log("[VideoGen] Merging audio…");
    const mergedPath = path.join(outputDir, `merged-${id}.mp4`);
    await runFfmpeg([
      "-i", concatPath,
      "-i", mixedAudioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-shortest",
      "-y", mergedPath,
    ]);
    finalInputPath = mergedPath;

    if (audioParts.length > 1) {
      await fs.unlink(mixedAudioPath).catch(() => {});
    }
  }

  // ── 6. Rename to final output ─────────────────────────────────────────────
  const finalName = `video-${id}.mp4`;
  const finalPath = path.join(outputDir, finalName);
  await fs.rename(finalInputPath, finalPath);

  // ── 7. Cleanup temp files ─────────────────────────────────────────────────
  await Promise.allSettled([
    ...clipPaths.map((p) => fs.unlink(p)),
    fs.unlink(listPath),
    concatPath !== finalPath ? fs.unlink(concatPath) : Promise.resolve(),
  ]);

  console.log("[VideoGen] Done:", finalName);
  return { videoUrl: `/media/generated/videos/${finalName}`, imageUrls };
}

// ── helpers ───────────────────────────────────────────────────────────────────

function resolveLocalPath(url) {
  if (!url) return null;
  // Strip http://host prefix if present (e.g. http://localhost:4000/media/...)
  const relative = url.replace(/^https?:\/\/[^/]+/, "");
  return path.join(projectRoot, "public", relative);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += d; });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-800)}`));
    });
  });
}
