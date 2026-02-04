# Pulsefy Project Log

This file records approved work and keeps an active checklist of the current task.
I will only add entries after you approve a step.

## Task Tracker
- Active task: Add sticky global player bar with playback controls.
- Status: Completed.
- What’s left:
  - Optional: Wire Player page to selected track.

## Change Log
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
