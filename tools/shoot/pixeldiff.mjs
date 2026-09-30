#!/usr/bin/env node
// Pixel-compares two shoot.mjs output dirs PNG-by-PNG (same relative paths). See tools/shoot/README.md.
//
//   node tools/shoot/pixeldiff.mjs --a shots/trim-before --b shots/trim-after [--out shots/trim-diff]
//        [--tolerance 0] [--minor 0] [--only id,id] [--mask-bottom <cssPx>] [--no-volatile] [--noisy <file>] [--workers n]
//
// Masks (ignored pixels), per pair, union of both runs:
//   - volatile rects recorded by shoot.mjs in the page/state JSON (`volatile[]`: footer server-timing text
//     "Page: NNms Template: NNms", <relative-time> text to the end of its line). Clip shots translate them by
//     the state's `clipRect`. Disabled by --no-volatile.
//   - full-page shots whose JSON has no `volatile` (runs made before it existed): the bottom 100 CSS px
//     (covers the footer timing line at 1440 (60 px from the bottom) and 390 (83 px)). --mask-bottom N forces
//     a bottom mask of N CSS px on every full-page shot.
// Known-noisy pages (tools/shoot/pixeldiff-noisy.json, or --noisy): results are flagged `knownNoisy` and counted
// separately; they are still compared and still get a diff PNG.
// Output: <out>/pixeldiff.json {a, b, options, totals, results:[{path, diffPixels, bbox, ...}]} and
// <out>/diff/<path>.png ([A | B | B dimmed + red diff], cropped to the bbox) for each non-identical pair.
// Exit 0 = every non-noisy pair identical, 1 = differences, 2 = usage error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs, list, runId } from './lib/args.mjs';
import { PROJECT_ROOT } from './lib/gitea.mjs';

const args = parseArgs();
if (!args.a || !args.b || args.help) {
  console.error('usage: node tools/shoot/pixeldiff.mjs --a <runA> --b <runB> [--out dir] [--tolerance n] [--minor px] [--only ids] [--mask-bottom cssPx] [--no-volatile] [--noisy file] [--workers n]');
  process.exit(2);
}
const A = path.resolve(PROJECT_ROOT, args.a);
const B = path.resolve(PROJECT_ROOT, args.b);
const OUT = path.resolve(PROJECT_ROOT, args.out && args.out !== true ? args.out : `shots/${runId('pixeldiff')}`);
const tolerance = Number(args.tolerance || 0);
const only = list(args.only, null);
const forceBottom = args['mask-bottom'] !== undefined ? Number(args['mask-bottom']) : null;
const useVolatile = !args['no-volatile'];
const FALLBACK_BOTTOM = 100;
const workers = Number(args.workers) || 6;
const minor = Number(args.minor || 0); // pairs with 0 < diffPixels <= minor are counted as `differentMinor`, not `different`
const noisyFile = path.resolve(PROJECT_ROOT, args.noisy && args.noisy !== true ? args.noisy : 'tools/shoot/pixeldiff-noisy.json');
const noisy = fs.existsSync(noisyFile) ? JSON.parse(fs.readFileSync(noisyFile, 'utf8')).entries || [] : [];
const noisyFor = (p) => { const e = noisy.find((n) => new RegExp(n.pattern).test(p)); return e ? e.reason : null; };

function walk(dir, base = dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['diff', 'blind', 'coverage'].includes(e.name)) walk(p, base, acc); }
    else if (e.name.endsWith('.png') && !e.name.endsWith('-FAILED.png')) acc.push(path.relative(base, p));
  }
  return acc;
}

const jsonCache = new Map();
const readJson = (f) => {
  if (!jsonCache.has(f)) { let v = null; try { v = JSON.parse(fs.readFileSync(f, 'utf8')); } catch {} jsonCache.set(f, v); }
  return jsonCache.get(f);
};

// rel: "<route>/<scheme>-<vw>.png" | "<route>/states/<scheme>-<vw>-<name>.png" | "...-<name>-clip.png"
function classify(rel) {
  const parts = rel.split(path.sep);
  const route = parts[0];
  let m;
  if (parts.length === 2 && (m = parts[1].match(/^(light|dark)-(\d+)\.png$/))) return { route, kind: 'full', scheme: m[1], vw: +m[2] };
  if (parts.length === 3 && parts[1] === 'states' && (m = parts[2].match(/^(light|dark)-(\d+)-(.+?)(-clip)?\.png$/))) {
    return { route, kind: m[4] ? 'clip' : 'state', scheme: m[1], vw: +m[2], state: m[3] };
  }
  return { route, kind: 'other' };
}

// volatile rects (CSS px, in this PNG's coordinate space) from one run's JSON; null = no data recorded
function volatileFor(runDir, c) {
  if (c.kind === 'other') return null;
  const j = readJson(path.join(runDir, c.route, `${c.scheme}-${c.vw}.json`));
  if (!j) return null;
  if (c.kind === 'full') return Array.isArray(j.volatile) ? j.volatile : null;
  const st = (j.states || []).find((s) => s.name === c.state);
  if (!st || !Array.isArray(st.volatile)) return null;
  if (c.kind === 'state') return st.volatile;
  if (!st.clipRect) return null;
  const { x, y } = st.clipRect;
  return st.volatile.map((r) => ({ ...r, x: r.x - Math.floor(x), y: r.y - Math.floor(y) }));
}

const relsA = walk(A).filter((r) => !only || only.includes(r.split(path.sep)[0]));
const relsB = new Set(walk(B));
const jobs = [];
const results = [];
const missingInB = [], missingInA = [];
for (const rel of relsA) {
  if (!relsB.has(rel)) { missingInB.push(rel); continue; }
  relsB.delete(rel);
  const c = classify(rel);
  const dpr = c.vw === 390 ? 2 : 1;
  const masks = [];
  const maskKinds = new Set();
  if (useVolatile) {
    const va = volatileFor(A, c), vb = volatileFor(B, c);
    for (const r of [...(va || []), ...(vb || [])]) { masks.push([r.x * dpr, r.y * dpr, r.w * dpr, r.h * dpr]); maskKinds.add(r.kind); }
    if (c.kind === 'full' && (va === null || vb === null) && forceBottom === null) { masks.push(['BOTTOM', FALLBACK_BOTTOM * dpr]); maskKinds.add(`bottom-${FALLBACK_BOTTOM}px`); }
  }
  if (c.kind === 'full' && forceBottom !== null && forceBottom > 0) { masks.push(['BOTTOM', forceBottom * dpr]); maskKinds.add(`bottom-${forceBottom}px`); }
  jobs.push({ path: rel, a: path.join(A, rel), b: path.join(B, rel), masks, maskKinds: [...maskKinds], tolerance,
    diffPng: path.join(OUT, 'diff', rel) });
}
for (const rel of relsB) if (!only || only.includes(rel.split(path.sep)[0])) missingInA.push(rel);

// BOTTOM masks need the image height: resolve with a tiny PNG header read (IHDR) of both images
const pngSize = (f) => { const b = Buffer.alloc(24); const fd = fs.openSync(f, 'r'); fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
for (const j of jobs) {
  const bottoms = j.masks.filter((m) => m[0] === 'BOTTOM');
  if (!bottoms.length) continue;
  j.masks = j.masks.filter((m) => m[0] !== 'BOTTOM');
  const sa = pngSize(j.a), sb = pngSize(j.b);
  for (const [, px] of bottoms) for (const [w, h] of [sa, sb]) j.masks.push([0, h - px, w, px]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const j of jobs) fs.mkdirSync(path.dirname(j.diffPng), { recursive: true });
const py = spawnSync('python3', [path.join(path.dirname(new URL(import.meta.url).pathname), 'lib/pixeldiff.py')], {
  input: JSON.stringify({ jobs: jobs.map(({ maskKinds, ...j }) => j), workers }), maxBuffer: 1 << 28, encoding: 'utf8',
});
if (py.status !== 0) { console.error(py.stderr); process.exit(2); }
const pyRes = JSON.parse(py.stdout);
for (let i = 0; i < jobs.length; i++) {
  const r = pyRes[i], j = jobs[i];
  const kn = noisyFor(j.path);
  results.push({ path: j.path, diffPixels: r.diffPixels, bbox: r.bbox, ...(r.sizeA && (r.sizeA[0] !== r.sizeB[0] || r.sizeA[1] !== r.sizeB[1]) ? { sizeA: r.sizeA, sizeB: r.sizeB } : {}),
    maskedPixels: r.maskedPixels, masks: j.maskKinds.length ? j.maskKinds : undefined,
    diffPng: r.diffPng ? path.relative(OUT, r.diffPng) : undefined, diffPngCrop: r.diffPngCrop, knownNoisy: kn || undefined, error: r.error });
}
// clean diff dirs left empty (identical pairs)
const prune = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(d, e.name)); if (!fs.readdirSync(d).length) fs.rmdirSync(d); };
prune(path.join(OUT, 'diff'));

results.sort((x, y) => y.diffPixels - x.diffPixels || x.path.localeCompare(y.path));
const diff = results.filter((r) => r.diffPixels > 0 || r.error);
const totals = {
  pairs: results.length, identical: results.length - diff.length,
  different: diff.filter((r) => !r.knownNoisy && (r.error || r.diffPixels > minor)).length,
  differentMinor: diff.filter((r) => !r.knownNoisy && !r.error && r.diffPixels <= minor).length,
  differentKnownNoisy: diff.filter((r) => r.knownNoisy).length, sizeMismatch: results.filter((r) => r.sizeA).length,
  errors: results.filter((r) => r.error).length, missingInB: missingInB.length, missingInA: missingInA.length,
  maskedPairs: results.filter((r) => r.maskedPixels > 0).length,
};
const report = { a: path.relative(PROJECT_ROOT, A), b: path.relative(PROJECT_ROOT, B), generated: new Date().toISOString(),
  options: { tolerance, minor, volatileMasks: useVolatile, maskBottom: forceBottom, fallbackBottomCssPx: FALLBACK_BOTTOM, noisyFile: fs.existsSync(noisyFile) ? path.relative(PROJECT_ROOT, noisyFile) : null },
  totals, missingInB, missingInA, results };
fs.writeFileSync(path.join(OUT, 'pixeldiff.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ out: path.relative(PROJECT_ROOT, OUT), totals,
  top: diff.slice(0, 15).map((r) => `${r.path} ${r.diffPixels}px${r.knownNoisy ? ' (known-noisy)' : ''}${r.sizeA ? ` size ${r.sizeA}→${r.sizeB}` : ''}`) }, null, 1));
process.exit(totals.different || totals.errors || totals.missingInB || totals.missingInA ? 1 : 0);
