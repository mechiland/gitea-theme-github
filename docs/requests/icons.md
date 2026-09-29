# Change requests from `icons` (wave 1, round 1) → integrator

## I-1 Restart Gitea to load the icon overrides
`npm run deploy` copied 17 files to `CUSTOM_PATH/public/assets/img/svg/` (`iconsChanged: 17`, `restartRequired: true`):
2 Octicon upgrades (`octicon-project-template`, `octicon-repo-forked-locked`) + 15 non-Octicon replacements
(list + reasons: docs/icons-audit.md §2, `src/icons/manifest.json`). Global for all themes (by policy §6).
After the restart please re-run `node tools/shoot/shoot.mjs --target gitea --theme github-auto --routes shots/icons-routes.json --schemes light --viewports 1440 --out shots/icons-r2`
— expected non-Octicons left: brand logos only (openid, migrate cards, colorblind markers, gitea-running on actions).

## I-2 Add svgo 4.0.1 (Gitea's version) as devDependency
Why: `src/icons/gen-icons.mjs` reproduces Gitea's `tools/generate-svg.ts` byte-for-byte (verified: 376/376 identical
against octicons 19.28.1) and needs the same svgo. Today it runs with `SVGO_PATH=<dir>` pointing at a scratch install.
```diff
   "devDependencies": {
     "@primer/css": "22.3.2",
     "@primer/octicons": "19.38.0",
     "@primer/primitives": "11.10.0",
     "lightningcss": "1.33.0",
     "playwright": "1.63.0",
     "postcss": "8.5.28",
-    "postcss-import": "17.0.0"
+    "postcss-import": "17.0.0",
+    "svgo": "4.0.1"
   }
```
and optionally `"icons": "node src/icons/gen-icons.mjs"`, plus `node src/icons/gen-icons.mjs --check` in `npm run lint`.

## I-3 `[ui] FILE_ICON_THEME = basic` in app.ini
Why: Gitea 1.27 defaults to `material` file icons (coloured brand/language glyphs with hard-coded fills, see
`shots/icons-r1-repo-home-crop.png`); github.com uses only `octicon-file` / `file-directory-fill` / `file-submodule` /
`file-symlink-file` (verified live, `shots/icons-gh-filelist-*-crop.png`). Source-verified: `basic` renders plain
Octicons via the `svg` helper at every call site (file list, Vue file tree, diff tree) — docs/icons-audit.md §2.1.
```diff
 [ui]
 DEFAULT_THEME = gitea-auto
 THEMES =
+FILE_ICON_THEME = basic
```
Trade-off: global — the Gitea/Modern/Studio themes also lose material icons. Needs a restart. If that is not
acceptable, the theme-scoped CSS fallback is in docs/requests/code.md (C-1); it works either way (it only matches
`svg.git-entry-icon`, which `basic` never emits).

## I-4 Bundle `src/icons/octicon-masks.css` into the token layer
`src/icons/octicon-masks.css` (generated, `:root { --gh-octicon-<name>: url("data:image/svg+xml,…") }`, 13 Octicons,
no colours — lint passes) provides the mask images the component folders need for JS/Vue icons and material file
icons. Proposed: in `build/build.mjs` assemble it right after the tokens (inside `gh.tokens`, both schemes, once in
auto) and exclude these `--gh-octicon-*` vars from token pruning only if they are referenced (they will be by
code/overlays/pages-people). Size ≈ 5 KB unminified.

## I-5 shoot tool: material file icons are not reported as non-Octicons
`lib/audit` counts `svg.svg` without an `octicon-*` class; material file icons carry `octicon-file`
(`<svg class="svg git-entry-icon octicon-file"><use href="#svg-mfi-nodejs">`), so they pass silently.
Proposed: treat `svg.git-entry-icon:has(> use[href^="#svg-mfi-"])` as non-Octicon with name
`material-file:<href minus #svg-mfi->`.

# Round 2 (icons, wave 1) → integrator

## I-6 [major, all folders] Vite re-inserts Gitea's index CSS **unlayered** on pages with lazy chunks
Found while verifying C-1: on repo home and file view, ~1 s after `load`, Vite's preload helper appends
`<link rel="stylesheet" href="/assets/css/index.<hash>.css">` to `<head>`, because a lazily imported chunk
(RepoFileSearch / katex path) lists index.css as a CSS dependency and Vite only de-duplicates against an existing
`link[href=…][rel="stylesheet"]`. Our head only has `rel="preload"` + `@import … layer(gitea)`, so the check misses and
the whole Gitea stylesheet then applies **unlayered** — it beats every `gh.*` layer.
Measured (preview = same markup as `templates/base/head_style.tmpl`, 1440, `shots/icons-r2/unlayered-index-css.json`,
screenshots `shots/icons-r2/unlayered-{light,dark}-{today,fixed}.png`, stacked in `unlayered-light-cmp.png`):
| /octo-org/theme-playground | today (after lazy load) | with fix |
|---|---|---|
| `.repo-button-row .ui.button` height / radius | 30px / 4px (Gitea) | 32px / 6px (controls) |
| Code button | Gitea blue primary | GitHub green primary |
| Directory icon with C-1 applied (light / dark) | rgb(9,105,218) / rgb(68,147,248) | rgb(84,174,255) / rgb(145,152,161) |
Affected pages (checked 8 routes): repo home and file view (`katex`, `RepoFileSearch` → index.css appended). Not
affected: issue, PR files, new issue, contributors, explore, dashboard (their lazy CSS does not list index.css).
This also explains part of the critic's "directory colour" and button measurements on repo pages.
**Fix (verified, `dedupe.mjs` → no unlayered index.css on any of the 8 routes):** add a non-applying stylesheet link
with the same href so Vite's de-duplication finds it; `media="not all"` means it never applies, the bytes are the
already-preloaded file.
```diff
 {{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="preload" as="style" href="{{.}}">{{end}}{{end}}
+{{/* Vite dedupes lazy-chunk CSS deps against link[rel=stylesheet][href]; without this it re-adds index.css unlayered */}}
+{{range StringUtils.Split (StringUtils.ToString (AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css")) "\""}}{{if StringUtils.Contains . ".css"}}<link rel="stylesheet" href="{{.}}" media="not all">{{end}}{{end}}
 <style>@layer gh-important, gitea, gh;{{range …}}@import url("{{.}}") layer(gitea);{{end}}{{end}}</style>
```
and the same in `tools/shoot/lib/preview.mjs` (so PREVIEW mode matches):
```diff
-      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
+      html = html.replace(m[0], `<link rel="preload" as="style" href="${m[1]}"><link rel="stylesheet" href="${m[1]}" media="not all"><style>@layer gh-important, gitea, gh;@import url("${m[1]}") layer(gitea);</style>`);
```
Suggest also a smoke/audit check: fail if `document.querySelector('link[rel=stylesheet][href*="/css/index."]:not([media="not all"])')` exists on a github-* page.

## I-1 (still open) Restart Gitea
As of 00:40 CST `gitea-server` still runs since 23:31; `curl /` still serves the original `gitea-eclipse` path.
Round 2 deploy changed one more file (`material-invert-colors` → `octicon-circle`), `restartRequired: true`.

## I-4 (update) octicon-masks.css now has 15 masks
Added `--gh-octicon-move-to-start` / `--gh-octicon-move-to-end` for navigation N-3 (pagination First/Last).

## I-7 deploy: remove icon files that were deleted from src/icons/svg
`build/build.mjs` copies `src/icons/svg/*.svg` to `CUSTOM_PATH/public/assets/img/svg/` but never deletes. Proposed:
keep `src/icons/manifest.json` as the source of truth — on deploy, delete `CUSTOM_PATH/public/assets/img/svg/<n>.svg`
for any `<n>` listed in the previously deployed manifest (store a copy next to the icons, e.g.
`CUSTOM_PATH/public/assets/img/svg/.gh-icons-manifest.json`) that is no longer in `src/icons/svg`. Never delete
files not in that manifest (other themes may own overrides).
