import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const defaultGeneratedDir = path.join(projectRoot, "public", "media", "generated");
const defaultScriptPath = path.join(projectRoot, "server", "musicgen", "generate.py");
const defaultFreeScriptPath = path.join(projectRoot, "server", "musicgen", "generate_free.py");

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function runPythonProcess({ pythonCmd, scriptPath, prompt, outputPath, model, durationSec, device }) {
  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      "--prompt",
      prompt,
      "--output",
      outputPath,
      "--model",
      model,
      "--duration",
      String(durationSec),
      "--device",
      device,
    ];

    const child = spawn(pythonCmd, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const error = new Error(
        `MusicGen process failed with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`
      );
      reject(error);
    });
  });
}

export async function generateWithMusicGenFree({ prompt, durationSec }) {
  const pythonCmd = process.env.MUSICGEN_FREE_PYTHON || process.env.MUSICGEN_PYTHON || "python3";
  const scriptPath = process.env.MUSICGEN_FREE_SCRIPT_PATH || defaultFreeScriptPath;
  const generatedDir = process.env.MUSICGEN_OUTPUT_DIR || defaultGeneratedDir;
  const defaultDuration = 8;
  const finalDuration = clamp(toInt(durationSec, defaultDuration), 1, 30);

  await fs.mkdir(generatedDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}.wav`;
  const outputPath = path.join(generatedDir, filename);

  const { stdout } = await runPythonProcess({
    pythonCmd,
    scriptPath,
    prompt: prompt || "upbeat",
    outputPath,
    model: "pulsefy-free-v0",
    durationSec: finalDuration,
    device: "cpu",
  });

  // Parse the JSON the Python script prints to stdout to get the actual model name.
  // generate_free.py routes to lstm/generate.py when a checkpoint exists, so the
  // model field will be "pulsefy-lstm-v1" once trained, otherwise "pulsefy-free-v0".
  let modelName = "pulsefy-free-v0";
  try {
    const parsed = JSON.parse(stdout.trim());
    if (parsed.model) modelName = parsed.model;
  } catch { /* stdout not JSON — keep default */ }

  return {
    audioUrl: `/media/generated/${filename}`,
    model: modelName,
    durationSec: finalDuration,
  };
}

export async function generateWithMusicGen({ prompt, durationSec, model }) {
  const pythonCmd = process.env.MUSICGEN_PYTHON || "python3";
  const scriptPath = process.env.MUSICGEN_SCRIPT_PATH || defaultScriptPath;
  const generatedDir = process.env.MUSICGEN_OUTPUT_DIR || defaultGeneratedDir;
  const selectedModel = model || process.env.MUSICGEN_MODEL || "facebook/musicgen-small";
  const selectedDevice = process.env.MUSICGEN_DEVICE || "auto";
  const defaultDuration = toInt(process.env.MUSICGEN_DURATION_SEC, 8);
  const finalDuration = clamp(toInt(durationSec, defaultDuration), 1, 30);

  await fs.access(scriptPath);
  await fs.mkdir(generatedDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}.wav`;
  const outputPath = path.join(generatedDir, filename);

  await runPythonProcess({
    pythonCmd,
    scriptPath,
    prompt,
    outputPath,
    model: selectedModel,
    durationSec: finalDuration,
    device: selectedDevice,
  });

  return {
    audioUrl: `/media/generated/${filename}`,
    model: selectedModel,
    durationSec: finalDuration,
  };
}
