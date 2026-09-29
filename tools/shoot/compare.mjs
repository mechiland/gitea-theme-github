#!/usr/bin/env node
// Contact sheet (ours vs github.com) and blind A/B pair generator.
//
//   node tools/shoot/compare.mjs --run shots/<run> [--ref docs/reference]
//        -> shots/<run>/compare.html
//   node tools/shoot/compare.mjs --run shots/<run> --blind [--seed <any>]
//        -> shots/<run>/blind/index.html + blind/pair-NNN-{A,B}.png   (give judges only blind/)
//        -> shots/<run>/blind-key.json                                 (secret: which side is ours)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs } from './lib/args.mjs';
import { PROJECT_ROOT } from './lib/gitea.mjs';

const args = parseArgs();
if (!args.run || args.run === true) { console.error('usage: compare.mjs --run shots/<run> [--ref docs/reference] [--blind]'); process.exit(2); }
const runDir = path.resolve(PROJECT_ROOT, args.run);
const refDir = path.resolve(PROJECT_ROOT, args.ref && args.ref !== true ? args.ref : 'docs/reference');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

// collect pages: <run>/<route>/<scheme>-<vw>.png
const pages = [];
for (const route of fs.readdirSync(runDir).sort()) {
  const d = path.join(runDir, route);
  if (!fs.statSync(d).isDirectory() || route === 'blind') continue;
  for (const f of fs.readdirSync(d).sort()) {
    const m = f.match(/^(light|dark)-(\d+)\.png$/);
    if (!m) continue;
    const ref = path.join(refDir, route, f);
    pages.push({ route, scheme: m[1], vw: +m[2], ours: path.join(d, f), ref: fs.existsSync(ref) ? ref : null,
      oursLog: readJson(path.join(d, `${m[1]}-${m[2]}.json`)), refLog: readJson(path.join(refDir, route, `${m[1]}-${m[2]}.json`)),
      oursMeasure: readJson(path.join(d, `${m[1]}-${m[2]}.measure.json`)), refMeasure: readJson(path.join(refDir, route, `${m[1]}-${m[2]}.measure.json`)) });
  }
}
if (!pages.length) { console.error(`no screenshots in ${runDir}`); process.exit(1); }

const CSS = `
:root{--bg:#fff;--fg:#1f2328;--muted:#59636e;--border:#d1d9e0;--bad:#d1242f;--ok:#1a7f37;--card:#f6f8fa}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#f0f6fc;--muted:#9198a1;--border:#3d444d;--bad:#f85149;--ok:#3fb950;--card:#151b23}}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,"Segoe UI",sans-serif}
h1{font-size:20px} h2{font-size:16px;margin:32px 0 8px;border-bottom:1px solid var(--border);padding-bottom:4px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
.pair.narrow{grid-template-columns:repeat(2,minmax(0,420px))}
.col{min-width:0} .col h3{font-size:13px;margin:0 0 4px;color:var(--muted)}
.col img{width:100%;border:1px solid var(--border);display:block}
.missing{padding:40px;border:1px dashed var(--border);color:var(--muted);text-align:center}
.badges{font-size:12px;color:var(--muted);margin:4px 0} .bad{color:var(--bad);font-weight:600} .good{color:var(--ok)}
details{margin:6px 0} table{border-collapse:collapse;font-size:12px} td,th{border:1px solid var(--border);padding:2px 6px;text-align:left;vertical-align:top}
.diff{color:var(--bad)} nav a{margin-right:10px} code{font-size:12px}
.toc{columns:3;font-size:12px}`;

function badges(log) {
  if (!log) return '<div class="badges">no log</div>';
  const n = (v, bad) => `<span class="${v > 0 && bad ? 'bad' : 'good'}">${v}</span>`;
  const live = log.cssVars ? log.cssVars.unresolved.filter((v) => v.matchedElements > 0).length : '-';
  return `<div class="badges">status ${esc(log.mainStatus)} · off-palette ${n(log.colors ? log.colors.offPaletteDistinct : 0, true)} colors / ${log.colors ? log.colors.offPaletteTotal : '-'} uses
    · unresolved vars ${n(live, true)} live / ${log.cssVars ? log.cssVars.unresolved.length : '-'} · non-octicon ${n(log.icons ? log.icons.nonOcticon.length : 0, true)}
    · console errors ${n(log.consoleErrors.length, true)} · failed req ${n(log.failedRequests.length, true)} · CLS ${log.cls ? log.cls.total : '-'} · css ${Math.round((log.cssBytes || 0) / 1024)}KB
    ${log.problems && log.problems.length ? `<div class="bad">${log.problems.map(esc).join('<br>')}</div>` : ''}</div>`;
}

const KEY_PROPS = ['box.h', 'padding-top', 'padding-left', 'border-top-left-radius', 'border-top-width', 'border-top-color', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'box-shadow'];
function measureTable(a, b) {
  if (!a || !b) return '';
  const rows = [];
  for (const name of Object.keys(a.measures)) {
    const x = a.measures[name].samples[0]; const y = b.measures[name] && b.measures[name].samples[0];
    if (!x || !y) continue;
    const get = (o, k) => (k === 'box.h' ? o.box.h + 'px' : o[k]);
    const cells = KEY_PROPS.map((k) => { const u = get(x, k), v = get(y, k); return u === v ? `<td>${esc(u)}</td>` : `<td class="diff">${esc(u)}<br>↔ ${esc(v)}</td>`; });
    rows.push(`<tr><th>${esc(name)}</th>${cells.join('')}</tr>`);
  }
  if (!rows.length) return '';
  return `<details><summary>Measured metrics (ours ↔ github; red = differs)</summary><table><tr><th>control</th>${KEY_PROPS.map((k) => `<th>${k}</th>`).join('')}</tr>${rows.join('')}</table></details>`;
}

function offPaletteList(log) {
  if (!log || !log.colors || !log.colors.offPalette.length) return '';
  const li = log.colors.offPalette.slice(0, 15).map((e) => `<tr><td><span style="display:inline-block;width:12px;height:12px;border:1px solid var(--border);background:${e.color}"></span> <code>${e.color}</code></td><td>${e.count}</td><td>${esc(Object.entries(e.props).map(([k, v]) => `${k}:${v}`).join(' '))}</td><td><code>${esc(e.samples[0] || '')}</code></td></tr>`);
  return `<details><summary>Off-palette colors (ours)</summary><table>${li.join('')}</table></details>`;
}

const rel = (f) => path.relative(runDir, f).split(path.sep).join('/');

if (!args.blind) {
  const sections = pages.map((p, i) => `
<h2 id="p${i}">${esc(p.route)} — ${p.scheme} — ${p.vw}px</h2>
<div class="pair ${p.vw < 800 ? 'narrow' : ''}">
  <div class="col"><h3>ours (${esc(p.oursLog && p.oursLog.theme)}) · <a href="${esc(rel(p.ours))}">png</a></h3>${badges(p.oursLog)}<a href="${esc(rel(p.ours))}"><img loading="lazy" src="${esc(rel(p.ours))}"></a></div>
  <div class="col"><h3>github.com${p.refLog ? ' · ' + esc(p.refLog.url) : ''}</h3>${p.ref ? badges(p.refLog) + `<a href="${esc(rel(p.ref))}"><img loading="lazy" src="${esc(rel(p.ref))}"></a>` : '<div class="missing">no reference screenshot</div>'}</div>
</div>
${measureTable(p.oursMeasure, p.refMeasure)}${offPaletteList(p.oursLog)}`);
  const summary = readJson(path.join(runDir, 'summary.json'));
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Compare ${esc(path.basename(runDir))}</title><style>${CSS}</style>
<h1>Ours vs github.com — ${esc(path.basename(runDir))}</h1>
<p class="badges">${summary ? `theme <b>${esc(summary.theme)}</b> · ${esc(summary.generated)} · pages ${summary.totals.pages} · with problems ${summary.totals.pagesWithProblems} · console errors ${summary.totals.consoleErrors} · failed requests ${summary.totals.failedRequests}` : ''}</p>
<div class="toc">${pages.map((p, i) => `<div><a href="#p${i}">${esc(p.route)} ${p.scheme} ${p.vw}</a>${p.ref ? '' : ' (no ref)'}</div>`).join('')}</div>
${sections.join('\n')}`;
  const out = path.join(runDir, 'compare.html');
  fs.writeFileSync(out, html);
  console.log(JSON.stringify({ compare: path.relative(PROJECT_ROOT, out), pages: pages.length, withReference: pages.filter((p) => p.ref).length }));
} else {
  const blindDir = path.join(runDir, 'blind');
  fs.rmSync(blindDir, { recursive: true, force: true });
  fs.mkdirSync(blindDir, { recursive: true });
  const pairs = pages.filter((p) => p.ref);
  // shuffle pair order too, so position in the list does not leak the route order
  const rnd = (n) => crypto.randomInt(n);
  for (let i = pairs.length - 1; i > 0; i--) { const j = rnd(i + 1); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
  const key = { run: path.basename(runDir), generated: new Date().toISOString(), pairs: {} };
  const items = pairs.map((p, i) => {
    const id = `pair-${String(i + 1).padStart(3, '0')}`;
    const oursIsA = rnd(2) === 0;
    fs.copyFileSync(oursIsA ? p.ours : p.ref, path.join(blindDir, `${id}-A.png`));
    fs.copyFileSync(oursIsA ? p.ref : p.ours, path.join(blindDir, `${id}-B.png`));
    key.pairs[id] = { A: oursIsA ? 'ours' : 'github', B: oursIsA ? 'github' : 'ours', route: p.route, scheme: p.scheme, viewport: p.vw };
    return `<h2 id="${id}">${id} — ${esc(p.route)} (${p.scheme}, ${p.vw}px)</h2><div class="pair ${p.vw < 800 ? 'narrow' : ''}"><div class="col"><h3>A</h3><a href="${id}-A.png"><img loading="lazy" src="${id}-A.png"></a></div><div class="col"><h3>B</h3><a href="${id}-B.png"><img loading="lazy" src="${id}-B.png"></a></div></div>`;
  });
  fs.writeFileSync(path.join(blindDir, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Blind pairs</title><style>${CSS}</style>
<h1>Blind comparison — ${pairs.length} pairs</h1><p>For each pair, one side is github.com and one is a Gitea theme. Score similarity and note differences per pair; record which side you believe is github.com.</p>${items.join('\n')}`);
  fs.writeFileSync(path.join(runDir, 'blind-key.json'), JSON.stringify(key, null, 1));
  console.log(JSON.stringify({ blind: path.relative(PROJECT_ROOT, path.join(blindDir, 'index.html')), key: path.relative(PROJECT_ROOT, path.join(runDir, 'blind-key.json')), pairs: pairs.length, skippedNoReference: pages.length - pairs.length }));
}
