---
name: AI services architecture
description: How each AI feature is implemented — what's local, what's external, and why
type: project
---

All AI services are **free** — no paid API keys except GEMINI_API_KEY (added but Veo 2 dropped, see video decision).

**Music generation:** Meta MusicGen via `audiocraft` Python lib, run as a local subprocess (`server/musicgen/generate.py`). Node.js spawns Python per request. Output: 16-bit PCM WAV. Models: small (fast/default), medium, large. Runs on CPU — no GPU required.

**TTS voiceover:** gTTS Python lib + ffmpeg. No API key. Converts text → MP3 → WAV (44.1kHz mono). 14+ languages, slow-speech toggle.

**Image generation:** Pollinations.ai REST API (no key). Server downloads and caches JPEG locally. Four scene angles × five style presets per generation set.

**Video generation (planned):** ffmpeg Ken Burns slideshow from Pollinations images + mixed audio. Veo 2 was original plan — dropped at $0.75/sec. See `DECISIONS.md`.

**Recommendations:** Rule-based — top genres from listening_events → unseen tracks in those genres. No ML model.

**Why self-hosted/free:** Thesis project with no budget. All AI generation costs $0 per run.

**How to apply:** When adding new AI features, prefer local Python scripts or free REST APIs over paid cloud APIs. If a paid API must be used, document the cost and consider free alternatives first.
