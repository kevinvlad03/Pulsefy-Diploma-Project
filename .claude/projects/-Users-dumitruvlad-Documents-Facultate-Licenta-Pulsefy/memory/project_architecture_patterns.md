---
name: Key architectural patterns
description: Recurring patterns used across the codebase worth knowing for future work
type: project
---

**DB schema management:** No migration tool. `schema.sql` uses `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Runs on every server start via `initializeDatabase()` in `db.js`.

**Static media serving:** All generated files (WAV, images, videos) go to `public/media/generated/`. Express serves `/media` as static. URLs are `/media/generated/<filename>` — converted to absolute `http://localhost:4000/...` on the frontend via `toAbsoluteUrl()`.

**Python subprocess pattern:** Node.js spawns Python scripts via `child_process.spawn()` for MusicGen and gTTS. Scripts accept CLI args, write output file, print result to stdout, exit 0 on success. Environment variable `MUSICGEN_PYTHON` controls which Python binary is used (defaults to `python3`).

**Async background jobs:** Long-running tasks (MusicGen, video generation) respond immediately with 202 + a DB record, then run in a fire-and-forget async IIFE. Frontend polls `GET /ai/generations` or `GET /ai/videos` with React Query `refetchInterval`.

**Player normalisation:** All audio sources (Jamendo, MusicGen, TTS) are normalised to the `PlayerTrack` shape before being passed to `usePlayer`. The global `PlayerProvider` context persists across route changes.

**Music catalog fallback:** Jamendo API → local `tracks` table if Jamendo is unreachable or client ID missing. Keeps the app functional offline.
