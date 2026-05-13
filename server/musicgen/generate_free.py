#!/usr/bin/env python3
"""
Pulsefy Free Music Generator v0
Procedural synthesizer using numpy/scipy — no ML model required.
Generates chord progressions and melodies from text prompts.
"""
import argparse
import json
import traceback
import wave
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve

SAMPLE_RATE = 44100

# keyword → (root_midi, scale_semitones, bpm, timbre)
MOODS = {
    "happy":       (60, [0, 2, 4, 5, 7, 9, 11], 128, "bright"),
    "upbeat":      (62, [0, 2, 4, 5, 7, 9, 11], 132, "bright"),
    "energetic":   (64, [0, 2, 4, 5, 7, 9, 11], 140, "bright"),
    "bright":      (60, [0, 2, 4, 5, 7, 9, 11], 124, "bright"),
    "commercial":  (62, [0, 2, 4, 5, 7, 9, 11], 120, "bright"),
    "pop":         (60, [0, 2, 4, 5, 7, 9, 11], 118, "bright"),
    "sad":         (57, [0, 2, 3, 5, 7, 8, 10],  72, "soft"),
    "melancholic": (57, [0, 2, 3, 5, 7, 8, 10],  68, "soft"),
    "dark":        (55, [0, 2, 3, 5, 7, 8, 10],  78, "soft"),
    "slow":        (57, [0, 2, 3, 5, 7, 8, 10],  75, "soft"),
    "cinematic":   (60, [0, 2, 3, 5, 7, 8, 10],  88, "full"),
    "epic":        (60, [0, 2, 3, 5, 7, 8, 10],  95, "full"),
    "orchestral":  (60, [0, 2, 3, 5, 7, 8, 10],  90, "full"),
    "ambient":     (60, [0, 2, 4, 7, 9],          80, "soft"),
    "relaxed":     (60, [0, 2, 4, 7, 9],          85, "soft"),
    "lofi":        (57, [0, 2, 3, 5, 7, 8, 10],  88, "soft"),
    "electronic":  (64, [0, 2, 4, 5, 7, 9, 11], 130, "bright"),
    "edm":         (64, [0, 2, 4, 5, 7, 9, 11], 138, "bright"),
    "corporate":   (60, [0, 2, 4, 5, 7, 9, 11], 110, "full"),
    "acoustic":    (60, [0, 2, 4, 5, 7, 9, 11],  96, "soft"),
    "warm":        (60, [0, 2, 4, 5, 7, 9, 11],  96, "soft"),
    "product":     (62, [0, 2, 4, 5, 7, 9, 11], 115, "bright"),
    "ad":          (62, [0, 2, 4, 5, 7, 9, 11], 118, "bright"),
}


def detect_mood(prompt: str):
    text = prompt.lower()
    for kw, params in MOODS.items():
        if kw in text:
            return params
    return (60, [0, 2, 4, 5, 7, 9, 11], 100, "bright")  # default C major, 100 BPM


def midi_to_freq(midi: int) -> float:
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def sine_wave(freq: float, duration: float, amp: float = 0.3) -> np.ndarray:
    t = np.linspace(0, duration, int(duration * SAMPLE_RATE), endpoint=False)
    return amp * np.sin(2 * np.pi * freq * t)


def adsr(signal: np.ndarray, attack=0.05, decay=0.1, sustain=0.7, release=0.15) -> np.ndarray:
    n = len(signal)
    env = np.ones(n)
    a = int(attack * SAMPLE_RATE)
    d = int(decay * SAMPLE_RATE)
    r = int(release * SAMPLE_RATE)
    s_start = a + d
    s_end = max(s_start, n - r)
    if a > 0:
        env[:a] = np.linspace(0, 1, a)
    if d > 0 and s_start > a:
        env[a:s_start] = np.linspace(1, sustain, s_start - a)
    env[s_start:s_end] = sustain
    if r > 0 and n > s_end:
        env[s_end:] = np.linspace(sustain, 0, n - s_end)
    return signal * env


def make_chord(root_midi: int, intervals: list, dur: float, amp=0.18) -> np.ndarray:
    frames = int(dur * SAMPLE_RATE)
    out = np.zeros(frames)
    n = max(len(intervals), 1)
    for st in intervals:
        freq = midi_to_freq(root_midi + st)
        w = sine_wave(freq, dur, amp=amp / n)
        # second harmonic for richness
        w += sine_wave(freq * 2, dur, amp=(amp * 0.25) / n)
        chunk = adsr(w[:frames], attack=0.02, decay=0.08, sustain=0.8, release=0.20)
        out += chunk[:frames]
    return out


def make_note(midi: int, dur: float, amp: float = 0.55) -> np.ndarray:
    """
    Additive synthesis modelling a piano-like tone.

    A real piano string vibrates simultaneously in multiple modes (harmonics).
    Each harmonic k has amplitude ~1/k and decays exponentially at a rate
    proportional to k — higher harmonics fade faster, leaving a warm fundamental.
    This is fundamentally different from a pure sine wave (xylophone) and
    produces the characteristic warmth of a string or keyboard instrument.
    """
    freq = midi_to_freq(midi)
    samples = max(1, int(dur * SAMPLE_RATE))
    t = np.linspace(0, dur, samples, endpoint=False)
    wave = np.zeros(samples)

    for k in range(1, 9):
        h_freq = freq * k
        if h_freq >= SAMPLE_RATE / 2:  # above Nyquist — skip
            break
        h_amp = amp / (k ** 1.3)            # amplitude falls with harmonic number
        decay = np.exp(-3.5 * k * t / max(dur, 0.01))  # higher harmonics decay faster
        wave += h_amp * np.sin(2 * np.pi * h_freq * t) * decay

    # 5 ms attack ramp to avoid clicks
    attack = min(int(0.005 * SAMPLE_RATE), samples)
    if attack > 0:
        wave[:attack] *= np.linspace(0, 1, attack)
    return wave


def add_reverb(signal: np.ndarray, wet: float = 0.30) -> np.ndarray:
    """
    Convolution reverb using a synthesised exponential-decay impulse response.

    Convolution reverb works by convolving the dry signal with a room impulse
    response (IR). Here we synthesise a plausible IR: an exponentially decaying
    noise burst, which approximates the dense reflection tail of a small room.
    Using a fixed random seed makes generation deterministic.
    """
    rng = np.random.default_rng(42)
    ir_len = int(1.5 * SAMPLE_RATE)
    t_ir = np.linspace(0, 1.5, ir_len)
    ir = rng.standard_normal(ir_len) * np.exp(-5.0 * t_ir)
    ir[0] = 1.0   # direct-sound impulse at t=0
    ir /= np.max(np.abs(ir)) + 1e-9
    wet_signal = fftconvolve(signal, ir)[:len(signal)]
    result = signal * (1.0 - wet) + wet_signal * wet
    peak = np.max(np.abs(result))
    if peak > 0:
        result *= 0.85 / peak
    return result


def build_track(root: int, scale: list, bpm: int, duration: float, timbre: str) -> np.ndarray:
    beat = 60.0 / bpm
    bar = beat * 4
    total_frames = int(duration * SAMPLE_RATE)
    out = np.zeros(total_frames)

    # Chord progression: degrees I – IV – V – I (indices into the scale)
    chord_degrees = [0, 3, 4, 0]

    def chord_intervals(degree):
        # Build triad from scale steps: root, third, fifth (scale degrees +2, +4)
        r = scale[degree % len(scale)]
        third = scale[(degree + 2) % len(scale)]
        fifth = scale[(degree + 4) % len(scale)]
        return [0, third - r, fifth - r]

    # Lay down chords bar by bar
    pos = 0
    bar_idx = 0
    while pos < total_frames:
        deg = chord_degrees[bar_idx % len(chord_degrees)]
        chord_root = root + scale[deg % len(scale)]
        ivs = chord_intervals(deg)
        dur = min(bar, (total_frames - pos) / SAMPLE_RATE)
        chunk = make_chord(chord_root, ivs, dur)
        end = pos + len(chunk)
        if end <= total_frames:
            out[pos:end] += chunk
        else:
            out[pos:total_frames] += chunk[: total_frames - pos]
        pos += int(bar * SAMPLE_RATE)
        bar_idx += 1

    # Melody: eighth notes walking up/down the scale
    scale_notes = [root + s for s in scale] + [root + 12 + s for s in scale]
    eighth = beat / 2
    pos = 0
    idx = 2  # start mid-scale
    direction = 1
    while pos < total_frames:
        note_midi = scale_notes[idx % len(scale_notes)]
        chunk = make_note(note_midi, eighth)
        end = pos + len(chunk)
        if end <= total_frames:
            out[pos:end] += chunk
        else:
            out[pos:total_frames] += chunk[: total_frames - pos]
        pos += int(eighth * SAMPLE_RATE)
        idx += direction
        if idx >= len(scale) + 3 or idx < 0:
            direction = -direction
            idx += direction * 2

    # Bass layer: root note of each chord, two octaves below, on beat 1 of each bar.
    # This fills the low-frequency register and anchors the harmony.
    bar_idx = 0
    bass_pos = 0
    while bass_pos < total_frames:
        deg = chord_degrees[bar_idx % len(chord_degrees)]
        bass_midi = root + scale[deg % len(scale)] - 24   # two octaves down
        bass_dur = min(beat * 2, (total_frames - bass_pos) / SAMPLE_RATE)
        chunk = make_note(bass_midi, bass_dur, amp=0.45)
        end = bass_pos + len(chunk)
        if end <= total_frames:
            out[bass_pos:end] += chunk
        else:
            out[bass_pos:total_frames] += chunk[:total_frames - bass_pos]
        bass_pos += int(bar * SAMPLE_RATE)
        bar_idx += 1

    # Kick-like thud on beats 1 and 3 for non-soft timbres
    if timbre != "soft":
        kick_dur = 0.10
        kick_frames = int(kick_dur * SAMPLE_RATE)
        t = np.linspace(0, kick_dur, kick_frames)
        kick = 0.40 * np.sin(2 * np.pi * 80.0 * t * np.exp(-t * 35))
        kick = adsr(kick, attack=0.003, decay=0.04, sustain=0.0, release=0.06)
        beat_pos = 0
        while beat_pos < total_frames:
            end = beat_pos + kick_frames
            if end <= total_frames:
                out[beat_pos:end] += kick
            beat_pos += int(beat * 2 * SAMPLE_RATE)

    # Normalise before reverb so the convolution doesn't clip
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out * (0.70 / peak)

    # Convolution reverb — blends the notes into a coherent space
    out = add_reverb(out, wet=0.28)

    return out


def write_wav(path: Path, samples: np.ndarray):
    int16 = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(int16.tobytes())


def parse_args():
    p = argparse.ArgumentParser(description="Pulsefy Free Music Generator — procedural synthesizer")
    p.add_argument("--prompt",   required=True,  help="Text prompt (mood keywords detected automatically)")
    p.add_argument("--output",   required=True,  help="Absolute output path for .wav file")
    p.add_argument("--duration", type=float, default=8.0)
    p.add_argument("--model",    default="auto",
                   help="'auto' uses the LSTM if a checkpoint is available, "
                        "'procedural' forces this procedural synthesiser.")
    p.add_argument("--device",   default="cpu")
    return p.parse_args()


def main():
    args = parse_args()
    out_path = Path(args.output).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    duration = max(1.0, min(float(args.duration), 30.0))

    # Route to the trained LSTM model when a checkpoint is available. The LSTM
    # produces higher-quality output by learning from real musical data, while
    # this procedural synthesiser remains the reliable fallback.
    _LSTM_CHECKPOINT = Path(__file__).parent / "lstm" / "checkpoints" / "best_model.pt"
    if _LSTM_CHECKPOINT.exists() and getattr(args, "model", None) != "procedural":
        import subprocess
        import sys as _sys
        _lstm_script = Path(__file__).parent / "lstm" / "generate.py"
        _venv_python = Path(__file__).parent / ".venv" / "bin" / "python3"
        _python = str(_venv_python) if _venv_python.exists() else _sys.executable
        _result = subprocess.run(
            [
                _python, str(_lstm_script),
                "--prompt", args.prompt,
                "--output", args.output,
                "--duration", str(duration),
                "--device", "cpu",
            ],
            capture_output=True, text=True,
        )
        if _result.returncode == 0:
            print(_result.stdout, end="")
            _sys.exit(0)
        # LSTM failed — fall through to the procedural synthesiser.
        print(
            f"[generate_free] LSTM failed, using procedural synth: "
            f"{_result.stderr[:200]}",
            file=_sys.stderr,
        )

    root, scale, bpm, timbre = detect_mood(args.prompt)
    audio = build_track(root, scale, bpm, duration, timbre)
    write_wav(out_path, audio)

    print(json.dumps({
        "ok": True,
        "output": str(out_path),
        "sample_rate": SAMPLE_RATE,
        "duration": duration,
        "device": "cpu",
        "model": "pulsefy-free-v0",
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
