// Builds a drop-in release package for Gitea's CUSTOM_PATH from an existing `npm run build` output.
//
//   node build/package.mjs            → dist/gitea-theme-github-<version>-gitea<ver>.{zip,tar.gz} + dist/package/
//
// Layout (extract into $GITEA_CUSTOM, e.g. /data/gitea in the official Docker image):
//   public/assets/css/theme-github-{auto,light,dark}.css
//   public/assets/img/svg/*.svg          Octicons 19.38 upgrade + non-Octicon replacements (global, all themes)
//   templates/**                         github-* branches only; other themes render Gitea's upstream bytes
//
// templates/base/head_style.tmpl: the development copy's else-branch also carries a local Modern-theme cache key; the
// package rewrites it to Gitea 1.27.3's upstream two lines and stamps the build revision for cache busting.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, DIST, SRC, THEMES} from './folders.mjs';

const GITEA_VERSION = '1.27.3';
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(DIST, 'build-report.json'), 'utf8'));
const name = `gitea-theme-github-${pkg.version}-gitea${GITEA_VERSION}`;
const out = path.join(DIST, 'package', 'gitea-theme-github');

fs.rmSync(path.join(DIST, 'package'), {recursive: true, force: true});
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), {recursive: true});
  fs.copyFileSync(from, to);
};

for (const theme of Object.keys(THEMES)) {
  copy(path.join(DIST, `theme-${theme}.css`), path.join(out, 'public/assets/css', `theme-${theme}.css`));
}

const iconDir = path.join(SRC, 'icons/svg');
if (fs.existsSync(iconDir)) {
  for (const f of fs.readdirSync(iconDir).filter((x) => x.endsWith('.svg'))) {
    copy(path.join(iconDir, f), path.join(out, 'public/assets/img/svg', f));
  }
}

const UPSTREAM_HEAD_STYLE_ELSE = `{{AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css"}}
<link rel="stylesheet" href="{{ctx.CurrentWebTheme.PublicAssetURI}}">`;
const tplRoot = path.join(ROOT, 'templates');
for (const rel of fs.readdirSync(tplRoot, {recursive: true}).filter((f) => f.endsWith('.tmpl'))) {
  let text = fs.readFileSync(path.join(tplRoot, rel), 'utf8');
  if (rel === path.join('base', 'head_style.tmpl')) {
    const m = text.match(/\{\{else\}\}\n([\s\S]*)\n\{\{end\}\}\s*$/);
    if (!m) throw new Error('head_style.tmpl: else-branch not found');
    text = text.replace(m[1], UPSTREAM_HEAD_STYLE_ELSE).replace(/github_revision=[0-9a-f]+/, `github_revision=${report.revision}`);
  }
  fs.mkdirSync(path.dirname(path.join(out, 'templates', rel)), {recursive: true});
  fs.writeFileSync(path.join(out, 'templates', rel), text);
}

for (const f of ['LICENSE', 'NOTICE']) copy(path.join(ROOT, f), path.join(out, f));
fs.writeFileSync(path.join(out, 'INSTALL.md'), `# gitea-theme-github ${pkg.version} (for Gitea ${GITEA_VERSION})

1. Copy the contents of this folder into Gitea's custom directory (\`$GITEA_CUSTOM\`, \`/data/gitea\` in the official
   Docker image), keeping the paths: \`public/…\` and \`templates/…\`.
2. In \`app.ini\`, add the themes to \`[ui] THEMES\` (keep the ones you use), e.g.
   \`THEMES = gitea-auto,gitea-light,gitea-dark,github-auto,github-light,github-dark\`
   and optionally \`DEFAULT_THEME = github-auto\`.
3. Restart Gitea once (new theme files and icons are read at startup).
4. Pick "GitHub" in Settings → Appearance.

Theme files: ${Object.entries(report.themes).map(([n, t]) => `${n} ${t.kb} KB`).join(', ')} · build ${report.revision}.
The templates are copies of Gitea ${GITEA_VERSION} templates with added github-only blocks; re-check them when upgrading Gitea.
If you already override one of these templates, merge the github-* blocks by hand.
The SVG files replace Gitea's icons for every theme (same meaning, Octicon drawings).
`);

fs.mkdirSync(DIST, {recursive: true});
for (const f of [`${name}.zip`, `${name}.tar.gz`]) fs.rmSync(path.join(DIST, f), {force: true});
execFileSync('tar', ['-czf', path.join(DIST, `${name}.tar.gz`), '-C', out, '.']);
execFileSync('zip', ['-qr', path.join(DIST, `${name}.zip`), '.'], {cwd: out});
console.log(`packaged ${name} (.zip, .tar.gz) from build ${report.revision}`);
