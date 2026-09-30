#!/usr/bin/env python3
"""PNG pair comparer used by tools/shoot/pixeldiff.mjs (Pillow only).

stdin: JSON {"jobs": [{"path", "a", "b", "masks": [[x, y, w, h], ...] (image px), "tolerance", "diffPng"}], "workers": n}
stdout: JSON list of {"path", "diffPixels", "bbox", "sizeA", "sizeB", "maskedPixels", "diffPng"|None, "error"?}

A pixel differs when any RGBA channel differs by more than `tolerance` (0 = exact). Masked rects are ignored.
Size mismatch: the non-overlapping area counts as different. For every non-identical pair a diff image is
written: [A crop | B crop | B dimmed with differing pixels in red], cropped to the diff bbox (+40 px, max 4000 px tall).
"""
import json
import sys
from concurrent.futures import ProcessPoolExecutor

from PIL import Image, ImageChops, ImageDraw

PAD = 40
MAX_H = 4000


def compare(job):
    try:
        return _compare(job)
    except Exception as e:  # noqa: BLE001
        return {"path": job["path"], "diffPixels": 0, "bbox": None, "maskedPixels": 0, "diffPng": None, "error": f"{type(e).__name__}: {e}"}


def _compare(job):
    out = {"path": job["path"], "diffPixels": 0, "bbox": None, "maskedPixels": 0, "diffPng": None}
    try:
        a = Image.open(job["a"]).convert("RGBA")
        b = Image.open(job["b"]).convert("RGBA")
    except Exception as e:  # noqa: BLE001
        out["error"] = f"open failed: {e}"
        return out
    out["sizeA"], out["sizeB"] = list(a.size), list(b.size)
    W, H = max(a.width, b.width), max(a.height, b.height)
    # pad both to the union size with a colour no screenshot contains (fully transparent magenta)
    def pad(im):
        if im.size == (W, H):
            return im
        c = Image.new("RGBA", (W, H), (255, 0, 255, 0))
        c.paste(im, (0, 0))
        return c
    pa, pb = pad(a), pad(b)
    tol = int(job.get("tolerance", 0))
    d = ImageChops.difference(pa, pb)
    chans = d.split()
    m = chans[0]
    for c in chans[1:]:
        m = ImageChops.lighter(m, c)
    m = m.point(lambda v: 255 if v > tol else 0)
    # outside the overlap of two different-size images always counts as different
    if a.size != b.size:
        dr = ImageDraw.Draw(m)
        ow, oh = min(a.width, b.width), min(a.height, b.height)
        if ow < W:
            dr.rectangle([ow, 0, W - 1, H - 1], fill=255)
        if oh < H:
            dr.rectangle([0, oh, W - 1, H - 1], fill=255)
    masks = job.get("masks") or []
    if masks:
        before = m.histogram()[255]
        dr = ImageDraw.Draw(m)
        for x, y, w, h in masks:
            x0, y0, x1, y1 = max(0, x), max(0, y), min(W - 1, x + w - 1), min(H - 1, y + h - 1)
            if x1 >= x0 and y1 >= y0:
                dr.rectangle([x0, y0, x1, y1], fill=0)
        out["maskedPixels"] = before - m.histogram()[255]
    n = m.histogram()[255]
    out["diffPixels"] = n
    if n == 0:
        return out
    bbox = m.getbbox()
    out["bbox"] = {"x": bbox[0], "y": bbox[1], "w": bbox[2] - bbox[0], "h": bbox[3] - bbox[1]}
    if job.get("diffPng"):
        x0, y0 = max(0, bbox[0] - PAD), max(0, bbox[1] - PAD)
        x1, y1 = min(W, bbox[2] + PAD), min(H, bbox[3] + PAD)
        if y1 - y0 > MAX_H:
            y1 = y0 + MAX_H
        box = (x0, y0, x1, y1)
        ca, cb, cm = pa.crop(box), pb.crop(box), m.crop(box)
        hl = Image.blend(cb.convert("L").convert("RGBA"), Image.new("RGBA", cb.size, (255, 255, 255, 255)), 0.6)
        hl.paste(Image.new("RGBA", cb.size, (255, 0, 0, 255)), (0, 0), cm)
        gap = 8
        canvas = Image.new("RGBA", (ca.width * 3 + gap * 2, ca.height), (128, 128, 128, 255))
        canvas.paste(ca, (0, 0))
        canvas.paste(cb, (ca.width + gap, 0))
        canvas.paste(hl, (2 * (ca.width + gap), 0))
        canvas.convert("RGB").save(job["diffPng"], optimize=False)
        out["diffPng"] = job["diffPng"]
        out["diffPngCrop"] = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}
    return out


def main():
    req = json.load(sys.stdin)
    jobs = req["jobs"]
    workers = max(1, int(req.get("workers", 4)))
    if workers == 1 or len(jobs) < 4:
        res = [compare(j) for j in jobs]
    else:
        with ProcessPoolExecutor(max_workers=workers) as ex:
            res = list(ex.map(compare, jobs, chunksize=2))
    json.dump(res, sys.stdout)


if __name__ == "__main__":
    main()
