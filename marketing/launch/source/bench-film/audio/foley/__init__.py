"""Rebuild only the 40-second Foley stem from the included real CC0 recordings.

Requires Python + NumPy and ffmpeg. No network, synthesis, voice or music.
Usage: python build-foley.py --output /chosen/output/foley-v3.wav
"""

from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parent


def filtered_sample(event, sample_rate):
    """Keep the recording's natural transient; only EQ and short edge fades."""
    path = ROOT / "samples" / event["sample"]
    raw = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(path),
            "-ar",
            str(sample_rate),
            "-ac",
            "1",
            "-f",
            "f32le",
            "-",
        ],
        check=True,
        stdout=subprocess.PIPE,
    ).stdout
    duration = len(raw) / 4 / sample_rate
    tail = event["fade_out_seconds"]
    filters = ",".join(
        [
            f"highpass=f={event['highpass_hz']}",
            f"lowpass=f={event['lowpass_hz']}",
            "afade=t=in:st=0:d=0.0015",
            f"afade=t=out:st={duration - tail}:d={tail}",
        ]
    )
    result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "f32le",
            "-ar",
            str(sample_rate),
            "-ac",
            "1",
            "-i",
            "-",
            "-af",
            filters,
            "-f",
            "f32le",
            "-",
        ],
        input=raw,
        check=True,
        stdout=subprocess.PIPE,
    )
    return np.frombuffer(result.stdout, dtype="<f4").astype(np.float64)


def _render():
    plan = json.loads((ROOT / "cues.json").read_text())
    sr, fps = plan["sample_rate"], plan["picture_fps"]
    for source in plan["sources"]:
        actual = hashlib.sha256(
            (ROOT / "samples" / source["sample"]).read_bytes()
        ).hexdigest()
        if actual != source["sample_sha256"]:
            raise ValueError(f"Source sample changed: {source['sample']}")
    audio = np.zeros((round(plan["duration_seconds"] * sr), 2), np.float64)
    rendered = []
    for event in plan["events"]:
        sample = filtered_sample(event, sr)
        sample *= 10 ** (event["peak_dbfs"] / 20) / np.max(np.abs(sample))
        anchor = int(np.argmax(np.abs(sample))) if event["align"] == "peak" else 0
        target = round(event["frame"] / fps * sr)
        start, end = target - anchor, target - anchor + len(sample)
        audio[start:end] += np.column_stack(
            [sample * event["left"], sample * event["right"]]
        )
        rendered.append(
            {
                **event,
                "time_seconds": event["frame"] / fps,
                "start_sample": start,
                "end_sample": end,
                "peak_sample": start + int(np.argmax(np.abs(sample))),
            }
        )
    assert np.isfinite(audio).all() and np.max(np.abs(audio)) < 1
    report = {
        "version": plan["version"],
        "sample_rate": sr,
        "sample_count": len(audio),
        "duration_seconds": len(audio) / sr,
        "peak_dbfs_LR": (20 * np.log10(np.max(np.abs(audio), axis=0))).tolist(),
        "events": rendered,
    }
    return audio, report


def render_foley():
    """Return the final float64 stereo stem: exactly 1,920,000 × 2 at 48 kHz.

    Purely offline. Does not write files or normalise the stem to mix loudness.
    """
    return _render()[0]


def build(output):
    """Write the same render as PCM24 WAV plus its sample-exact cue report."""
    audio, report = _render()
    sr = report["sample_rate"]
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "f32le",
            "-ar",
            str(sr),
            "-ac",
            "2",
            "-i",
            "-",
            "-c:a",
            "pcm_s24le",
            str(output),
        ],
        input=audio.astype("<f4").tobytes(),
        check=True,
    )
    report["sha256"] = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n")
    print(
        json.dumps(
            {
                "output": str(output),
                "duration": report["duration_seconds"],
                "peak_dbfs_LR": report["peak_dbfs_LR"],
            }
        )
    )
