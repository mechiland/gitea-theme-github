#!/usr/bin/env python3
"""Blind A/B pairs for the final gate: ours (shots/<run>) vs github.com (docs/reference), same route/scheme, 1440 wide.
Variants: 'page' = top of the page incl. global header; 'content' = global header cropped off both (ours is logged-in,
the reference is logged-out github.com, whose marketing header is a give-away unrelated to the theme).
Browser chrome/URL are not in the screenshots. Side-by-side image, A left / B right, random per pair (seeded).
The answer key is written OUTSIDE the project (argv[3]); judges never get its path."""
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFont
root = '/Users/michael/work/gitea/gitea-theme-github'
run, out, keypath = sys.argv[1], sys.argv[2], sys.argv[3]
seed = int(sys.argv[4]) if len(sys.argv) > 4 else 1729
rng = random.Random(seed)
routes = json.load(open(f'{root}/tools/shoot/routes.json'))
routes = routes['routes'] if isinstance(routes, dict) else routes
os.makedirs(out, exist_ok=True)
W, H = 1440, 1300
key, pairs = {}, []
def header_h(meas, default):
    try:
        m = json.load(open(meas))['measures']['header']['samples'][0]['box']['h']
        return int(round(m)) if m else default
    except Exception:
        return default
n = 0
for r in routes:
    if not r.get('github'):
        continue
    for scheme in ('light', 'dark'):
        ours = f'{root}/{run}/{r["id"]}/{scheme}-1440.png'
        ref = f'{root}/docs/reference/{r["id"]}/{scheme}-1440.png'
        if not (os.path.exists(ours) and os.path.exists(ref)):
            continue
        try:  # skip references github.com refused (e.g. signup 403 bot wall) or that errored
            rj = json.load(open(ref[:-4] + '.json'))
            if rj.get('problems') and r.get('expectStatus') != 404:
                continue
        except Exception:
            pass
        gh_h = header_h(f'{root}/docs/reference/{r["id"]}/{scheme}-1440.measure.json', 72)
        for variant in ('page', 'content'):
            imgs = {}
            for who, p, hh in (('ours', ours, 64), ('github', ref, gh_h)):
                im = Image.open(p).convert('RGB')
                top = hh if variant == 'content' else 0
                im = im.crop((0, top, W, min(im.height, top + H)))
                canvas = Image.new('RGB', (W, H), (128, 128, 128))
                canvas.paste(im, (0, 0))
                imgs[who] = canvas.resize((W * 2 // 3, H * 2 // 3))
            a_is_ours = rng.random() < 0.5
            A, B = (imgs['ours'], imgs['github']) if a_is_ours else (imgs['github'], imgs['ours'])
            w, h = A.size
            sheet = Image.new('RGB', (w * 2 + 24, h + 40), (90, 90, 90))
            sheet.paste(A, (0, 40)); sheet.paste(B, (w + 24, 40))
            d = ImageDraw.Draw(sheet)
            try: f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
            except Exception: f = None
            d.text((w // 2 - 10, 4), 'A', fill=(255, 255, 0), font=f); d.text((w + 24 + w // 2 - 10, 4), 'B', fill=(255, 255, 0), font=f)
            n += 1
            pid = f'p{n:03d}'
            sheet.save(f'{out}/{pid}.png', optimize=True)
            key[pid] = {'route': r['id'], 'scheme': scheme, 'variant': variant, 'github': 'B' if a_is_ours else 'A'}
            pairs.append(pid)
rng.shuffle(pairs)
json.dump(pairs, open(f'{out}/pairs.json', 'w'))
json.dump(key, open(keypath, 'w'), indent=1)
print(len(pairs), 'pairs')
