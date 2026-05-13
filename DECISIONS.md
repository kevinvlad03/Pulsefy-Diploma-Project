# Pulsefy — Design & Architecture Decisions

This file records key technical decisions made during development, including approaches that were
considered but not adopted and the reasons why. Intended for reference in academic documentation.

---

## [2026-04-12] Frontend framework — React + TypeScript + Vite

**Chosen:** React 18 with TypeScript, bundled by Vite.

**Why:** React's component model and ecosystem (React Query, React Router, shadcn/ui) allow rapid
UI iteration. TypeScript adds compile-time safety across the frontend/backend data contract.
Vite provides near-instant hot-reload, which is important for a project developed iteratively.

**Considered but not chosen:**
- Next.js — SSR not needed; the app is fully authenticated and client-rendered. The added
  complexity of SSR/RSC was not justified.
- Vue / Svelte — ecosystem maturity and personal familiarity with React made it the safer choice
  for a solo thesis project.

---

## [2026-04-12] Backend — Node.js + Express.js

**Chosen:** Express.js with ES modules (`"type": "module"`).

**Why:** Lightweight, widely documented, and shares the JavaScript runtime with the frontend
so tooling knowledge transfers. REST over GraphQL was chosen because the data access patterns
are simple and well-defined (no complex graph traversal).

**Considered but not chosen:**
- Fastify — marginally faster than Express but no material advantage at this scale.
- Python (FastAPI/Django) — would have been natural given the Python AI services, but keeping
  the API server in Node.js meant fewer runtime contexts to manage.

---

## [2026-04-12] Database — PostgreSQL

**Chosen:** PostgreSQL with the `pg` driver (no ORM).

**Why:** Relational structure fits the domain (users, tracks, playlists, listening events,
follows). Raw SQL was preferred over an ORM (Prisma, Drizzle) to keep the dependency surface
small and to demonstrate direct query knowledge in the thesis context.

**Schema is bootstrapped at server start** via `db/schema.sql` using `CREATE TABLE IF NOT EXISTS`
and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so migrations are handled without a migration
tool.

---

## [2026-04-12] Authentication — JWT (stateless)

**Chosen:** JSON Web Tokens signed with `jsonwebtoken`, stored in `localStorage` on the client.

**Why:** Stateless — no session store needed. Suitable for a single-server deployment. The
`Authorization: Bearer <token>` pattern is straightforward to implement and document.

**Trade-offs acknowledged:**
- `localStorage` is vulnerable to XSS (vs `HttpOnly` cookies). Accepted for a thesis project
  where security hardening is out of scope.
- No refresh token — tokens expire and the user must re-authenticate.

---

## [2026-04-12] Music catalog — Jamendo API with local fallback

**Chosen:** Jamendo API (`api.jamendo.com/v3.0`) for the browsable track catalog.

**Why:** Jamendo provides a large catalog of Creative Commons–licensed music via a free API
(requires only a `client_id`). This avoids any copyright issues inherent to serving real music
in a student project.

**Fallback:** If `JAMENDO_CLIENT_ID` is not set or the Jamendo API is unreachable, the server
falls back to tracks seeded into the local PostgreSQL `tracks` table. This keeps the app
functional in offline or restricted environments.

---

## [2026-04-12] AI music generation — Meta MusicGen (self-hosted)

**Chosen:** Meta's MusicGen model (`facebook/musicgen-small/medium/large`) via the `audiocraft`
Python library, run as a local subprocess.

**Why:**
- Completely free — no API costs per generation.
- Runs on CPU (no GPU required), making it accessible on a standard development machine.
- The `small` model (~300 MB) produces usable results in 30–90 seconds on CPU.
- Output is copyright-free by construction (model generates novel audio).

**Architecture:** The Node.js server spawns a Python child process
(`server/musicgen/generate.py`) per generation request. The process writes a 16-bit PCM WAV
file to `public/media/generated/` and exits. Node.js serves the file over `/media/`.

**Considered but not chosen:**
- Suno AI API / Udio API — both charge per generation and had no free tier suitable for
  development at scale.
- Replicate hosted MusicGen — pay-per-second inference; not free.

**Known limitation:** Generations are synchronous and block the HTTP response for their full
duration (up to ~90 seconds on CPU). Acceptable for a thesis prototype; a production system
would use a job queue.

---

## [2026-04-12] Text-to-speech — gTTS + ffmpeg

**Chosen:** Google Text-to-Speech (`gTTS` Python library) converting to WAV via `ffmpeg`.

**Why:** gTTS wraps Google's public TTS endpoint — no API key required, no cost, supports 14+
languages. `ffmpeg` converts the MP3 output of gTTS to 16-bit PCM WAV (44.1 kHz mono) for
consistency with the rest of the audio pipeline.

**Considered but not chosen:**
- Google Cloud Text-to-Speech API (paid, higher quality WaveNet/Neural2 voices).
- ElevenLabs — high quality but paid; free tier too limited for iterative development.
- Browser-native `SpeechSynthesis` — client-side only, output cannot be saved or merged with
  video server-side.

---

## [2026-04-12] Image generation — Pollinations.ai

**Chosen:** Pollinations.ai (`image.pollinations.ai`) REST API for ad scene images.

**Why:** Completely free, no API key or account required. Accepts a text prompt via URL and
returns a JPEG. Supports custom width/height and a seed parameter for reproducible results.
The server downloads and caches the images locally, so they are served from the app's own
static files rather than from Pollinations on every request.

**Scene strategy:** Four scene angles are pre-defined (hero shot, lifestyle, close-up detail,
brand moment) and combined with five visual style modifiers (minimalist, vibrant, cinematic,
corporate, lifestyle). This produces coherent multi-scene image sets from a single product
description.

**Considered but not chosen:**
- DALL·E 3 / Stable Diffusion API (Stability AI) — both require paid API keys.
- Locally hosted Stable Diffusion — technically feasible but requires a GPU and adds
  significant setup complexity; out of scope for the development environment.

---

## [2026-04-12] AI recommendations — rule-based listening history

**Chosen:** A rule-based recommendation engine that reads `listening_events` to determine the
user's top 3 genres, then surfaces unheard tracks in those genres from the local `tracks` table.

**Why:** Keeps the recommendation feature self-contained with no external dependency. For a
thesis prototype, demonstrating the concept (personalised suggestions based on history) is more
important than the algorithmic sophistication of the engine.

**Daily rotation (Jamendo):** The Jamendo-facing "Explore" feed uses a client-side
deterministic hash (`userId + date → offset`) so the feed feels fresh each day without a
server-side job.

**Considered but not chosen:**
- Collaborative filtering / matrix factorisation — requires a significant corpus of listening
  data that does not exist at prototype stage.
- External recommendation API (Spotify, Last.fm) — would introduce OAuth complexity and
  dependency on third-party user data.

---

## [2026-04-12] Social graph — follow/unfollow

**Chosen:** A simple `follows` table (`follower_id`, `following_id`) with a self-reference
check constraint (`follower_id <> following_id`).

**Why:** Covers the core social requirement (following other users, seeing their activity) with
a minimal schema. No graph database needed at this scale.

---

## [2026-04-12] Global audio player — React Context

**Chosen:** A `PlayerProvider` React context wrapping the entire app, exposing `playTrack`,
`currentTrack`, and `isPlaying` to all components.

**Why:** The persistent bottom player bar must survive navigation (route changes). Context
avoids prop-drilling and keeps the player state decoupled from any specific page component.
All three audio sources (Jamendo tracks, MusicGen generations, gTTS voiceovers) are normalised
to the same `PlayerTrack` shape before being handed to the player.

---

## [2026-04-12] Video generation — Veo 2 API abandoned due to cost → ffmpeg pipeline adopted

### Original approach
AI-generated video clips were to be produced using **Google Veo 2** (`veo-2.0-generate-001`),
accessed through the **Gemini API** (`@google/genai` SDK).

The intended pipeline was:
1. User provides a text prompt describing the video scene.
2. Server calls `ai.models.generateVideo()` with Veo 2, polls the long-running operation
   until the clip is ready (typically 1–3 minutes).
3. The returned MP4 is downloaded from Google's servers.
4. ffmpeg merges it with MusicGen background music (ducked to 35%) and a gTTS voiceover.
5. Final MP4 is served to the user for preview and download.

The server-side service (`server/src/services/videogen.js`) and the corresponding API routes
(`POST /ai/video`, `GET /ai/videos`) were fully implemented for this approach.

### Why it was dropped
Veo 2 video generation is billed separately from the standard Gemini API quota.
The cost at time of evaluation was approximately **$0.75 per second of generated video**.
For an 8-second clip — the minimum useful duration for an ad — this amounts to **$6.00 per
generation**. This is prohibitive for a student project with no revenue, and the model is
not available on the Gemini free tier.

### Adopted alternative
A free, self-contained pipeline using **ffmpeg** and assets already produced by the application:
- Scene images generated by **Pollinations.ai** (free, no account required).
- Each image animated with a **Ken Burns effect** (slow zoom/pan) via ffmpeg filters.
- Images concatenated into a video, then merged with MusicGen music and gTTS voiceover.

This produces output suitable for short-form ad content without any per-generation cost.

---
