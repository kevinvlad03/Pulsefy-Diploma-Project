"""
Token vocabulary for the Pulsefy LSTM music language model.

Why a discrete vocabulary?
--------------------------
Symbolic music is a *categorical* signal — a pitch is either C4 or C#4, not
"60.3". We therefore borrow the standard NLP recipe: convert every musical
event into one of a small, fixed set of integer token IDs, then train a
language model that predicts the next token. This converts music generation
into the same mathematical problem as text generation, which is well-studied
and produces well-conditioned gradients (cross-entropy loss over a softmax
output).

Token layout
------------
The vocabulary is partitioned into four contiguous regions. Putting tokens
of the same kind next to each other keeps the embedding matrix structured
(neighbouring rows learn similar representations) and makes range checks
cheap (``token >= NOTE_OFFSET`` etc.).

  ID       Meaning
  ------   --------------------------------------------------------
  0        PAD     — padding for variable-length batches; ignored in loss
  1        START   — prepended to every sequence (gives the LM a defined
                     "beginning of song" condition)
  2        END     — appended to every sequence (lets the LM learn when to
                     stop, and lets generation halt cleanly)
  3        REST    — silence between notes
  4..131   NOTE_p  — pitch ``p`` (0..127) maps to token ``p + 4``
  132..163 DUR_d   — duration ``d`` (1..32) maps to token ``d + 131``

  total: 164 tokens

Encoding scheme
---------------
A note is represented by a *pair* of consecutive tokens: first the
pitch-or-REST token, then the duration token. Every input sequence is
wrapped with START and END:

  raw  = [(60, 4), (-1, 2), (64, 2)]            # C4 quarter, 8th rest, E4 8th
  enc  = [START, NOTE_60, DUR_4, REST, DUR_2, NOTE_64, DUR_2, END]
       = [    1,      64,   135,    3,   133,      68,   133,   2]

This factored representation keeps the vocabulary small (164 tokens vs
4096+ for a joint pitch-duration token scheme) at the cost of doubling
the sequence length. For an LSTM trained on a small academic corpus, the
tradeoff is favourable — fewer parameters in the embedding/output layers
means less risk of overfitting.
"""
from __future__ import annotations

import json
import pathlib
from typing import Iterable


# Format version stamped into saved vocab files. Bump this if the token
# layout changes incompatibly so old checkpoints can refuse to load instead
# of silently producing garbage.
_VOCAB_FORMAT_VERSION = 1

# Sentinel pitch used in note-sequence tuples to mean "this is a rest".
_REST_PITCH_SENTINEL = -1


class Vocabulary:
    """Bidirectional integer-token codec for the music LSTM.

    Stateless: all behaviour is determined by the class constants below, so
    instances are interchangeable. ``Vocabulary()`` is provided as a no-arg
    constructor only for readability at call sites — every method could in
    principle be a ``@classmethod``.

    The class is the *contract* between the dataset, the model, and the
    inference script. Any change to the constants must be matched in the
    saved checkpoint config (which embeds ``to_dict()``).
    """

    # ----- token IDs (must not be reordered) ---------------------------------
    PAD = 0
    START = 1
    END = 2
    REST = 3

    # NOTE token range:  pitch p in [0, 127]  ->  token (p + NOTE_OFFSET)
    NOTE_OFFSET = 4

    # DURATION token range:  duration d in [1, MAX_DURATION]  ->  token
    # (d + DURATION_OFFSET).  DURATION_OFFSET = NOTE_OFFSET + 128 - 1 + 1 = 132
    # (the "- 1 + 1" cancels and is shown here only to make the arithmetic
    # transparent: 128 pitches span IDs 4..131, so durations begin at 132.
    # We then store the offset such that token = duration + offset, i.e. the
    # smallest valid duration 1 maps to token 132, hence offset = 131.)
    DURATION_OFFSET = 131

    # Maximum quantised duration we represent. 32 steps = 8 beats at 4 steps/
    # beat = 2 bars in 4/4. Anything longer is clamped, matching the parser.
    MAX_DURATION = 32

    VOCAB_SIZE = 164  # PAD + START + END + REST + 128 pitches + 32 durations

    # ----- range membership ---------------------------------------------------

    def is_special_token(self, token: int) -> bool:
        """Return True for PAD, START, END, or REST tokens.

        Special tokens never have an associated pitch or duration value; they
        are control symbols in the sequence.
        """
        return token in (self.PAD, self.START, self.END, self.REST)

    def is_note_token(self, token: int) -> bool:
        """Return True if ``token`` lies in the pitch range (4..131).

        Used by the decoder to recognise the start of a note pair, and by
        sampling routines that want to mask out non-note tokens.
        """
        return self.NOTE_OFFSET <= token < self.NOTE_OFFSET + 128

    def is_duration_token(self, token: int) -> bool:
        """Return True if ``token`` lies in the duration range (132..163)."""
        return (
            self.DURATION_OFFSET + 1
            <= token
            <= self.DURATION_OFFSET + self.MAX_DURATION
        )

    # ----- single-value conversion -------------------------------------------

    def pitch_to_token(self, pitch: int) -> int:
        """Convert a MIDI pitch (0-127) to its NOTE token ID.

        Raises ``ValueError`` for out-of-range pitches so we fail fast during
        encoding rather than silently producing tokens that overflow the
        embedding matrix.
        """
        if not (0 <= pitch <= 127):
            raise ValueError(f"Pitch {pitch} is out of MIDI range 0-127")
        return pitch + self.NOTE_OFFSET

    def token_to_pitch(self, token: int) -> int:
        """Recover the MIDI pitch from a NOTE token. Raises if not a note token."""
        if not self.is_note_token(token):
            raise ValueError(f"Token {token} is not a NOTE token")
        return token - self.NOTE_OFFSET

    def duration_to_token(self, duration: int) -> int:
        """Convert a duration in steps to its DURATION token ID.

        Durations < 1 are clamped to 1, durations > MAX_DURATION are clamped
        down. Clamping (rather than raising) is deliberate: real MIDI files
        contain pathologically long held notes, and dropping them would
        corrupt the surrounding sequence structure.
        """
        clamped = max(1, min(int(duration), self.MAX_DURATION))
        return clamped + self.DURATION_OFFSET

    def token_to_duration(self, token: int) -> int:
        """Recover the step duration from a DURATION token. Raises if not one."""
        if not self.is_duration_token(token):
            raise ValueError(f"Token {token} is not a DURATION token")
        return token - self.DURATION_OFFSET

    # ----- sequence-level conversion -----------------------------------------

    def encode(self, note_sequence: Iterable[tuple[int, int]]) -> list[int]:
        """Encode a ``(pitch, duration)`` sequence into a list of token IDs.

        Input
        -----
        ``note_sequence`` is a list of ``(pitch, duration)`` tuples as produced
        by :func:`parser.extract_note_sequence`. ``pitch == -1`` marks a rest.

        Output
        ------
        ``[START, p_1, d_1, p_2, d_2, ..., p_n, d_n, END]`` where each ``p_i``
        is either a NOTE token or the REST token.

        Example
        -------
        >>> v = Vocabulary()
        >>> v.encode([(60, 4), (-1, 2), (64, 2)])
        [1, 64, 135, 3, 133, 68, 133, 2]
        """
        tokens: list[int] = [self.START]
        for pitch, duration in note_sequence:
            if pitch == _REST_PITCH_SENTINEL:
                tokens.append(self.REST)
            else:
                tokens.append(self.pitch_to_token(pitch))
            tokens.append(self.duration_to_token(duration))
        tokens.append(self.END)
        return tokens

    def decode(self, tokens: Iterable[int]) -> list[tuple[int, int]]:
        """Decode a token stream back to a ``(pitch_or_-1, duration)`` list.

        Behaviour:
          * ``START`` and ``PAD`` tokens are skipped.
          * ``END`` terminates the decode early.
          * The decoder maintains a tiny state machine: it expects the stream
            to alternate ``[note, duration, note, duration, ...]``. If two
            note tokens appear in a row, the first is overwritten (the model
            "changed its mind"). If two durations appear in a row, the second
            is ignored (the first note keeps its duration).
          * Trailing notes without a duration token are dropped.

        This permissive parsing matters because LSTM samples are not guaranteed
        to be syntactically perfect — strict parsing would throw away most of
        the generated sequence on the first malformed pair.
        """
        out: list[tuple[int, int]] = []
        pending_pitch: int | None = None  # -1 for rest, MIDI pitch otherwise
        for tok in tokens:
            if tok == self.PAD or tok == self.START:
                continue
            if tok == self.END:
                break
            if tok == self.REST:
                pending_pitch = _REST_PITCH_SENTINEL
                continue
            if self.is_note_token(tok):
                # If a previous pitch is unresolved, overwrite it (last writer
                # wins) — the model emitted two pitches in a row, treat as
                # corrected pitch.
                pending_pitch = self.token_to_pitch(tok)
                continue
            if self.is_duration_token(tok):
                if pending_pitch is None:
                    # Duration without a preceding pitch — ignore.
                    continue
                out.append((pending_pitch, self.token_to_duration(tok)))
                pending_pitch = None
                continue
            # Unknown token id — silently skip (defensive).
        return out

    # ----- serialisation ------------------------------------------------------

    def to_dict(self) -> dict:
        """Return a JSON-serialisable dict capturing every vocabulary constant.

        Embedded into checkpoints so inference can reconstruct the exact
        token layout the model was trained on, even if the source code drifts.
        """
        return {
            "format_version": _VOCAB_FORMAT_VERSION,
            "PAD": self.PAD,
            "START": self.START,
            "END": self.END,
            "REST": self.REST,
            "NOTE_OFFSET": self.NOTE_OFFSET,
            "DURATION_OFFSET": self.DURATION_OFFSET,
            "MAX_DURATION": self.MAX_DURATION,
            "VOCAB_SIZE": self.VOCAB_SIZE,
        }

    def save(self, path: str | pathlib.Path) -> None:
        """Write the vocabulary as pretty-printed JSON to ``path``.

        Useful for debugging and for the academic write-up — the vocabulary
        file is human-readable and small (a few hundred bytes).
        """
        path = pathlib.Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(self.to_dict(), fh, indent=2)

    @classmethod
    def load(cls, path: str | pathlib.Path) -> "Vocabulary":
        """Load a vocabulary file written by :meth:`save`.

        Validates the format version and that the constants in the file match
        the constants compiled into this class. A mismatch indicates the
        checkpoint was made with an incompatible code version, and we refuse
        to proceed rather than silently mis-decode tokens.
        """
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if data.get("format_version") != _VOCAB_FORMAT_VERSION:
            raise ValueError(
                f"Vocabulary format version mismatch: "
                f"file={data.get('format_version')} expected={_VOCAB_FORMAT_VERSION}"
            )
        vocab = cls()
        for key in (
            "PAD", "START", "END", "REST",
            "NOTE_OFFSET", "DURATION_OFFSET", "MAX_DURATION", "VOCAB_SIZE",
        ):
            if data.get(key) != getattr(vocab, key):
                raise ValueError(
                    f"Vocabulary constant {key} differs: "
                    f"file={data.get(key)} code={getattr(vocab, key)}"
                )
        return vocab
