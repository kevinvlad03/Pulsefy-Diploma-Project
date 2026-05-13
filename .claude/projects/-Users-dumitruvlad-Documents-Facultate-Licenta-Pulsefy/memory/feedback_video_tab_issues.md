---
name: Video tab known issues to fix
description: Two UX/display bugs in the Video tab — both resolved 2026-04-13
type: feedback
---

Both issues resolved on 2026-04-13.

1. **Music & TTS URL inputs** → replaced with `<Select>` dropdowns. Music picker is populated from completed MusicGen generations (`generationsQuery.data`); voiceover picker from the session `ttsHistory` array. Selecting "None" sends null to the API.

2. **Video fullscreen zoom bug** → changed `object-cover` to `object-contain` and replaced the gradient background with `bg-black` on the video container div, so the video letterboxes correctly at any viewport size including native fullscreen.
