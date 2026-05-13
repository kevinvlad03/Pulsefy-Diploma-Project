"""
PyTorch Dataset for next-token prediction on tokenised music sequences.

The training objective
----------------------
We train the LSTM as a *causal language model*: given a context window of
tokens ``x_1, x_2, ..., x_L``, the model must predict the next token
``x_{L+1}``. Equivalently, for every position ``t`` in the window, the model
predicts ``x_{t+1}`` given ``x_1..x_t``. This is exactly the objective Bengio
et al. (2003, "A Neural Probabilistic Language Model") introduced for text and
that has since become the standard for sequence modelling. Cross-entropy loss
between the predicted distribution and the one-hot true next token gives a
well-conditioned, dense gradient signal at every position in the sequence.

Why this objective is right for music
-------------------------------------
Music has strong local temporal dependencies (notes constrain the immediately
following notes via key, scale, melodic contour) and weaker long-range ones.
Next-token prediction exploits the local structure directly: the model sees
the recent musical context and must learn the conditional distribution over
what could come next. There is no need for a separate "music-aware" loss
function — the categorical cross-entropy over the discrete token vocabulary
already captures the notion of "this is the right next note".

Sliding window construction
---------------------------
Each piece in the corpus is encoded into a token sequence
``s = [START, ...notes/durations..., END]`` of variable length. We slice ``s``
with a sliding window of width ``seq_len`` to produce ``len(s) - seq_len``
training examples per piece. For each window we emit:

  input  = s[i     : i + seq_len]      # tokens 0..L-1
  target = s[i + 1 : i + seq_len + 1]  # tokens 1..L  (input shifted by 1)

This is the standard "teacher forcing" setup. Examples are pre-materialised at
construction time (rather than generated on the fly) so training is fully
random-access and does not waste time on per-batch decoding.

Why we don't pad short sequences
--------------------------------
Sequences shorter than ``seq_len + 1`` cannot produce even a single full-width
training example. We simply skip them. This is preferable to padding a few
short pieces out to ``seq_len`` because: (a) padding tokens dominate the loss
when there are many of them, hurting learning, and (b) the corpus we use
(Nottingham folk songs) consistently produces sequences in the hundreds of
tokens, so dropping a handful of pathologically short ones is harmless.
"""
from __future__ import annotations

import warnings
from pathlib import Path

import torch
from torch.utils.data import Dataset

try:
    from .parser import extract_note_sequence
    from .vocab import Vocabulary
except ImportError:
    from parser import extract_note_sequence  # type: ignore
    from vocab import Vocabulary              # type: ignore


class MusicDataset(Dataset):
    """Sliding-window next-token prediction dataset.

    Parameters
    ----------
    sequences
        List of pre-encoded token sequences. Each inner list begins with
        ``Vocabulary.START`` and ends with ``Vocabulary.END``.
    seq_len
        Length of each training window (in tokens). 128 is a reasonable
        default: long enough to span ~32 notes (since each note is 2 tokens),
        which is several musical phrases, while keeping per-step LSTM compute
        tractable on CPU/MPS.
    pad_token
        Value used to pad short sequences if the caller decided to pad rather
        than skip. Stored on the instance so collators can reach it.

    Notes
    -----
    Examples are materialised eagerly. Memory cost is
    ``num_examples * seq_len * 8 bytes`` (long tensor). For 100k examples and
    seq_len=128, that is ~100 MB — well within reach for an academic project.
    """

    def __init__(
        self,
        sequences: list[list[int]],
        seq_len: int = 128,
        pad_token: int = 0,
    ):
        if seq_len < 2:
            raise ValueError(f"seq_len must be >= 2, got {seq_len}")

        self.seq_len = seq_len
        self.pad_token = pad_token

        # Filter sequences too short to produce even one window.
        usable = [s for s in sequences if len(s) >= seq_len + 1]
        self._num_sequences = len(usable)
        self._total_tokens = sum(len(s) for s in usable)

        # Materialise (input, target) pairs as flat python lists of tensors.
        # We build lists then stack into one big tensor for cache locality.
        inputs: list[list[int]] = []
        targets: list[list[int]] = []
        for seq in usable:
            for start in range(len(seq) - seq_len):
                inputs.append(seq[start : start + seq_len])
                targets.append(seq[start + 1 : start + seq_len + 1])

        if not inputs:
            # No usable examples — leave empty tensors so __len__ == 0 and
            # downstream code can detect the situation gracefully.
            self._inputs = torch.empty((0, seq_len), dtype=torch.long)
            self._targets = torch.empty((0, seq_len), dtype=torch.long)
        else:
            self._inputs = torch.tensor(inputs, dtype=torch.long)
            self._targets = torch.tensor(targets, dtype=torch.long)

    # ----- standard PyTorch interface ----------------------------------------

    def __len__(self) -> int:
        return self._inputs.shape[0]

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        """Return ``(input, target)`` LongTensors, each of shape ``(seq_len,)``.

        ``target`` is ``input`` shifted one position to the right, which is
        the standard teacher-forcing training signal for autoregressive LMs.
        """
        return self._inputs[idx], self._targets[idx]

    # ----- diagnostics --------------------------------------------------------

    @property
    def num_sequences(self) -> int:
        """Number of source pieces that contributed at least one window."""
        return self._num_sequences

    @property
    def total_tokens(self) -> int:
        """Sum of token counts across the contributing source sequences.

        Used in training logs to give a sense of corpus size in the same units
        the model sees (tokens, not "songs" or "notes").
        """
        return self._total_tokens

    # ----- construction from disk --------------------------------------------

    @classmethod
    def from_midi_dir(
        cls,
        midi_dir: str | Path,
        vocab: Vocabulary,
        seq_len: int = 128,
        min_notes: int = 20,
        max_files: int | None = None,
        verbose: bool = True,
    ) -> "MusicDataset":
        """Scan a directory of ``.mid``/``.midi`` files and build a dataset.

        Pipeline applied to every file
        ------------------------------
          1. Recursively find ``*.mid`` and ``*.midi`` files under ``midi_dir``.
          2. Parse with :func:`parser.extract_note_sequence`.
          3. Drop sequences shorter than ``min_notes``.
          4. Encode with ``vocab.encode``.
          5. Add the encoded sequence to the dataset.

        Files that raise any exception during parsing are silently skipped —
        real-world MIDI corpora always contain a few corrupt files, and we'd
        rather train on the 99% that work than abort on the first bad byte.

        Parameters
        ----------
        midi_dir
            Directory to scan recursively. Typically
            ``server/musicgen/lstm/data/midi``.
        vocab
            Vocabulary instance used for encoding.
        seq_len
            Forwarded to the constructor.
        min_notes
            Sequences with fewer than this many ``(pitch, duration)`` events
            (counting rests) are rejected as too short to learn from.
        max_files
            If set, parse at most this many files. Useful for fast smoke
            tests during development.
        verbose
            If True, print progress and final statistics.
        """
        midi_dir = Path(midi_dir)
        if not midi_dir.exists():
            raise FileNotFoundError(f"MIDI directory does not exist: {midi_dir}")

        # Use a set comprehension to deduplicate any double-counted files
        # (e.g. files matching both .mid and .midi extensions on case-
        # insensitive filesystems).
        midi_paths = sorted(
            {p for p in midi_dir.rglob("*.mid")} | {p for p in midi_dir.rglob("*.midi")}
        )
        if max_files is not None:
            midi_paths = midi_paths[:max_files]

        if verbose:
            print(f"      Scanning {len(midi_paths)} MIDI file(s) in {midi_dir}")

        encoded_sequences: list[list[int]] = []
        n_parsed_ok = 0
        n_too_short = 0
        n_failed = 0

        for i, path in enumerate(midi_paths):
            try:
                # ``extract_note_sequence`` already issues warnings; we
                # additionally suppress any noisy ones to keep the log clean.
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    seq = extract_note_sequence(path)
            except Exception:
                n_failed += 1
                continue

            if len(seq) < min_notes:
                n_too_short += 1
                continue

            tokens = vocab.encode(seq)
            encoded_sequences.append(tokens)
            n_parsed_ok += 1

            if verbose and (i + 1) % 50 == 0:
                print(f"      ... processed {i + 1}/{len(midi_paths)} files")

        dataset = cls(encoded_sequences, seq_len=seq_len, pad_token=vocab.PAD)

        if verbose:
            print(
                f"      Files OK={n_parsed_ok}  "
                f"too_short={n_too_short}  failed={n_failed}"
            )
            print(f"      Sequences kept: {dataset.num_sequences}")
            print(f"      Total tokens  : {dataset.total_tokens:,}")
            print(f"      Training windows (examples): {len(dataset):,}")

        return dataset
