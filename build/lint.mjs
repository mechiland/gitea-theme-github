// Lint for theme sources. Exit code 1 on any error.
//  1. No literal colors (hex, rgb/hsl/hwb/lab/lch/oklab/oklch/color(), CSS named colors) in any
//     declaration value outside src/tokens/ (the generated Primer files and the mapping file).
//  2. Type, radius, shadow, motion and z-index values must come from tokens (error);
//     spacing/size literals other than 0/1px/2px/%/auto are reported as warnings.
//  3. Selector ownership: an identical selector may not be styled by two folders
//     (the `dark` folder is exempt: it exists to re-state dark-only exceptions).
//  4. gh-important files (*.important.css) may not set display/visibility (Gitea's tw-hidden must win).
// Usage: node build/lint.mjs [--json] [folder ...]
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import {FOLDERS, SRC, ROOT} from './folders.mjs';

const NAMED = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));
const COLOR_FN = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const HEX = /(^|[\s,(])#[0-9a-f]{3,8}\b/i;
const TOKEN_ONLY_PROPS = /^(font-size|font-weight|font-family|line-height|border(-top|-right|-bottom|-left)?-radius|border-(start|end)-(start|end)-radius|box-shadow|transition-duration|animation-duration|z-index)$/;
const SPACING_PROPS = /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|width|height|min-width|min-height|max-width|max-height)(-.*)?$/;
const LITERAL_LEN = /(^|[\s,(])-?\d*\.?\d+(px|rem|em)\b/g;

function stripUrlsAndStrings(v) {
  return v.replace(/url\([^)]*\)/g, 'url()').replace(/"[^"]*"|'[^']*'/g, '""');
}

export function lintValue(prop, rawValue) {
  const errors = [];
  const warnings = [];
  const v = stripUrlsAndStrings(rawValue).replace(/var\(--[\w-]+/g, 'var(');
  if (HEX.test(v)) errors.push('literal hex color');
  if (COLOR_FN.test(v)) errors.push('literal color function (use a Primer token)');
  for (const word of v.toLowerCase().match(/(?<![\w-])[a-z]+(?![\w-])/g) || []) {
    if (NAMED.has(word)) { errors.push(`named color "${word}"`); break; }
  }
  if (!prop.startsWith('--')) {
    if (TOKEN_ONLY_PROPS.test(prop)) {
      const lits = (v.match(LITERAL_LEN) || []).map((s) => s.trim().replace(/^[(,]/, '')).filter((s) => !/^-?0(px|rem|em)$/.test(s));
      if (/^font-weight$/.test(prop) && /^\d+$/.test(v.trim())) errors.push(`literal font-weight ${v.trim()}`);
      else if (/^z-index$/.test(prop) && /^-?\d+$/.test(v.trim()) && !/^-?[01]$/.test(v.trim())) errors.push(`literal z-index ${v.trim()}`);
      else if (/^line-height$/.test(prop) && /^\d*\.?\d+$/.test(v.trim()) && v.trim() !== '1' && v.trim() !== '0') errors.push(`literal line-height ${v.trim()}`);
      else if (lits.length && !/^(box-shadow)$/.test(prop)) errors.push(`literal ${lits.join(' ')} in ${prop}`);
      else if (prop === 'box-shadow' && !/var\(|none|inherit|initial|unset/.test(v)) errors.push('literal box-shadow');
    } else if (SPACING_PROPS.test(prop)) {
      const lits = (v.match(LITERAL_LEN) || []).map((s) => s.trim().replace(/^[(,]/, '')).filter((s) => !/^-?(0|1|2)px$/.test(s) && !/^-?0(rem|em)$/.test(s));
      if (lits.length) warnings.push(`literal ${lits.join(' ')} in ${prop}`);
    }
  }
  return {errors, warnings};
}

// Rule 4 exceptions (integrator-approved, CODE-L1-1): Gitea hides these with its own `display: none !important`
// helpers (.not-mobile.not-mobile, repo.css .diff-detail-stats) and github.com shows them on mobile. Exact selectors
// only; neither element can carry tw-hidden, so Gitea's show/hide JS is unaffected.
const IMPORTANT_DISPLAY_ALLOW = new Set([
  '.blame .lines-commit .blame-time.not-mobile',
  '.repository .diff-detail-box .diff-detail-stats',
]);

// PERF-2 (2026-10-12): Chrome restyles every element that can match a rule's subject on *any* class change when a
// compound in front of that subject contains :has() or an attribute selector on class ([class*=…], [class="…"]),
// whether or not the anchor exists. With a keyless subject (`X:has(…) > *`, `… > :not(.a)`, `X:has(…) *` inside
// :is()) or a span / td subject that is the whole page: ~0.4–0.6 s per hover or toggle on a 47-file PR diff
// (300k elements), 1.2 s in total before PERF-2. Keep such subjects keyed by a class or id (or a rare element type).
const POPULOUS_TYPES = new Set(['span', 'td', 'tr', 'div', 'li']);
function splitTop(s, isSep) {
  const out = [];
  let depth = 0, cur = '', quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) { cur += c; if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === '\\') { cur += c + (s[++i] ?? ''); continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (!depth && isSep(c)) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
function topLevelOf(compound) { // the compound without anything inside (…) or […]
  let depth = 0, out = '';
  for (const c of compound) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (!depth) out += c;
  }
  return out;
}
// a complex selector → compounds and the combinators between them (' ', '>', '+', '~')
function parseComplex(selector) {
  const compounds = [], combinators = [];
  let depth = 0, cur = '', comb = null;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === '\\') { cur += c + (selector[++i] ?? ''); continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (!depth && /[\s>+~]/.test(c)) {
      if (cur) { compounds.push(cur); cur = ''; comb = ' '; }
      if (c !== ' ' && c !== '\n') comb = c;
      continue;
    }
    if (comb && !cur) { combinators.push(comb); comb = null; }
    cur += c;
  }
  if (cur) compounds.push(cur);
  return {compounds, combinators};
}
// the arguments of each top-level :is() / :where() / :not() / :has() of a selector
function pseudoArgs(selector, names) {
  const out = [];
  for (const m of selector.matchAll(new RegExp(`:(${names})\\(`, 'g'))) {
    let depth = 1, j = m.index + m[0].length;
    for (; j < selector.length && depth; j++) depth += selector[j] === '(' ? 1 : selector[j] === ')' ? -1 : 0;
    out.push(...splitTop(selector.slice(m.index + m[0].length, j - 1), (c) => c === ','));
  }
  return out;
}
// Classes with thousands of elements on a large PR diff (Chrome, signed in: every code line has a
// button.ui.primary.button.add-code-comment with an svg.octicon-plus), plus the Chroma token classes.
const POPULOUS_CLASSES = new Set(['ui', 'button', 'primary', 'svg', 'chroma', 'code-inner', 'tw-font-mono', 'add-code-comment', 'octicon-plus', 'add-code', 'del-code', 'same-code', 'added-code', 'removed-code']);
const CHROMA_TOKENS = new Set('bp c c1 ch cm cp cpf cs dl err fm g gd ge gh gi gl go gp gr gs gt gu hl il k kc kd kn kp kr kt l ld lnt m mb mf mh mi mo n na nb nc nd ne nf ni nl nn no nt nv nx o ow p py s s1 s2 sa sb sc sd se sh si sr ss sx vc vg vi vm w x'.split(' '));
const populousClass = (c) => POPULOUS_CLASSES.has(c) || CHROMA_TOKENS.has(c) || c.startsWith('lines-') || c.startsWith('add-code-comment');
// The feature Chrome keys a compound's invalidation by (measured): an id anywhere in it; else the first class, a
// single-argument :is() / :where() counting as its argument (`:where(.rare).button` → .rare, `:is(.a, .b).button` →
// .button); else, when every alternative of an :is() / :where() is keyed, those; else the element type.
function keyed(compound) {
  const top = topLevelOf(compound);
  if (/#[\w-]/.test(top)) return true;
  const units = [];
  for (let i = 0, depth = 0, start = 0; i <= compound.length; i++) {
    const c = compound[i];
    if (!depth && (i === compound.length || (i > start && /[.:[#]/.test(c) && compound[i - 1] !== '\\' && compound[i - 1] !== ':'))) { units.push(compound.slice(start, i)); start = i; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
  }
  const multi = [];
  const typeFirst = /^[a-z]/i.test(units[0] ?? ''); // `a:where(.rare).button` is keyed by .button (measured), not .rare
  for (const u of units) {
    if (u.startsWith('.')) return !populousClass(/^\.([\w-]+)/.exec(u)[1]);
    const m = /^:(is|where)\((.*)\)$/s.exec(u);
    if (!m) continue;
    const alts = splitTop(m[2], (c) => c === ',');
    if (alts.length === 1 && /^\.[\w-]+$/.test(alts[0]) && !typeFirst) return !populousClass(alts[0].slice(1));
    multi.push(alts);
  }
  if (multi.some((alts) => alts.every((a) => keyed(parseComplex(a).compounds.at(-1) ?? '')))) return true;
  const type = /^[a-z][\w-]*/i.exec(top)?.[0]?.toLowerCase();
  return !!type && !POPULOUS_TYPES.has(type); // `span:where(.nb, .kt)` is keyed by span (0.39 s vs 0.07 s)
}
// Measured (Chrome, 300k-element PR diff): `X:has(…) > *` / `X:has(…) ~ *` 0.4–0.55 s at the top level; inside an
// :is() of a keyed compound only a descendant / child chain (`.a:is(X:has(…) *)`) stays expensive, a sibling chain
// (`.item:is(:first-child:not(:has(…)) ~ *)`) does not.
export function invalidationErrors(selector, nested = false) {
  const errors = [];
  const {compounds, combinators} = parseComplex(selector);
  const first = compounds.slice(0, -1).findIndex((c) => c.includes(':has(') || /\[class[\]*^$~|=]/.test(c));
  if (first >= 0 && !keyed(compounds.at(-1)) && (!nested || combinators.slice(first).some((c) => c === ' ' || c === '>')))
    errors.push(`"${selector}": subject "${compounds.at(-1)}" needs a rare class (first) or an id after a :has() / [class…] compound (PERF-2, build/lint.mjs)`);
  for (const arg of pseudoArgs(selector, 'is|where|not')) errors.push(...invalidationErrors(arg, true));
  // PERF-3: a :has() anchored on a page-level element (html, body, .full.height, .page-content, the issue / PR view)
  // whose argument searches descendants (`body:has(.repo-header)`) is re-run over the whole page on every class
  // change, ~13 ms each on a 330k-element diff; a fixed child path (`body:has(> .full.height > … > .repo-header)`)
  // is bounded.
  for (const m of selector.matchAll(/:has\(/g)) {
    // the anchor: the top-level compound the :has() sits in (also through `.page-content:not(.a, :has(…))`)
    let start = 0;
    for (let i = 0, depth = 0; i < m.index; i++) {
      const c = selector[i];
      if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (!depth && /[\s>+~]/.test(c)) start = i + 1;
    }
    const anchor = selector.slice(start, m.index);
    if (!anchor) continue;
    const top = topLevelOf(anchor).replace(/::?[\w-]+/g, '');
    const type = /^[a-z][\w-]*/i.exec(top)?.[0]?.toLowerCase();
    const classes = [...top.matchAll(/\.([\w-]+)/g)].map((x) => x[1]);
    const pageLevel = type === 'html' || type === 'body' || /:root/.test(anchor) || (!type && classes.length > 0 && classes.every((c) => PAGE_LEVEL_CLASSES.has(c)));
    if (!pageLevel) continue;
    let depth = 1, j = m.index + 5;
    for (; j < selector.length && depth; j++) depth += selector[j] === '(' ? 1 : selector[j] === ')' ? -1 : 0;
    const searches = splitTop(selector.slice(m.index + 5, j - 1), (c) => c === ',').some((alt) => {
      const {combinators} = parseComplex(alt.replace(/^([>+~])/, '$1 '));
      return !/^[>+~]/.test(alt) || combinators.some((c) => c === ' ');
    });
    if (searches && !PERF3_ALLOW.some((a) => selector.startsWith(a))) errors.push(`"${selector}": :has() on page-level "${anchor}" searches descendants; use a fixed child path (PERF-3, build/lint.mjs)`);
  }
  return [...new Set(errors)];
}
const PAGE_LEVEL_CLASSES = new Set(['full', 'height', 'page-content', 'repository', 'view', 'issue', 'pull', 'diff', 'files']);
// Waived: the destructive-confirmation scope (overlays/dialog.css) must look for its triggers anywhere on the page.
// Chrome only evaluates it (and re-runs it on class changes) while an id-less modal with an OK button exists, i.e.
// after a data-modal-confirm trigger was used on a small page (labels, Actions runs…), never on a plain diff.
const PERF3_ALLOW = ['body:has(:is([data-modal-confirm], [data-modal-confirm-content])'];

export async function lintFolder(folder) {
  const dir = path.join(SRC, folder);
  const result = {folder, errors: [], warnings: [], selectors: new Set()};
  const files = fs.existsSync(dir) ? fs.readdirSync(dir, {recursive: true}).filter((f) => f.endsWith('.css')) : [];
  for (const rel of files) {
    const file = path.join(dir, rel);
    const important = rel.endsWith('.important.css');
    let root;
    try {
      root = postcss.parse(fs.readFileSync(file, 'utf8'), {from: file});
    } catch (e) {
      result.errors.push({file: path.relative(ROOT, file), line: e.line, msg: `parse error: ${e.reason}`});
      continue;
    }
    root.walkDecls((d) => {
      const {errors, warnings} = lintValue(d.prop, d.value);
      for (const msg of errors) result.errors.push({file: path.relative(ROOT, file), line: d.source?.start?.line, msg: `${d.prop}: ${msg}`});
      for (const msg of warnings) result.warnings.push({file: path.relative(ROOT, file), line: d.source?.start?.line, msg: `${d.prop}: ${msg}`});
      if (important && /^(display|visibility)$/.test(d.prop) && !(d.prop === 'display' && IMPORTANT_DISPLAY_ALLOW.has(d.parent?.selector?.replace(/\s+/g, ' ').trim()))) result.errors.push({file: path.relative(ROOT, file), line: d.source?.start?.line, msg: `${d.prop} not allowed in gh-important`});
    });
    root.walkRules((r) => {
      if (r.parent?.type === 'atrule' && /keyframes/.test(r.parent.name)) return;
      for (const s of r.selectors) {
        const norm = s.replace(/\s+/g, ' ').trim();
        for (const msg of invalidationErrors(norm)) result.errors.push({file: path.relative(ROOT, file), line: r.source?.start?.line, msg});
        if (norm === ':root' || norm.startsWith('gitea-theme-meta-info')) continue;
        const ctx = r.parent?.type === 'atrule' ? `@${r.parent.name} ${r.parent.params} ` : '';
        result.selectors.add(ctx + norm);
      }
    });
  }
  return result;
}

export async function lintAll(folders = FOLDERS) {
  const results = [];
  for (const f of folders) results.push(await lintFolder(f));
  // selector ownership
  const owner = new Map();
  for (const r of results) {
    if (r.folder === 'dark') continue;
    for (const s of r.selectors) {
      if (owner.has(s) && owner.get(s) !== r.folder) r.errors.push({file: `src/${r.folder}`, msg: `selector "${s}" is already owned by src/${owner.get(s)}`});
      else owner.set(s, r.folder);
    }
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const results = await lintAll(args.length ? args : FOLDERS);
  let errs = 0;
  for (const r of results) {
    errs += r.errors.length;
    console.log(`${r.errors.length ? '✗' : '✓'} ${r.folder}: ${r.errors.length} errors, ${r.warnings.length} warnings, ${r.selectors.size} selectors`);
    for (const e of r.errors.slice(0, 50)) console.log(`   ERROR ${e.file}${e.line ? ':' + e.line : ''} ${e.msg}`);
    if (process.argv.includes('--warnings')) for (const w of r.warnings) console.log(`   warn  ${w.file}:${w.line} ${w.msg}`);
  }
  // FG2-105 page-scope check: LEAKs are warnings here (errors in `build.mjs --strict` / `page-scope-check.mjs --strict`)
  const {pageScopeCheck} = await import('./page-scope-check.mjs');
  const ps = await pageScopeCheck();
  for (const [g, f] of Object.entries(ps.folders)) for (const x of f.rows.filter((r) => r.status === 'LEAK')) console.log(`   warn  page-scope LEAK pages/${g} ${x.scope} (${x.first}) → ${x.leaks.join(', ')}`);
  console.log(`${ps.totals.leaks ? '!' : '✓'} page-scope: ${ps.totals.leaks} LEAK, ${ps.totals.newScopes} NEW, ${ps.totals.dead} DEAD (docs/page-scope-report.md)`);
  if (process.argv.includes('--strict') && ps.totals.leaks) errs++;
  if (process.argv.includes('--json')) fs.writeFileSync(path.join(ROOT, 'dist/lint.json'), JSON.stringify(results.map((r) => ({...r, selectors: r.selectors.size})), null, 1));
  process.exit(errs ? 1 : 0);
}
