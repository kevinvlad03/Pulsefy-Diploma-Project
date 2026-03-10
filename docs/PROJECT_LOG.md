# Pulsefy Project Log

This file records approved work and keeps an active checklist of the current task.
I will only add entries after you approve a step.

## Task Tracker
- Active task: Stabilize and document AI generation + playback experience end-to-end.
- Status: Completed.
- What’s left:
  - Investigate and harden Jamendo empty-result behavior (fallback/retry strategy).
  - Continue FE polish pass for cross-page visual consistency.

## Change Log
- [Proposed] 2026-03-10 — Improve AI Generator visual design and add a stronger entry point from Home.
- [Approved] 2026-03-10 — Improve AI Generator visual design and add a stronger entry point from Home.
- [Completed] 2026-03-10 — Rebuilt `src/pages/AIGenerator.tsx` with hero/stat cards, prompt studio, prompt suggestions, and redesigned generation history.
- [Completed] 2026-03-10 — Kept AI generation playback as a single `Play in Player` action (removed duplicate in-card native audio player control from the new layout).
- [Completed] 2026-03-10 — Ensured generated audio uses absolute backend media URLs on FE (`API_BASE` + `/media/...`) for reliable playback.
- [Completed] 2026-03-10 — Added a prominent Home-page AI Studio CTA linking to `/ai-generator` (`src/pages/Home.tsx`).
- [Proposed] 2026-03-10 — Replace placeholder AI generation with real Meta MusicGen integration.
- [Approved] 2026-03-10 — Replace placeholder AI generation with real Meta MusicGen integration.
- [Completed] 2026-03-10 — Added MusicGen Python runner (`server/musicgen/generate.py`) and Node service bridge (`server/src/services/musicgen.js`).
- [Completed] 2026-03-10 — Updated `POST /ai/generate` to run MusicGen, persist `audio_url`, and mark failed/completed statuses.
- [Completed] 2026-03-10 — Added generated media folder (`public/media/generated`) and simple audio playback rendering in AI Generator page.
- [Completed] 2026-03-10 — Extended setup docs/env with MusicGen Python path and Audiocraft installation steps.
- [Completed] 2026-03-10 — Resolved MusicGen environment blockers on macOS (Python 3.11 venv, dependency pinning, CPU device fallback).
- [Completed] 2026-03-10 — Validated end-to-end `/ai/generate` API returns `completed` and writes WAV files in `public/media/generated`.
- [Completed] 2026-03-10 — Fixed generated audio encoding to browser-safe PCM s16 WAV and converted existing generated files.
- [Completed] 2026-03-10 — Wired AI Generator play action into global player state so generated tracks can appear in bottom Now Playing bar.
- [Completed] 2026-03-10 — Added backend static media serving (`/media`) and FE absolute media URL resolution.
- [Proposed] 2026-03-10 — Execute all next steps: lint stabilization, backend MVP endpoints, AI wiring, telemetry, setup docs.
- [Approved] 2026-03-10 — Execute all next steps: lint stabilization, backend MVP endpoints, AI wiring, telemetry, setup docs.
- [Completed] 2026-03-10 — Fixed blocking lint errors (`no-empty-object-type`, `no-require-imports`) and restored clean lint pass (warnings only).
- [Completed] 2026-03-10 — Added backend MVP routes: playlists, listening events, recommendations (+ refresh), AI generate/history.
- [Completed] 2026-03-10 — Wired AI Recommendations and AI Generator pages to real API endpoints.
- [Completed] 2026-03-10 — Added listening-event telemetry from global player (start/progress/end checkpoints).
- [Completed] 2026-03-10 — Added `SETUP.md` with env vars, DB bootstrap order, and local run flow.
- [Completed] 2026-02-04 — Added mix salt + refresh controls to vary Jamendo selections per page and session.
- [Completed] 2026-02-04 — Home now pulls a larger set and uses different slices for diversity.
- [Completed] 2026-02-04 — Player page now uses global playback state and shows the actual queue (no duplicate Dashboard UI).
- [Proposed] 2026-02-04 — Add pagination offsets and daily shuffle for Jamendo tracks (per user).
- [Approved] 2026-02-04 — Add pagination offsets and daily shuffle for Jamendo tracks (per user).
- [Completed] 2026-02-04 — Added deterministic daily offsets and pagination controls to vary library/home tracks per user.
- [Proposed] 2026-02-04 — Fix crash caused by play toggle dependency ordering.
- [Approved] 2026-02-04 — Fix crash caused by play toggle dependency ordering.
- [Completed] 2026-02-04 — Reordered player callbacks to avoid render crash.
- [Proposed] 2026-02-04 — Fix track play buttons to toggle pause when the same track is clicked.
- [Approved] 2026-02-04 — Fix track play buttons to toggle pause when the same track is clicked.
- [Completed] 2026-02-04 — Clicking the same track now toggles play/pause from cards and lists.
- [Proposed] 2026-02-04 — Replace marketing Home with app-style Home and move landing to `/about`.
- [Approved] 2026-02-04 — Replace marketing Home with app-style Home and move landing to `/about`.
- [Completed] 2026-02-04 — Added app-style Home page (library, playlists, trending) and moved landing page to `/about`.
- [Proposed] 2026-02-04 — Add sticky global player bar with playback controls and shared player state.
- [Approved] 2026-02-04 — Add sticky global player bar with playback controls and shared player state.
- [Completed] 2026-02-04 — Added global player context, sticky bottom Now Playing bar, and wired Dashboard to global playback.
- [Proposed] 2026-02-04 — Improve library UI + add playback in Dashboard.
- [Approved] 2026-02-04 — Improve library UI + add playback in Dashboard.
- [Completed] 2026-02-04 — Added cover art, play overlays, and audio playback via Jamendo on the Dashboard.
- [Proposed] 2026-02-04 — Create `docs/PROJECT_LOG.md` with task tracker + approval workflow.
- [Approved] 2026-02-04 — Create `docs/PROJECT_LOG.md` with task tracker + approval workflow.
- [Completed] 2026-02-04 — Created `docs/PROJECT_LOG.md`.
- [Proposed] 2026-02-04 — Suggestion 1 (MVP scope): Goal, audience, in-scope, out-of-scope, success criteria.
- [Approved] 2026-02-04 — Suggestion 1 (MVP scope): Goal, audience, in-scope, out-of-scope, success criteria.
- [Completed] 2026-02-04 — Documented MVP scope decisions (Node.js + Express + PostgreSQL, real AI API).
- [Proposed] 2026-02-04 — Suggestion 2 (Minimal API contract): entities + endpoints for MVP.
- [Approved] 2026-02-04 — Suggestion 2 (Minimal API contract): entities + endpoints for MVP.
- [Completed] 2026-02-04 — Defined minimal API contract for MVP.
- [Proposed] 2026-02-04 — Suggestion 3 (Backend skeleton): Express server, auth endpoints, tracks read endpoints, DB schema.
- [Approved] 2026-02-04 — Suggestion 3 (Backend skeleton): Express server, auth endpoints, tracks read endpoints, DB schema.
- [Completed] 2026-02-04 — Added backend skeleton with DB schema and auth/tracks routes.
- [Proposed] 2026-02-04 — Seed public-domain tracks hosted locally under `public/media/audio`.
- [Approved] 2026-02-04 — Seed public-domain tracks hosted locally under `public/media/audio`.
- [Completed] 2026-02-04 — Downloaded 10 public-domain audio files and created `server/db/seed.sql`.
- [Proposed] 2026-02-04 — Suggestion 4 (Frontend wiring): Auth page, API client, dashboard tracks from backend.
- [Approved] 2026-02-04 — Suggestion 4 (Frontend wiring): Auth page, API client, dashboard tracks from backend.
- [Completed] 2026-02-04 — Added Auth page, API/auth helpers, and dashboard track fetching.
- [Proposed] 2026-02-04 — Suggestion 5 (Jamendo): backend proxy + dashboard toggle for external catalog.
- [Approved] 2026-02-04 — Suggestion 5 (Jamendo): backend proxy + dashboard toggle for external catalog.
- [Completed] 2026-02-04 — Added `/jamendo/tracks` proxy route and dashboard source toggle.
- [Proposed] 2026-02-04 — Hide Jamendo name and present a single library search.
- [Approved] 2026-02-04 — Hide Jamendo name and present a single library search.
- [Completed] 2026-02-04 — Dashboard now uses a single library search UI (Jamendo-only backend).

## Session Summary (2026-03-10)
- Integrated Meta MusicGen (Audiocraft) into the real backend generation pipeline.
- Added/validated Python runner + Node bridge and connected `POST /ai/generate` to persisted generation statuses.
- Fixed local MusicGen environment blockers (Python version/dependencies/model runtime compatibility).
- Validated real generation outputs are produced and written under `public/media/generated`.
- Converted generated WAV output to browser-safe PCM s16 and verified playback compatibility.
- Added backend static media serving and FE absolute media URL handling for generated audio.
- Wired generated items into global player state so AI tracks can appear in the bottom Now Playing bar.
- Implemented backend MVP routes for playlists, listening events, recommendations, and AI generation history.
- Wired AI Recommendations and AI Generator pages to real API endpoints.
- Added listening telemetry checkpoints from the global player.
- Added/updated setup documentation (`SETUP.md`, env/setup flow notes).
- Performed a visual redesign pass on AI Generator and added a stronger discovery link from Home.
- Current known follow-up: Jamendo can still return empty result sets in some local runs and needs fallback hardening.

## MVP Scope (Approved)
- Goal: Deliver a production-like AI-enhanced music streaming platform demo with real navigation, accounts, recommendations, and AI generation flows that feel usable and cohesive for a thesis commission.
- Audience: General music listeners.
- In-scope:
  - Authentication + user profile/settings.
  - Music library with real, playable audio (open-licensed or self-produced).
  - Browse/search and a player with queue controls.
  - AI recommendations flow using listening history (real API/logic).
  - AI karaoke/generation flow (prompt → beat + lyrics).
- Out-of-scope:
  - Commercial licensing of major-label tracks.
  - Payments/subscriptions.
  - Social features (following, sharing, live activity).
  - Offline downloads + DRM.
  - Native mobile apps.
- Success criteria:
  - End-to-end demo runs locally with no dead links or empty states.
  - Every major page has functional interactions (not just static).
  - At least 10 playable tracks with metadata.
  - AI Recommendations show personalized results.
  - AI Karaoke outputs a playable artifact or convincingly presented output.
  - Backend: Node.js + Express + PostgreSQL.
- AI integration: Real API.

## Minimal API Contract (Approved)
### Entities
- User: id, email, name, password_hash, created_at
- Track: id, title, artist, album, genre, duration_sec, audio_url, cover_url, created_at
- Playlist: id, user_id, name, description, created_at
- PlaylistTrack: playlist_id, track_id, position
- ListeningEvent: id, user_id, track_id, played_at, seconds_listened
- Recommendation: id, user_id, track_id, reason, created_at
- AIGeneration: id, user_id, prompt, lyrics, audio_url, created_at, status

### Endpoints
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Library: `GET /tracks`, `GET /tracks/:id`, `GET /playlists`, `POST /playlists`, `GET /playlists/:id`, `POST /playlists/:id/tracks`, `DELETE /playlists/:id/tracks/:trackId`
- Playback: `POST /listening-events`
- Recommendations: `GET /recommendations`, `POST /recommendations/refresh`
- AI Generation: `POST /ai/generate`, `GET /ai/generations`
