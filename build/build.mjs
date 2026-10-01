// Builds dist/theme-github-{light,dark,auto}.css from src/ and (with --deploy) syncs them into Gitea's CUSTOM_PATH.
//
//   node build/build.mjs [--deploy] [--exclude a,b] [--no-lint] [--no-prune] [--no-rename] [--no-nest]
//
// Per folder: postcss-import resolves the folder's index.css; *.important.css files go to @layer gh-important.
// A folder that fails to parse/compile or lint is EXCLUDED (reported in dist/build-report.json) — the rest
// of the theme is still produced (failure isolation). A folder can also be disabled with src/<folder>/.disabled.
// Primer tokens not transitively referenced by the mapping or any folder are pruned to respect the size budget.
// Custom properties the theme itself defines (Primer tokens, --gh-octicon-* masks) get short names in the minified
// files only (request PPL-1 addendum); dist/theme-*.src.css keeps the real names and dist/varmap.json maps them.
// Last size step (loop 1, build/nest.mjs): shared selector prefixes of consecutive rules are factored into CSS nesting in
// the minified files only, checked by lowering both texts and comparing every selector member (falls back to flat output).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import {transform} from 'lightningcss';
import {FOLDERS, THEMES, SRC, DIST, ROOT, CUSTOM_PATH, GITEA_URL, GITEA_CONTAINER, BUDGET_BYTES, layerName} from './folders.mjs';
import {lintAll} from './lint.mjs';
import {nest, verifyNest} from './nest.mjs';
import {pageScopeCheck} from './page-scope-check.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const excluded = new Set((opt('exclude') || '').split(',').filter(Boolean));
const report = {startedAt: new Date().toISOString(), folders: {}, themes: {}, deploy: null};
const read = (p) => fs.readFileSync(p, 'utf8');
// Browsers with CSS nesting (`&`): Chrome/Edge 112+, Safari 16.5+, Firefox 117+ (build/nest.mjs output needs it).
const TARGETS = {chrome: 120 << 16, firefox: 117 << 16, safari: (16 << 16) | (5 << 8)};
const NEST = !flag('no-nest');

function validate(css, filename) {
  // throws on syntax errors; returns nothing. Keeps modern syntax (targets are recent evergreen browsers).
  transform({filename, code: Buffer.from(css), minify: false, targets: TARGETS, errorRecovery: false});
}

async function compileFolder(folder) {
  const dir = path.join(SRC, folder);
  if (!fs.existsSync(path.join(dir, 'index.css'))) return {css: '', important: '', files: 0};
  const res = await postcss([postcssImport({root: dir})]).process(read(path.join(dir, 'index.css')), {from: path.join(dir, 'index.css')});
  const importantFiles = fs.readdirSync(dir, {recursive: true}).filter((f) => f.endsWith('.important.css')).sort();
  let important = '';
  for (const f of importantFiles) important += `/* ${folder}/${f} */\n${read(path.join(dir, f))}\n`;
  validate(res.css, `${folder}/index.css`);
  if (important) validate(important, `${folder}/*.important.css`);
  return {css: res.css, important, files: res.messages.filter((m) => m.type === 'dependency').length + 1 + importantFiles.length};
}

// ---- 1. lint + compile folders -------------------------------------------------------------------------
const lint = flag('no-lint') ? [] : await lintAll(FOLDERS);
// FG2-105: page-folder scopes vs Gitea templates (+ cached live page classes); warning, error under --strict
const scopeCheck = flag('no-lint') ? null : await pageScopeCheck().catch((e) => ({error: e.message, totals: {leaks: 0}}));
if (scopeCheck) report.pageScope = scopeCheck.error ? {error: scopeCheck.error} : {...scopeCheck.totals, report: 'docs/page-scope-report.md'};
const compiled = {};
for (const folder of FOLDERS) {
  const entry = report.folders[folder] = {status: 'ok'};
  if (excluded.has(folder) || fs.existsSync(path.join(SRC, folder, '.disabled'))) { entry.status = 'excluded (disabled)'; continue; }
  const l = lint.find((r) => r.folder === folder);
  if (l) { entry.lintErrors = l.errors.length; entry.lintWarnings = l.warnings.length; }
  if (l?.errors.length) { entry.status = 'excluded (lint errors)'; entry.errors = l.errors.slice(0, 30); continue; }
  try {
    compiled[folder] = await compileFolder(folder);
    entry.files = compiled[folder].files;
    entry.bytes = compiled[folder].css.length + compiled[folder].important.length;
  } catch (e) {
    entry.status = 'excluded (compile error)';
    entry.errors = [String(e.message || e) + (e.loc ? ` @${e.fileName}:${e.loc.line}` : '')];
  }
}

// ---- 2. tokens -----------------------------------------------------------------------------------------
const tok = (f) => read(path.join(SRC, 'tokens', f));
const colorTokens = {light: tok('generated/primer-color-light.css'), dark: tok('generated/primer-color-dark.css')};
const scaleTokens = tok('generated/primer-scale.css');
const giteaMap = tok('gitea-map.css');
const schemeCss = {light: tok('scheme-light.css'), dark: tok('scheme-dark.css')};
// Octicon mask images (src/icons/octicon-masks.css, generated by the icons folder): `--gh-octicon-<name>` custom
// properties used by folders to draw Octicons over JS/Vue-bundled or material icons (CSS mask). Scheme-independent,
// emitted once inside gh.tokens; only the masks some folder references are kept (unless --no-prune).
const masksFile = path.join(SRC, 'icons/octicon-masks.css');
const masksCss = fs.existsSync(masksFile) ? read(masksFile) : '';

function prune(allComponentCss) {
  const defs = new Map(); // name -> value (union of both schemes + scale)
  for (const css of [colorTokens.light, colorTokens.dark, scaleTokens]) {
    for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]*);/g)) defs.set(m[1], `${defs.get(m[1]) || ''} ${m[2]}`);
  }
  const used = new Set();
  const queue = [...(giteaMap + schemeCss.light + schemeCss.dark + allComponentCss).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
  while (queue.length) {
    const n = queue.pop();
    if (used.has(n)) continue;
    used.add(n);
    for (const m of (defs.get(n) || '').matchAll(/var\(\s*(--[\w-]+)/g)) queue.push(m[1]);
  }
  const keep = (css) => css.split('\n').filter((line) => {
    const m = line.match(/^\s*(--[\w-]+)\s*:/);
    return !m || used.has(m[1]);
  }).join('\n');
  return {light: keep(colorTokens.light), dark: keep(colorTokens.dark), scale: keep(scaleTokens), used: used.size, total: defs.size};
}

// ---- 3. assemble per theme -----------------------------------------------------------------------------
const layerOrder = `@layer gh-important, gitea, gh;\n@layer ${['tokens', ...FOLDERS].map((f) => layerName(f).replace(/^gh\./, 'gh.')).join(', ')};\n`;
const wrap = (layer, css) => (css.trim() ? `@layer ${layer} {\n${css}\n}\n` : '');

function componentCss(scheme) {
  let out = '';
  let imp = '';
  for (const folder of FOLDERS) {
    const c = compiled[folder];
    if (!c) continue;
    if (folder === 'dark') {
      if (scheme === 'light') continue;
      const body = scheme === 'auto' ? `@media (prefers-color-scheme: dark) {\n${c.css}\n}` : c.css;
      out += wrap(layerName(folder), body);
      if (c.important) imp += scheme === 'auto' ? `@media (prefers-color-scheme: dark) {\n${c.important}\n}\n` : c.important;
      continue;
    }
    out += wrap(layerName(folder), c.css);
    imp += c.important;
  }
  return {out, imp};
}

const allComponent = Object.values(compiled).map((c) => c.css + c.important).join('\n');
const tokens = flag('no-prune') ? {light: colorTokens.light, dark: colorTokens.dark, scale: scaleTokens, used: 'all', total: 'all'} : prune(allComponent);
report.tokens = {used: tokens.used, total: tokens.total};
const usedMasks = new Set([...allComponent.matchAll(/var\(\s*(--gh-octicon-[\w-]+)/g)].map((m) => m[1]));
const masks = flag('no-prune') ? masksCss : masksCss.split('\n').filter((line) => {
  const m = line.match(/^\s*(--gh-octicon-[\w-]+)\s*:/);
  return !m || usedMasks.has(m[1]);
}).join('\n');
report.octiconMasks = {used: [...usedMasks].sort(), defined: (masksCss.match(/^\s*--gh-octicon-[\w-]+\s*:/gm) || []).length};
for (const n of usedMasks) if (!masksCss.includes(`${n}:`)) console.warn(`! ${n} is referenced but not defined in src/icons/octicon-masks.css`);

// ---- 2b. short custom-property names (minified output only) --------------------------------------------
// Only names defined by the Primer token files and the octicon masks are renamed. Gitea's own names (--color-*,
// --fonts-*, --is-dark-theme, … = gitea-map.css / scheme-*.css / folder-local names) are never touched, and any
// Primer name that Gitea's source (web_src, templates) or our templates mention is kept verbatim.
const RENAME = !flag('no-rename');
const shortNames = new Map();
if (RENAME) {
  const ours = new Set([...(colorTokens.light + colorTokens.dark + scaleTokens + masksCss).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const keepVerbatim = new Set();
  const foreign = new Set(); // every custom-property name Gitea's source or our templates mention: never generated
  const scan = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir, {recursive: true})) {
      if (!/\.(tmpl|ts|js|vue|css|go)$/.test(f)) continue;
      for (const m of read(path.join(dir, f)).matchAll(/--[\w-]+/g)) {
        foreign.add(m[0]);
        if (ours.has(m[0])) keepVerbatim.add(m[0]);
      }
    }
  };
  const GITEA_SRC = process.env.GITEA_SRC || path.resolve(ROOT, '../gitea-src-1.27.3');
  for (const d of [path.join(GITEA_SRC, 'web_src'), path.join(GITEA_SRC, 'templates'), path.join(ROOT, 'templates')]) scan(d);
  for (const n of keepVerbatim) ours.delete(n);
  report.renamedKeptVerbatim = [...keepVerbatim].sort();
  // Loop 2 (integrator L2b, budget): identical-token dedupe. Primer tokens whose definitions are identical in every
  // scheme (e.g. several 8px size tokens, the two identical system font stacks, aliases of the same functional token)
  // are served under ONE short name: references to the others are renamed to it and their definitions dropped.
  // Lossless: every such token is defined only on :root, so `var()` inside it resolves there, never per element; tokens
  // that any folder re-declares (subtree re-theming) and names Gitea mentions (keepVerbatim) are never merged. --no-dedupe.
  const alias = new Map(); // dropped name → kept name
  if (!flag('no-dedupe')) {
    const declaredByFolders = new Set([...(allComponent + giteaMap).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const canon = (n) => { while (alias.has(n)) n = alias.get(n); return n; };
    const defs = (css) => new Map([...css.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]*);/gm)].map((m) => [m[1], m[2].trim()]));
    const refCount = new Map();
    for (const m of [giteaMap, schemeCss.light, schemeCss.dark, tokens.scale, tokens.light, tokens.dark, allComponent].join('\n').matchAll(/var\(\s*(--[\w-]+)/g)) refCount.set(m[1], (refCount.get(m[1]) || 0) + 1);
    for (let pass = 0; pass < 4; pass++) {
      const L = defs(tokens.light), D = defs(tokens.dark), S = defs(tokens.scale);
      const norm = (v) => (v == null ? '∅' : v.replace(/var\(\s*(--[\w-]+)/g, (m, n) => `var(${canon(n)}`));
      const groups = new Map();
      for (const n of new Set([...L.keys(), ...D.keys(), ...S.keys()])) {
        if (!ours.has(n) || declaredByFolders.has(n) || alias.has(n)) continue;
        const k = `${norm(L.get(n))}|${norm(D.get(n))}|${norm(S.get(n))}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(n);
      }
      let merged = 0;
      for (const g of groups.values()) {
        if (g.length < 2) continue;
        g.sort((a, b) => (refCount.get(b) || 0) - (refCount.get(a) || 0) || a.localeCompare(b));
        for (const n of g.slice(1)) { alias.set(n, g[0]); merged++; }
      }
      if (!merged) break;
      const drop = (css) => css.split('\n').filter((line) => { const m = line.match(/^\s*(--[\w-]+)\s*:/); return !m || !alias.has(m[1]); }).join('\n');
      tokens.light = drop(tokens.light); tokens.dark = drop(tokens.dark); tokens.scale = drop(tokens.scale);
    }
    report.dedupedTokens = alias.size;
  }
  const everything = [giteaMap, schemeCss.light, schemeCss.dark, masksCss, tokens.scale, tokens.light, tokens.dark, allComponent].join('\n');
  const freq = new Map();
  for (const m of everything.matchAll(/--[\w-]+/g)) { const n = alias.get(m[0]) ? (() => { let x = m[0]; while (alias.has(x)) x = alias.get(x); return x; })() : m[0]; if (ours.has(n)) freq.set(n, (freq.get(n) || 0) + 1); }
  const taken = new Set([...everything.match(/--[\w-]+/g), ...foreign]);
  // Loop 2 (integrator L2b, budget): names are `--<base62>` without the former `p` prefix (−1 byte on each of ~6,800
  // references). A generated name is never one that our CSS, Gitea's web_src / templates or our templates use.
  const A = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const gen = (i) => { let s = ''; do { s += A[i % 62]; i = Math.floor(i / 62) - 1; } while (i >= 0); return `--${s}`; };
  let i = 0;
  for (const [n] of [...freq].sort((a, b) => b[1] - a[1])) {
    let s; do { s = gen(i++); } while (taken.has(s));
    shortNames.set(n, s);
  }
  for (const [n] of alias) { let c = n; while (alias.has(c)) c = alias.get(c); if (shortNames.has(c)) shortNames.set(n, shortNames.get(c)); }
}
const rename = (css) => (RENAME ? css.replace(/--[\w-]+/g, (n) => shortNames.get(n) || n) : css);
report.renamedCustomProperties = shortNames.size;

fs.mkdirSync(DIST, {recursive: true});
if (RENAME) {
  const vm = {};
  for (const [a, b] of shortNames) if (!vm[b] || b === undefined) vm[b] = a; else vm[b] = `${vm[b]} = ${a}`; // deduped tokens share a short name
  fs.writeFileSync(path.join(DIST, 'varmap.json'), JSON.stringify(vm, null, 1));
}
const version = JSON.parse(read(path.join(ROOT, 'package.json'))).version;
const primerVersion = read(path.join(SRC, 'tokens/generated/VERSION')).trim();
for (const [name, meta] of Object.entries(THEMES)) {
  const {scheme} = meta;
  let tokenCss;
  if (scheme === 'auto') {
    tokenCss = `${tokens.scale}\n@media (prefers-color-scheme: light) {\n${tokens.light}\n${schemeCss.light}\n}\n@media (prefers-color-scheme: dark) {\n${tokens.dark}\n${schemeCss.dark}\n}\n${giteaMap}\n${masks}`;
  } else {
    tokenCss = `${tokens.scale}\n${tokens[scheme]}\n${schemeCss[scheme]}\n${giteaMap}\n${masks}`;
  }
  const {out, imp} = componentCss(scheme);
  const source = `${layerOrder}${wrap('gh.tokens', tokenCss)}${out}${wrap('gh-important', imp)}`;
  let min;
  try {
    min = transform({filename: `${name}.css`, code: Buffer.from(rename(source)), minify: true, targets: TARGETS}).code.toString();
  } catch (e) {
    console.error(`✗ ${name}: minify failed: ${e.message}`);
    fs.writeFileSync(path.join(DIST, `${name}.debug.css`), source);
    process.exit(1);
  }
  if (NEST) {
    const nested = nest(min);
    const check = verifyNest(min, nested, transform);
    transform({filename: `${name}.nested.css`, code: Buffer.from(nested), minify: false, targets: TARGETS, errorRecovery: false});
    if (check.ok) { report.nest = report.nest || {}; report.nest[name] = {flatBytes: Buffer.byteLength(min), nestedBytes: Buffer.byteLength(nested), members: check.members}; min = nested; }
    else { console.error(`! ${name}: nesting self-check failed (${check.reason}) — flat output kept`); report.nest = {...report.nest, [name]: {failed: check.reason}}; }
  }
  const banner = `/* GitHub theme for Gitea 1.27.3 · gitea-theme-github ${version} · ${primerVersion} · Octicons/Primer (MIT) */\n`;
  const metaBlock = `\ngitea-theme-meta-info{--theme-display-name:"${meta.display}";--theme-color-scheme:"${scheme}"}\n`;
  const file = banner + min + metaBlock;
  fs.writeFileSync(path.join(DIST, `theme-${name}.css`), file);
  fs.writeFileSync(path.join(DIST, `theme-${name}.src.css`), source); // unminified, for debugging
  const bytes = Buffer.byteLength(file);
  report.themes[name] = {bytes, kb: +(bytes / 1024).toFixed(1), overBudget: bytes > BUDGET_BYTES};
}

const rev = crypto.createHash('sha256').update(Object.keys(THEMES).map((n) => read(path.join(DIST, `theme-${n}.css`))).join('')).digest('hex').slice(0, 10);
report.revision = rev;

// ---- 4. deploy -----------------------------------------------------------------------------------------
async function deploy() {
  const cssDir = path.join(CUSTOM_PATH, 'public/assets/css');
  const d = {revision: rev, files: [], templateReloaded: false, verified: {}, restartRequired: false};
  for (const name of Object.keys(THEMES)) {
    const src = path.join(DIST, `theme-${name}.css`);
    const dst = path.join(cssDir, `theme-${name}.css`);
    const isNew = !fs.existsSync(dst);
    fs.copyFileSync(src, `${dst}.tmp`);
    fs.renameSync(`${dst}.tmp`, dst); // atomic swap: a concurrent request never sees a half-written file
    d.files.push(dst);
    if (isNew) d.restartRequired = true; // Gitea (prod) caches the theme list; new theme files need one restart
  }
  // icons: src/icons/svg/*.svg → CUSTOM_PATH/public/assets/img/svg (read once at startup → restart required on change)
  const iconSrc = path.join(SRC, 'icons/svg');
  if (fs.existsSync(iconSrc)) {
    const iconDst = path.join(CUSTOM_PATH, 'public/assets/img/svg');
    fs.mkdirSync(iconDst, {recursive: true});
    let changed = 0;
    const names = fs.readdirSync(iconSrc).filter((x) => x.endsWith('.svg')).sort();
    for (const f of names) {
      const a = read(path.join(iconSrc, f));
      const dst = path.join(iconDst, f);
      if (!fs.existsSync(dst) || read(dst) !== a) { fs.writeFileSync(dst, a); changed++; }
    }
    // Retired overrides: delete only files that a previous deploy of THIS project placed (listed in our manifest),
    // never other files in the directory (other themes/sessions may own overrides there).
    const manifestFile = path.join(iconDst, '.gh-icons-manifest.json');
    let previous = [];
    try { previous = JSON.parse(read(manifestFile)).files || []; } catch {}
    const removed = [];
    for (const f of previous) {
      if (names.includes(f) || !/^[\w.-]+\.svg$/.test(f)) continue;
      const dst = path.join(iconDst, f);
      if (fs.existsSync(dst)) { fs.unlinkSync(dst); removed.push(f); }
    }
    fs.writeFileSync(manifestFile, JSON.stringify({project: 'gitea-theme-github', files: names}, null, 1));
    d.iconsChanged = changed;
    d.iconsRemoved = removed;
    if (changed || removed.length) d.restartRequired = true;
  }
  // restartRequired also when the running server predates any theme/icon file we deployed (a previous deploy's
  // change that was never loaded) — Gitea reads the theme list and the svg overrides only at startup.
  try {
    const started = Date.parse(execFileSync('docker', ['inspect', '-f', '{{.State.StartedAt}}', GITEA_CONTAINER], {encoding: 'utf8'}).trim());
    const iconDst = path.join(CUSTOM_PATH, 'public/assets/img/svg');
    const iconFiles = fs.existsSync(path.join(SRC, 'icons/svg')) ? fs.readdirSync(path.join(SRC, 'icons/svg')).filter((x) => x.endsWith('.svg')).map((f) => path.join(iconDst, f)) : [];
    const newest = Math.max(0, ...iconFiles.filter((f) => fs.existsSync(f)).map((f) => fs.statSync(f).mtimeMs));
    d.serverStartedAt = new Date(started).toISOString();
    if (newest > started) { d.restartRequired = true; d.restartReason = `icon overrides newer than the running server (${new Date(newest).toISOString()})`; }
  } catch (e) {
    d.serverStartedAtError = String(e.message || e).slice(0, 200);
  }
  // cache-busting: bump github_revision in the (shared) head_style.tmpl, then hot-reload templates
  const tmpl = path.join(CUSTOM_PATH, 'templates/base/head_style.tmpl');
  if (fs.existsSync(tmpl) && read(tmpl).includes('github_revision=')) {
    const before = read(tmpl);
    const after = before.replace(/github_revision=[0-9a-f]+/, `github_revision=${rev}`);
    if (after !== before) {
      fs.writeFileSync(`${tmpl}.tmp`, after);
      fs.renameSync(`${tmpl}.tmp`, tmpl);
      try {
        execFileSync('docker', ['exec', '-u', 'git', GITEA_CONTAINER, 'gitea', 'manager', 'reload-templates', '--config', '/data/gitea/conf/app.ini'], {stdio: 'pipe'});
        d.templateReloaded = true;
      } catch (e) {
        d.templateReloadError = String(e.stderr || e.message).slice(0, 500);
      }
    }
  } else {
    d.templateWarning = 'head_style.tmpl has no github branch — cascade layering and cache-busting inactive (integrator: install templates/base/head_style.tmpl)';
  }
  // read-only drift check: every project template override must match the live copy (head_style modulo the
  // revision). Installing templates is an orchestrator/integrator step (docs/requests/ORCHESTRATOR.md), not deploy.
  const tmplRoot = path.join(ROOT, 'templates');
  const norm = (s) => s.replace(/github_revision=[0-9a-f]+/g, 'github_revision=REV');
  d.templatesPending = [];
  for (const rel of fs.existsSync(tmplRoot) ? fs.readdirSync(tmplRoot, {recursive: true}).filter((f) => f.endsWith('.tmpl')).sort() : []) {
    const live = path.join(CUSTOM_PATH, 'templates', rel);
    let state = 'missing';
    try { state = norm(read(live)) === norm(read(path.join(tmplRoot, rel))) ? 'ok' : 'differs'; } catch {}
    if (state !== 'ok') d.templatesPending.push(`${rel}: ${state} in CUSTOM_PATH (install it: docs/requests/ORCHESTRATOR.md)`);
  }
  // verify Gitea serves the new bytes
  for (const name of Object.keys(THEMES)) {
    const want = crypto.createHash('sha256').update(fs.readFileSync(path.join(DIST, `theme-${name}.css`))).digest('hex');
    try {
      const r = await fetch(`${GITEA_URL}/assets/css/theme-${name}.css?github_revision=${rev}`, {cache: 'no-store'});
      const got = crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex');
      d.verified[name] = r.ok && got === want ? 'ok' : `MISMATCH (status ${r.status})`;
    } catch (e) {
      d.verified[name] = `fetch failed: ${e.message}`;
    }
  }
  return d;
}

if (flag('deploy')) report.deploy = await deploy();
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(DIST, 'build-report.json'), JSON.stringify(report, null, 1));

// ---- 5. summary ----------------------------------------------------------------------------------------
let failed = false;
for (const [f, e] of Object.entries(report.folders)) {
  const bad = e.status !== 'ok';
  console.log(`${bad ? '✗' : '✓'} ${f.padEnd(34)} ${e.status}${e.bytes != null ? ` · ${(e.bytes / 1024).toFixed(1)} KB src` : ''}${e.lintWarnings ? ` · ${e.lintWarnings} warn` : ''}`);
  if (bad && e.errors) for (const x of e.errors.slice(0, 8)) console.log(`     ${typeof x === 'string' ? x : `${x.file}${x.line ? ':' + x.line : ''} ${x.msg}`}`);
}
console.log(`tokens kept ${tokens.used}/${tokens.total}`);
for (const [n, t] of Object.entries(report.themes)) {
  console.log(`${t.overBudget ? '✗ OVER BUDGET' : '✓'} theme-${n}.css ${t.kb} KB`);
  if (t.overBudget && !flag('budget-warn')) failed = true; // --budget-warn: report, don't fail (CI snapshot builds)
}
console.log(`revision ${rev}`);
if (report.deploy) {
  console.log('deploy:', JSON.stringify(report.deploy, null, 1));
  if (Object.values(report.deploy.verified).some((v) => v !== 'ok')) failed = true;
}
if (report.pageScope) {
  const ps = report.pageScope;
  console.log(ps.error ? `! page-scope check failed to run: ${ps.error}` : `${ps.leaks ? '! ' : '✓ '}page-scope: ${ps.leaks} LEAK, ${ps.newScopes} NEW, ${ps.dead} DEAD (${ps.report})`);
  if (flag('strict') && (ps.leaks || ps.error)) failed = true;
}
if (flag('strict') && Object.values(report.folders).some((e) => e.status.startsWith('excluded (') && !e.status.includes('disabled'))) failed = true;
process.exit(failed ? 1 : 0);
