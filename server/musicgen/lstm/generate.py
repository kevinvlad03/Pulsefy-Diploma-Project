#!/usr/bin/env python3
"""
Inference script for the Pulsefy LSTM music generator.

Pipeline
--------
    text prompt
        |  detect_mood
        v
    musical parameters (key, scale, BPM, seed pitches, sampling temperature)
        |  build_seed_tokens
        v
    seed token sequence
        |  MusicLSTM.generate (autoregressive sampling)
        v
    generated token sequence
        |  Vocabulary.decode
        v
    list of (pitch, duration_steps)
        |  tokens_to_audio  (additive sine + ADSR + concat + normalise)
        v
    .wav file on disk

The CLI is intentionally identical to ``generate.py`` (the MusicGen wrapper)
and ``generate_free.py`` (the procedural fallback), so the Node backend can
swap synthesisers without changing how it spawns the subprocess.
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
import wave
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve

# Allow ``python3 generate.py`` (script-mode) to import sibling modules.
_THIS_DIR = Path(__file__).parent.resolve()
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

import torch  # noqa: E402

from vocab import Vocabulary  # noqa: E402
from model import MusicLSTM   # noqa: E402


# ---------------------------------------------------------------------------
# Synthesis constants — copied verbatim from ``generate_free.py`` so that the
# audible output of the LSTM and the procedural fallback share an identical
# timbre. This makes A/B comparison fair (any difference is the model's
# doing, not the synthesiser's).
# ---------------------------------------------------------------------------

SAMPLE_RATE = 44100  # Hz; CD-quality, browser-compatible.

# Quantisation grid: the parser quantises every note to a 16th-note grid
# (4 steps per beat). The synthesiser converts steps back to seconds via:
#     seconds = steps * (60 / bpm) / STEPS_PER_BEAT
STEPS_PER_BEAT = 4

# Output ceiling, expressed as a peak amplitude after normalisation. -3 dBFS
# (~0.707) leaves a little headroom; we use 0.85 to match generate_free.py.
_PEAK_AMPLITUDE = 0.85


# ---------------------------------------------------------------------------
# Mood -> generation parameters table.
# ---------------------------------------------------------------------------
#
# Each row maps a mood keyword to:
#   key_root     : MIDI pitch of the tonal centre. Determines the absolute
#                  register of the seed and (statistically) of the output.
#   scale        : Semitone offsets from key_root defining the diatonic scale.
#                  Major (W-W-H-W-W-W-H), minor (W-H-W-W-H-W-W), pentatonic.
#   bpm          : Tempo. Drives the "step -> seconds" conversion in
#                  ``tokens_to_audio``.
#   seed_pitches : Opening MIDI pitches fed to the LSTM. They prime the
#                  hidden state with the tonal character of the chosen mood,
#                  which biases the (otherwise unconditioned) model towards
#                  staying in key.
#   temperature  : Sampling temperature for ``model.generate``. Lower values
#                  (0.7-0.85) produce conservative, repetitive output;
#                  higher values (0.95-1.05) produce more variety but risk
#                  occasional out-of-key jumps.
MOOD_TABLE: dict[str, dict] = {
    "happy":       {"key_root": 60, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 120, "seed_pitches": [60, 64, 67, 72], "temperature": 0.90},
    "upbeat":      {"key_root": 62, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 128, "seed_pitches": [62, 66, 69, 74], "temperature": 0.90},
    "bright":      {"key_root": 60, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 120, "seed_pitches": [60, 64, 67, 71], "temperature": 0.85},
    "commercial":  {"key_root": 62, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 118, "seed_pitches": [62, 65, 69, 72], "temperature": 0.88},
    "sad":         {"key_root": 57, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  76, "seed_pitches": [57, 60, 64, 69], "temperature": 0.82},
    "melancholic": {"key_root": 57, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  70, "seed_pitches": [57, 60, 64, 67], "temperature": 0.80},
    "slow":        {"key_root": 57, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  72, "seed_pitches": [57, 61, 64, 69], "temperature": 0.82},
    "dark":        {"key_root": 55, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  80, "seed_pitches": [55, 58, 62, 67], "temperature": 0.95},
    "cinematic":   {"key_root": 62, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  88, "seed_pitches": [62, 65, 69, 74], "temperature": 0.92},
    "epic":        {"key_root": 60, "scale": [0, 2, 3, 5, 7, 8, 10], "bpm":  95, "seed_pitches": [48, 55, 60, 67], "temperature": 0.95},
    "ambient":     {"key_root": 60, "scale": [0, 2, 4, 7, 9],         "bpm":  80, "seed_pitches": [60, 64, 67, 71], "temperature": 0.78},
    "relaxed":     {"key_root": 60, "scale": [0, 2, 4, 7, 9],         "bpm":  85, "seed_pitches": [60, 64, 67, 72], "temperature": 0.78},
    "energetic":   {"key_root": 64, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 132, "seed_pitches": [64, 67, 71, 76], "temperature": 1.00},
    "electronic":  {"key_root": 64, "scale": [0, 2, 4, 5, 7, 9, 11], "bpm": 130, "seed_pitches": [64, 67, 71, 76], "temperature": 1.00},
}

# Used when the prompt matches no keyword — neutral C major at 100 BPM.
DEFAULT_MOOD: dict = {
    "key_root": 60,
    "scale": [0, 2, 4, 5, 7, 9, 11],
    "bpm": 100,
    "seed_pitches": [60, 62, 64, 67],
    "temperature": 0.90,
}


# ---------------------------------------------------------------------------
# Mood detection + seed construction.
# ---------------------------------------------------------------------------


def detect_mood(prompt: str) -> dict:
    """Find the first ``MOOD_TABLE`` keyword present in ``prompt``.

    Matching is case-insensitive substring search. We iterate the table in
    insertion order so when two keywords overlap (e.g. "happy energetic")
    the earlier entry wins, giving the user a deterministic mapping.

    Returns ``DEFAULT_MOOD`` if nothing matches.
    """
    text = prompt.lower()
    for keyword, params in MOOD_TABLE.items():
        if keyword in text:
            return params
    return DEFAULT_MOOD


def build_seed_tokens(mood: dict, vocab: Vocabulary) -> list[int]:
    """Construct the initial token sequence that primes the LSTM.

    Layout
    ------
    ``[START, NOTE(p0), DUR(2), NOTE(p1), DUR(2), ..., NOTE(pn), DUR(2)]``

    where ``p0..pn`` come from ``mood["seed_pitches"]`` and every duration
    is fixed at 2 grid steps (an 8th note). A short, regular seed:

      * gives the LSTM enough context to settle on a key (with only one
        seed note the model has no scale information);
      * keeps the seed short so the user-controlled "duration" parameter
        is dominated by *generated* music rather than seed material.

    Note: we deliberately omit ``END`` from the seed.
    """
    tokens: list[int] = [vocab.START]
    seed_duration_steps = 2  # eighth note on a 16th-note grid
    duration_token = vocab.duration_to_token(seed_duration_steps)
    for pitch in mood["seed_pitches"]:
        tokens.append(vocab.pitch_to_token(pitch))
        tokens.append(duration_token)
    return tokens


# ---------------------------------------------------------------------------
# Synthesis primitives — parallel to those in generate_free.py.
# Documented here in the LSTM context for the thesis.
# ---------------------------------------------------------------------------


def midi_to_freq(midi: int) -> float:
    """Convert a MIDI pitch number to its fundamental frequency in Hz.

    Uses the equal-tempered tuning convention with A4 (MIDI 69) = 440 Hz.
    Each semitone is a factor of 2**(1/12) ~ 1.0595.
    """
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def sine_wave(freq: float, duration: float, amp: float = 0.3) -> np.ndarray:
    """Generate a pure sine wave at ``freq`` Hz for ``duration`` seconds.

    Uses ``endpoint=False`` so successive notes can be concatenated without
    a discontinuity at the join.
    """
    n_samples = int(duration * SAMPLE_RATE)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    return amp * np.sin(2 * np.pi * freq * t)


def adsr(
    signal: np.ndarray,
    attack: float = 0.05,
    decay: float = 0.10,
    sustain: float = 0.7,
    release: float = 0.15,
) -> np.ndarray:
    """Apply a classical ADSR amplitude envelope to ``signal``.

    Sections (in seconds):
      * attack  : 0 -> 1   (note onset rises smoothly to peak)
      * decay   : 1 -> sustain (settles to the held level)
      * sustain : flat at ``sustain`` until ``release`` window
      * release : sustain -> 0 (smooth fade so concatenated notes don't click)

    All sections are clamped to fit within the signal length, so very short
    notes still get a smooth-but-compressed envelope.
    """
    n = len(signal)
    env = np.ones(n)
    a = int(attack * SAMPLE_RATE)
    d = int(decay * SAMPLE_RATE)
    r = int(release * SAMPLE_RATE)
    s_start = a + d
    s_end = max(s_start, n - r)
    if a > 0 and a <= n:
        env[:a] = np.linspace(0, 1, a)
    if d > 0 and s_start > a and s_start <= n:
        env[a:s_start] = np.linspace(1, sustain, s_start - a)
    env[s_start:s_end] = sustain
    if r > 0 and n > s_end:
        env[s_end:] = np.linspace(sustain, 0, n - s_end)
    return signal * env


def make_note(midi_pitch: int, duration_sec: float, amp: float = 0.55) -> np.ndarray:
    """Additive synthesis modelling a piano-like tone.

    A real piano string vibrates simultaneously in multiple modes (harmonics).
    Each harmonic k has amplitude ~1/k^1.3 and decays exponentially at a rate
    proportional to k — higher harmonics fade faster, leaving a warm fundamental.
    This produces the characteristic warmth of a keyboard instrument instead of
    the thin, xylophone-like quality of a pure sine wave.
    """
    freq = midi_to_freq(midi_pitch)
    samples = max(1, int(duration_sec * SAMPLE_RATE))
    t = np.linspace(0, duration_sec, samples, endpoint=False)
    wave = np.zeros(samples)

    for k in range(1, 9):
        h_freq = freq * k
        if h_freq >= SAMPLE_RATE / 2:   # above Nyquist — skip
            break
        h_amp = amp / (k ** 1.3)                          # amplitude falls with harmonic number
        decay = np.exp(-3.5 * k * t / max(duration_sec, 0.01))  # higher harmonics decay faster
        wave += h_amp * np.sin(2 * np.pi * h_freq * t) * decay

    # 5 ms linear attack ramp to avoid onset clicks
    attack = min(int(0.005 * SAMPLE_RATE), samples)
    if attack > 0:
        wave[:attack] *= np.linspace(0, 1, attack)
    return wave


def add_reverb(signal: np.ndarray, wet: float = 0.30) -> np.ndarray:
    """Convolution reverb using a synthesised exponential-decay impulse response.

    Convolving a dry signal with a room impulse response (IR) simulates the
    reflections of a physical space. Here we synthesise a plausible IR as an
    exponentially decaying noise burst — the standard model for a reverberant
    room tail. A fixed random seed (42) ensures deterministic output.
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


def write_wav(path: Path, samples: np.ndarray) -> None:
    """Write ``samples`` (float32 in [-1, 1]) to a 16-bit PCM WAV file.

    16-bit PCM is the lowest-common-denominator format for browser ``<audio>``
    elements, which is ultimately how the generated music is played.
    """
    int16 = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(int16.tobytes())


# ---------------------------------------------------------------------------
# Token sequence -> audio waveform.
# ---------------------------------------------------------------------------


def tokens_to_audio(
    tokens: list[int],
    vocab: Vocabulary,
    bpm: int,
    duration_sec: float,
) -> np.ndarray:
    """Render a generated token sequence into a mono waveform.

    Steps
    -----
      1. Decode tokens back into a list of ``(pitch, duration_steps)`` pairs
         (``pitch == -1`` denotes a rest).
      2. Convert each ``duration_steps`` to seconds:
            seconds_per_beat = 60 / bpm
            seconds          = duration_steps * (seconds_per_beat / STEPS_PER_BEAT)
      3. For each note, synthesise via :func:`make_note`. Rests are emitted
         as zero arrays of the correct length.
      4. Concatenate all chunks into a single buffer.
      5. Trim to exactly ``duration_sec`` seconds. If the model produced
         less audio than requested (it sampled END early), tile the audio
         seamlessly to fill the requested length — better than a sudden
         silence at the end.
      6. Normalise the peak to ``_PEAK_AMPLITUDE`` (~-1.4 dBFS) so files are
         loud enough for casual playback without clipping.
    """
    note_sequence = vocab.decode(tokens)
    if not note_sequence:
        # Pathological case: the model emitted no decodable note pairs.
        # Return one bar of silence rather than a zero-length file.
        return np.zeros(int(SAMPLE_RATE * duration_sec), dtype=np.float32)

    seconds_per_beat = 60.0 / bpm
    seconds_per_step = seconds_per_beat / STEPS_PER_BEAT

    chunks: list[np.ndarray] = []
    for pitch, dur_steps in note_sequence:
        # Enforce a minimum of 2 steps per note so the LSTM cannot produce
        # rapid staccato bursts that sound more like noise than melody.
        dur_steps = max(dur_steps, 2)
        note_seconds = dur_steps * seconds_per_step
        if pitch < 0:
            chunks.append(np.zeros(int(note_seconds * SAMPLE_RATE), dtype=np.float32))
        else:
            chunks.append(make_note(pitch, note_seconds).astype(np.float32))

    audio = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)

    target_len = int(duration_sec * SAMPLE_RATE)
    if len(audio) >= target_len:
        audio = audio[:target_len]
    else:
        repeats = int(np.ceil(target_len / len(audio)))
        audio = np.tile(audio, repeats)[:target_len]

    # Normalise before reverb so convolution doesn't clip
    peak = float(np.max(np.abs(audio)))
    if peak > 0:
        audio = audio * (0.70 / peak)

    # Convolution reverb — blends individual notes into a coherent space
    audio = add_reverb(audio, wet=0.30).astype(np.float32)

    return audio


# ---------------------------------------------------------------------------
# CLI.
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments. Schema matches ``generate_free.py`` deliberately."""
    parser = argparse.ArgumentParser(
        description="Generate music using the Pulsefy LSTM model."
    )
    parser.add_argument(
        "--prompt",
        required=True,
        help="Text prompt (mood keywords detected automatically).",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Absolute output path for the .wav file.",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=8.0,
        help="Audio duration in seconds (clamped to 1-30).",
    )
    parser.add_argument(
        "--model",
        default="auto",
        help="Path to checkpoint directory, or 'auto' to use ./checkpoints/.",
    )
    parser.add_argument(
        "--device",
        default="cpu",
        choices=["auto", "cpu", "cuda", "mps"],
        help="Compute device for inference (CPU is plenty fast for one stream).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Same clamping range as the procedural fallback so both backends present
    # an identical contract to the Node service.
    duration = max(1.0, min(float(args.duration), 30.0))
    out_path = Path(args.output).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Locate the checkpoint. 'auto' resolves to ./checkpoints/best_model.pt
    # next to this script, so the script works from any working directory.
    if args.model == "auto":
        checkpoint_path = _THIS_DIR / "checkpoints" / "best_model.pt"
    else:
        checkpoint_path = Path(args.model) / "best_model.pt"

    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"No trained model found at {checkpoint_path}.\n"
            f"Train the model first: cd server/musicgen/lstm && python3 train.py"
        )

    # Inference is fast and memory-light; pin to CPU unless the user asked
    # for an accelerator. The 'auto' case only matters for benchmarking —
    # in production the Node service spawns this with --device cpu.
    if args.device == "auto":
        if torch.backends.mps.is_available():
            device = torch.device("mps")
        elif torch.cuda.is_available():
            device = torch.device("cuda")
        else:
            device = torch.device("cpu")
    else:
        device = torch.device(args.device)

    # Self-contained checkpoint: vocab and architecture config are embedded.
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    vocab = Vocabulary()  # stateless — constants only
    model = MusicLSTM.load(checkpoint, device=device)
    model.eval()

    mood = detect_mood(args.prompt)
    seed_tokens = build_seed_tokens(mood, vocab)

    # ----- estimate how many tokens to sample -------------------------------
    # Each note contributes ~2 tokens. Notes per second = (bpm/60) * notes_per_beat.
    # We assume the generator produces roughly 4 notes per beat (matches the
    # 16th-note grid). +32 safety padding so trim/tile in tokens_to_audio
    # has material to work with.
    estimated_notes = int((mood["bpm"] / 60.0) * 4 * duration) + 32
    max_new_tokens = estimated_notes * 2 + 16

    generated_tokens = model.generate(
        seed_tokens=seed_tokens,
        max_new_tokens=max_new_tokens,
        temperature=mood["temperature"],
        vocab=vocab,
        device=device,
        top_k=10,
    )

    audio = tokens_to_audio(generated_tokens, vocab, mood["bpm"], duration)
    write_wav(out_path, audio)

    print(json.dumps({
        "ok": True,
        "output": str(out_path),
        "sample_rate": SAMPLE_RATE,
        "duration": duration,
        "device": str(device),
        "model": "pulsefy-lstm-v1",
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        raise
