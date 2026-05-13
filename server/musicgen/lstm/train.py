#!/usr/bin/env python3
"""
Training script for the Pulsefy LSTM music language model.

Usage
-----
    cd server/musicgen/lstm
    python3 train.py --epochs 30 --batch-size 64

The script expects training MIDI files in ``./data/midi/`` (run
``download_data.py`` first to populate this directory).

Training objective
------------------
Standard categorical cross-entropy on next-token prediction. For each
``(input, target)`` window of length L:

    loss = mean over t in 0..L-1 of  -log P(target_t | input_0..t)

where ``P`` is the softmax over the model's logits at position t. PAD tokens
are excluded from the average via ``ignore_index=Vocabulary.PAD`` so they
don't dilute the loss signal.

Train / validation split
------------------------
A small fraction of the dataset (default 5%) is reserved as a held-out
validation set. After every epoch we compute val-loss and save a checkpoint
*only if it improves on the best val-loss seen so far*. This is a poor man's
early-stopping: the final ``best_model.pt`` always corresponds to the lowest
val-loss across the run, so over-training a few extra epochs costs nothing.

Why no learning-rate warmup?
----------------------------
Adam + a cosine schedule is robust enough for a 1M-parameter LSTM that the
warmup machinery used by Transformer training is unnecessary. We start at
the requested LR and let cosine annealing decay it smoothly to zero by the
final epoch.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# Allow ``python3 train.py`` (script-mode) to import sibling modules without
# requiring the user to set PYTHONPATH or invoke as a package.
_THIS_DIR = Path(__file__).parent.resolve()
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from vocab import Vocabulary           # noqa: E402  (sys.path setup above)
from dataset import MusicDataset       # noqa: E402
from model import MusicLSTM            # noqa: E402


# Default location for the training corpus, resolved relative to this file
# so the script works regardless of the user's current directory.
_DEFAULT_MIDI_DIR = _THIS_DIR / "data" / "midi"
_DEFAULT_OUTPUT_DIR = _THIS_DIR / "checkpoints"


def get_device(device_arg: str) -> torch.device:
    """Resolve the ``--device`` argument to an actual ``torch.device``.

    ``"auto"`` prefers Apple MPS first (most thesis development happens on
    a MacBook), then CUDA, finally CPU. We print which device was chosen so
    the training log makes the hardware setup unambiguous.
    """
    arg = device_arg.lower()
    if arg == "auto":
        if torch.backends.mps.is_available():
            chosen = torch.device("mps")
            why = "Apple Metal (MPS) detected"
        elif torch.cuda.is_available():
            chosen = torch.device("cuda")
            why = "CUDA detected"
        else:
            chosen = torch.device("cpu")
            why = "no accelerator detected, using CPU"
    elif arg == "mps":
        if not torch.backends.mps.is_available():
            print("[warn] MPS requested but not available; falling back to CPU")
            chosen = torch.device("cpu")
            why = "MPS unavailable"
        else:
            chosen = torch.device("mps")
            why = "user requested MPS"
    elif arg == "cuda":
        if not torch.cuda.is_available():
            print("[warn] CUDA requested but not available; falling back to CPU")
            chosen = torch.device("cpu")
            why = "CUDA unavailable"
        else:
            chosen = torch.device("cuda")
            why = "user requested CUDA"
    else:
        chosen = torch.device("cpu")
        why = "user requested CPU"

    print(f"      Device: {chosen}  ({why})")
    return chosen


def train_one_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
    device: torch.device,
    grad_clip: float = 1.0,
) -> float:
    """Run one full pass over ``dataloader`` in training mode.

    For each batch:
      1. Move tensors to ``device``.
      2. Forward pass; reshape logits/targets to 2-D / 1-D so cross-entropy
         can be computed across all (batch, position) pairs at once.
      3. Backward pass.
      4. Clip the global gradient norm to ``grad_clip``. RNNs are known to
         suffer from exploding gradients on long sequences; clipping is the
         simplest and most effective remedy (Pascanu et al., 2013).
      5. Optimiser step.

    Returns the mean loss over all batches (not weighted by batch size, on
    the assumption that ``drop_last=True`` keeps batch size constant).
    """
    model.train()
    total_loss = 0.0
    num_batches = 0
    for inputs, targets in dataloader:
        inputs = inputs.to(device)
        targets = targets.to(device)

        optimizer.zero_grad()
        logits, _ = model(inputs)  # logits: (B, L, V)
        # CrossEntropyLoss expects logits as (N, V) and targets as (N,) where
        # N = B * L. Reshape rather than computing per-position to keep the
        # implementation vectorised.
        loss = criterion(
            logits.reshape(-1, logits.size(-1)),
            targets.reshape(-1),
        )
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=grad_clip)
        optimizer.step()

        total_loss += loss.item()
        num_batches += 1

    return total_loss / max(num_batches, 1)


@torch.no_grad()
def evaluate(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> float:
    """Compute mean validation loss with no gradient tracking.

    ``model.eval()`` disables dropout so the validation number reflects what
    the deployed (inference-mode) model actually does. Wrapping in
    ``torch.no_grad`` skips autograd bookkeeping and roughly halves memory
    use, which matters for the larger validation batch sizes some setups use.
    """
    model.eval()
    total_loss = 0.0
    num_batches = 0
    for inputs, targets in dataloader:
        inputs = inputs.to(device)
        targets = targets.to(device)
        logits, _ = model(inputs)
        loss = criterion(
            logits.reshape(-1, logits.size(-1)),
            targets.reshape(-1),
        )
        total_loss += loss.item()
        num_batches += 1
    return total_loss / max(num_batches, 1)


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments.

    Defaults are tuned for the Nottingham corpus on a MacBook Pro M-series:
    convergence in ~30 epochs, ~10 minutes wall-clock.
    """
    parser = argparse.ArgumentParser(
        description="Train the Pulsefy LSTM music generation model.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    # ----- data -------------------------------------------------------------
    parser.add_argument(
        "--midi-dir",
        type=str,
        default=str(_DEFAULT_MIDI_DIR),
        help="Directory containing training MIDI files (searched recursively).",
    )
    parser.add_argument(
        "--max-files",
        type=int,
        default=None,
        help="If set, parse at most this many MIDI files (for quick testing).",
    )
    parser.add_argument(
        "--min-notes",
        type=int,
        default=20,
        help="Drop sequences with fewer than this many notes after parsing.",
    )
    parser.add_argument(
        "--seq-len",
        type=int,
        default=128,
        help="Length of each training context window (in tokens).",
    )
    parser.add_argument(
        "--val-split",
        type=float,
        default=0.05,
        help="Fraction of windows held out for validation.",
    )

    # ----- model ------------------------------------------------------------
    parser.add_argument(
        "--embed-dim",
        type=int,
        default=64,
        help="Token embedding dimensionality.",
    )
    parser.add_argument(
        "--hidden-dim",
        type=int,
        default=256,
        help="LSTM hidden state size.",
    )
    parser.add_argument(
        "--num-layers",
        type=int,
        default=2,
        help="Number of stacked LSTM layers.",
    )
    parser.add_argument(
        "--dropout",
        type=float,
        default=0.3,
        help="Dropout probability between LSTM layers and before the output projection.",
    )

    # ----- optimisation -----------------------------------------------------
    parser.add_argument(
        "--epochs",
        type=int,
        default=30,
        help="Number of training epochs.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=64,
        help="Mini-batch size.",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=1e-3,
        help="Initial learning rate for Adam.",
    )
    parser.add_argument(
        "--grad-clip",
        type=float,
        default=1.0,
        help="Maximum gradient L2 norm (clip larger to prevent explosions).",
    )

    # ----- system -----------------------------------------------------------
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        choices=["auto", "cpu", "cuda", "mps"],
        help="Compute device. 'auto' prefers MPS > CUDA > CPU.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(_DEFAULT_OUTPUT_DIR),
        help="Directory to write checkpoints, logs, and the vocab JSON.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed for python/torch RNGs (split + weight init).",
    )

    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Reproducibility: fix the seed used by the train/val split and by the
    # initial weight sampler. (Cudnn determinism is left at default — the
    # extra slowdown is not worth it for an academic project.)
    torch.manual_seed(args.seed)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    device = get_device(args.device)

    # ------------------------------------------------------------------ data
    print("\n[1/4] Loading dataset...")
    vocab = Vocabulary()
    full_dataset = MusicDataset.from_midi_dir(
        midi_dir=args.midi_dir,
        vocab=vocab,
        seq_len=args.seq_len,
        min_notes=args.min_notes,
        max_files=args.max_files,
        verbose=True,
    )
    if len(full_dataset) == 0:
        raise RuntimeError(
            f"No training examples produced from {args.midi_dir}. "
            f"Did you run download_data.py first?"
        )

    print(f"      Total sequences (windows): {len(full_dataset):,}")
    print(f"      Total tokens             : {full_dataset.total_tokens:,}")

    val_size = max(1, int(len(full_dataset) * args.val_split))
    train_size = len(full_dataset) - val_size
    train_set, val_set = random_split(
        full_dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(args.seed),
    )
    print(f"      Train / val split        : {train_size:,} / {val_size:,}")

    train_loader = DataLoader(
        train_set,
        batch_size=args.batch_size,
        shuffle=True,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_set,
        batch_size=args.batch_size,
        shuffle=False,
        drop_last=False,
    )

    # ----------------------------------------------------------------- model
    print("\n[2/4] Building model...")
    model = MusicLSTM(
        vocab_size=Vocabulary.VOCAB_SIZE,
        embed_dim=args.embed_dim,
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
        dropout=args.dropout,
    ).to(device)
    print(model)

    # -------------------------------------------------------------- training
    print("\n[3/4] Training...")
    criterion = nn.CrossEntropyLoss(ignore_index=Vocabulary.PAD)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    # CosineAnnealingLR smoothly decays LR to 0 by the final epoch — no extra
    # hyperparameters, and it usually outperforms a flat schedule on small
    # corpora because the late-epoch fine-tuning happens at low LR.
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_loss = float("inf")
    training_log: list[dict] = []

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss = train_one_epoch(
            model, train_loader, optimizer, criterion, device, grad_clip=args.grad_clip
        )
        val_loss = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - t0
        current_lr = scheduler.get_last_lr()[0]

        print(
            f"  Epoch {epoch:3d}/{args.epochs} | "
            f"train={train_loss:.4f} | val={val_loss:.4f} | "
            f"lr={current_lr:.2e} | {elapsed:.1f}s"
        )

        training_log.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_loss,
            "lr": current_lr,
            "seconds": elapsed,
        })

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            checkpoint = {
                "model_state_dict": model.state_dict(),
                "config": {
                    "vocab_size": Vocabulary.VOCAB_SIZE,
                    "embed_dim": args.embed_dim,
                    "hidden_dim": args.hidden_dim,
                    "num_layers": args.num_layers,
                    "dropout": args.dropout,
                },
                "vocab": vocab.to_dict(),
                "epoch": epoch,
                "val_loss": val_loss,
                "train_loss": train_loss,
            }
            torch.save(checkpoint, output_dir / "best_model.pt")
            print(f"             -> saved best model (val_loss={val_loss:.4f})")

    # -------------------------------------------------------------- artefacts
    print("\n[4/4] Saving artefacts...")
    vocab.save(output_dir / "vocab.json")
    with open(output_dir / "config.json", "w", encoding="utf-8") as fh:
        json.dump(vars(args), fh, indent=2)
    with open(output_dir / "training_log.json", "w", encoding="utf-8") as fh:
        json.dump(training_log, fh, indent=2)

    print("\nTraining complete.")
    print(f"  Best val loss : {best_val_loss:.4f}")
    print(f"  Checkpoint    : {output_dir / 'best_model.pt'}")
    print(f"  Vocab         : {output_dir / 'vocab.json'}")
    print(f"  Training log  : {output_dir / 'training_log.json'}")
    print(
        "  To generate   : python3 generate.py "
        "--prompt 'upbeat' --output /tmp/test.wav"
    )


if __name__ == "__main__":
    main()
