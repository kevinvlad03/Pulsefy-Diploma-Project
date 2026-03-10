#!/usr/bin/env python3
import argparse
import json
import subprocess
import traceback
import wave
from pathlib import Path

import torch
import torchaudio
from audiocraft.models import MusicGen


def parse_args():
    parser = argparse.ArgumentParser(description="Generate music from prompt using Meta MusicGen")
    parser.add_argument("--prompt", required=True, help="Text prompt for generation")
    parser.add_argument("--output", required=True, help="Absolute output path for .wav file")
    parser.add_argument("--model", default="facebook/musicgen-small", help="MusicGen model id")
    parser.add_argument("--duration", type=float, default=8.0, help="Audio duration in seconds")
    parser.add_argument(
        "--device",
        default="auto",
        choices=["auto", "cpu", "cuda", "mps"],
        help="Execution device",
    )
    return parser.parse_args()


def resolve_device(device: str) -> str:
    if device == "mps":
        return "cpu"
    if device != "auto":
        return device
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main():
    args = parse_args()
    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    duration = max(1.0, min(float(args.duration), 30.0))
    device = resolve_device(args.device)

    model = MusicGen.get_pretrained(args.model, device=device)
    model.set_generation_params(duration=duration)

    wav = model.generate([args.prompt])
    sample_rate = int(model.sample_rate)
    one = wav[0].detach().cpu()
    if one.dim() == 1:
        one = one.unsqueeze(0)
    # Use 16-bit PCM WAV for broad browser compatibility.
    torchaudio.save(
        str(output_path),
        one,
        sample_rate,
        format="wav",
        encoding="PCM_S",
        bits_per_sample=16,
    )
    ensure_browser_compatible_wav(output_path)

    print(
        json.dumps(
            {
                "ok": True,
                "output": str(output_path),
                "sample_rate": sample_rate,
                "duration": duration,
                "device": device,
                "model": args.model,
            }
        )
    )


def ensure_browser_compatible_wav(path: Path):
    try:
        with wave.open(str(path), "rb"):
            return
    except Exception:
        tmp_path = path.with_suffix(".tmp.wav")
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-i",
                str(path),
                "-c:a",
                "pcm_s16le",
                str(tmp_path),
            ],
            check=True,
        )
        tmp_path.replace(path)


if __name__ == "__main__":
    try:
        main()
    except Exception:  # pragma: no cover
        traceback.print_exc()
        raise
