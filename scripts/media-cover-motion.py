"""Render the two editorial cover films. This is an offline production tool.

Needs ffmpeg on PATH, Python, numpy and opencv-python-headless. Pass the three
original Pexels clips, plus the composited phone plates described in marketing/launch.
"""

import argparse
import json
from functools import lru_cache
from pathlib import Path
import subprocess
import tempfile

import cv2 as cv
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "marketing/launch/source/magnesium"
FPS, FRAMES = 24, 204
OPENING_FRAME = 157  # Enter during the real press; the end continues into this pose.
STOCK_SIZE = (1600, 900)
cv.setNumThreads(3)


def ease(a, b, t):
    s = np.clip((t - a) / (b - a), 0, 1)
    return s * s * (3 - 2 * s)


def mix(a, b, amount):
    if amount <= 0:
        return a
    if amount >= 1:
        return b
    return cv.addWeighted(a, 1 - amount, b, amount, 0)


def image(path, flags=cv.IMREAD_COLOR):
    pixels = cv.imread(str(path), flags)
    if pixels is None:
        raise FileNotFoundError(path)
    return pixels


def decode_shot(source, start, duration, directory):
    # Decode each licensed master once, identically for both aspect ratios.
    directory.mkdir()
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start),
        "-i", str(source), "-t", str(duration), "-an", "-vf",
        f"fps={FPS},scale={STOCK_SIZE[0]}:{STOCK_SIZE[1]}:flags=lanczos",
        "-q:v", "2", "-start_number", "0", str(directory / "%03d.jpg"),
    ], check=True)
    count = len(list(directory.glob("*.jpg")))

    @lru_cache(maxsize=4)
    def read(index):
        return image(directory / f"{index:03d}.jpg")

    return lambda second: read(int(np.clip(round(second * FPS), 0, count - 1)))


def camera(scale, source_anchor, destination):
    x, y = destination
    sx, sy = source_anchor
    return np.float32([[scale, 0, x - sx * scale], [0, scale, y - sy * scale]])


def photograph(pixels, matrix, size):
    # Extend the edge of the photographed wall or bench into the shadows.
    # Mirroring a full shot here would introduce a second hand or device.
    result = cv.warpAffine(pixels, matrix, size, flags=cv.INTER_LINEAR,
                           borderMode=cv.BORDER_REPLICATE)
    h, w = result.shape[:2]
    scale, left, top = matrix[0, 0], matrix[0, 2], matrix[1, 2]
    if left > 0:
        # Dust at the sensor edge must not smear across the extended wall.
        start = int(left)
        reach = min(w, start + max(12, int(.09 * w)))
        band = result[:, start:reach]
        tones = cv.resize(band, (1, 7), interpolation=cv.INTER_AREA)
        wall = cv.resize(tones, (1, h), interpolation=cv.INTER_CUBIC)
        shadow = np.median(tones, axis=0) * .79
        wall = wall * .34 + shadow * .66
        blend = ease(start - .05 * w, reach, np.arange(reach))[None, :, None]
        result[:, :reach] = wall * (1 - blend) + result[:, :reach] * blend
    end = round(top + pixels.shape[0] * scale)
    if 0 < end < h:
        # Continue the colour of the out-of-focus foreground below the sensor.
        reach = max(1, end - max(12, round(.15 * h)))
        tones = cv.resize(result[reach:end], (12, 4), interpolation=cv.INTER_AREA)
        foreground = np.median(tones.reshape(-1, 3), axis=0) * .65
        blend = ease(reach, end, np.arange(reach, h))[:, None, None]
        result[reach:] = result[reach:] * (1 - blend) + foreground * blend
    return result


def grade(pixels, style):
    # The two practical shots and the bench have a common warm-black point.
    # Keep neutral dust, steel and the app's white surface distinct.
    coefficients = {"chalk": (.84, .84, .83), "press": (1.06, 1.13, 1.14)}
    slope = coefficients[style]
    offsets = {"chalk": (3., 4., 6.), "press": (2., 3., 3.)}[style]
    lut = np.clip(np.arange(256)[:, None] * slope + offsets, 0, 255)
    return cv.LUT(pixels, lut.astype(np.uint8).reshape(256, 1, 3))


class Composition:
    def __init__(self, size, portrait, bench_size):
        self.w, self.h = size
        self.size = size
        self.portrait = portrait
        self.bw, self.bh = bench_size
        self.chalk_camera = self.chalk_framing()
        self.press_camera = self.press_framing()
        self.grip_camera = self.grip_framing()
        # Fall off gently below the action; a cropped sensor edge must never
        # reflect a second pair of hands or duplicate the top of the phone.
        y = (np.arange(self.h, dtype=np.float32) / self.h)[:, None, None]
        self.dark = (.99 - .77 * ease(.57, .97, y)) if portrait else None

    def chalk_framing(self):
        w, h = self.w, self.h
        sw, sh = STOCK_SIZE
        if self.portrait:
            scale = max(w / sw * 1.5, h / sh * .76)
            return camera(scale, (.52 * sw, .40 * sh), (.55 * w, .31 * h))
        scale = max(w / sw, h / sh) * 1.035
        return camera(scale, (.46 * sw, .39 * sh), (.626 * w, .44 * h))

    def press_framing(self):
        w, h = self.w, self.h
        sw, sh = STOCK_SIZE
        if self.portrait:
            scale = max(w / sw * 1.6, h / sh * .70)
            return camera(scale, (.62 * sw, .51 * sh), (.56 * w, .37 * h))
        scale = max(w / sw, h / sh) * 1.03
        return camera(scale, (.62 * sw, .50 * sh), (.74 * w, .49 * h))

    def grip_framing(self):
        w, h = self.w, self.h
        sw, sh = STOCK_SIZE
        if self.portrait:
            scale = max(w / sw * 1.40, h / sh * .68)
            return camera(scale, (.449 * sw, .57 * sh), (.51 * w, .34 * h))
        scale = max(w / sw, h / sh) * 1.10
        return camera(scale, (.59 * sw, .51 * sh), (.615 * w, .50 * h))

    def phone_camera(self, t):
        # The physical camera continues towards the set after the match cut.
        progress = ease(2.35, 6.30, t)
        if self.portrait:
            scale = self.h / self.bh * (.64 + progress * .055)
            return camera(scale, (.71 * self.bw, .49 * self.bh),
                          (self.w * (.60 - .025 * progress), self.h * .335))
        scale = self.w / self.bw * (1.09 + .10 * progress)
        return camera(scale, (.72 * self.bw, .48 * self.bh),
                      (self.w * (.754 - .012 * progress), self.h * .49))

    def camera_take(self, pixels, transform):
        result = photograph(pixels, transform, self.size)
        if self.dark is not None:
            result = (result * self.dark).astype(np.uint8)
        return result


class Chalk:
    """Carry particles sampled from a real impact into the actual input glyph."""

    def __init__(self, layout, phone_glyph):
        w, h = layout.size
        mobile = layout.portrait
        self.unit = (w / 640) if mobile else (w / 1536)
        random = np.random.default_rng(2619)
        count = 20500
        mask = image(ART / "vaegtfelt.png", cv.IMREAD_GRAYSCALE)
        density = image(ART / "stoevkorn.png", cv.IMREAD_GRAYSCALE)
        gh, gw = mask.shape
        rh, rw = density.shape

        def sample(field):
            probabilities = field.ravel().astype(float)
            index = random.choice(field.size, count, p=probabilities / probabilities.sum())
            y, x = np.unravel_index(index, field.shape)
            return x + random.random(count), y + random.random(count)

        gx, gy = sample(mask)
        u, v = gx / gw, gy / gh
        sx, sy = sample(density)
        photo = np.c_[sx * STOCK_SIZE[0] / rw, sy * STOCK_SIZE[1] / rh].astype("float32")
        self.start = cv.transform(photo[None], layout.chalk_camera)[0]

        # Keep individual grains, air holes, depth and small clumps in the type.
        # This is neither another font nor a solid type layer set over a picture.
        text_width = w * (.65 if mobile else .299)
        center = np.float32([w * (.49 if mobile else .688), h * (.249 if mobile else .345)])
        jag = random.normal(0, 1, (count, 2))
        scattered = random.random(count) < .22
        jag *= np.where(scattered, random.gamma(1.1, 6.4, count), 1.7)[:, None] * self.unit
        unwarped = np.c_[(u - .5) * text_width, (v - .5) * text_width * gh / gw]
        # A slight rising baseline follows the physical direction of the chalk.
        unwarped[:, 1] -= unwarped[:, 0] * .070
        self.letter = (center + unwarped + jag).astype(np.float32)

        rotation = random.uniform(-np.pi, np.pi, count)
        self.swirl = np.c_[np.cos(rotation), np.sin(rotation)].astype(np.float32)
        self.swirl *= (random.normal(62, 25, count) * self.unit)[:, None]
        self.phase = random.random(count).astype(np.float32) * 2 * np.pi
        self.delay = np.float32(.18 * (u - .5) + random.normal(0, .15, count))
        self.float_size = np.float32(random.uniform(.8, 3.7, count) * self.unit)
        self.weight = np.float32(random.gamma(1.45, .66, count).clip(.17, 3.6))
        self.weight[scattered] *= .82
        self.clusters = random.integers(0, 3, count)
        unit_rect = np.float32([[0, 0], [1, 0], [1, 1], [0, 1]])
        surface = cv.getPerspectiveTransform(unit_rect, np.float32(phone_glyph))
        self.ink = cv.perspectiveTransform(np.float32([np.c_[u, v]]), surface)[0]

    def paint(self, frame, layout, time):
        if time <= .09 or time >= 3.92:
            return frame
        form = ease(.28, 1.91, time - self.delay)[:, None]
        landing = ease(2.53, 3.89, time - self.delay * .32)[:, None]
        flight = 4 * form * (1 - form)
        phase = self.phase + time * 1.35
        drift = np.c_[np.cos(phase), np.sin(phase)] * self.float_size[:, None]
        position = self.start * (1 - form) + self.letter * form
        position += self.swirl * flight + drift
        coordinates = cv.transform(self.ink[None], layout.phone_camera(time))[0]
        position = position * (1 - landing) + coordinates * landing
        # Grains curl as the mass moves over the same field on the glass.
        bow = np.sin(np.pi * landing)
        position[:, 1] -= (29 * self.unit + self.swirl[:, 1] * .34) * bow[:, 0]
        position[:, 0] += self.swirl[:, 0] * .36 * bow[:, 0]
        visibility = ease(.07, .90, time) * (1 - ease(3.42, 3.92, time))
        strength = self.weight * visibility
        return self.expose(frame, position, strength)

    def expose(self, frame, xy, strength):
        # Bilinear subpixel splats at three depths avoid a noisy video overlay
        # and preserve specular grains in both the 640px and 1536px exports.
        height, width = frame.shape[:2]
        inset = max(3, round(6 * self.unit))
        x0 = max(0, int(xy[:, 0].min()) - inset)
        y0 = max(0, int(xy[:, 1].min()) - inset)
        x1 = min(width, int(xy[:, 0].max()) + inset + 2)
        y1 = min(height, int(xy[:, 1].max()) + inset + 2)
        if x0 >= x1 or y0 >= y1:
            return frame
        rw, rh = x1 - x0, y1 - y0
        x, y = xy[:, 0] - x0, xy[:, 1] - y0
        inside = (x >= 0) & (y >= 0) & (x < rw - 1) & (y < rh - 1)
        x, y = x[inside], y[inside]
        weights, cluster = strength[inside], self.clusters[inside]
        ix, iy = x.astype(np.int32), y.astype(np.int32)
        fx, fy = x - ix, y - iy
        density = np.zeros((rh, rw), dtype=np.float32)
        for layer, radius in enumerate([.32, .85, 1.65]):
            matches = cluster == layer
            flat = iy[matches] * rw + ix[matches]
            xx, yy = fx[matches], fy[matches]
            indexes = np.r_[flat, flat + 1, flat + rw, flat + rw + 1]
            exposure = np.r_[(1 - xx) * (1 - yy), xx * (1 - yy),
                             (1 - xx) * yy, xx * yy]
            exposure *= np.tile(weights[matches], 4)
            plane = np.bincount(indexes, weights=exposure, minlength=rw * rh)
            plane = plane.reshape(rh, rw).astype(np.float32)
            tint = [2.3, 2.8, 2.1][layer]
            density += tint * cv.GaussianBlur(plane, (0, 0), max(.25, radius * self.unit))
        # Local coverage is optical, so overlapping clouds approach white limestone.
        alpha = 1 - np.exp(-density * (.79 * self.unit ** 2))
        roi = frame[y0:y1, x0:x1]
        roi[:] = roi + (np.float32([224, 233, 238]) - roi) * alpha[:, :, None]
        return frame


def render(kind, scale, chalk, press, grip, bench, directory, sheets):
    mobile = kind == "portraet"
    size = (672, 1196) if mobile else (1536, 864)
    size = tuple(max(2, 2 * round(n * scale / 2)) for n in size)
    metadata = json.loads((bench / "glyph-quad.json").read_text())
    glyph = metadata if isinstance(metadata, list) else metadata["quad"]

    @lru_cache(maxsize=5)
    def plate(name):
        return image(bench / (name + ".webp"))

    layout = Composition(size, mobile, plate("before").shape[1::-1])
    powder = Chalk(layout, glyph)
    name = "saet-" + kind
    directory.mkdir(parents=True, exist_ok=True)
    export = subprocess.Popen([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
        "-pixel_format", "bgr24", "-video_size", f"{size[0]}x{size[1]}",
        "-framerate", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
        "-preset", "slow", "-crf", "26", "-maxrate",
        "1.05M" if mobile else "1.75M", "-bufsize", "1.6M" if mobile else "2.5M", "-pix_fmt", "yuv420p", "-movflags",
        "+faststart", str(directory / (name + ".mp4")),
    ], stdin=subprocess.PIPE)

    def chalk_take(t):
        return layout.camera_take(grade(chalk(t), "chalk"), layout.chalk_camera)

    def press_take(t):
        # Two views of the same real press, cut on the ascent of the bar.
        if t < 1.13:
            take = grip(.52 + t)
            if not mobile:
                take = cv.flip(take, 1)
            return layout.camera_take(grade(take, "press"), layout.grip_camera)
        return layout.camera_take(grade(press(t), "press"), layout.press_camera)

    def bench_take(t):
        transform = layout.phone_camera(t)
        if t < 3.91:
            blank = plate("empty")
            amount = ease(3.63, 3.91, t)
            shot = mix(blank, plate("before"), amount)
        elif t < 4.28:
            shot = plate("before")
        elif t < 4.78:
            shot = plate(f"settle-{min(11, int((t - 4.28) * FPS)):02d}")
        else:
            shot = plate("after-01" if t >= 5.28 else "after-00")
        return layout.camera_take(shot, transform)

    keyframes = []
    try:
        for index in range(FRAMES):
            t = ((index + OPENING_FRAME) % FRAMES) / FPS
            if t < 2.80:
                frame = chalk_take(.81 + .73 * t)
            elif t < 3.57:
                frame = mix(chalk_take(.81 + .73 * t), bench_take(t), ease(2.80, 3.57, t))
            elif t < 6.13:
                frame = bench_take(t)
            elif t < 6.36:
                frame = mix(bench_take(t), press_take(t - 6.13), ease(6.13, 6.36, t))
            elif t < 7.69:
                frame = press_take(t - 6.13)
            elif t < 7.88:
                frame = mix(press_take(t - 6.13), chalk_take(t - 7.69), ease(7.69, 7.88, t))
            else:
                frame = chalk_take(t - 7.69)
            frame = powder.paint(frame, layout, t)
            if index == 0:
                cv.imwrite(str(directory / (name + ".webp")), frame,
                           [cv.IMWRITE_WEBP_QUALITY, 86])
            if sheets and index in [0, 14, 25, 43, 60, 78, 96, 112, 123, 138, 165, 192]:
                preview_size = (112, 198) if mobile else (244, 138)
                preview = cv.resize(frame, preview_size, interpolation=cv.INTER_AREA)
                keyframes.append(preview)
            export.stdin.write(frame.tobytes())
    finally:
        export.stdin.close()
        code = export.wait()
    if code:
        raise RuntimeError(f"Encoder exited with {code}")
    if sheets:
        n = 6 if mobile else 4
        rows = [np.hstack(keyframes[i:i + n]) for i in range(0, len(keyframes), n)]
        cv.imwrite(str(sheets / (name + ".jpg")), np.vstack(rows))
    print(f"{directory / name}.mp4", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kalk", required=True, type=Path)
    parser.add_argument("--loeft", required=True, type=Path)
    parser.add_argument("--greb", required=True, type=Path)
    parser.add_argument("--bench", required=True, type=Path)
    parser.add_argument("--out", default=ROOT / "public/product/cover", type=Path)
    parser.add_argument("--format", choices=["landskab", "portraet", "both"], default="both")
    parser.add_argument("--scale", type=float, default=1.)
    parser.add_argument("--sheets", type=Path, help="Optional directory for contact prints")
    args = parser.parse_args()
    if args.sheets:
        args.sheets.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        chalk = decode_shot(args.kalk, 0, 3.6, Path(tmp) / "chalk")
        press = decode_shot(args.loeft, 9.41, 1.90, Path(tmp) / "press")
        grip = decode_shot(args.greb, 0, 1.9, Path(tmp) / "grip")
        formats = ["landskab", "portraet"] if args.format == "both" else [args.format]
        for kind in formats:
            render(kind, args.scale, chalk, press, grip, args.bench, args.out, args.sheets)


if __name__ == "__main__":
    main()
