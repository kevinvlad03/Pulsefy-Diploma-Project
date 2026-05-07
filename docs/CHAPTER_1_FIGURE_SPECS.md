# Chapter 1 — Figure specifications

Two diagrams to draw for Chapter 1 of the diploma thesis. Both should match IARCA's monochrome style: black outlines, white fills, light gray only for shared elements, no shadows, no color, no gradients. Caption format: `Figure N: <Caption>` placed under the figure, centered, plain Times New Roman 10pt.

---

## Figure 1 — Listening and creation flows in Pulsefy

### Purpose

This is the **load-bearing diagram of Chapter 1**. The chapter's argument is "listening and creating used to be separate products; Pulsefy combines them". This figure has to make that visually obvious in one glance.

### Tool

draw.io (https://app.diagrams.net). Use the default UML / flowchart shapes.

### Layout (text drawing, not to scale)

```
        LISTENING                     CREATION
        =========                     ========
           |                              |
           v                              v
   +---------------+              +---------------+
   | Browse catalog|              |  Type prompt  |
   +---------------+              +---------------+
           |          <------>           |
           v                              v
   +---------------+              +---------------+
   |  Play track   |              | Generate AI   |
   |               |              |    track      |
   +---------------+              +---------------+
           |          <------>           |
           v                              v
   +---------------+              +---------------+
   |      Get      |              |  Add cover    |
   | recommendation|              |     art       |
   +---------------+              +---------------+
           |          <------>           |
           v                              v
   +---------------+              +---------------+
   |   Save to     |              |  Publish to   |
   |   playlist    |              |   library     |
   +---------------+              +---------------+
            \                            /
             \                          /
              v                        v
    +-------------------------------------------+
    |     Shared library, single account        |  (light gray fill)
    +-------------------------------------------+
```

### Detailed shape inventory

- **2 column-header labels**: "LISTENING" (left), "CREATION" (right). Text only, bold, no bounding box. Placed at the top of each column.
- **8 process boxes** (rounded rectangles, default draw.io style): four per column, arranged vertically.
- **Left column boxes (top to bottom)**: `Browse catalog` → `Play track` → `Get recommendation` → `Save to playlist`.
- **Right column boxes (top to bottom)**: `Type prompt` → `Generate AI track` → `Add cover art` → `Publish to library`.
- **8 vertical arrows**: one connecting each pair of adjacent boxes within a column. Standard down-arrows.
- **3 horizontal double-headed arrows**: one between each parallel pair of boxes (rows 2, 3, 4). These arrows are the figure's argument — they show the user can transition between the two activities at any step. Label them with short verbs in italic above the arrow line, e.g. "inspires", "mixes into", "remixes".
- **1 shared bottom block**: a wide rounded rectangle spanning both columns, labeled `Shared library, single account`. Fill it with light gray (e.g. `#F0F0F0`) so it's visually distinct from the white process boxes. Two diagonal arrows connect the bottom box of each column down to this shared block.

### Sizing

Roughly 12 cm wide × 14 cm tall on the page. Don't worry about exact pixels — draw.io's auto-export will scale. Make sure all box labels fit on one or two lines.

### Caption (exact text)

`Figure 1: Listening and creation flows in Pulsefy`

### Save and place

- Export as PNG at 300 DPI from draw.io (`File → Export As → PNG`, set DPI = 300, transparent background).
- File name: `figure_01_pulsefy_flows.png` in `docs/figures/` (create the folder).
- In Word: replace the placeholder `[FIGURE 1: Listening and creation flows in Pulsefy — to be drawn]` with the inserted image. Keep the existing centered caption beneath.

---

## Figure 2 — Manual versus AI-assisted music discovery and creation timelines

### Purpose

Justifies the time-cost claim made in Chapter 1.3 ("the time between an idea and its evaluation drops"). Must be **honest** — no exaggerated factor like "1000× faster". The visual argument is hours-vs-minutes, not "AI is magic".

### Tool

draw.io or Canva. Both work — pick whichever is faster for you. If using Canva, search for "horizontal timeline infographic" templates.

### Layout

Two horizontal timelines stacked vertically. Each timeline has tick marks for time intervals and rounded rectangles above the line for the activity at each interval.

```
MANUAL WORKFLOW
|------|------|--------------------------------|
0h     2h     3h                              8h
[Browse: Spotify, blogs,    [Find vocalist  [Record / mix / iterate]
 friends' playlists for      or DAW + sample
 inspiration]                pack]


AI-ASSISTED WORKFLOW (PULSEFY)
|----------|--|--|----------|
0min       5  6  7         10min
[Open       [Type  [Generate  [Iterate prompt,
 recs]      prompt] AI track]  regenerate]
```

### Detailed spec

**Top timeline — "MANUAL WORKFLOW"**:
- Total span: 0 to 8 hours.
- Tick marks at: 0h, 2h, 3h, 8h.
- Activity blocks above the line:
  - 0h-2h: `Browse Spotify, blogs, friends' playlists for inspiration`
  - 2h-3h: `Find a vocalist or a DAW with sample pack`
  - 3h-8h: `Record / mix / iterate`
- Label "MANUAL WORKFLOW" left of timeline.

**Bottom timeline — "AI-ASSISTED WORKFLOW (PULSEFY)"**:
- Total span: 0 to 10 minutes.
- Tick marks at: 0min, 5min, 6min, 7min, 10min.
- Activity blocks above the line:
  - 0-5min: `Open recommendations feed`
  - 5-6min: `Type prompt based on a recommendation`
  - 6-7min: `Generate AI track`
  - 7-10min: `Iterate prompt, regenerate`
- Label "AI-ASSISTED WORKFLOW (PULSEFY)" left of timeline.

### Critical instruction: do NOT normalize the scales

The two timelines must visually represent different absolute durations (hours vs minutes). Don't make them the same physical length on the page — that misleads. The manual timeline should be roughly the same physical length as the AI timeline despite being 48× longer in real time, which makes the *honest* point that AI compresses the workflow. Add the unit label (h vs min) clearly on each.

### Style

Monochrome. Black timeline rule, black tick marks, white-filled rounded rectangles for activity blocks, plain text labels. No icons, no emoji, no color.

### Caption (exact text)

`Figure 2: Manual versus AI-assisted music discovery and creation timelines`

### Save and place

- Export as PNG at 300 DPI.
- File name: `figure_02_workflow_timelines.png` in `docs/figures/`.
- Replace the placeholder in Word and keep the existing caption.

---

## After both figures are inserted

1. In Word, replace the two `[FIGURE N: ... — to be drawn]` placeholder lines with the actual image (Insert → Pictures → From File).
2. The existing `Figure N: <caption>` line beneath each placeholder is already centered with correct caption styling — keep it.
3. Right-click the Table of Figures at the front of the document and choose "Update Field" to refresh it.
4. Save and push.

---

## Why these figures matter for the defense

A commissioner is likely to ask one of two questions about Chapter 1:

> "Why couldn't a user just open Spotify in one tab and Suno in another?"

Figure 1 answers this visually — the horizontal arrows show that the *workflow itself* is interleaved, not just the data. Tab-switching is friction.

> "How much faster is your AI workflow really?"

Figure 2 answers this honestly. Hours-to-minutes is a real claim. Minutes-to-microseconds would be a lie. Don't overpromise in the diagram.

Be ready to walk through both figures verbally during the defense.
