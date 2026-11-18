"""Offline picture edit: 40.0 seconds, 24fps, two individually framed aspect ratios.

Requires ffmpeg, numpy, opencv-python-headless, Pillow and fonttools[woff] on macOS (Menlo font).
Run the controlled UI capture and unpack the existing phone master first; see
marketing/launch/source/bench-film/README.md. Generated intermediate JPEG frames
and rendered output belong in a build directory, never in version control.
"""

from pathlib import Path
import cv2 as cv, numpy as np, subprocess, json, importlib.util, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont
import argparse

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(
    description="Render the 40-second photographic product film. Inputs must be approved public source clips; no user data."
)
parser.add_argument("--grip", type=Path, required=True, help="Pexels5320004 original")
parser.add_argument("--press", type=Path, required=True, help="Pexels5320001 original")
parser.add_argument("--chalk", type=Path, required=True, help="Pexels31794153 original")
parser.add_argument(
    "--bench", type=Path, required=True, help="Directory from media-unpack-bench.py"
)
parser.add_argument("--output", type=Path, default=ROOT / "output/bench-film")
parser.add_argument(
    "--format", choices=["both", "landscape", "portrait"], default="both"
)
parser.add_argument("--preview-only", action="store_true")
parser.add_argument(
    "--font-dir",
    type=Path,
    help="Optional directory with CabinetGrotesk-800.otf and Satoshi-400.otf; otherwise existing WOFF2 files are decoded into output/fonts",
)
args = parser.parse_args()
P = args.output.resolve()
P.mkdir(parents=True, exist_ok=True)
BENCH = args.bench.resolve()
ART = ROOT / "marketing/launch/source/bench-film"
FPS = 24
FONT_DIR = args.font_dir.resolve() if args.font_dir else P / "fonts"
if not args.font_dir:
    from fontTools.ttLib import TTFont

    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name in ["CabinetGrotesk-800", "Satoshi-400"]:
        face = TTFont(ROOT / "public/fonts" / (name + ".woff2"))
        face.flavor = None
        face.save(FONT_DIR / (name + ".otf"))
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location(
    "cover", ROOT / "scripts/media-cover-motion.py"
)
cover = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cover)
cv.setNumThreads(3)
FONT = str(FONT_DIR / "Satoshi-400.otf")
BOLD = str(FONT_DIR / "CabinetGrotesk-800.otf")


@lru_cache(maxsize=60)
def read(p):
    return cv.imread(str(p), cv.IMREAD_UNCHANGED)


def ease(a, b, t):
    return cover.ease(a, b, t)


def mix(a, b, x):
    return cover.mix(a, b, x)


def resize(a, w, h):
    return cv.resize(
        a,
        (round(w), round(h)),
        interpolation=cv.INTER_AREA if w < a.shape[1] else cv.INTER_CUBIC,
    )


def crop(a, box):
    x, y, w, h = map(round, box)
    return a[y : y + h, x : x + w]


def fit(a, size, cx=0.5, cy=0.5):
    w, h = size
    sc = max(w / a.shape[1], h / a.shape[0])
    return cover.photograph(
        a,
        cover.camera(sc, (a.shape[1] * cx, a.shape[0] * cy), (w * 0.5, h * 0.5)),
        size,
    )


def paste(bg, fg, x, y, alpha=1):
    x, y = round(x), round(y)
    h, w = fg.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(bg.shape[1], x + w), min(bg.shape[0], y + h)
    if x1 <= x0 or y1 <= y0:
        return bg
    part = fg[y0 - y : y1 - y, x0 - x : x1 - x]
    mask = (part[:, :, 3:4] / 255 if part.shape[2] == 4 else 1) * alpha
    bg[y0:y1, x0:x1] = bg[y0:y1, x0:x1] * (1 - mask) + part[:, :, :3] * mask
    return bg


@lru_cache(maxsize=12)
def ui(state):
    return read(P / "ui" / f"{state}.png")[:, :, :3]


G = np.float32(json.loads((BENCH / "glyph-quad.json").read_text())["glass_quad"])
H = cv.getPerspectiveTransform(
    np.float32([[0, 0], [1206, 0], [1206, 2622], [0, 2622]]), G
)
GLYPH = cv.perspectiveTransform(
    np.float32(
        [
            [
                [255 * 3, 454 * 3],
                [289 * 3, 454 * 3],
                [289 * 3, 472 * 3],
                [255 * 3, 472 * 3],
            ]
        ]
    ),
    H,
)[0]


@lru_cache(maxsize=6)
def phone(state):
    base = read(BENCH / "before.webp").copy()
    s = ui(state).astype(np.float32) * np.float32([0.91, 0.94, 0.94]) + np.float32(
        [5, 4, 2]
    )
    s = np.clip(s, 0, 255).astype("uint8")
    mask = np.zeros((2622, 1206), dtype=np.uint8)
    cv.rectangle(mask, (65, 0), (1140, 2622), 255, -1)
    cv.rectangle(mask, (0, 65), (1206, 2557), 255, -1)
    for cx, cy in [(65, 65), (1140, 65), (65, 2557), (1140, 2557)]:
        cv.circle(mask, (cx, cy), 65, 255, -1)
    # Perspective downsampling needs a supersampled intermediate to preserve thin native rules.
    scale = 3
    large = cv.resize(base, None, fx=scale, fy=scale, interpolation=cv.INTER_CUBIC)
    hs = cv.getPerspectiveTransform(
        np.float32([[0, 0], [1206, 0], [1206, 2622], [0, 2622]]), G * scale
    )
    m = (
        cv.warpPerspective(mask, hs, large.shape[1::-1], flags=cv.INTER_LINEAR)[
            :, :, None
        ]
        / 255
    )
    warped = cv.warpPerspective(s, hs, large.shape[1::-1], flags=cv.INTER_LINEAR)
    return np.uint8(large * (1 - m) + warped * m)


def decode():
    from concurrent.futures import ThreadPoolExecutor

    def one(pair):
        name, f = pair
        dest = P / "decoded" / name
        dest.mkdir(parents=True, exist_ok=True)
        if not (dest / "000.jpg").exists():
            subprocess.run(
                [
                    "ffmpeg",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-threads",
                    "2",
                    "-i",
                    f,
                    "-an",
                    "-vf",
                    "fps=24,scale=1600:900",
                    "-q:v",
                    "3",
                    "-start_number",
                    "0",
                    str(dest / "%03d.jpg"),
                ],
                check=True,
            )

    with ThreadPoolExecutor(max_workers=3) as ex:
        list(
            ex.map(
                one,
                [
                    ("grip", str(args.grip)),
                    ("press", str(args.press)),
                    ("chalk", str(args.chalk)),
                ],
            )
        )


@lru_cache(maxsize=12)
def shot(name, frame):
    return read(P / "decoded" / name / f"{frame:03d}.jpg")


def source(name, sec):
    return shot(name, max(0, int(sec * 24)))


def text(im, lines, xy, size, color="white", bold=False, lineheight=1.12, stroke=0):
    p = Image.fromarray(cv.cvtColor(im, cv.COLOR_BGR2RGB))
    d = ImageDraw.Draw(p)
    font = ImageFont.truetype(BOLD if bold else FONT, size)
    for n, line in enumerate(lines.split("\n")):
        d.text(
            (xy[0], xy[1] + n * size * lineheight),
            line,
            font=font,
            fill=color,
            stroke_width=stroke,
            stroke_fill="#15181d",
        )
    return cv.cvtColor(np.array(p), cv.COLOR_RGB2BGR)


def dark(im, amount=0.25):
    return np.uint8(im * (1 - amount))


class Film:
    def __init__(self, mobile):
        self.mobile = mobile
        self.size = (720, 1280) if mobile else (1440, 810)
        self.w, self.h = self.size
        self.layout = cover.Composition(self.size, mobile, (1672, 941))
        self.powder = cover.Chalk(self.layout, GLYPH)

    def phot(self, name, sec):
        im = source(name, sec)
        im = cover.grade(im, "chalk" if name == "chalk" else "press")
        return fit(im, self.size, 0.46 if name == "grip" else 0.53, 0.51)

    def phone_take(self, state, cam):
        hi = cam.copy()
        hi[:, :2] /= 3
        return cover.photograph(phone(state), hi, self.size)

    def physical(self, state, t=6):
        return self.phone_take(state, self.layout.phone_camera(t))

    def set_camera(self, t):
        initial = self.layout.phone_camera(8)
        target = cover.camera(
            2.13 if self.mobile else 2.8,
            (1190, 435),
            (
                self.w * 0.50 if self.mobile else self.w * 0.57,
                self.h * 0.43 if self.mobile else self.h * 0.48,
            ),
        )
        p = ease(12.8, 15.8, t)
        return initial * (1 - p) + target * p

    def history_camera(self, t):
        sc = 2.05 if self.mobile else 2.22
        p = ease(28, 31, t)
        return cover.camera(
            sc * (0.94 + 0.06 * p),
            (1175, 626),
            (
                self.w * 0.52 if self.mobile else self.w * 0.68,
                self.h * 0.40 if self.mobile else self.h * 0.48,
            ),
        )

    def note(self, frame):
        return text(
            frame,
            "Eksempeldata · rekonstrueret appvisning",
            (30, 24) if self.mobile else (34, 26),
            16 if self.mobile else 17,
            "#f6f5f1",
            stroke=1,
        )

    def timer(self, frame, t):
        rem = 120 - int(t - 18.35)
        label = f"{rem // 60:02d}:{rem % 60:02d}"
        x, y = (55, 775) if self.mobile else (110, 455)
        size = 116 if self.mobile else 126
        p = Image.fromarray(cv.cvtColor(frame, cv.COLOR_BGR2RGB))
        d = ImageDraw.Draw(p)
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", size, index=1)
        d.text((x, y), label, font=font, fill="#f6f5f1")
        frame = cv.cvtColor(np.array(p), cv.COLOR_RGB2BGR)
        return text(
            frame,
            "Pausetid mellem sæt",
            (x, y - 35),
            26 if self.mobile else 28,
            "#f6f5f1",
        )

    def frame(self, t):
        mobile = self.mobile
        w, h = self.size
        if t < 6:
            out = (
                self.phot("grip", 1.0 + t) if t < 3 else self.phot("press", 9.5 + t - 3)
            )
            if 0.45 < t < 3:
                layer = dark(out, 0.12)
                layer = text(
                    layer,
                    "Hvad løftede\njeg sidst?",
                    (45, 850) if mobile else (65, 500),
                    62 if mobile else 66,
                    bold=True,
                )
                out = mix(out, layer, ease(0.45, 0.8, t) * (1 - ease(2.65, 3, t)))
            return out
        if t < 11:
            u = (t - 6) * 0.83
            raw = self.layout.camera_take(
                cover.grade(source("chalk", min(3.55, 0.15 + 0.77 * u)), "chalk"),
                self.layout.chalk_camera,
            )
            if u > 2.80:
                raw = mix(raw, self.physical("empty", u), ease(2.80, 3.57, u))
            raw = self.powder.paint(raw, self.layout, u)
            if u > 3.6:
                raw = mix(raw, self.physical("before", u), ease(3.6, 3.95, u))
            return self.note(raw) if u > 2.8 else raw
        if t < 19.65:
            state = (
                "before"
                if t < 18
                else "pending"
                if t < 18.35
                else "rest-" + str(120 - int(t - 18.35))
            )
            cam = self.set_camera(t)
            out = self.phone_take(state, cam)
            if 17.78 < t < 18.3:
                point = cam @ np.array([1301.9, 455.35, 1])
                r = 18 * cam[0, 0] + 12 * ease(17.78, 18.3, t)
                overlay = out.copy()
                cv.circle(
                    overlay,
                    tuple(np.round(point).astype(int)),
                    round(r),
                    (245, 225, 185),
                    3,
                    cv.LINE_AA,
                )
                out = mix(out, overlay, 0.62 * (1 - ease(18.1, 18.3, t)))
            return self.note(out)
        if t < 28:
            out = self.phot("chalk", 14.0 + max(0, t - 20.2) * 0.76)
            # An editorial iris originates exactly at the persisted green completion mark.
            if t < 20.55:
                cam = self.set_camera(19.65)
                old = self.phone_take("rest-119", cam)
                cx, cy = cam @ np.array([1301.9, 455.35, 1])
                p = ease(19.65, 20.55, t)
                r = 16 * cam[0, 0] + (max(w, h) * 1.55) * p
                yy, xx = np.mgrid[:h, :w]
                dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
                mask = np.clip((r - dist) / 3, 0, 1)[:, :, None]
                out = np.uint8(old * (1 - mask) + out * mask)
                cv.circle(
                    out, (round(cx), round(cy)), round(r), (95, 174, 125), 3, cv.LINE_AA
                )
            if 20.1 < t < 24:
                layer = self.timer(dark(out, 0.16), t)
                out = mix(out, layer, ease(20.1, 20.65, t) * (1 - ease(23.3, 24, t)))
            return out
        if t < 34:
            out = self.phone_take("history", self.history_camera(t))
            out = self.note(out)
            return text(
                out,
                "Næste\ntræning." if not mobile else "Næste træning.",
                (40, 1035) if mobile else (65, 180),
                48 if mobile else 72,
                bold=True,
            )
        # A fresh, uninterrupted photographic closing take; no simulated web controls.
        out = dark(self.phot("press", 18.2 + (t - 34)), 0.43)
        logo = read(ROOT / "public/brand/tm-logo.png")
        size = 96 if mobile else 112
        logo = resize(logo, size, size)
        x, y = (44, 170) if mobile else (65, 100)
        out = paste(out, logo, x, y)
        out = text(
            out,
            "Træningsmester",
            (x + size + 18, y + size * 0.31),
            34 if mobile else 38,
            bold=True,
        )
        out = text(
            out,
            "Få besked\nom adgang.",
            (44, 520) if mobile else (65, 285),
            66 if mobile else 82,
            bold=True,
        )
        out = text(
            out,
            "traeningsmester.dk",
            (44, 750) if mobile else (65, 510),
            32 if mobile else 36,
        )
        out = text(
            out,
            "Træningsmester er under udvikling.",
            (44, 820) if mobile else (65, 578),
            23 if mobile else 25,
        )
        return out

    def preview(self):
        times = [2.0, 8.25, 15.3, 20.6, 30.4, 37.0]
        frames = []
        for t in times:
            im = self.frame(t)
            cv.imwrite(str(P / f"preview-{self.mobile}-{t:.2f}.jpg"), im)
            small = resize(im, 360, 640 if self.mobile else 203)
            small = cv.copyMakeBorder(
                small, 0, 28, 0, 0, cv.BORDER_CONSTANT, value=(25, 25, 25)
            )
            small = text(small, f"{t:04.1f}s", (10, small.shape[0] - 24), 16)
            frames.append(small)
        contact = np.vstack([np.hstack(frames[:3]), np.hstack(frames[3:])])
        cv.imwrite(
            str(
                P / ("contact-portrait.jpg" if self.mobile else "contact-landscape.jpg")
            ),
            contact,
        )

    def render(self):
        dest = P / (
            "bench-film-portrait-silent.mp4"
            if self.mobile
            else "bench-film-landscape-silent.mp4"
        )
        w, h = self.size
        proc = subprocess.Popen(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "rawvideo",
                "-pixel_format",
                "bgr24",
                "-video_size",
                f"{w}x{h}",
                "-framerate",
                "24",
                "-i",
                "-",
                "-an",
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "20",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(dest),
            ],
            stdin=subprocess.PIPE,
        )
        for i in range(960):
            proc.stdin.write(self.frame(i / 24).tobytes())
            if i % 120 == 0:
                print(dest.name, i, flush=True)
        proc.stdin.close()
        assert proc.wait() == 0
        print("DONE", dest, flush=True)


if __name__ == "__main__":
    decode()
    for mobile in (
        [False, True] if args.format == "both" else [args.format == "portrait"]
    ):
        film = Film(mobile)
        film.preview()
        if not args.preview_only:
            film.render()
