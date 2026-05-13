---
name: Video generation approach decision
description: Veo 2 was the planned approach for video generation but dropped due to cost ($0.75/sec); thesis needs to document this
type: project
---

Original video generation plan was Veo 2 via the Gemini API — fully implemented in `server/src/services/videogen.js` and `POST /ai/video` route. Dropped because Veo 2 is billed separately from Gemini quota at ~$0.75/second (~$6 per 8s clip), not available on free tier.

**Why:** Cost is prohibitive for a student project; documented in `DECISIONS.md` at repo root for thesis reference.

**How to apply:** When discussing video generation, reference DECISIONS.md. The adopted alternative is an ffmpeg pipeline using Pollinations.ai images with Ken Burns effect + MusicGen music + gTTS voiceover — no per-generation cost.
