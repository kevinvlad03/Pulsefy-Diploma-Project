#!/usr/bin/env python3
"""
Dataset downloader for the Pulsefy LSTM thesis project.

Source
------
The Nottingham Music Database — a corpus of ~1200 British and American folk
tunes that Eric Foxley transcribed in ABC notation in the 1990s. The Jukedeck
fork on GitHub (the source we use) provides the corpus pre-converted to MIDI
under a permissive license suitable for academic use:

    https://github.com/jukedeck/nottingham-dataset

Why this corpus?
----------------
* **Public domain content.** The underlying tunes are traditional folk
  melodies, free of copyright concerns that would complicate a thesis
  defence.
* **Stylistically homogeneous.** Every tune is a monophonic melody with
  optional chord accompaniment, all in major or minor keys, all in 2/4,
  3/4, 4/4, 6/8, or 9/8. This homogeneity is exactly what a small LSTM
  needs to learn coherent output — training on a heterogeneous corpus
  (e.g. MAESTRO classical piano) would require a much larger model.
* **Right size.** ~1200 files yields ~50k training windows at seq_len=128,
  enough to fit a 1M-parameter model without overfitting.

How it is used
--------------
The downloaded ``.mid`` files land in ``./data/midi/``. The training script
(``train.py``) recursively scans that directory, parses each file with
``parser.parse_midi``, drops percussion and out-of-range notes, and emits
the resulting token sequences for the LSTM.

This script uses only Python stdlib (``urllib``, ``zipfile``, ``shutil``,
``pathlib``) so it has no install-time dependencies beyond Python itself.
"""
from __future__ import annotations

import shutil
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path


# Download endpoint. Pinned to the master branch's auto-generated zip.
TARGET_URL = "https://github.com/jukedeck/nottingham-dataset/archive/refs/heads/master.zip"

# Where extracted MIDI files live, resolved relative to this script so the
# downloader works regardless of the user's current directory.
_THIS_DIR = Path(__file__).parent.resolve()
_DATA_DIR = _THIS_DIR / "data" / "midi"

# Threshold below which we re-download. The full corpus has ~1200 MIDI files;
# 10 is a generous "looks intentional" floor for partial / aborted downloads.
_MIN_EXISTING_FILES = 10


def _format_bytes(n: int) -> str:
    """Render a byte count like '12.3 MB' for human-friendly progress logs."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def _make_progress_hook():
    """Return a urlretrieve reporthook closure that prints percent-complete.

    ``urlretrieve`` calls the hook as ``hook(blocks_read, block_size, total)``
    every block. We render a single carriage-returned line so the progress
    overwrites itself instead of scrolling past.
    """
    last_pct = -1  # cache so we only redraw on whole-percent changes

    def hook(block_num: int, block_size: int, total_size: int) -> None:
        nonlocal last_pct
        downloaded = block_num * block_size
        if total_size > 0:
            pct = min(100, int(downloaded * 100 / total_size))
            if pct != last_pct:
                last_pct = pct
                bar = "#" * (pct // 4) + "-" * (25 - pct // 4)
                sys.stdout.write(
                    f"\r      [{bar}] {pct:3d}%  "
                    f"({_format_bytes(downloaded)} / {_format_bytes(total_size)})"
                )
                sys.stdout.flush()
        else:
            sys.stdout.write(f"\r      Downloaded {_format_bytes(downloaded)}")
            sys.stdout.flush()

    return hook


def _existing_midi_count() -> int:
    """Count ``.mid`` and ``.midi`` files already present in the data dir."""
    if not _DATA_DIR.exists():
        return 0
    return sum(1 for _ in _DATA_DIR.rglob("*.mid")) + sum(
        1 for _ in _DATA_DIR.rglob("*.midi")
    )


def main() -> None:
    print("\n[Pulsefy LSTM] Dataset downloader")
    print(f"      Target directory: {_DATA_DIR}")

    # Skip if we already have a usable corpus on disk.
    existing = _existing_midi_count()
    if existing >= _MIN_EXISTING_FILES:
        print(f"      Dataset already present ({existing} MIDI files). Nothing to do.")
        return

    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = _DATA_DIR.parent / "_nottingham.zip"

    # ---- download ----------------------------------------------------------
    print(f"\n      Downloading Nottingham Music Database from")
    print(f"      {TARGET_URL}")
    try:
        urllib.request.urlretrieve(TARGET_URL, zip_path, reporthook=_make_progress_hook())
        print()  # newline after the progress bar
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
        print(f"\n      ERROR: download failed ({exc.__class__.__name__}: {exc})")
        print("      Manual download instructions:")
        print("        1. Open https://github.com/jukedeck/nottingham-dataset")
        print("        2. Click 'Code' -> 'Download ZIP'")
        print("        3. Extract the archive's MIDI/ folder into:")
        print(f"           {_DATA_DIR}")
        # Clean up a partial download so a re-run starts fresh.
        if zip_path.exists():
            zip_path.unlink()
        sys.exit(1)

    # ---- extract -----------------------------------------------------------
    print("      Extracting MIDI files...")
    n_extracted = 0
    try:
        with zipfile.ZipFile(zip_path) as zf:
            for entry in zf.namelist():
                lower = entry.lower()
                if not (lower.endswith(".mid") or lower.endswith(".midi")):
                    continue
                # Strip leading directory components so every file lands flat
                # in _DATA_DIR. This avoids deep nested paths from the zip's
                # internal layout.
                target = _DATA_DIR / Path(entry).name
                with zf.open(entry) as src, open(target, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                n_extracted += 1
    except zipfile.BadZipFile as exc:
        print(f"      ERROR: zip is corrupt ({exc}). Delete the partial file and retry.")
        sys.exit(1)
    finally:
        # Always clean up the zip, even if extraction failed midway.
        if zip_path.exists():
            zip_path.unlink()

    if n_extracted == 0:
        print("      ERROR: zip contained no .mid files. Source layout may have changed.")
        print("      Inspect the zip manually or use the fallback instructions above.")
        sys.exit(1)

    print(f"\n      Downloaded {n_extracted} MIDI files to {_DATA_DIR}")
    print("      Next step: cd into this directory and run `python3 train.py`.\n")


if __name__ == "__main__":
    main()
