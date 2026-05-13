"""
Pure-Python MIDI 1.0 binary parser for the Pulsefy LSTM thesis project.

Why a pure-Python parser?
-------------------------
The thesis requirement is to implement the symbolic-music pipeline from first
principles: no `mido`, no `music21`, no `pretty_midi`. Reading the binary MIDI
format directly demonstrates a precise understanding of what symbolic music
actually is at the byte level, and produces a self-contained artefact that can
be defended in front of a university commission without hand-waving over
"black-box" libraries.

MIDI 1.0 binary format — short reference
----------------------------------------
A Standard MIDI File (SMF) is a sequence of *chunks*. Every chunk begins with
a 4-byte ASCII identifier and a 4-byte big-endian length, followed by `length`
bytes of body.

  +---------+--------+----------------------+
  | "MThd"  | length | header body          |
  +---------+--------+----------------------+
  | "MTrk"  | length | track event stream   |
  +---------+--------+----------------------+
  ...

Header chunk (`MThd`) body, always 6 bytes:
  - format   (uint16, big-endian): 0 = single track, 1 = simultaneous tracks,
                                    2 = independent songs.
  - ntracks  (uint16, big-endian): number of subsequent MTrk chunks.
  - division (uint16, big-endian): if bit 15 = 0, the lower 15 bits give the
    number of *ticks per quarter note* (PPQ). If bit 15 = 1 the value encodes
    SMPTE frame rate plus ticks-per-frame (used by film/TV scores). We only
    handle PPQ — SMPTE files in melodic-music corpora are essentially absent.

Track chunks (`MTrk`) contain a stream of *events*. Every event is preceded by
a delta-time encoded as a Variable-Length Quantity (VLQ).

Event categories
----------------
1. Channel voice/mode events. The status byte's high nibble identifies the
   event type, the low nibble the MIDI channel (0-15).
     0x8n  Note Off       (note, velocity)            — 2 data bytes
     0x9n  Note On        (note, velocity)            — 2 data bytes
                          velocity == 0 is treated as Note Off (common idiom)
     0xAn  Polyphonic Aftertouch                       — 2 data bytes
     0xBn  Control Change                              — 2 data bytes
     0xCn  Program Change                              — 1 data byte
     0xDn  Channel Pressure                            — 1 data byte
     0xEn  Pitch Bend                                  — 2 data bytes

2. Meta events (only inside MTrk).
     0xFF <type> <vlq-length> <data...>
   Includes tempo (0x51), time signature (0x58), end-of-track (0x2F), etc.

3. System Exclusive events.
     0xF0 <vlq-length> <data...>   (begin)
     0xF7 <vlq-length> <data...>   (continuation/escape)

Running status
--------------
If a data byte (high bit clear) is encountered where a status byte was
expected, the previous channel-status byte is reused. This is a 1980s-era
optimisation that any conformant parser MUST implement, otherwise large
fractions of real-world files will fail mid-stream.

Variable-Length Quantity (VLQ)
------------------------------
Encodes a 28-bit unsigned integer in 1-4 bytes. Each byte contributes 7 bits
to the value (most-significant first). Bit 7 is the continuation flag: 1 means
"more bytes follow", 0 means "this is the last byte".

  0x40           -> 64
  0x7F           -> 127
  0x81 0x00      -> 128
  0x86 0xC0      -> (0b0000110 << 7) | 0b1000000 = 0x340 = 832
  0x82 0x80 0x00 -> 32768

Quantisation
------------
Real performances contain expressive timing deviations (a note nominally on
beat 1 might land 12 ticks early). For language-model training we want a
discrete grid, so we round every event time to a 16th-note step
(``ticks_per_step = ticks_per_beat / 4``). This is the same grid used by most
DAW piano rolls and is fine-grained enough for melodic music while keeping
the vocabulary compact.
"""
from __future__ import annotations

import pathlib
import struct
import warnings
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Constants — named so a reader does not have to decode magic numbers.
# ---------------------------------------------------------------------------

_HEADER_MAGIC = b"MThd"
_TRACK_MAGIC = b"MTrk"

# MIDI channel numbers are 0-indexed in the wire format. Channel 9 (the 10th
# channel) is reserved by the General MIDI standard for percussion. Excluding
# it dramatically improves the coherence of a melodic-only language model.
_PERCUSSION_CHANNEL = 9

# Channel-event status nibbles (high 4 bits of the status byte).
_NOTE_OFF = 0x80
_NOTE_ON = 0x90
_POLY_AFTERTOUCH = 0xA0
_CONTROL_CHANGE = 0xB0
_PROGRAM_CHANGE = 0xC0
_CHANNEL_PRESSURE = 0xD0
_PITCH_BEND = 0xE0

# System-realm status bytes (full byte, not nibble).
_SYSEX_BEGIN = 0xF0
_SYSEX_ESCAPE = 0xF7
_META_EVENT = 0xFF

# Meta-event sub-types we care about.
_META_SET_TEMPO = 0x51
_META_END_OF_TRACK = 0x2F

# VLQ continuation bit.
_VLQ_CONTINUE = 0x80
_VLQ_VALUE = 0x7F

# Filtering thresholds applied by ``extract_note_sequence``.
# Pitches outside C2 (36) -- C7 (96) are usually bass-pedal or sound-effect
# tracks; they confuse a melodic LM trained on small corpora.
_MIN_MELODIC_PITCH = 36
_MAX_MELODIC_PITCH = 96
_MIN_NOTES_FOR_USEFUL_SEQUENCE = 8
_MAX_DURATION_STEPS = 32  # one full bar at 8 steps/bar, two bars at 4/bar.


# ---------------------------------------------------------------------------
# Public dataclass.
# ---------------------------------------------------------------------------


@dataclass
class Note:
    """A quantised musical note.

    Attributes
    ----------
    pitch : int
        MIDI pitch number in the range 0-127. Middle C is 60.
    start_step : int
        Onset position on the 16th-note grid (0 = beginning of the file).
    duration_steps : int
        Length of the note in 16th-note steps. Always >= 1, because zero-length
        notes carry no useful information for a sequence model.
    """

    pitch: int
    start_step: int
    duration_steps: int


# ---------------------------------------------------------------------------
# Low-level helpers.
# ---------------------------------------------------------------------------


def _read_vlq(data: bytes, pos: int) -> tuple[int, int]:
    """Read a MIDI variable-length quantity (VLQ) starting at ``pos``.

    Returns ``(value, new_position)``.

    VLQ encoding: each byte contributes 7 bits to the integer value
    (most-significant first). Bit 7 of every byte is a continuation flag —
    1 means more bytes follow, 0 means this byte is the last. The MIDI spec
    caps VLQs at four bytes, giving a maximum representable value of
    ``0x0FFFFFFF`` (~268 million ticks, far beyond any real file).

    Example
    -------
    >>> _read_vlq(bytes([0x86, 0x40]), 0)
    (832, 2)
    # ((0x86 & 0x7F) << 7) | (0x40 & 0x7F) == 0x340 == 832
    """
    value = 0
    bytes_read = 0
    while True:
        if pos >= len(data):
            # Truncated VLQ — the file is malformed. Return what we have so the
            # outer track parser can stop cleanly instead of indexing past end.
            raise ValueError("Truncated VLQ at end of track")
        byte = data[pos]
        pos += 1
        bytes_read += 1
        value = (value << 7) | (byte & _VLQ_VALUE)
        if not (byte & _VLQ_CONTINUE):
            return value, pos
        if bytes_read >= 4:
            # MIDI spec: VLQs are capped at 4 bytes. A 5th byte indicates a
            # corrupt file; refuse to keep reading instead of looping forever.
            raise ValueError("VLQ exceeds 4-byte maximum (corrupt file)")


# ---------------------------------------------------------------------------
# Track-level parser.
# ---------------------------------------------------------------------------


def _parse_track(
    data: bytes,
    ticks_per_beat: int,
    quantise_steps_per_beat: int = 4,
) -> list[Note]:
    """Parse a single MIDI track chunk *body* (the bytes after the MTrk header).

    Walks the event stream, maintaining absolute tick time and a table of
    "currently sounding" notes (keyed by ``(channel, pitch)``). Every Note On
    event opens an entry; the matching Note Off (or Note On with velocity 0)
    closes it and emits a quantised :class:`Note`.

    Parameters
    ----------
    data
        Raw track body bytes.
    ticks_per_beat
        From the MThd chunk's division field. Used to convert tick deltas to
        a quantised grid.
    quantise_steps_per_beat
        Number of grid steps per beat. Default 4 = 16th-note grid.

    Returns
    -------
    list[Note]
        Notes ordered by ``start_step``. Notes whose Off event is missing
        (a fairly common error in real MIDI files) are silently dropped.
    """
    if ticks_per_beat <= 0:
        raise ValueError(f"Invalid ticks_per_beat: {ticks_per_beat}")

    # Floating-point so we don't lose resolution when ticks_per_beat is not
    # a multiple of quantise_steps_per_beat (e.g. 96 / 4 = 24 is fine, but
    # 480 / 6 = 80 still benefits from real division for safety).
    ticks_per_step = ticks_per_beat / quantise_steps_per_beat

    pos = 0
    abs_tick = 0
    running_status: Optional[int] = None
    # active_notes maps (channel, pitch) -> start_tick. We keep the channel in
    # the key so the same pitch can be held simultaneously on two channels
    # without one Note Off closing the other.
    active_notes: dict[tuple[int, int], int] = {}
    notes: list[Note] = []

    end = len(data)
    while pos < end:
        # ---- delta time -----------------------------------------------------
        delta, pos = _read_vlq(data, pos)
        abs_tick += delta
        if pos >= end:
            break

        # ---- status byte (with running-status fallback) --------------------
        first = data[pos]
        if first & 0x80:
            status = first
            pos += 1
            # Running status is reset by system-realm bytes (>= 0xF0) but
            # preserved across normal channel events.
            if status < _SYSEX_BEGIN:
                running_status = status
        else:
            if running_status is None:
                # A data byte with no preceding status — corrupt stream. Skip
                # this byte and resync; better than aborting the whole file.
                pos += 1
                continue
            status = running_status

        # ---- meta events (0xFF) --------------------------------------------
        if status == _META_EVENT:
            if pos >= end:
                break
            meta_type = data[pos]
            pos += 1
            length, pos = _read_vlq(data, pos)
            if pos + length > end:
                break
            payload = data[pos : pos + length]
            pos += length
            if meta_type == _META_END_OF_TRACK:
                break
            # Set Tempo (0x51) and other meta events are read but not used by
            # the LM — quantisation is in beats, not seconds, so tempo changes
            # do not affect the symbolic representation.
            continue

        # ---- system exclusive (0xF0 / 0xF7) --------------------------------
        if status == _SYSEX_BEGIN or status == _SYSEX_ESCAPE:
            length, pos = _read_vlq(data, pos)
            pos += length
            # SysEx resets running status (per MIDI spec).
            running_status = None
            continue

        # ---- channel voice events ------------------------------------------
        msg_type = status & 0xF0
        channel = status & 0x0F

        if msg_type == _NOTE_ON or msg_type == _NOTE_OFF:
            if pos + 2 > end:
                break
            pitch = data[pos]
            velocity = data[pos + 1]
            pos += 2

            if channel == _PERCUSSION_CHANNEL:
                # Drums are not melodic; skip without bookkeeping.
                continue

            key = (channel, pitch)
            if msg_type == _NOTE_ON and velocity > 0:
                # Some files emit two Note Ons in a row without a Note Off —
                # treat the second as a re-trigger by closing the previous
                # instance first.
                if key in active_notes:
                    start_tick = active_notes.pop(key)
                    _emit_note(notes, pitch, start_tick, abs_tick, ticks_per_step)
                active_notes[key] = abs_tick
            else:
                # Note Off OR Note On with velocity 0 (the common idiom).
                start_tick = active_notes.pop(key, None)
                if start_tick is not None:
                    _emit_note(notes, pitch, start_tick, abs_tick, ticks_per_step)
            continue

        if msg_type in (_PROGRAM_CHANGE, _CHANNEL_PRESSURE):
            # 1-byte payload events.
            pos += 1
            continue

        if msg_type in (_POLY_AFTERTOUCH, _CONTROL_CHANGE, _PITCH_BEND):
            # 2-byte payload events.
            pos += 2
            continue

        # Unknown / undefined status — skip a byte and try to resync.
        pos += 1

    # ``notes`` is approximately ordered by the order Off events appeared,
    # which is *not* the same as start order. Sort explicitly for callers.
    notes.sort(key=lambda n: (n.start_step, n.pitch))
    return notes


def _emit_note(
    notes: list[Note],
    pitch: int,
    start_tick: int,
    end_tick: int,
    ticks_per_step: float,
) -> None:
    """Quantise (pitch, start_tick, end_tick) onto the 16th-note grid.

    Helper kept private to this module to avoid duplicating the rounding logic
    in two places inside ``_parse_track``.
    """
    start_step = int(round(start_tick / ticks_per_step))
    end_step = int(round(end_tick / ticks_per_step))
    duration_steps = max(1, end_step - start_step)
    notes.append(Note(pitch=pitch, start_step=start_step, duration_steps=duration_steps))


# ---------------------------------------------------------------------------
# File-level parser.
# ---------------------------------------------------------------------------


def parse_midi(filepath: str | pathlib.Path) -> list[Note]:
    """Parse a Standard MIDI File and return all notes across every track.

    Supports MIDI Format 0 (single track) and Format 1 (multiple simultaneous
    tracks sharing one timeline). Format 2 (multi-song) is rare in melodic
    corpora and is treated identically to Format 1 — each track is parsed and
    the results are merged.

    Header structure (MThd, always 14 bytes total):
      bytes  0-3 : magic "MThd"
      bytes  4-7 : chunk length (uint32 BE), always 6
      bytes  8-9 : format (uint16 BE), 0 / 1 / 2
      bytes 10-11: number of tracks (uint16 BE)
      bytes 12-13: division (uint16 BE):
                     bit 15 == 0  -> ticks per quarter note
                     bit 15 == 1  -> SMPTE timing (not handled)

    Returns
    -------
    list[Note]
        All notes from all tracks, sorted by start_step. Returns an empty list
        (with a warning) for files that contain zero parseable notes.

    Raises
    ------
    ValueError
        If the file is not a valid Standard MIDI File (wrong magic, truncated
        header, SMPTE timing, etc.).
    FileNotFoundError
        If ``filepath`` does not exist.
    """
    path = pathlib.Path(filepath)
    raw = path.read_bytes()

    if len(raw) < 14 or raw[:4] != _HEADER_MAGIC:
        raise ValueError(f"Not a Standard MIDI File: {path}")

    header_length = struct.unpack(">I", raw[4:8])[0]
    if header_length < 6:
        raise ValueError(f"MThd header too short ({header_length} bytes)")

    midi_format, n_tracks, division = struct.unpack(">HHH", raw[8:14])

    if division & 0x8000:
        # Bit 15 set means SMPTE timecode timing — convertible in principle
        # but extremely rare in melodic data and not worth the complexity.
        raise ValueError("SMPTE-timed MIDI files are not supported")

    ticks_per_beat = division & 0x7FFF
    if ticks_per_beat == 0:
        raise ValueError("Division field has zero ticks per beat")

    # Skip past the (possibly oversized) header into the track region.
    pos = 8 + header_length
    all_notes: list[Note] = []
    tracks_seen = 0

    while pos + 8 <= len(raw) and tracks_seen < n_tracks:
        chunk_id = raw[pos : pos + 4]
        chunk_len = struct.unpack(">I", raw[pos + 4 : pos + 8])[0]
        body_start = pos + 8
        body_end = body_start + chunk_len
        if body_end > len(raw):
            warnings.warn(f"Truncated track in {path.name}; stopping early")
            break

        if chunk_id == _TRACK_MAGIC:
            try:
                track_notes = _parse_track(raw[body_start:body_end], ticks_per_beat)
                all_notes.extend(track_notes)
            except ValueError as exc:
                warnings.warn(f"Skipping malformed track in {path.name}: {exc}")
            tracks_seen += 1
        # Unknown chunk types (e.g. proprietary extensions) are silently
        # skipped per the MIDI spec.

        pos = body_end

    if not all_notes:
        warnings.warn(f"No parseable notes in {path.name}")
        return []

    all_notes.sort(key=lambda n: (n.start_step, n.pitch))
    return all_notes


# ---------------------------------------------------------------------------
# High-level convenience used by the dataset builder.
# ---------------------------------------------------------------------------


def extract_note_sequence(filepath: str | pathlib.Path) -> list[tuple[int, int]]:
    """Parse a MIDI file and return a cleaned ``(pitch, duration_steps)`` list.

    Output schema
    -------------
    A flat sequence in performance order. Each element is one of:
      * ``(pitch, duration_steps)`` — a melodic note, ``pitch`` in 0-127
      * ``(-1, rest_duration_steps)`` — a rest/silence between consecutive notes

    Filters applied (in order)
    --------------------------
    1. Percussion (channel 9) is excluded during track parsing.
    2. Notes with pitch outside ``[36, 96]`` (C2 -- C7, the typical melodic
       range) are dropped.
    3. Durations are clamped to ``[1, 32]`` steps. 32 steps = two full bars at
       4 steps/beat; longer notes (typically held drones) hurt LM training.
    4. Sequences with fewer than 8 notes are rejected as too short to be
       musically meaningful.

    Rest detection
    --------------
    For each consecutive pair of notes (``n_i``, ``n_{i+1}``), if
    ``n_{i+1}.start_step > n_i.start_step + n_i.duration_steps``, the gap is
    emitted as a rest token. Overlapping notes do not produce a rest.

    Returns
    -------
    list[tuple[int, int]]
        Empty list if the file is unparseable, has too few notes after
        filtering, or raises any error during parsing.
    """
    try:
        notes = parse_midi(filepath)
    except (ValueError, FileNotFoundError, OSError) as exc:
        warnings.warn(f"Could not parse {filepath}: {exc}")
        return []

    # Apply melodic-range filter.
    filtered = [
        n for n in notes
        if _MIN_MELODIC_PITCH <= n.pitch <= _MAX_MELODIC_PITCH
    ]

    if len(filtered) < _MIN_NOTES_FOR_USEFUL_SEQUENCE:
        return []

    # Build the flat (pitch, duration) sequence with rest insertion.
    sequence: list[tuple[int, int]] = []
    prev_end_step: Optional[int] = None
    for note in filtered:
        if prev_end_step is not None:
            gap = note.start_step - prev_end_step
            if gap > 0:
                rest_dur = min(gap, _MAX_DURATION_STEPS)
                sequence.append((-1, rest_dur))
        clamped_duration = max(1, min(note.duration_steps, _MAX_DURATION_STEPS))
        sequence.append((note.pitch, clamped_duration))
        prev_end_step = note.start_step + note.duration_steps

    return sequence
