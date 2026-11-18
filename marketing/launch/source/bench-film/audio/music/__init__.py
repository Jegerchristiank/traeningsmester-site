"""The film's original score, played on Karoryfer's sampled Otto Rubner upright bass."""

import json
from pathlib import Path

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy.signal import butter, lfilter, sosfilt

from .notes import BOW, WOOD

RATE = 48_000
FRAME_COUNT = 40 * RATE
ROOT = Path(__file__).resolve().parent
RECORDED_NOTES = {33: "a1", 36: "c2", 39: "eb2", 42: "gb2", 45: "a2", 48: "c3"}
PLUCK_TAKES = ((3, 2), (2, 1), (3, 3), (2, 2), (3, 4))


def amplitude(decibels):
    return 10 ** (decibels / 20)


def presence_filter(signal, frequency, decibels, q):
    """A peaking EQ to let the recorded string overtones carry on a small speaker."""
    omega = 2 * np.pi * frequency / RATE
    alpha = np.sin(omega) / (2 * q)
    gain = 10 ** (decibels / 40)
    return lfilter(
        [1 + alpha * gain, -2 * np.cos(omega), 1 - alpha * gain],
        [1 + alpha / gain, -2 * np.cos(omega), 1 - alpha / gain],
        signal,
    )


def select_take(note, index, bowed):
    available = [key for key in RECORDED_NOTES if not bowed or key >= 39]
    root_note = min(available, key=lambda key: abs(note - key))
    if bowed:
        direction = ("down", "up")[index % 2]
        name = f"{RECORDED_NOTES[root_note]}_vl1_{direction}"
    else:
        layer, variation = PLUCK_TAKES[index % len(PLUCK_TAKES)]
        name = f"{RECORDED_NOTES[root_note]}_vl{layer}_rr{variation}"
    return root_note, name


def play(stereo, events, bank, regions, bowed):
    for index, (onset, note, duration, level_db) in enumerate(events):
        root_note, name = select_take(note, index, bowed)
        region = regions[name]
        take = bank[region["at"]:region["at"] + region["frames"]]

        if bowed:
            release = 0.34
        elif duration > 1.4:
            release = 0.54
        else:
            release = max(0.11, min(0.58, duration * 0.49))
        time = np.arange(round((duration + release) * RATE)) / RATE
        source_rate = 44_100 * 2 ** ((note - root_note) / 12)
        wave = np.interp(time * source_rate, np.arange(len(take)), take, right=0)

        attack = 0.154 if bowed else 0.0055
        gate = np.cos(np.pi / 2 * np.maximum(0, time - duration) / release) ** 2
        envelope = np.minimum(1, time / attack) * gate
        start = 0.18 if bowed else 0.022
        end = min(0.62, duration + 0.03) if bowed else min(0.33, duration + 0.045)
        body = wave[(time > start) & (time < end)]
        rms = np.sqrt(np.mean(body**2))
        if bowed:
            # Retain the far quieter natural onset of the real bow.
            rms = max(rms, np.sqrt(np.mean(wave**2)) * 0.9)
        wave *= envelope * amplitude(level_db) * (0.115 if bowed else 0.14) / max(rms, 0.0025)
        if not bowed:
            wave = 0.88 * wave + 0.12 * np.tanh(2.5 * wave) / 1.55

        pan = 0.12 if bowed else -0.05
        first = round(onset * RATE)
        count = min(len(wave), FRAME_COUNT - first)
        stereo[first:first + count, 0] += wave[:count] * np.sqrt(1 - pan) * 0.70710678
        stereo[first:first + count, 1] += wave[:count] * np.sqrt(1 + pan) * 0.70710678


def render_music():
    """Return 40 s of 48 kHz stereo float64, exactly matching the 24-bit music master."""
    bank, source_rate = sf.read(ROOT / "kontrabas.flac", dtype="float64")
    if source_rate != 44_100 or bank.ndim != 1:
        raise ValueError("The recorded bass bank must be 44.1 kHz mono.")
    regions = json.loads((ROOT / "instrument.json").read_text(encoding="utf-8"))

    stereo = np.zeros((FRAME_COUNT, 2), dtype=np.float64)
    play(stereo, WOOD, bank, regions, bowed=False)
    play(stereo, BOW, bank, regions, bowed=True)
    for channel in range(2):
        tone = sosfilt(butter(2, 40, fs=RATE, btype="highpass", output="sos"), stereo[:, channel])
        tone = presence_filter(tone, 320, 1.9, 0.78)
        tone = presence_filter(tone, 1070, 1.05, 0.72)
        stereo[:, channel] = sosfilt(butter(2, 6400, fs=RATE, btype="lowpass", output="sos"), tone)

    fade = round(0.24 * RATE)
    stereo[-fade:] *= np.linspace(1, 0, fade)[:, None]
    stereo *= amplitude(-23.7 - pyloudnorm.Meter(RATE).integrated_loudness(stereo))

    # Match libsndfile's 24-bit reference encode before joining voice and foley.
    return (np.rint(stereo * 2**31).astype(np.int64) >> 8).astype(np.float64) / 2**23
