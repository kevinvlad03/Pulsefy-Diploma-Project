import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const defaultScriptPath  = path.join(projectRoot, "server", "tts", "generate.py");
const defaultOutputDir   = path.join(projectRoot, "public", "media", "generated");

/**
 * Generate a WAV voiceover from text using gTTS.
 *
 * @param {{ text: string, lang?: string, slow?: boolean }} opts
 * @returns {Promise<{ audioUrl: string, durationSec: number }>}
 */
export async function generateTTS({ text, lang = "en", slow = false }) {
  const pythonCmd  = process.env.MUSICGEN_PYTHON || "python3";   // reuse same venv
  const scriptPath = process.env.TTS_SCRIPT_PATH || defaultScriptPath;
  const outputDir  = process.env.TTS_OUTPUT_DIR  || defaultOutputDir;

  await fs.access(scriptPath);
  await fs.mkdir(outputDir, { recursive: true });

  const filename   = `tts-${Date.now()}-${crypto.randomUUID()}.wav`;
  const outputPath = path.join(outputDir, filename);

  await runScript(pythonCmd, scriptPath, { text, lang, slow: String(slow), output: outputPath });

  // Read duration via ffprobe
  const durationSec = await probeDuration(outputPath);

  return {
    audioUrl: `/media/generated/${filename}`,
    durationSec,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function runScript(pythonCmd, scriptPath, { text, lang, slow, output }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      pythonCmd,
      [scriptPath, "--text", text, "--output", output, "--lang", lang, "--slow", slow],
      { cwd: projectRoot, env: process.env, stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`TTS script exited ${code}: ${stderr.trim()}`));
    });
  });
}

async function probeDuration(filePath) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_streams",
      filePath,
    ]);
    const data = JSON.parse(stdout);
    const dur  = parseFloat(data?.streams?.[0]?.duration ?? "0");
    return Number.isFinite(dur) ? dur : 0;
  } catch {
    return 0;
  }
}
