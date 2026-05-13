import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const outputDir   = path.join(projectRoot, "public", "media", "generated", "videos");

/**
 * Take an uploaded video file and optionally overlay TTS + background music.
 * Returns { videoUrl } pointing to the processed file under /media/generated/videos/.
 */
export async function processUploadedVideo({ uploadedVideoPath, ttsUrl, musicUrl }) {
  await fs.mkdir(outputDir, { recursive: true });
  const id = crypto.randomUUID();

  if (!ttsUrl && !musicUrl) {
    // No audio — just copy to output dir for a consistent public URL
    const outName = `uploaded-${id}.mp4`;
    const outPath = path.join(outputDir, outName);
    await runFfmpeg(["-i", uploadedVideoPath, "-c", "copy", "-y", outPath]);
    return { videoUrl: `/media/generated/videos/${outName}` };
  }

  const audioParts = [ttsUrl, musicUrl].filter(Boolean).map(resolveLocalPath);

  let mixedAudioPath;
  if (audioParts.length === 1) {
    mixedAudioPath = audioParts[0];
  } else {
    // Voiceover at full volume, music ducked to 35%
    mixedAudioPath = path.join(outputDir, `mix-${id}.wav`);
    await runFfmpeg([
      "-i", audioParts[0],
      "-i", audioParts[1],
      "-filter_complex", "[1]volume=0.35[bg];[0][bg]amix=inputs=2:duration=longest",
      "-y", mixedAudioPath,
    ]);
  }

  const outName = `uploaded-${id}.mp4`;
  const outPath = path.join(outputDir, outName);
  await runFfmpeg([
    "-i", uploadedVideoPath,
    "-i", mixedAudioPath,
    "-map", "0:v:0",   // video stream from uploaded file
    "-map", "1:a:0",   // audio stream from our overlay (replaces original audio)
    "-c:v", "copy",
    "-c:a", "aac",
    "-shortest",
    "-y", outPath,
  ]);

  if (audioParts.length > 1) {
    await fs.unlink(mixedAudioPath).catch(() => {});
  }

  return { videoUrl: `/media/generated/videos/${outName}` };
}

function resolveLocalPath(url) {
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
