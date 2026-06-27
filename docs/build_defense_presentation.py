"""
Build the Pulsefy diploma defense presentation.

12 slides, 5 minutes total speaking time, calm and minimal.
Designed for ~25 seconds per slide with the spoken text in the notes pane.

Run from the worktree root:
    python3 docs/build_defense_presentation.py
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

OUT = (
    "/Users/dumitruvlad/Documents/Facultate/Licenta/Pulsefy/"
    ".claude/worktrees/friendly-shockley-28309b/docs/"
    "Pulsefy_Defense_Presentation.pptx"
)

# Pulsefy accent palette
VIOLET = RGBColor(0x7C, 0x3A, 0xED)
INK = RGBColor(0x0F, 0x17, 0x2A)
MUTED = RGBColor(0x64, 0x74, 0x8B)
SOFT = RGBColor(0xE9, 0xD5, 0xFF)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# 16:9 presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]  # fully blank layout


def add_slide():
    slide = prs.slides.add_slide(BLANK)
    return slide


def add_text(slide, x, y, w, h, text, *, size=24, bold=False, color=INK,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, italic=False,
             font_name="Calibri"):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    if not text:
        return tb
    # first paragraph
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font_name
    return tb


def add_paragraph_run(textbox, text, *, size=18, bold=False, color=INK,
                      align=PP_ALIGN.LEFT, italic=False, font_name="Calibri"):
    """Add an additional paragraph to an existing textbox."""
    tf = textbox.text_frame
    p = tf.add_paragraph()
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font_name
    return p


def add_accent_bar(slide, x, y, w, h, color=VIOLET):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                   Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def set_speaker_notes(slide, text):
    notes_tf = slide.notes_slide.notes_text_frame
    notes_tf.text = text


def add_image_placeholder(slide, x, y, w, h, caption):
    """Soft grey rectangle with placeholder text — Vlad replaces with screenshot."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                   Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(0xF1, 0xF5, 0xF9)
    shape.line.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
    shape.line.width = Pt(1)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = caption
    run.font.size = Pt(14)
    run.font.italic = True
    run.font.color.rgb = MUTED


# ====================================================================
# SLIDE 1 — Title
# ====================================================================
s = add_slide()
add_accent_bar(s, 0, 3.4, 13.333, 0.04)
add_text(s, 1.0, 2.4, 11.3, 1.0, "Pulsefy",
         size=72, bold=True, color=INK, align=PP_ALIGN.LEFT)
add_text(s, 1.0, 3.6, 11.3, 0.7,
         "AI-Assisted Ad Creation Platform for Short-Form Social Video",
         size=22, color=MUTED, align=PP_ALIGN.LEFT)

add_text(s, 1.0, 5.6, 5.5, 0.4, "Vlad DUMITRU", size=16, bold=True, color=INK)
add_text(s, 1.0, 6.0, 5.5, 0.4, "Diploma project, June 2026", size=13, color=MUTED)

add_text(s, 7.8, 5.6, 4.6, 0.4, "Coordinator", size=12, color=MUTED, align=PP_ALIGN.RIGHT)
add_text(s, 7.8, 5.9, 4.6, 0.4, "Conf. dr. ing. Iuliana MARIN",
         size=14, bold=True, color=INK, align=PP_ALIGN.RIGHT)
add_text(s, 7.8, 6.3, 4.6, 0.4,
         "Faculty of Engineering in Foreign Languages, UPB",
         size=11, color=MUTED, align=PP_ALIGN.RIGHT)

set_speaker_notes(s,
    "Good morning. I'm Vlad Dumitru, and I'm presenting Pulsefy, "
    "an AI-assisted ad creation platform built as my diploma project "
    "under the guidance of Conf. dr. ing. Iuliana Marin."
)


# ====================================================================
# SLIDE 2 — The problem
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Short-form social ads are expensive to produce",
         size=32, bold=True, color=INK)

add_text(s, 1.0, 2.4, 11.5, 0.5,
         "Three options, none of them good for solo creators:",
         size=18, color=MUTED, italic=True)

tb = add_text(s, 1.0, 3.2, 11.5, 0.6,
              "Hire an agency",
              size=24, bold=True, color=VIOLET)
add_paragraph_run(tb, "    ~1,000–10,000 € per campaign",
                  size=18, color=INK)

tb2 = add_text(s, 1.0, 4.3, 11.5, 0.6,
               "Stitch together four DIY tools",
               size=24, bold=True, color=VIOLET)
add_paragraph_run(tb2, "    Canva + Suno + ElevenLabs + CapCut, four subscriptions, four interfaces",
                  size=18, color=INK)

tb3 = add_text(s, 1.0, 5.4, 11.5, 0.6,
               "Skip advertising altogether",
               size=24, bold=True, color=VIOLET)
add_paragraph_run(tb3, "    Lose visibility on platforms that reward consistent posting",
                  size=18, color=INK)

set_speaker_notes(s,
    "Small businesses and solo creators need to advertise on TikTok, "
    "Reels, and Shorts at high frequency. The options are agency work, "
    "which costs thousands per campaign, stitching together four separate "
    "tools, which costs hours per ad, or skipping advertising entirely "
    "and losing visibility. There is a clear gap for a single, "
    "low-cost, fast tool."
)


# ====================================================================
# SLIDE 3 — Pulsefy in one line
# ====================================================================
s = add_slide()
add_text(s, 0.5, 2.6, 12.3, 1.5,
         "One application.",
         size=54, bold=True, color=INK, align=PP_ALIGN.CENTER)
add_text(s, 0.5, 3.6, 12.3, 1.5,
         "Four AI subsystems.",
         size=54, bold=True, color=VIOLET, align=PP_ALIGN.CENTER)
add_text(s, 0.5, 4.6, 12.3, 1.5,
         "One finished ad.",
         size=54, bold=True, color=INK, align=PP_ALIGN.CENTER)

add_text(s, 0.5, 6.4, 12.3, 0.5,
         "Image generation, music generation, voiceover synthesis, video assembly.",
         size=16, color=MUTED, align=PP_ALIGN.CENTER, italic=True)

set_speaker_notes(s,
    "Pulsefy bundles the four asset-creation stages behind a single account: "
    "scene image generation, background music generation, voiceover synthesis, "
    "and video assembly. The user enters a product brief and gets back "
    "a finished MP4 ready to upload to TikTok or Reels."
)


# ====================================================================
# SLIDE 4 — The four AI subsystems (pipeline visual)
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Four AI subsystems behind one interface",
         size=30, bold=True, color=INK)

# Pipeline: Product brief → 4 generators → FFmpeg → MP4
def box(x, y, w, h, label, sub, fill=SOFT):
    shape = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                               Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = VIOLET
    shape.line.width = Pt(1.25)
    tf = shape.text_frame
    tf.margin_left = Inches(0.1)
    tf.margin_right = Inches(0.1)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.size = Pt(14)
    r.font.bold = True
    r.font.color.rgb = INK
    p2 = tf.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    r2 = p2.add_run()
    r2.text = sub
    r2.font.size = Pt(10)
    r2.font.color.rgb = MUTED
    r2.font.italic = True

# Product brief
box(0.6, 3.0, 2.0, 1.5, "Product brief", "name, style, ratio",
    fill=RGBColor(0xF1, 0xF5, 0xF9))

# 4 AI subsystems (stacked vertically in the middle)
box(3.4, 1.7, 3.2, 1.1, "Scene images", "Pollinations.ai")
box(3.4, 3.0, 3.2, 1.1, "Music", "MusicGen / Pulsefy AI")
box(3.4, 4.3, 3.2, 1.1, "Voiceover", "gTTS")
box(3.4, 5.6, 3.2, 1.1, "Assembly", "FFmpeg")

# Output
box(8.0, 3.0, 2.0, 1.5, "MP4 ad", "9:16 / 1:1 / 16:9",
    fill=RGBColor(0xDC, 0xFC, 0xE7))

# Publish destination
box(10.8, 3.0, 2.0, 1.5, "TikTok • Reels • Shorts", "ready to upload",
    fill=RGBColor(0xF1, 0xF5, 0xF9))

set_speaker_notes(s,
    "Each stage is backed by a dedicated AI subsystem. Pollinations.ai "
    "produces the scene images. MusicGen or a custom LSTM I trained "
    "handles the background music. gTTS synthesizes the voiceover. "
    "FFmpeg assembles everything into the final MP4 at the requested "
    "aspect ratio."
)


# ====================================================================
# SLIDE 5 — My main contribution: Pulsefy AI
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "My main contribution: Pulsefy AI",
         size=32, bold=True, color=INK)

add_text(s, 1.0, 1.9, 11.5, 0.5,
         "A custom LSTM music generator trained from scratch",
         size=20, color=VIOLET, italic=True)

add_text(s, 1.0, 3.0, 5.8, 0.6,
         "Why it matters",
         size=20, bold=True, color=INK)
tb = add_text(s, 1.0, 3.7, 5.8, 0.4,
              "The free tier never depends on a paid third-party model.",
              size=14, color=INK)
add_paragraph_run(tb, "")
add_paragraph_run(tb,
    "Required learning PyTorch, MIDI tokenisation, and sequence "
    "modelling end-to-end.",
    size=14, color=INK)
add_paragraph_run(tb, "")
add_paragraph_run(tb,
    "Generates a track in single-digit seconds — instant feedback "
    "for the creator.",
    size=14, color=INK)

add_image_placeholder(s, 7.5, 2.9, 5.0, 3.6,
    "[Insert: training screenshot from Ch 5 / Figure 43]")

set_speaker_notes(s,
    "The part of the project I'm most proud of is Pulsefy AI, a custom "
    "LSTM music generator I trained from scratch on a curated MIDI corpus. "
    "Building this rather than just plugging in an off-the-shelf model "
    "means the free tier of the platform never depends on a paid third-party "
    "service, and it required me to learn PyTorch, MIDI tokenisation, and "
    "sequence modelling end to end."
)


# ====================================================================
# SLIDE 6 — Training numbers
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Training Pulsefy AI",
         size=32, bold=True, color=INK)

# Big numbers in a 4-column row
def stat(x, label, value, sub):
    add_text(s, x, 2.6, 3.0, 0.5, label,
             size=14, color=MUTED, align=PP_ALIGN.CENTER)
    add_text(s, x, 3.1, 3.0, 1.0, value,
             size=42, bold=True, color=VIOLET, align=PP_ALIGN.CENTER)
    add_text(s, x, 4.5, 3.0, 0.5, sub,
             size=12, color=MUTED, align=PP_ALIGN.CENTER, italic=True)

stat(0.5,  "Input corpus",  "1,034",   "MIDI files")
stat(3.6,  "Tokens",        "573,692", "after preprocessing")
stat(6.7,  "Parameters",    "908,708", "across 2 LSTM layers")
stat(9.8,  "Training",      "30",      "epochs on Apple MPS")

add_text(s, 1.0, 5.8, 11.3, 0.5,
         "Validation loss converged from 0.51 to 0.43 within the first three epochs.",
         size=15, color=INK, align=PP_ALIGN.CENTER, italic=True)

set_speaker_notes(s,
    "The training corpus was 1,034 MIDI files parsed into 573,692 tokens. "
    "The model has roughly 908 thousand parameters across two LSTM layers "
    "with a 256-unit hidden dimension. Training ran for 30 epochs on "
    "Apple Metal acceleration, and the validation loss converged from "
    "approximately 0.51 to 0.43 within the first three epochs, "
    "confirming the model fits the dataset."
)


# ====================================================================
# SLIDE 7 — Tier strategy
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Honest tier separation",
         size=32, bold=True, color=INK)

add_text(s, 1.0, 1.8, 11.5, 0.5,
         "Free is functional. Premium adds quality, not access.",
         size=18, color=MUTED, italic=True)

# Two cards side by side
def card(x, header, header_color, body_lines):
    shape = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                               Inches(x), Inches(2.8), Inches(5.5), Inches(3.8))
    shape.fill.solid()
    shape.fill.fore_color.rgb = WHITE
    shape.line.color.rgb = header_color
    shape.line.width = Pt(2)

    add_text(s, x + 0.3, 3.0, 5.0, 0.5, header,
             size=22, bold=True, color=header_color)

    tb = add_text(s, x + 0.3, 3.7, 5.0, 0.4, body_lines[0],
                  size=14, color=INK)
    for line in body_lines[1:]:
        add_paragraph_run(tb, "")
        add_paragraph_run(tb, line, size=14, color=INK)

card(0.6, "Free  ·  Pulsefy AI", VIOLET, [
    "Custom LSTM, 908k params",
    "~3–7 seconds per track",
    "No third-party dependency",
])
card(7.2, "Premium  ·  MusicGen", RGBColor(0xF9, 0x73, 0x16), [
    "Meta audiocraft, balanced quality",
    "~5–7 minutes per track on CPU",
    "Multilingual voiceover unlocked too",
])

set_speaker_notes(s,
    "The tier separation is honest rather than feature-gated. "
    "Free users get Pulsefy AI, which is instant but acoustically simpler. "
    "Premium users get Meta's MusicGen, which produces higher-quality "
    "output but takes minutes per request and unlocks non-English voiceover. "
    "Both engines are real options. The free tier is not a teaser."
)


# ====================================================================
# SLIDE 8 — Live demo / Sound Studio screenshot
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Sound Studio: the single authoring surface",
         size=30, bold=True, color=INK)

add_image_placeholder(s, 1.0, 1.8, 11.3, 5.2,
    "[Insert: Sound Studio screenshot — the Music tab with Pulsefy AI vs MusicGen selector]")

set_speaker_notes(s,
    "This is the Sound Studio, the single authoring surface. Four tabs — "
    "Music, Voiceover, Video, and Upload — mirror the four AI subsystems. "
    "Users move through them at their own pace, can pick a Jamendo "
    "Creative Commons track instead of generating one, and can upload "
    "their own video for the audio-overlay path."
)


# ====================================================================
# SLIDE 9 — Benchmark result
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "How fast it actually is",
         size=32, bold=True, color=INK)

add_text(s, 1.0, 1.9, 11.5, 0.5,
         "Three Instagram Reel scenarios, measured on Mac M2 Pro:",
         size=16, color=MUTED, italic=True)

# Three big rows: manual / free / premium
def row(y, label, value, sub, color):
    add_text(s, 1.0, y, 5.0, 0.6, label,
             size=20, color=INK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, 6.0, y, 3.8, 0.6, value,
             size=36, bold=True, color=color, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, 9.9, y, 3.0, 0.6, sub,
             size=14, color=MUTED, italic=True, anchor=MSO_ANCHOR.MIDDLE)

row(3.0, "Manual workflow",  "~8 hours",        "baseline",    MUTED)
row(4.3, "Pulsefy free",      "~3 min 11 s",    "≈ 150× faster", VIOLET)
row(5.6, "Pulsefy premium",   "~9 min 12 s",    "≈ 52× faster",  RGBColor(0xF9, 0x73, 0x16))

set_speaker_notes(s,
    "I benchmarked the platform on a Mac M2 Pro across three Instagram "
    "Reel scenarios, each with a different product theme. The free-tier "
    "pipeline finishes a complete ad in about three minutes — roughly "
    "one hundred and fifty times faster than the eight-hour manual baseline. "
    "The premium tier finishes in nine minutes, slower because "
    "MusicGen takes the bulk of the time, but still over fifty times "
    "faster than the manual path."
)


# ====================================================================
# SLIDE 10 — Architecture overview
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "Architecture",
         size=32, bold=True, color=INK)

add_text(s, 1.0, 1.8, 11.5, 0.5,
         "Thin web tier, heavy work in spawned subprocesses",
         size=16, color=MUTED, italic=True)

add_image_placeholder(s, 1.0, 2.6, 11.3, 4.4,
    "[Insert: Pulsefy architecture block diagram — Figure 22 from Chapter 4]")

set_speaker_notes(s,
    "Architecturally, Pulsefy is a thin Express server backed by PostgreSQL. "
    "The heavy work happens in spawned subprocesses: Python for MusicGen, "
    "Pulsefy AI, and gTTS, plus FFmpeg for video. External APIs cover "
    "image generation through Pollinations.ai and the licensed music "
    "catalog through Jamendo. This keeps the web tier responsive while "
    "the generations run in the background."
)


# ====================================================================
# SLIDE 11 — Future work
# ====================================================================
s = add_slide()
add_accent_bar(s, 1.0, 0.9, 0.08, 0.5, VIOLET)
add_text(s, 1.2, 0.8, 11.5, 0.7,
         "What's next",
         size=32, bold=True, color=INK)

def fut(x, y, w, label, body):
    add_text(s, x, y, w, 0.4, label,
             size=18, bold=True, color=VIOLET)
    add_text(s, x, y + 0.5, w, 1.5, body,
             size=14, color=INK)

fut(1.0, 2.4, 5.5, "GPU-backed inference",
    "Reduce MusicGen latency from minutes to seconds with a worker pool on GPU hardware.")
fut(6.8, 2.4, 5.5, "Larger validation study",
    "N ≥ 20 listeners with MUSHRA scoring and Fréchet Audio Distance against a reference catalog.")

fut(1.0, 4.4, 5.5, "Mobile-responsive layout",
    "Meet creators on the device they shoot their content on.")
fut(6.8, 4.4, 5.5, "Real payment processing",
    "Replace the simulated tier upgrade with a Stripe-backed subscription flow.")

fut(1.0, 6.2, 11.3, "Multi-language interface  +  expanded Pulsefy AI training corpus beyond Nottingham folk MIDI",
    "")

set_speaker_notes(s,
    "Five concrete next steps: GPU-backed inference to remove the "
    "MusicGen latency bottleneck; a larger validation study with at "
    "least twenty listeners and a quality metric like Fréchet Audio "
    "Distance; a mobile-responsive layout; real payment processing; "
    "and expanded training data for Pulsefy AI beyond folk music. "
    "Each of these is achievable in a few weeks of focused work."
)


# ====================================================================
# SLIDE 12 — Thank you / Q&A
# ====================================================================
s = add_slide()
add_accent_bar(s, 0, 3.4, 13.333, 0.04)
add_text(s, 0.5, 2.6, 12.3, 1.4,
         "Thank you.",
         size=72, bold=True, color=INK, align=PP_ALIGN.CENTER)
add_text(s, 0.5, 4.0, 12.3, 0.8,
         "Questions?",
         size=32, color=VIOLET, align=PP_ALIGN.CENTER, italic=True)

add_text(s, 0.5, 6.5, 12.3, 0.4,
         "Vlad DUMITRU  ·  Pulsefy  ·  UPB FILS 2026",
         size=12, color=MUTED, align=PP_ALIGN.CENTER)

set_speaker_notes(s,
    "Thank you for your attention. I'm happy to answer questions."
)


prs.save(OUT)
print(f"Saved: {OUT}")
print(f"Slides: {len(prs.slides)}")
