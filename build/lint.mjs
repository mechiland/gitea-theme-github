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
      if (important && /^(display|visibility)$/.test(d.prop)) result.errors.push({file: path.relative(ROOT, file), line: d.source?.start?.line, msg: `${d.prop} not allowed in gh-important`});
    });
    root.walkRules((r) => {
      if (r.parent?.type === 'atrule' && /keyframes/.test(r.parent.name)) return;
      for (const s of r.selectors) {
        const norm = s.replace(/\s+/g, ' ').trim();
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
  if (process.argv.includes('--json')) fs.writeFileSync(path.join(ROOT, 'dist/lint.json'), JSON.stringify(results.map((r) => ({...r, selectors: r.selectors.size})), null, 1));
  process.exit(errs ? 1 : 0);
}
