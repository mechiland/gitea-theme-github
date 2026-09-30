#!/usr/bin/env node
// CSS rule coverage of the GitHub theme over every route/state/scheme/viewport of routes.json.
// See tools/shoot/README.md (coverage.mjs).
//
//   node tools/shoot/coverage.mjs [--theme github-auto] [--only a,b] [--schemes light,dark] [--viewports 1440,390]
//        [--no-states] [--concurrency 3] [--out shots/coverage] [--routes file]
//
// Every page gets dist/theme-<theme>.src.css (unminified, real custom-property names, one @layer block per folder)
// in place of the deployed theme file (page.route on /assets/css/theme-<theme>.css — rendering is identical, the
// minified file only renames the theme's own custom properties). Chrome's CSS.startRuleUsageTracking runs from before
// navigation until after the state action; a rule counts as used when its selector matched any element at any time
// during tracking. Rules are parsed from the same text with postcss and mapped to their folder (layer block; in
// gh-important by the build's `/* <folder>/<file> */` comments) and, by selector search, to a source file.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import { transform } from 'lightningcss';
import { launchBrowser } from './lib/browser.mjs';
import { parseArgs, list } from './lib/args.mjs';
import { PROJECT_ROOT, GITEA_URL, ensureLogin, ensureAppearance, langCookies, giteaVersion } from './lib/gitea.mjs';
import { trackInflight, waitReady, statesFor, performState } from './lib/states.mjs';

const args = parseArgs();
const theme = args.theme && args.theme !== true ? args.theme : 'github-auto';
const routesFile = path.resolve(PROJECT_ROOT, args.routes || 'tools/shoot/routes.json');
const cfg = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
const only = list(args.only, null);
const schemes = list(args.schemes, ['light', 'dark']);
const viewports = list(args.viewports, ['1440', '390']).map(Number);
const doStates = !args['no-states'];
const concurrency = Number(args.concurrency) || 3;
const outDir = path.resolve(PROJECT_ROOT, args.out && args.out !== true ? args.out : 'shots/coverage');
const giteaBase = (cfg.giteaBase || GITEA_URL).replace(/\/$/, '');
const SRC_FILE = path.join(PROJECT_ROOT, `dist/theme-${theme}.src.css`);
const MIN_FILE = path.join(PROJECT_ROOT, `dist/theme-${theme}.css`);
const THEME_PATH = `/assets/css/theme-${theme}.css`;
const CSS_TEXT = fs.readFileSync(SRC_FILE, 'utf8');
const TARGETS = { chrome: 111 << 16, firefox: 113 << 16, safari: (16 << 16) | (5 << 8) };

// ---------------------------------------------------------------- static model of the stylesheet
const DYN_PSEUDO = ['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'target', 'target-within',
  'checked', 'indeterminate', 'invalid', 'valid', 'user-invalid', 'user-valid', 'placeholder-shown', 'autofill',
  '-webkit-autofill', 'open', 'popover-open', 'modal', 'fullscreen', 'playing', 'paused', 'default', 'in-range', 'out-of-range'];
const DYN_RE = new RegExp(`:(${DYN_PSEUDO.map((p) => p.replace(/-/g, '\\-')).join('|')})(?![\\w-])`, 'i');
const HAS_RE = /:has\(/i;
// pseudo-elements Chrome resolves only under a condition (selection, scrollbars, placeholder, dialogs, …)
const COND_PE_RE = /::?(selection|placeholder|-webkit-scrollbar[\w-]*|-webkit-resizer|backdrop|-webkit-[\w-]+|-moz-[\w-]+|marker|file-selector-button|cue|highlight|search-text|target-text|spelling-error|grammar-error|view-transition[\w-]*|details-content|picker[\w-]*|checkmark)\b/i;

/** strips dynamic pseudo-classes and pseudo-elements so the selector can be tested with querySelector */
function baseSelector(sel) {
  let s = sel;
  s = s.replace(/::?(before|after|first-line|first-letter)\b/gi, '');
  s = s.replace(/::[\w-]+(\([^()]*\))?/g, '');
  s = s.replace(new RegExp(`:(${DYN_PSEUDO.map((p) => p.replace(/-/g, '\\-')).join('|')})(?![\\w-])`, 'gi'), '');
  // empty functional pseudos left behind (e.g. :not(:hover) -> :not())
  for (let i = 0; i < 3; i++) s = s.replace(/:(not|is|where|has)\(\s*\)/gi, '');
  s = s.trim();
  if (!s) return '*';
  if (/[>+~]\s*$/.test(s)) s += ' *';
  if (/^[>+~]/.test(s)) s = ':scope ' + s;
  return s;
}

const root = postcss.parse(CSS_TEXT, { from: SRC_FILE });
const rules = []; // {i, start, end, line, selector, selectors[], folder, layer, file?, media[], atCtx}
const mediaConds = new Set();
{
  const topFolder = (layer) => layer.replace(/^gh\./, '').replace(/^pages-/, 'pages/');
  let impFile = null;
  root.walk((node) => {
    if (node.type === 'comment') {
      const m = node.text.trim().match(/^((?:pages\/)?[\w-]+)\/([\w./-]+\.important\.css)$/);
      if (m) impFile = { folder: m[1], file: `src/${m[1]}/${m[2]}` };
      return;
    }
    if (node.type !== 'rule') return;
    let layer = null; const media = []; const ctx = []; let keyframes = false;
    for (let p = node.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type !== 'atrule') continue;
      const n = p.name.toLowerCase();
      if (n === 'layer') layer = p.params.trim();
      else if (n === 'media') { media.push(p.params.trim()); mediaConds.add(p.params.trim()); ctx.push(`@media ${p.params.trim()}`); }
      else if (/keyframes$/.test(n)) keyframes = true;
      else ctx.push(`@${n} ${p.params.trim()}`.slice(0, 80));
    }
    if (keyframes) return;
    let folder = layer ? topFolder(layer) : '(unlayered)';
    let file = null;
    if (layer === 'gh-important') { folder = impFile ? impFile.folder : 'gh-important'; file = impFile ? impFile.file : null; }
    rules.push({ i: rules.length, start: node.source.start.offset, end: node.source.end.offset, line: node.source.start.line,
      selector: node.selector, selectors: node.selectors, folder, layer, file, media, ctx: ctx.reverse(), node });
  });
}
const byStart = new Map(rules.map((r) => [r.start, r]));

// source-file lookup for component layers: first file of the folder that contains the selector text verbatim
const srcFiles = new Map(); // folder -> [{rel, text}]
function filesOf(folder) {
  if (srcFiles.has(folder)) return srcFiles.get(folder);
  const dir = path.join(PROJECT_ROOT, 'src', folder);
  const out = [];
  const walk = (d) => { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (folder !== 'pages' || true) walk(p); } else if (e.name.endsWith('.css')) out.push({ rel: path.relative(PROJECT_ROOT, p), text: fs.readFileSync(p, 'utf8') });
  } };
  walk(dir);
  if (folder === 'tokens') walk(path.join(PROJECT_ROOT, 'src/icons'));
  srcFiles.set(folder, out);
  return out;
}
function locate(r) {
  const needle = r.selector.slice(0, 120);
  const cands = r.file ? filesOf(r.folder).filter((f) => f.rel === r.file) : filesOf(r.folder).filter((f) => !f.rel.endsWith('.important.css'));
  for (const f of cands.length ? cands : filesOf(r.folder)) {
    const k = f.text.indexOf(needle);
    if (k >= 0) return `${f.rel}:${f.text.slice(0, k).split('\n').length}`;
  }
  return r.file || null;
}

// selectors to test against the live DOM (for dead selectors inside used rules and for state rules' base elements)
const selIndex = new Map(); // base selector -> id
const selList = [];
for (const r of rules) {
  r.baseIds = r.selectors.map((s) => {
    const b = baseSelector(s);
    if (!selIndex.has(b)) { selIndex.set(b, selList.length); selList.push(b); }
    return selIndex.get(b);
  });
  r.dynamic = r.selectors.map((s) => DYN_RE.test(s) || HAS_RE.test(s) || COND_PE_RE.test(s));
}

// ---------------------------------------------------------------- runtime
const usedCount = new Uint32Array(rules.length);
const usedBy = new Map(); // rule i -> first job ids
const selMatched = new Uint8Array(selList.length); // 1 matched somewhere, 2 invalid for querySelector
const mediaMatched = new Map([...mediaConds].map((c) => [c, 0]));
const unmappedRanges = new Set();
const jobsOut = [];

function newContextFor(browser, route, scheme, vw, storageState) {
  const vp = vw === 390 ? { width: 390, height: 844, deviceScaleFactor: 2 } : vw === 1440 ? { width: 1440, height: 900, deviceScaleFactor: 1 } : { width: vw, height: 900, deviceScaleFactor: 1 };
  const auth = route.auth !== false;
  return browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor,
    colorScheme: scheme, locale: 'en-US', timezoneId: 'UTC', ...(auth ? { storageState } : {}) })
    .then(async (ctx) => {
      await ctx.addCookies(langCookies(giteaBase, auth ? undefined : theme));
      await ctx.route((u) => u.pathname === THEME_PATH, (r) => r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: CSS_TEXT, headers: { 'cache-control': 'no-store' } }));
      return ctx;
    });
}

async function runJob(browser, storageState, job) {
  const { route, scheme, vw, state } = job;
  const id = `${route.id}/${scheme}-${vw}${state ? '-' + state.name : ''}`;
  const res = { id, ok: false };
  const t0 = Date.now();
  const ctx = await newContextFor(browser, route, scheme, vw, storageState);
  const page = await ctx.newPage();
  trackInflight(page);
  try {
    const cdp = await ctx.newCDPSession(page);
    const sheets = new Set();
    cdp.on('CSS.styleSheetAdded', (e) => { if ((e.header.sourceURL || '').includes(THEME_PATH)) sheets.add(e.header.styleSheetId); });
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    await cdp.send('CSS.startRuleUsageTracking');
    const url = route.gitea.startsWith('http') ? route.gitea : giteaBase + route.gitea;
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    res.status = resp ? resp.status() : null;
    await waitReady(page);
    await page.waitForTimeout(250);
    if (state) Object.assign(res, await performState(page, state));
    // live-DOM selector test (only selectors not yet seen matching anywhere)
    const todo = []; for (let k = 0; k < selList.length; k++) if (!selMatched[k]) todo.push(k);
    const conds = [...mediaConds];
    const probe = await page.evaluate(({ sels, conds }) => {
      const hit = [], bad = [];
      for (const [k, s] of sels) { try { if (document.querySelector(s)) hit.push(k); } catch { bad.push(k); } }
      return { hit, bad, media: conds.filter((c) => matchMedia(c).matches), theme: document.documentElement.dataset.theme };
    }, { sels: todo.map((k) => [k, selList[k]]), conds });
    for (const k of probe.hit) selMatched[k] = 1;
    for (const k of probe.bad) if (!selMatched[k]) selMatched[k] = 2;
    for (const c of probe.media) mediaMatched.set(c, mediaMatched.get(c) + 1);
    res.htmlTheme = probe.theme;
    const { ruleUsage } = await cdp.send('CSS.stopRuleUsageTracking');
    res.sheets = sheets.size;
    if (!sheets.size) throw new Error(`theme stylesheet ${THEME_PATH} not loaded (html[data-theme]=${probe.theme})`);
    let n = 0;
    for (const u of ruleUsage) {
      if (!u.used || !sheets.has(u.styleSheetId)) continue;
      const r = byStart.get(u.startOffset);
      if (!r) { if (!/@[\w-]+\s+$/.test(CSS_TEXT.slice(Math.max(0, u.startOffset - 40), u.startOffset))) unmappedRanges.add(u.startOffset); continue; }
      n++;
      usedCount[r.i]++;
      let a = usedBy.get(r.i); if (!a) usedBy.set(r.i, (a = []));
      if (a.length < 4) a.push(id);
    }
    res.usedRules = n;
    res.ok = true;
  } catch (e) {
    res.error = String(e.message || e).split('\n')[0];
  }
  res.ms = Date.now() - t0;
  await ctx.close().catch(() => {});
  return res;
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---------------------------------------------------------------- size model (exact minified savings)
const varmapFile = path.join(PROJECT_ROOT, 'dist/varmap.json');
const shortOf = new Map(fs.existsSync(varmapFile) ? Object.entries(JSON.parse(fs.readFileSync(varmapFile, 'utf8'))).map(([s, l]) => [l, s]) : []);
const rename = (css) => css.replace(/--[\w-]+/g, (n) => shortOf.get(n) || n);
const minSize = (css) => transform({ filename: 'x.css', code: Buffer.from(rename(css)), minify: true, targets: TARGETS }).code.length;
/** minified bytes saved by deleting these rules (and at-rules left empty) from the whole stylesheet */
function savings(ruleSet, baseline) {
  if (!ruleSet.length) return 0;
  const drop = new Set(ruleSet.map((r) => r.start));
  const clone = root.clone();
  const kill = [];
  clone.walkRules((n) => { if (drop.has(n.source.start.offset)) kill.push(n); });
  for (const n of kill) { let p = n.parent; n.remove(); while (p && p.type === 'atrule' && p.nodes && !p.nodes.some((c) => c.type !== 'comment')) { const q = p.parent; p.remove(); p = q; } }
  return baseline - minSize(clone.toString());
}

// ---------------------------------------------------------------- main
async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const minDeployed = fs.readFileSync(MIN_FILE);
  const baseline = minSize(CSS_TEXT);
  const browser = await launchBrowser();
  const storageState = await ensureLogin(browser, { force: !!args.relogin });
  const appearance = await ensureAppearance(browser, storageState, { theme, lang: 'en-US' });
  if (appearance.preview) throw new Error(`${theme} is not registered in Gitea yet (restart pending) — coverage needs the real template branch`);
  const served = Buffer.from(await (await fetch(giteaBase + THEME_PATH)).arrayBuffer());
  const deployedMatchesDist = served.equals(minDeployed);
  let routes = cfg.routes.filter((r) => (!only || only.includes(r.id)) && r.gitea && !String(r.gitea).includes('{{'));
  const jobs = [];
  for (const route of routes) for (const scheme of schemes) for (const vw of viewports) {
    jobs.push({ route, scheme, vw });
    if (doStates) for (const st of statesFor(route, 'gitea', vw)) jobs.push({ route, scheme, vw, state: st });
  }
  console.error(`[coverage] ${theme}: ${routes.length} routes, ${jobs.length} page loads (states ${doStates ? 'on' : 'off'}), ${rules.length} style rules in ${path.relative(PROJECT_ROOT, SRC_FILE)}; deployed == dist: ${deployedMatchesDist}`);
  let done = 0;
  const results = await pool(jobs, concurrency, async (job) => {
    const r = await runJob(browser, storageState, job);
    done++;
    if (!r.ok || done % 25 === 0) console.error(`[coverage] ${done}/${jobs.length} ${r.id} ${r.ok ? `used=${r.usedRules}` : 'FAILED ' + r.error}`);
    return r;
  });
  await browser.close();
  jobsOut.push(...results);

  // ---- classify never-used rules
  const usedIdx = (r) => usedCount[r.i] > 0;
  const mediaNever = new Set([...mediaMatched].filter(([, n]) => n === 0).map(([c]) => c));
  const bytesOf = (r) => r.end - r.start;
  const out = [];
  for (const r of rules) {
    if (usedIdx(r)) continue;
    const entry = { selector: r.selector.replace(/\s+/g, ' ').slice(0, 400), bytes: bytesOf(r), line: r.line, folder: r.folder,
      source: locate(r), context: r.ctx.length ? r.ctx : undefined };
    const neverMedia = r.media.filter((m) => mediaNever.has(m));
    const baseHit = r.baseIds.map((k) => selMatched[k] === 1);
    if (neverMedia.length) { entry.category = 'unverifiable'; entry.reason = `media never matched in tested configs: ${neverMedia.join(' and ')}`; entry.kind = 'media'; }
    else if (r.dynamic.some(Boolean)) {
      entry.category = 'unverifiable'; entry.kind = 'state';
      entry.baseElementPresent = baseHit.some(Boolean);
      entry.reason = entry.baseElementPresent
        ? 'state-only selector (hover/focus/active/:has/…); its element exists on some tested page, the state was never triggered'
        : 'state-only selector; even without the pseudo-classes it matched no element on any tested page';
    } else entry.category = 'unused';
    entry._r = r;
    out.push(entry);
  }
  // dead selectors inside used rules (selector-list members whose base selector matched nothing anywhere)
  const deadSelectors = [];
  for (const r of rules) {
    if (!usedIdx(r) || r.selectors.length < 2) continue;
    r.selectors.forEach((s, k) => {
      if (selMatched[r.baseIds[k]] === 1) return;
      if (r.media.some((m) => mediaNever.has(m))) return;
      deadSelectors.push({ folder: r.folder, selector: s, bytes: s.length + 1, line: r.line, source: locate(r), stateOnly: r.dynamic[k], invalidForQuery: selMatched[r.baseIds[k]] === 2 || undefined });
    });
  }

  // ---- per-folder totals + exact minified savings
  const folders = {};
  const order = ['tokens', 'foundation', 'controls', 'overlays', 'navigation', 'data-display', 'code', 'markdown',
    'pages/repo', 'pages/issues-prs', 'pages/actions-packages-projects', 'pages/people', 'pages/settings-admin', 'pages/auth', 'dark'];
  const allFolders = [...new Set([...order, ...rules.map((r) => r.folder)])].filter((f) => rules.some((r) => r.folder === f));
  for (const f of allFolders) {
    const fr = rules.filter((r) => r.folder === f);
    const un = out.filter((e) => e.folder === f);
    const cat = (c, pred = () => true) => un.filter((e) => e.category === c && pred(e));
    const unused = cat('unused'), stateDead = cat('unverifiable', (e) => e.kind === 'state' && !e.baseElementPresent),
      statePresent = cat('unverifiable', (e) => e.kind === 'state' && e.baseElementPresent), media = cat('unverifiable', (e) => e.kind === 'media');
    const sum = (a) => a.reduce((s, e) => s + e.bytes, 0);
    folders[f] = {
      rules: fr.length, usedRules: fr.filter(usedIdx).length, srcBytes: sum(fr.map((r) => ({ bytes: bytesOf(r) }))),
      unused: { rules: unused.length, srcBytes: sum(unused), minBytesSaved: savings(unused.map((e) => e._r), baseline) },
      unverifiableStateBaseAbsent: { rules: stateDead.length, srcBytes: sum(stateDead), minBytesSaved: savings(stateDead.map((e) => e._r), baseline) },
      unverifiableStateBasePresent: { rules: statePresent.length, srcBytes: sum(statePresent), minBytesSaved: savings(statePresent.map((e) => e._r), baseline) },
      unverifiableMedia: { rules: media.length, srcBytes: sum(media), minBytesSaved: savings(media.map((e) => e._r), baseline) },
      deadSelectorsInUsedRules: { count: deadSelectors.filter((d) => d.folder === f).length, srcBytes: deadSelectors.filter((d) => d.folder === f).reduce((s, d) => s + d.bytes, 0) },
    };
  }
  const allUnused = out.filter((e) => e.category === 'unused');
  const totals = {
    styleRules: rules.length, usedRules: rules.filter(usedIdx).length, neverUsed: out.length,
    unused: { rules: allUnused.length, srcBytes: allUnused.reduce((s, e) => s + e.bytes, 0), minBytesSaved: savings(allUnused.map((e) => e._r), baseline) },
    unusedPlusStateBaseAbsent: (() => { const a = out.filter((e) => e.category === 'unused' || (e.kind === 'state' && !e.baseElementPresent)); return { rules: a.length, minBytesSaved: savings(a.map((e) => e._r), baseline) }; })(),
    allNeverUsed: { rules: out.length, minBytesSaved: savings(out.map((e) => e._r), baseline) },
    minifiedBaselineBytes: baseline, deployedMinifiedBytes: minDeployed.length, budgetBytes: 300 * 1024,
  };
  const jobsFailed = jobsOut.filter((j) => !j.ok);
  const report = {
    generated: new Date().toISOString(), theme, source: path.relative(PROJECT_ROOT, SRC_FILE), giteaVersion: await giteaVersion(),
    deployedMatchesDist, schemes, viewports, states: doStates, routes: routes.length, pageLoads: jobsOut.length, pageLoadsFailed: jobsFailed.length,
    note: 'A rule is "used" if its selector matched any element at any time while tracking (load → waitReady → state action). '
      + 'State rules (:hover/:focus/:active/:has()/…) and pseudo-element rules (::selection, scrollbars, ::placeholder) are listed as "unverifiable": '
      + 'they can be falsely unused when the state was never triggered. Rules inside @media conditions that no tested config matched '
      + '(e.g. pointer: coarse, forced-colors, widths between 544 and 1011 px other than the tested 390/1440) are "unverifiable" too. '
      + 'minBytesSaved = exact size reduction of the minified theme file (renamed vars, lightningcss) when those rules are deleted.',
    totals, folders, mediaConditions: Object.fromEntries(mediaMatched),
    unmappedUsedRanges: [...unmappedRanges].sort((a, b) => a - b).map((o) => ({ offset: o, text: CSS_TEXT.slice(o, o + 60).replace(/\s+/g, " ") })),
    failedJobs: jobsFailed.map((j) => ({ id: j.id, error: j.error })),
    rules: out.map(({ _r, ...e }) => e).sort((a, b) => b.bytes - a.bytes),
    deadSelectors: deadSelectors.sort((a, b) => b.bytes - a.bytes),
    lowUseRules: rules.filter((r) => usedCount[r.i] > 0 && usedCount[r.i] <= 2 && bytesOf(r) >= 200)
      .map((r) => ({ folder: r.folder, selector: r.selector.replace(/\s+/g, ' ').slice(0, 200), bytes: bytesOf(r), line: r.line, usedBy: usedBy.get(r.i) }))
      .sort((a, b) => b.bytes - a.bytes),
    jobs: jobsOut,
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 1));

  // ---- per-folder markdown
  const esc = (s) => s.replace(/\|/g, '\\|').replace(/`/g, "'");
  for (const f of allFolders) {
    const F = folders[f];
    const un = report.rules.filter((e) => e.folder === f);
    const table = (a) => a.length ? ['| bytes | selector | source | src line |', '|---:|---|---|---:|',
      ...a.map((e) => `| ${e.bytes} | \`${esc(e.selector.slice(0, 220))}\`${e.context ? ` <br>in ${esc(e.context.join(' › '))}` : ''} | ${e.source || ''} | ${e.line} |`)].join('\n') : '_none_';
    const ds = report.deadSelectors.filter((d) => d.folder === f);
    const md = `# Coverage — ${f}

Generated ${report.generated} from \`${report.source}\` over ${report.routes} routes × ${schemes.join('/')} × ${viewports.join('/')}${doStates ? ' + every defined state' : ''} (${report.pageLoads} page loads, ${report.pageLoadsFailed} failed).

**Caveat.** Chrome marks a rule used when its selector matched an element at any time during tracking. Rules that only apply in a
state (\`:hover\`, \`:focus\`, \`:active\`, \`:has()\`, \`:checked\`…) or to conditional pseudo-elements (\`::selection\`, scrollbars,
\`::placeholder\`) can be falsely "unused" when no route/state triggered them, so they are listed separately as *unverifiable*.
Rules under an \`@media\` condition no tested config matched are unverifiable too. Content not present in the seeded data
(e.g. a page type not in routes.json) also shows as unused — check before deleting.

| | rules | src bytes | minified bytes saved if deleted |
|---|---:|---:|---:|
| all rules in folder | ${F.rules} | ${F.srcBytes} | |
| used | ${F.usedRules} | | |
| **never used (verifiable)** | ${F.unused.rules} | ${F.unused.srcBytes} | **${F.unused.minBytesSaved}** |
| unverifiable: state rule, base element absent everywhere | ${F.unverifiableStateBaseAbsent.rules} | ${F.unverifiableStateBaseAbsent.srcBytes} | ${F.unverifiableStateBaseAbsent.minBytesSaved} |
| unverifiable: state rule, base element present | ${F.unverifiableStateBasePresent.rules} | ${F.unverifiableStateBasePresent.srcBytes} | ${F.unverifiableStateBasePresent.minBytesSaved} |
| unverifiable: @media never matched | ${F.unverifiableMedia.rules} | ${F.unverifiableMedia.srcBytes} | ${F.unverifiableMedia.minBytesSaved} |
| dead selectors inside used rules | ${F.deadSelectorsInUsedRules.count} | ${F.deadSelectorsInUsedRules.srcBytes} | |

## Never used (verifiable), by bytes

${table(un.filter((e) => e.category === 'unused'))}

## Unverifiable — state/pseudo rules whose element (pseudo-classes stripped) matched nothing on any tested page

${table(un.filter((e) => e.kind === 'state' && !e.baseElementPresent))}

## Unverifiable — state/pseudo rules whose element exists (state never triggered; likely needed)

${table(un.filter((e) => e.kind === 'state' && e.baseElementPresent))}

## Unverifiable — @media condition never matched (390/1440, light/dark, fine pointer, no forced colors)

${table(un.filter((e) => e.kind === 'media'))}

## Dead selectors inside used rules (selector-list members that matched nothing; pseudo-classes stripped)

${ds.length ? ['| bytes | selector | state-only | source | src line |', '|---:|---|---|---|---:|', ...ds.map((d) => `| ${d.bytes} | \`${esc(d.selector.slice(0, 200))}\` | ${d.stateOnly ? 'yes' : ''} | ${d.source || ''} | ${d.line} |`)].join('\n') : '_none_'}
`;
    fs.writeFileSync(path.join(outDir, `${f.replace(/\//g, '-')}.md`), md);
  }
  console.log(JSON.stringify({ out: path.relative(PROJECT_ROOT, outDir), deployedMatchesDist, pageLoads: report.pageLoads, failed: report.pageLoadsFailed,
    unmappedUsedRanges: unmappedRanges.size, totals,
    folders: Object.fromEntries(Object.entries(folders).map(([k, v]) => [k, { rules: v.rules, unused: v.unused, stateBaseAbsent: v.unverifiableStateBaseAbsent.minBytesSaved, statePresent: v.unverifiableStateBasePresent.minBytesSaved, media: v.unverifiableMedia.minBytesSaved }])) }, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
