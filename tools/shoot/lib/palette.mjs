// Builds the "allowed palette": every color emitted by @primer/primitives
// functional themes (light.css, dark.css) plus the base color scales
// (internalCss/light.css, internalCss/dark.css), resolved to rgba by the browser
// itself (so var() chains, color-mix(), alpha hex, shadows all resolve exactly
// like they would in a page). Cached in .cache/primer-palette-<version>.json.
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from './gitea.mjs';

const PRIMER = path.join(PROJECT_ROOT, 'node_modules/@primer/primitives');
const FILES = {
  light: ['dist/css/functional/themes/light.css', 'dist/internalCss/light.css'],
  dark: ['dist/css/functional/themes/dark.css', 'dist/internalCss/dark.css'],
};

function declarations(file) {
  const txt = fs.readFileSync(path.join(PRIMER, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = {};
  for (const m of txt.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

export async function loadPalette(browser) {
  const version = JSON.parse(fs.readFileSync(path.join(PRIMER, 'package.json'), 'utf8')).version;
  const cacheFile = path.join(PROJECT_ROOT, '.cache', `primer-palette-${version}.json`);
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const result = { version, schemes: {} };
  const page = await browser.newPage();
  for (const [scheme, files] of Object.entries(FILES)) {
    const decls = Object.assign({}, ...files.map(declarations));
    const colors = await page.evaluate((decls) => {
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = ':root{' + Object.entries(decls).map(([k, v]) => `${k}:${v};`).join('') + '}';
      document.head.appendChild(style);
      const probe = document.createElement('div');
      document.body.style.color = 'rgb(1, 2, 3)'; // sentinel: invalid var() falls back to inherited color
      document.body.appendChild(probe);
      const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
      const cx = cvs.getContext('2d', { willReadFrequently: true });
      const norm = (c) => {
        let m = c.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
        if (m) {
          let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
          return `rgba(${Math.round(+m[1])},${Math.round(+m[2])},${Math.round(+m[3])},${+a.toFixed(2)})`;
        }
        cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
        const d = cx.getImageData(0, 0, 1, 1).data;
        return `rgba(${d[0]},${d[1]},${d[2]},${+(d[3] / 255).toFixed(2)})`;
      };
      const colorRe = /(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}\b)/g;
      const found = {};
      for (const name of Object.keys(decls)) {
        for (const [prop, read] of [['color', 'color'], ['box-shadow', 'box-shadow'], ['border-top', 'border-top-color']]) {
          probe.style.cssText = '';
          probe.style.setProperty(prop, `var(${name})`);
          const v = getComputedStyle(probe).getPropertyValue(read);
          if (!v || v === 'none' || v === 'rgb(1, 2, 3)') continue;
          const matches = v.match(colorRe) || [];
          for (const c of matches) {
            const n = norm(c);
            if (n === 'rgba(1,2,3,1)') continue; // currentColor inside a shadow token
            (found[n] ||= new Set()).add(name);
          }
          if (prop === 'color' && matches.length) break; // plain color token resolved
        }
      }
      return Object.fromEntries(Object.entries(found).map(([k, s]) => [k, [...s].slice(0, 6)]));
    }, decls);
    result.schemes[scheme] = colors;
  }
  await page.close();
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(result, null, 1));
  return result;
}
