// Compare CLS / DCL / load per page between two shoot runs (e.g. github-auto vs the built-in gitea-auto baseline).
// usage: node tools/shoot/budget-compare.mjs --ours shots/integrate-w2 --base shots/baseline-gitea-auto-w2 [--json out.json]
import fs from 'node:fs';
import path from 'node:path';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ours = arg('ours'), base = arg('base');
const CLS_NOISE = Number(arg('cls-noise', 0.02)), DCL_NOISE_MS = Number(arg('dcl-noise', 150)), DCL_NOISE_REL = 0.25;
const load = (dir) => {
  const s = JSON.parse(fs.readFileSync(path.join(dir, 'summary.json'), 'utf8'));
  const m = new Map();
  for (const r of s.pages) {
    let j = {};
    try { j = JSON.parse(fs.readFileSync(path.join(dir, r.route, `${r.scheme}-${r.viewport}.json`), 'utf8')); } catch {}
    m.set(`${r.route}|${r.scheme}|${r.viewport}`, {cls: j.cls?.total ?? r.cls ?? 0, shifts: j.cls?.shifts || [], dcl: j.timing?.domContentLoaded, load: j.timing?.load, cssBytes: r.cssBytes, cssRes: j.timing?.cssResources});
  }
  return m;
};
const A = load(ours), B = load(base);
const rows = [];
for (const [k, a] of A) {
  const b = B.get(k); if (!b) continue;
  const clsReg = a.cls - b.cls > CLS_NOISE;
  const dclReg = a.dcl != null && b.dcl != null && a.dcl - b.dcl > Math.max(DCL_NOISE_MS, b.dcl * DCL_NOISE_REL);
  rows.push({page: k, ours: {cls: +a.cls.toFixed(4), dcl: a.dcl, load: a.load, cssRes: a.cssRes}, base: {cls: +b.cls.toFixed(4), dcl: b.dcl, load: b.load, cssRes: b.cssRes},
    clsDelta: +(a.cls - b.cls).toFixed(4), dclDelta: a.dcl - b.dcl, clsRegression: clsReg, dclRegression: dclReg,
    shiftSources: clsReg ? a.shifts.slice(0, 3).map((s) => ({value: s.value, sources: (s.sources || []).slice(0, 3)})) : undefined});
}
const med = (xs) => { const s = xs.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const out = {
  ours, base, pages: rows.length, noise: {cls: CLS_NOISE, dclMs: DCL_NOISE_MS, dclRel: DCL_NOISE_REL},
  median: {oursDcl: med(rows.map((r) => r.ours.dcl)), baseDcl: med(rows.map((r) => r.base.dcl)), oursLoad: med(rows.map((r) => r.ours.load)), baseLoad: med(rows.map((r) => r.base.load))},
  maxCls: {ours: Math.max(...rows.map((r) => r.ours.cls)), base: Math.max(...rows.map((r) => r.base.cls))},
  sumCls: {ours: +rows.reduce((t, r) => t + r.ours.cls, 0).toFixed(3), base: +rows.reduce((t, r) => t + r.base.cls, 0).toFixed(3)},
  clsRegressions: rows.filter((r) => r.clsRegression).sort((x, y) => y.clsDelta - x.clsDelta),
  clsImprovements: rows.filter((r) => r.clsDelta < -CLS_NOISE).length,
  dclRegressions: rows.filter((r) => r.dclRegression).sort((x, y) => y.dclDelta - x.dclDelta),
};
const j = arg('json'); if (j) fs.writeFileSync(j, JSON.stringify(out, null, 1));
console.log(JSON.stringify({...out, clsRegressions: out.clsRegressions.map((r) => `${r.page} ${r.base.cls}→${r.ours.cls}`), dclRegressions: out.dclRegressions.map((r) => `${r.page} ${r.base.dcl}→${r.ours.dcl}ms`)}, null, 1));
