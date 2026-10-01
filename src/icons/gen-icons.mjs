#!/usr/bin/env node
// Generates server-side icon overrides for Gitea 1.27.3 into src/icons/svg/ (deployed by `npm run deploy`
// to CUSTOM_PATH/public/assets/img/svg; Gitea reads them once at startup → a restart is needed).
//
// 1. Octicons upgrade: every octicon-*.svg Gitea ships (gitea-src/public/assets/img/svg) is regenerated from
//    @primer/octicons (pinned 19.38.0) exactly the way Gitea's own tools/generate-svg.ts does it (svgo 4.0.1,
//    same plugin list). Only files whose bytes differ from Gitea's are written.
// 2. Replacements (RESTORED is empty since w2 r1: deploy deletes retired overrides, I-7): purely presentational non-Octicon icons (gitea-*, fontawesome-*, material-* UI glyphs) are
//    replaced by the closest Octicon drawing. The file keeps its original name and class (`svg <name>`) so
//    Gitea's CSS/JS hooks still match, plus an `octicon-<x>` class so audits see it's an Octicon.
//    Decisions + reasons: docs/icons-audit.md.
//
// Usage:
//   node src/icons/gen-icons.mjs                      # write src/icons/svg/*.svg + src/icons/manifest.json
//   node src/icons/gen-icons.mjs --check              # verify only: exit 1 if src/icons/svg is stale
//   node src/icons/gen-icons.mjs --data-uri-masks     # every mask as a data URI (pre-loop-2 encoding; pixel-diff baselines only)
//   node src/icons/gen-icons.mjs --octicons <dir> --out <dir> --no-replace
//        (fidelity test: point at octicons 19.28.1's build/svg → must emit 0 files, i.e. byte-identical to Gitea)
// svgo: resolved from the project (`svgo@4.0.1`, Gitea's version) or from $SVGO_PATH (a directory containing
// node_modules/svgo, or the svgo package dir itself).

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(name);

const GITEA_SRC = path.resolve(opt('--gitea-src', path.resolve(ROOT, '../gitea-src-1.27.3')));
const GITEA_SVG = path.join(GITEA_SRC, 'public/assets/img/svg');
const OCTICONS = path.resolve(opt('--octicons', path.join(ROOT, 'node_modules/@primer/octicons/build/svg')));
const OUT = path.resolve(opt('--out', path.join(HERE, 'svg')));
const CHECK = flag('--check');
const NO_REPLACE = flag('--no-replace');
const DATA_URI_MASKS = flag('--data-uri-masks'); // pre-L2b encoding (every mask a data URI), for pixel-diff baselines
const SVGO_VERSION = '4.0.1'; // Gitea 1.27.3 package.json

// Non-Octicon → Octicon replacements (server-rendered only; JS/Vue copies are baked into Gitea's bundle).
// See docs/icons-audit.md for the full audit, including the icons that are deliberately kept.
export const REPLACEMENTS = {
  'gitea-exclamation': 'alert', // commit status error/warning
  'gitea-eclipse': 'device-desktop', // theme menu: "auto" (follow system) scheme
  'gitea-whitespace': 'gear', // diff whitespace options button (GitHub: diff settings gear)
  'gitea-split': 'split-view', // diff: switch to split view
  'gitea-join': 'rows', // diff: switch to unified view
  'gitea-lock': 'verified', // commit signature verified (known user)
  'gitea-lock-cog': 'shield-check', // commit signature verified by instance/trusted key
  'gitea-unlock': 'unlock', // commit signature not verified OR commit not signed (commit_page.tmpl:174) → keep Gitea's
  //   meaning ("open padlock") in every theme; GitHub themes: data-display masks the signed-but-unverified case
  //   (`.commit-sign-badge.commit-is-signed .svg.gitea-unlock`) with --gh-octicon-unverified, D-4 hides unsigned.
  //   (w1 used `unverified`, which told Gitea-theme users an unsigned commit was "Unverified": critic w2r0 #1.)
  'fontawesome-save': 'check', // "Save" buttons in label/push-mirror modals
  'fontawesome-send': 'key', // access-token list item icon (32px)
  'material-invert-colors': 'circle', // commit graph: monochrome (hollow = "no colour"; circle-slash read as "blocked")
  'material-palette': 'paintbrush', // commit graph: colored
  'material-folder-symlink': 'file-directory-symlink', // symlink to directory (material file-icon theme)
};

// Retired overrides re-emitted with Gitea's ORIGINAL bytes. Empty since wave 2 r1: deploy now deletes files it placed
// earlier that are no longer in src/icons/svg (integrator I-7, `.gh-icons-manifest.json`), so a withdrawn override
// simply disappears and Gitea serves its bundled copy. (w1 r4 listed gitea-double-chevron-left/right here.)
export const RESTORED = [];

// Octicons exported as CSS mask data-URIs (src/icons/octicon-masks.css → `--gh-octicon-<name>`), for icons that
// cannot be replaced by a file: Vue/JS-bundled icons and material file icons (<svg class="git-entry-icon"><use>).
// Recipe (in the owning folder): `svg.X { background: currentColor; mask: var(--gh-octicon-Y) center / contain no-repeat }`
// + `svg.X > * { visibility: hidden }` (or `fill: transparent`). 16px drawings; scale with the element.
export const MASKS = [
  'alert', 'stop', 'x-circle', 'info', 'check-circle', 'arrow-left', 'arrow-right', 'move-to-start', 'move-to-end',
  'file', 'file-directory-fill', 'file-directory-open-fill', 'file-submodule', 'file-symlink-file', 'file-directory-symlink',
  'unverified', // w2 r1: signed-but-unverified commit badge in GitHub themes (data-display D-5)
  'issue-opened', 'git-pull-request', 'milestone', 'telescope', 'search', // w2 r1: navigation NI-1 (AppHeader icon buttons)
  // final gate #1 (L1 r1) — requested or needed by open FG items (pruned from the bundle until a folder references one):
  'book', 'home', 'people', // pages/people PPL-I1 (FG-052 profile/org Overview tab, followers line)
  'plus', 'dash', 'screen-full', // pages/actions-packages-projects APK-M1 (FG-038 workflow-graph controls)
  'chevron-right', 'chevron-down', 'chevron-up', // settings-admin SA-6 (token <details>), navigation FG-117 (NavList groups)
  'person', 'person-fill', // data-display FG-011 (default-avatar placeholder)
  'three-bars', // navigation (AppHeader hamburger, JS/Vue copies)
  'code', 'tag', // pages/repo FG-086 (commit-row browse button), FG-095 (Tags Box header)
  'file-diff', 'eye', // icons FG-114 (PR "Files changed" tab), FG-091 (colorblind theme markers)
  'table', // icons L1 r2: Projects tabs (profile/org/repo nav) — github.com uses octicon-table, Gitea project(-symlink)
  // navigation FG-050: leading visuals of the settings / org / repo / admin NavLists (mapping in docs/icons-audit.md §5)
  'gear', 'paintbrush', 'shield-lock', 'key', 'key-asterisk', 'apps', 'organization', 'repo', 'package', 'play',
  'webhook', 'server', 'mail', 'bell', 'blocked', 'git-branch', 'globe', 'terminal', 'file-binary', 'checklist',
  'id-badge', 'sliders', 'meter', 'pulse', 'graph', 'clock', 'stack', 'cpu',
  // loop 2 (integrator L2b): controls CT-IC-1 (date input indicator), code CODE-L2-1 (Permalink / History IconButtons),
  // data-display DD-IC-1 (DataTable sort arrows, swap in src/icons/sort-arrows.css), pages/auth PA-L2-IC1 (24px Blankslate)
  'calendar', 'link', 'history', 'arrow-up', 'arrow-down', 'alert-24',
];

async function loadSvgo() {
  const tries = [];
  try {
    const m = await import('svgo');
    return m;
  } catch (e) {
    tries.push(`import('svgo'): ${e.code || e.message}`);
  }
  const base = process.env.SVGO_PATH;
  if (base) {
    for (const dir of [path.join(base, 'node_modules/svgo'), base]) {
      const entry = path.join(dir, 'lib/svgo-node.js');
      if (fs.existsSync(entry)) {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
        if (pkg.version !== SVGO_VERSION) console.warn(`warning: svgo ${pkg.version} (Gitea uses ${SVGO_VERSION}) — output may differ`);
        return import(pathToFileURL(entry).href);
      }
      tries.push(`${entry}: not found`);
    }
  }
  throw new Error(`svgo ${SVGO_VERSION} not found (${tries.join('; ')}). Install it (npm i -D svgo@${SVGO_VERSION}) or set SVGO_PATH.`);
}

// Exact copy of Gitea's processAssetsSvgFile() plugin list (tools/generate-svg.ts), with extra classes appended
// after `svg <name>` for replacements.
function giteaOptimize(optimize, src, name, extraClasses = []) {
  const {data} = optimize(src, {
    plugins: [
      {name: 'preset-default'},
      {name: 'removeDimensions'},
      {name: 'removeTitle'},
      {name: 'prefixIds', params: {prefix: () => name}},
      {name: 'addClassesToSVGElement', params: {classNames: ['svg', name, ...extraClasses]}},
      {
        name: 'addAttributesToSVGElement', params: {
          attributes: [
            {'xmlns': 'http://www.w3.org/2000/svg'},
            {'width': '16'}, {'height': '16'}, {'aria-hidden': 'true'},
          ],
        },
      },
    ],
  });
  return data;
}

async function main() {
  const {optimize} = await loadSvgo();
  if (!fs.existsSync(GITEA_SVG)) throw new Error(`Gitea icons not found: ${GITEA_SVG}`);
  const giteaFiles = fs.readdirSync(GITEA_SVG).filter((f) => f.endsWith('.svg')).sort();
  const out = new Map(); // file → content
  const manifest = {generator: 'src/icons/gen-icons.mjs', octicons: readOcticonsVersion(), svgo: SVGO_VERSION,
    giteaIcons: giteaFiles.length, upgraded: [], unchanged: 0, replaced: {}, missing: []};

  // 1. upgrade every octicon Gitea ships
  for (const f of giteaFiles.filter((x) => x.startsWith('octicon-'))) {
    const name = f.slice(0, -4);
    const src = path.join(OCTICONS, `${name.slice('octicon-'.length)}-16.svg`);
    if (!fs.existsSync(src)) { manifest.missing.push(name); continue; }
    const data = giteaOptimize(optimize, fs.readFileSync(src, 'utf8'), name);
    const orig = fs.readFileSync(path.join(GITEA_SVG, f), 'utf8');
    if (data === orig) { manifest.unchanged++; continue; }
    out.set(f, data);
    manifest.upgraded.push(name);
  }

  // 2. replace presentational non-Octicons with an Octicon drawing (same file name, original class kept)
  if (!NO_REPLACE) {
    for (const [name, octicon] of Object.entries(REPLACEMENTS)) {
      if (!giteaFiles.includes(`${name}.svg`)) throw new Error(`${name}.svg is not a Gitea icon`);
      const src = path.join(OCTICONS, `${octicon}-16.svg`);
      if (!fs.existsSync(src)) throw new Error(`octicon ${octicon} not in ${OCTICONS}`);
      out.set(`${name}.svg`, giteaOptimize(optimize, fs.readFileSync(src, 'utf8'), name, [`octicon-${octicon}`]));
      manifest.replaced[name] = `octicon-${octicon}`;
    }
  }

  // 3. retired overrides → Gitea's original bytes (see RESTORED)
  manifest.restored = [];
  if (!NO_REPLACE) {
    for (const name of RESTORED) {
      if (REPLACEMENTS[name]) throw new Error(`${name} is both replaced and restored`);
      const orig = path.join(GITEA_SVG, `${name}.svg`);
      if (!fs.existsSync(orig)) throw new Error(`${name}.svg is not a Gitea icon`);
      out.set(`${name}.svg`, fs.readFileSync(orig, 'utf8'));
      manifest.restored.push(name);
    }
  }

  // sanity: every emitted root must carry class="svg <name> …", width/height 16, aria-hidden, no root fill
  for (const [f, data] of out) {
    const root = data.slice(0, data.indexOf('>') + 1);
    const name = f.slice(0, -4);
    const problems = [];
    if (!new RegExp(`class="svg ${name}( |")`).test(root)) problems.push('class');
    if (!/ width="16" height="16"/.test(root)) problems.push('size');
    if (!/aria-hidden="true"/.test(root)) problems.push('aria-hidden');
    if (/\sfill=/.test(root)) problems.push('root fill');
    if (!/viewBox="/.test(root)) problems.push('viewBox');
    if (problems.length) throw new Error(`${f}: bad root (${problems.join(', ')}): ${root}`);
  }

  // 4. mask images. Loop 2 (integrator L2b, budget): an Octicon that Gitea itself serves from /assets/img/svg
  // (every 16px octicon-<name>.svg of 1.27.3; the upgraded 19.38.0 drawing when deploy placed one in CUSTOM_PATH, i.e.
  // exactly the drawing written into src/icons/svg above) is referenced by URL, relative to the theme file
  // (/assets/css/theme-github-*.css → ../img/svg/, works under a sub-path ROOT_URL): same drawing, ~45 B instead of
  // ~500 B per mask, one cached same-origin request (Cache-Control 6h) the first time a page shows it (NAV-I6
  // precedent). Anything Gitea does not ship (size-suffixed drawings like alert-24) stays a data URI.
  let masks = '/* generated by src/icons/gen-icons.mjs — Octicons ' + readOcticonsVersion() + ' (MIT) as CSS mask images */\n:root {\n';
  for (const n of MASKS) {
    const sized = /-(12|16|24|48)$/.test(n);
    if (!sized && !DATA_URI_MASKS && giteaFiles.includes(`octicon-${n}.svg`)) {
      masks += `  --gh-octicon-${n}: url("../img/svg/octicon-${n}.svg");\n`;
      continue;
    }
    const src = path.join(OCTICONS, sized ? `${n}.svg` : `${n}-16.svg`);
    if (!fs.existsSync(src)) throw new Error(`mask octicon ${n} missing`);
    const {data} = optimize(fs.readFileSync(src, 'utf8'), {plugins: [{name: 'preset-default'}, {name: 'removeDimensions'}]});
    const uri = data.replace(/"/g, "'").replace(/[<>#%]/g, (c) => encodeURIComponent(c));
    masks += `  --gh-octicon-${n}: url("data:image/svg+xml,${uri}");\n`;
  }
  masks += '}\n';
  const MASKS_FILE = path.join(HERE, 'octicon-masks.css');

  const summary = `${manifest.upgraded.length} upgraded, ${manifest.unchanged} identical to Gitea, ` +
    `${Object.keys(manifest.replaced).length} replaced, ${manifest.restored.length} restored to Gitea's original, ` +
    `${manifest.missing.length} missing in octicons`;

  if (CHECK) {
    const have = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((x) => x.endsWith('.svg')).sort() : [];
    const want = [...out.keys()].sort();
    const stale = want.filter((f) => !have.includes(f) || fs.readFileSync(path.join(OUT, f), 'utf8') !== out.get(f));
    const extra = have.filter((f) => !out.has(f));
    if (!fs.existsSync(MASKS_FILE) || fs.readFileSync(MASKS_FILE, 'utf8') !== masks) stale.push('octicon-masks.css');
    if (stale.length || extra.length) {
      console.error(`icons stale: ${stale.length} differ/missing, ${extra.length} extra (${[...stale, ...extra].slice(0, 10).join(', ')})`);
      process.exit(1);
    }
    console.log(`icons up to date (${summary})`);
    return;
  }

  fs.mkdirSync(OUT, {recursive: true});
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.svg'))) {
    if (!out.has(f)) fs.unlinkSync(path.join(OUT, f)); // directory is fully generated
  }
  for (const [f, data] of out) fs.writeFileSync(path.join(OUT, f), data);
  if (OUT === path.join(HERE, 'svg')) {
    fs.writeFileSync(MASKS_FILE, masks);
    fs.writeFileSync(path.join(HERE, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  }
  console.log(`${out.size} files → ${path.relative(process.cwd(), OUT) || OUT} (${summary})`);
  if (manifest.missing.length) console.log(`missing: ${manifest.missing.join(', ')}`);
}

function readOcticonsVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(OCTICONS, '../../package.json'), 'utf8')).version;
  } catch {
    return 'unknown';
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
