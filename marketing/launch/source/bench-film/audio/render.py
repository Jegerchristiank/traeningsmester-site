"""Mix the scored double bass, synchronised hand recordings and approved Danish narration."""

import argparse
import subprocess
from pathlib import Path

import numpy as np
import pyloudnorm as loudness
import soundfile as sf
from scipy.signal import resample_poly

RATE = 48_000
FRAMES = 40 * RATE
SOURCE = Path(__file__).resolve().parent
CAPTIONS = SOURCE.parents[4] / "public/product/film/baenkpres-da.vtt"


def write_stem(path, wave):
    sf.write(path, wave, RATE, subtype="PCM_24")
    # Master the same 24-bit samples that an editor receives.
    return sf.read(path, dtype="float64")[0]


def cue_seconds(stamp):
    hours, minutes, seconds = stamp.split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


def dialogue_fader(captions):
    # Ride whole lines. Short gaps between words should not make the bass surge.
    clock = np.arange(FRAMES // (RATE // 100) + 1) / 100
    speech = np.zeros_like(clock)
    for line in captions.splitlines():
        if " --> " not in line:
            continue
        start, end = map(cue_seconds, line.split(" --> "))
        entrance = np.clip((clock - (start - 0.22)) / 0.22, 0, 1)
        release = np.clip(((end + 0.59) - clock) / 0.46, 0, 1)
        ramp = np.minimum(entrance, release)
        speech = np.maximum(speech, ramp * ramp * (3 - 2 * ramp))
    # Release gently to the scored level in the spaces between the eight lines.
    gain = 10 ** ((-3.8 * speech) / 20)
    return np.interp(np.arange(FRAMES) / (RATE / 100), np.arange(len(gain)), gain)


def master(stereo):
    meter = loudness.Meter(RATE)
    gain = 10 ** ((-17.3 - meter.integrated_loudness(stereo)) / 20)
    stereo *= gain
    true_peak = max(np.max(np.abs(resample_poly(channel, 4, 1))) for channel in stereo.T)
    if 20 * np.log10(true_peak) <= -1.8:
        return stereo

    limit = 10 ** (-1.85 / 20)
    filters = (
        f"aresample={RATE * 4},alimiter=limit={limit}:attack=5:release=75:level=0:latency=1,"
        f"aresample={RATE},apad=whole_len={FRAMES},atrim=end_sample={FRAMES}"
    )
    process = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-f", "f32le", "-ar", str(RATE), "-ac", "2", "-i", "pipe:0",
            "-af", filters, "-f", "f32le", "pipe:1",
        ],
        input=stereo.astype("float32").tobytes(),
        stdout=subprocess.PIPE,
        check=True,
    )
    return np.frombuffer(process.stdout, dtype=np.float32).reshape(-1, 2)


def write_mix(output, music, foley):
    output.mkdir(exist_ok=True, parents=True)
    voice, sample_rate = sf.read(SOURCE / "speak.da.flac", dtype="float64")
    if sample_rate != RATE or voice.shape != (FRAMES,):
        raise ValueError("Expected 40 seconds of mono narration at 48 kHz.")
    if music.shape != (FRAMES, 2) or foley.shape != (FRAMES, 2):
        raise ValueError("The music and foley must start on frame zero and span the picture in stereo.")

    music = write_stem(output / "music.wav", music * 10 ** (-1.8 / 20))
    foley = write_stem(output / "foley.wav", foley * 10 ** (1.0 / 20))
    fader = dialogue_fader(CAPTIONS.read_text(encoding="utf-8"))
    music = write_stem(output / "music-ducked.wav", music * fader[:, None])
    voice_stereo = np.column_stack((voice, voice)) * 0.70710678
    mix = output / "mix.wav"
    sf.write(mix, master(voice_stereo + music + foley), RATE, subtype="PCM_24")
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(mix),
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(output / "mix.m4a"),
        ],
        check=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Directory for the stems and final mix")
    from foley import render_foley
    from music import render_music

    write_mix(parser.parse_args().output, render_music(), render_foley())
