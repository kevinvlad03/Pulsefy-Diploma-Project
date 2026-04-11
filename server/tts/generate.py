#!/usr/bin/env python3
"""
Pulsefy TTS — wraps gTTS to generate a WAV voiceover from text.

Usage:
  python generate.py --text "Hello world" --output /path/to/out.wav
  python generate.py --text "Hello" --output out.wav --lang en --slow false

Exit codes: 0 = success, 1 = error (message on stderr).
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description="gTTS voiceover generator")
    p.add_argument("--text",   required=True,  help="Text to synthesise")
    p.add_argument("--output", required=True,  help="Absolute path for output .wav file")
    p.add_argument("--lang",   default="en",   help="BCP-47 language code (default: en)")
    p.add_argument("--slow",   default="false", help="Slow speech: true/false (default: false)")
    return p.parse_args()


def main():
    args = parse_args()
    text   = args.text.strip()
    lang   = args.lang.strip() or "en"
    slow   = args.slow.strip().lower() == "true"
    output = Path(args.output)

    if not text:
        print("Error: --text cannot be empty", file=sys.stderr)
        sys.exit(1)

    output.parent.mkdir(parents=True, exist_ok=True)

    # gTTS only natively produces MP3; we write to a temp file then
    # convert to WAV with ffmpeg so the rest of the pipeline stays consistent.
    try:
        from gtts import gTTS
    except ImportError:
        print("Error: gTTS not installed in this environment", file=sys.stderr)
        sys.exit(1)

    tts = gTTS(text=text, lang=lang, slow=slow)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        tts.save(str(tmp_path))

        # Convert MP3 → WAV via ffmpeg (must be on PATH)
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", str(tmp_path),
                "-ar", "44100",      # 44.1 kHz sample rate
                "-ac", "1",          # mono
                "-acodec", "pcm_s16le",
                str(output),
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            print(f"ffmpeg error: {result.stderr}", file=sys.stderr)
            sys.exit(1)

    finally:
        tmp_path.unlink(missing_ok=True)

    print(f"OK:{output}", flush=True)


if __name__ == "__main__":
    main()
