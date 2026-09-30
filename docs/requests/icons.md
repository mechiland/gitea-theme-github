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

# Round 3 (icons, wave 1)

## I-1 (still open) Restart Gitea
At 01:05 CST `gitea-server` still runs since 2026-09-29T15:31:18Z (23:31 CST); `curl /` serves the original icons and
`theme-gitea-auto`. Round 3 deploy rewrote `gitea-double-chevron-left/right` (now `move-to-start` / `move-to-end`); all 17
files in `CUSTOM_PATH/public/assets/img/svg/` are byte-identical to `src/icons/svg/` (cmp). Restart required.
Order: I-6 should land with or before the restart, since without it repo home / file view keep Gitea's unlayered CSS.

## I-6 (still open) — re-verified in the round-3 simulation
`shots/icons-r3-sim.mjs` (waits 1.8 s after load): repo home without the fix → 1 unlayered `link[href*=/css/index.]`,
directories rgb(9,105,218) / rgb(68,147,248); with the `media="not all"` link → 0 unlayered, directories
rgb(84,174,255) / rgb(145,152,161) with C-1 applied (`shots/icons-r3/cmp-c.png`, `sim/report.json` tags
`filelist-*`). Diff unchanged from round 2 above.

## P-1 → pages/issues-prs: PR-list "base ← head" glyph (12px)
`shared/issuelist.tmpl:68` renders `{{svg "gitea-double-chevron-left" 12}}` between base and head branch in every PR
list row (`#issue-list .item .branches`). The server file is now `octicon-move-to-start` (right for pagination, its
other two uses). After the restart the PR list reads `main ⇤ head`; github.com's compare view uses `arrow-left`.
Proposed (needs `--gh-octicon-arrow-left` from `src/icons/octicon-masks.css`, I-4):
```css
#issue-list .branches > .svg.gitea-double-chevron-left { background-color: currentColor; mask: var(--gh-octicon-arrow-left) center / contain no-repeat; }
#issue-list .branches > .svg.gitea-double-chevron-left > * { visibility: hidden; }
```
Verified by injection on /octo-org/theme-playground/pulls?state=all, light/dark × 1440/390: `mask: true`, 12×12,
background = currentColor rgb(89,99,110) light / rgb(145,152,161) dark, reads `main ← head`
(`shots/icons-r3/cmp-a.png`, `cmp-b.png`, report `shots/icons-r3/sim/report-pulls-branches.json`).
(github.com's PR list shows no branches at all; hiding `.branches` would be the stricter parity option — owner's call.)

## I-4 (update) mask users
Still 15 masks. Consumers: P-1 (`arrow-left`), pages/people dashboard pagination (`move-to-start/end`), overlays toasts
(`alert`, `x-circle`, `info`, `check-circle`, `stop`), code C-2 (`file*`). navigation N-3 no longer needs them.

# Round 4 (icons, wave 1)

## I-1 (still open) Restart Gitea
At 01:25 CST (2026-09-29T17:24Z) `gitea-server` still runs since 2026-09-29T15:31:18Z; `curl /` serves `gitea-eclipse`.
Round 4 deploy: `iconsChanged: 2`, `restartRequired: true`. The two changed files are `gitea-double-chevron-left/right`,
now **byte-identical to Gitea's originals** (see below). All 17 files in `CUSTOM_PATH/public/assets/img/svg/` = `src/icons/svg/` (cmp).
Land I-6 with or before the restart.

## I-7 (update, now load-bearing) deploy must delete retired icon files
Round 4 withdraws the `gitea-double-chevron-left/right` overrides (critic r3 issue A: the round-3 `move-to-start`
file rendered `main ⇤ head` in every PR row of Gitea's own themes). Because deploy never deletes, simply removing the
files from `src/icons/svg` would have left the round-3 drawing in `CUSTOM_PATH` for the restart. Interim workaround in
my folder: `gen-icons.mjs` `RESTORED` list re-emits Gitea's **original** bytes for these two names, so the deployed
copies are the originals (verified `cmp` against gitea-src). When I-7 lands, I drop the names from `RESTORED` and the
deploy deletes the two files. Alternative if you prefer to clean up now (after that change):
`rm CUSTOM_PATH/public/assets/img/svg/gitea-double-chevron-{left,right}.svg` (Gitea then serves its bundled copy,
same bytes).
Also still open from the critic: `restartRequired` should stay `true` while the running server predates the newest
icon/theme file in CUSTOM_PATH (compare `docker inspect … StartedAt` with the files' mtimes), not only when the current
deploy changed something.

## I-5 (update) audit: masked glyphs
Masked icons keep their Gitea class (e.g. `svg.gitea-double-chevron-left` masked to `move-to-start`), so
`icons.nonOcticon` keeps counting them. Proposed: treat an `svg.svg` whose computed `mask-image` is a
`data:image/svg+xml` URL as Octicon (name `mask:<original>`), and report those separately as `icons.masked`.

## P-1 (update) → pages/issues-prs: now an improvement, not a repair
The server file `gitea-double-chevron-left` is Gitea's original `«` again. After the restart the PR list reads
`main « head` in every theme, exactly as today. P-1's CSS is unchanged and still recommended for GitHub themes
(github.com's compare view uses `arrow-left`): sim r4 `proposals` = `main ← head`, mask applied, 12×12,
rgb(89,99,110) light / rgb(145,152,161) dark (`shots/icons-r4/cmp-pag-branches.png`,
`shots/icons-r4/sim/report-pulls-branches+pagination+footer-theme.json`).

## I-4 (update) mask users
Consumers: navigation N-3 (reinstated: `move-to-start`, `move-to-end`), P-1 (`arrow-left`), pages/people dashboard
pagination (`move-to-start/end`), overlays toasts (`alert`, `x-circle`, `info`, `check-circle`, `stop`), code C-2 (`file*`).

# Integrator (between wave 1 and wave 2, 2026-09-30)

- **I-1 — DONE.** Gitea restarted 2026-09-29T18:30:06Z (no migration task running). `curl /` now serves
  `svg gitea-eclipse octicon-device-desktop`. Logged-out spot check with cookie `gitea_theme=gitea-auto` and
  `github-auto` on 8 routes (`shots/integrate-icons-spot.mjs`, `shots/integrate-w1/icons-spot/report.json`): 0 broken
  icons (every visible svg.svg has a box and a drawing) in either theme; graph Mono/Color render circle/paintbrush in
  gitea-auto; the PR list keeps Gitea's original `«` in both (RESTORED copies).
- **I-2 — ACCEPTED, install PENDING.** Adding `svgo@4.0.1` needs a network `npm install` (package download), which
  this pass did not perform; the orchestrator/user should run `npm i -D -E svgo@4.0.1`. Until then keep SVGO_PATH.
- **I-3 — REJECTED.** `FILE_ICON_THEME = basic` is global: it removes material file icons from the Gitea, Modern and
  Studio themes, which other sessions own (CONTEXT.md). The theme-scoped route exists: code C-1 (colours) + C-2 (masks)
  now that I-4 ships the masks. Code gets this in its wave-2 brief.
- **I-4 — DONE.** `build/build.mjs` reads `src/icons/octicon-masks.css` and emits it once inside `gh.tokens` (all three
  themes). Only `--gh-octicon-*` properties that some folder references via `var(--gh-octicon-…)` are kept
  (`--no-prune` keeps all); `dist/build-report.json → octiconMasks {used, defined}`; a referenced but undefined mask
  prints a warning. Today 0 are referenced, so 0 bytes are added.
- **I-5 — DONE.** `tools/shoot/lib/audit.mjs`: `svg` with `<use href="#svg-mfi-…">` counts as non-Octicon
  `material-file:<name>`; an svg whose computed mask-image is an SVG data URI counts as Octicon and is listed under
  `icons.masked` (`mask:<original>`). `summary.json` has `totals.nonOcticonIcons`, `totals.maskedIcons`,
  `maskedIcons[]`, and a new per-page `unlayeredGiteaCss` (I-6 regression check, also added to `problems`).
- **I-6 — see foundation #1: PARTIAL** (project template + preview.mjs done; live template install pending approval).
- **I-7 — DONE.** Deploy writes `CUSTOM_PATH/public/assets/img/svg/.gh-icons-manifest.json` (the files it placed) and,
  on the next deploy, deletes only files listed there that are no longer in `src/icons/svg` (never anything else);
  reported as `deploy.iconsRemoved`, and it sets `restartRequired`. The manifest was written by today's deploy, so you can
  drop the RESTORED names now: the next deploy deletes the two chevron files (Gitea then serves its bundled copies).
- **restartRequired (critic r3/r4) — DONE.** Deploy also sets `restartRequired` (+ `restartReason`) when any deployed
  icon file is newer than `docker inspect gitea-server .State.StartedAt`, not only when this deploy changed something.
- **P-1 pointer:** created docs/requests/pages-issues-prs.md. **C-3 ID collision** in code.md: the round-4 "Diff
  toolbar icon buttons" item is renamed C-4 there.

# Icons builder — wave 2, round 1 (status)
- I-1 DONE (integrator restart 2026-09-29T18:30Z). A new restart is needed for w2 r1 → integrator.md II-1.
- I-2 still pending install → reminder integrator.md II-2.
- I-3 REJECTED — accepted; material file icons are handled by code C-1/C-2 (masks available).
- I-4 DONE — masks now 21 (added `unverified` for data-display D-5; issue-opened, git-pull-request, milestone, telescope, search for navigation NI-1).
- I-5 DONE — used in this round's audit (`material-file:*`, `maskedIcons`).
- I-6 PARTIAL (integrator) — not icons-owned.
- I-7 DONE — used: `RESTORED` emptied; w2 r1 deploy removed the two chevron copies (`iconsRemoved`).
- P-1 open at pages/issues-prs; parity alternative P-2 filed there. N-5 (hide First/Last, parity) filed at navigation.

# Integrator (end of wave 2, 2026-09-30)
- **II-1 — DONE:** restart 2026-09-29T20:11:56Z; gitea-auto shows `octicon-unlock` for unsigned commits (curl verified).
- **I-6 — DONE (live)**, see foundation.md #1. **I-2/II-2 — PENDING** (ORC-2 in ORCHESTRATOR.md, package download).
- Audit after restart (shots/integrate-w2, 272 pages): nonOcticon 96 = PR-list `gitea-double-chevron-left` 48 (4 pages,
  pages/issues-prs P-1/P-2 in wave 3), colorblind markers 28, fontawesome-openid 8, gitea-npm 8, gitea-running 4;
  masked 1832; material file icons 0 unmasked.


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-091 [theme-fixable-css] Non-Octicon icons left: gitea-running (Actions status filter), gitea-colorblind-* (theme menu)** — impact 4 (judges 0, critic wt 4; routes: actions-list, user-settings-appearance)
   - Fix: CSS masks with Octicons (dot-fill / sync for running; eye for colorblind) in github themes; brand logos (gitea-gitea, feishu, matrix, npm) stay by §6.
   - Critic refs: C048 (actions-list, minor), C084 (user-settings-appearance, nit)
   - PNG: `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`, `shots/final-gate/user-settings-appearance/dark-1440.png`, `shots/final-gate/user-settings-appearance/light-1440.png`
   - **DONE (icons L1 r1)** — colorblind markers → `eye` mask (`src/icons/theme-menu.css`); `gitea-running` kept: it *is* github.com's in-progress icon (same paths, fgColor-attention, 1s rotation — re-verified, docs/icons-audit.md §5); audit reclassification asked (integrator IC-2). Live once integrator IC-1 registers the icons layer.
2. **FG-114 [theme-fixable-css] PR 'Files Changed' tab uses octicon-diff (bare ±); github.com uses file-diff** — impact 1 (judges 0, critic wt 1; routes: repo-pull)
   - Fix: Mask with --gh-octicon-file-diff (navigation applies it on the tab).
   - Critic refs: C142 (repo-pull, nit)
   - PNG: `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`
   - **DONE (icons L1 r1)** — `src/icons/pr-tabs.css` masks the tab's octicon-diff with `file-diff` (icons owns it, navigation needn't); live once integrator IC-1 lands. Sim `shots/icons-l1r1/sim/cmp-repo-pull.png`.

# From pages/people (final gate #1, wave L1 round 1) — PPL-I1: mask `book` (FG-052)
What: add `book` to `MASKS` in src/icons/gen-icons.mjs (→ `--gh-octicon-book` in src/icons/octicon-masks.css).
Why: FG-052 — github.com's profile Overview tab icon is octicon-book, Gitea renders octicon-info
(templates/user/overview/header.tmpl:5). src/pages/people/profile.css already references
`var(--gh-octicon-book, inherit)` on `.user.profile overflow-menu .item > .octicon-info`; every declaration there is
written so that it is invalid while the mask is missing (Gitea's info icon stays, no blank or square glyph), so it
switches on by itself once the mask exists — no further change in pages/people.
Proposed diff (src/icons/gen-icons.mjs, MASKS array): `+  'book',`
(Optional, same technique, not referenced yet: `home` for the org Overview tab and `people` for the profile
followers line — github.com uses both; say if you add them and pages/people will reference them.)
- **DONE (icons L1 r1)** — `book`, `home`, `people` added; `book` is live since deploy 9ee594a4be (Overview tab shows the book, `shots/icons-l1r1/live/cmp-live.png`).

# From pages/actions-packages-projects (final gate #1, loop 1 — FG-038)
## APK-M1 — three more Octicon masks: `plus`, `dash`, `screen-full`
- **What:** add `'plus', 'dash', 'screen-full'` to `MASKS` in `src/icons/gen-icons.mjs` and regenerate
  `src/icons/octicon-masks.css` (no SVG file changes, no restart).
- **Why:** FG-038 (judges: "zoom icons … instead of bottom-right fullscreen/-/+"). github.com's workflow-graph controls
  are `octicon-screen-full` + a `dash | plus` ButtonGroup; Gitea's Vue WorkflowGraph bundles `octicon-sync`,
  `octicon-zoom-out`, `octicon-zoom-in` (JS, not overridable by file). `src/pages/actions-packages-projects/action-run.css`
  already references `var(--gh-octicon-screen-full|dash|plus)` on `.graph-controls .svg.octicon-{sync,zoom-out,zoom-in}`
  with a safe fallback (the `background` layer only resolves when the var exists), so today the original magnifier
  icons still show; once the masks exist the buttons show the GitHub glyphs. The build currently warns
  `! --gh-octicon-plus is referenced but not defined` (×3) — expected until this lands.
- **Diff:**
```diff
-  'issue-opened', 'git-pull-request', 'milestone', 'telescope', 'search', // w2 r1: navigation NI-1 (AppHeader icon buttons)
+  'issue-opened', 'git-pull-request', 'milestone', 'telescope', 'search', // w2 r1: navigation NI-1 (AppHeader icon buttons)
+  'plus', 'dash', 'screen-full', // FG-038: Actions workflow-graph zoom controls (pages/actions-packages-projects)
```
- **DONE (icons L1 r1)** — added; live since deploy 9ee594a4be: the graph controls render screen-full / dash / plus, 16×16, fgColor-muted, both schemes (`shots/icons-l1r1/live/cmp-live.png`, `live/report.json`).

# From pages/repo (final gate #1 loop 1, round 1)
## PR-IC-1: two Octicon masks for pages/repo (FG-086, FG-095)
Please add to `src/icons/octicon-masks.css` (same generator as the existing 21 masks):
- `--gh-octicon-code` (octicon `code`, 16px) — FG-086: commit rows' browse button renders `octicon-file-code`
  (templates/repo/commits_list.tmpl `a.view-commit-path > svg.octicon-file-code`); github.com uses `code` (<>).
  pages/repo would then add `#commits-table .view-commit-path > .svg { mask: var(--gh-octicon-code) center / 16px no-repeat; background: currentColor }`
  (the path fill is hidden by `fill: transparent` in the same rule).
- `--gh-octicon-tag` (octicon `tag`, 16px) — FG-095: `::before` icon in the tags Box header.
Not implemented in this round because referencing an undefined mask var would be flagged as an unresolved variable.
Note also: pages/repo is at 31,740 B of its 31 KiB cap, so each of these needs an equal trim first.
- **DONE (icons L1 r1)** — `--gh-octicon-code` and `--gh-octicon-tag` exist (catalogue `shots/icons-l1r1/masks-catalogue.png`); each is pruned until referenced (code 0.45 KB, tag 0.49 KB once used).

# From pages/people (final gate #1, wave L1 round 2) — PPL-I2: mask `table`
github.com's user and org "Projects" tab uses octicon-table (Gitea: octicon-project-symlink). pages/people already
references `--gh-octicon-table` in src/pages/people/profile.css (guarded: inert while the mask does not exist), so please
add `table` to the generated masks (src/icons/gen-icons.mjs list). `home` is now referenced too (org Overview tab).

# Icons builder — wave L1, round 2 (status)
- FG-091 (colorblind): **changed to "marker hidden"** (`display: none`, github.com has no marker). The critic noted that
  `eye` made both variants identical and means "watch". The description line still names the variant. **Not live until
  integrator IC-1.** Audit reclassification of hidden svgs → integrator IC-4.
- FG-091 (`gitea-running`): kept, as it matches github.com. Audit → integrator IC-2 (still open).
- FG-114: unchanged (`file-diff`). **Not live until IC-1.** IC-1 reminder filed.
- New: `table` mask (66 masks). The repo Projects tab and the overflow popup → `table` (`nav-tabs.css`, waits on IC-1).
  The profile/org tabs were already swapped by pages/people and went live with this deploy.
- Evidence: `docs/icons-audit.md` §5 "L1 round 2", `shots/icons-l1r2/`.

# From data-display (final gate #2, wave L2 round 1) — DD-IC-1: DataTable sort arrows (FG2-075, critic C138)
Gitea's `SortArrow` helper (modules/templates/util_misc.go:28) renders a filled `octicon-triangle-up` (ascending) /
`octicon-triangle-down` (descending, and the default column) inside `th[data-sortt-asc]` of the admin tables
(admin/emails, admin/user, admin/orgs, admin/repos …). Primer DataTable marks the sorted column with `arrow-up` /
`arrow-down` (16px, --fgColor-muted). This is a theme-scoped Octicon swap (your `gh.icons` pattern), so please:
1. add `arrow-up` and `arrow-down` to the generated masks (src/icons/gen-icons.mjs list);
2. swap them in the table header only (the triangles elsewhere are dropdown carets and must stay):
```css
th[data-sortt-asc] > .svg.octicon-triangle-up,
th[data-sortt-asc] > .svg.octicon-triangle-down {
  background-color: currentColor;
  mask: var(--gh-octicon-arrow-up) center / contain no-repeat;
}
th[data-sortt-asc] > .svg.octicon-triangle-down { mask-image: var(--gh-octicon-arrow-down); }
th[data-sortt-asc] > .svg:is(.octicon-triangle-up, .octicon-triangle-down) > * { visibility: hidden; }
```
Not done in data-display: the masks do not exist yet, and a `var(--gh-octicon-arrow-up)` with no definition would paint
a solid currentColor square. Evidence: shots/data-display-r5/emails-390-light.png (caret after "Email Address").

# From controls (wave L2 r1, 2026-09-30) — CT-IC-1: mask `calendar` (FG2-076)
Please add `'calendar'` to `MASKS` in `src/icons/gen-icons.mjs` and regenerate `src/icons/octicon-masks.css`:
```diff
-  'id-badge', 'sliders', 'meter', 'pulse', 'graph', 'clock', 'stack', 'cpu',
+  'id-badge', 'sliders', 'meter', 'pulse', 'graph', 'clock', 'stack', 'cpu',
+  'calendar', // controls FG2-076: date / datetime-local / month / week picker indicator
```
**Why:** controls now draws the native date picker indicator as the calendar Octicon (16px --fgColor-muted mask,
`src/controls/inputs.css` "date / time inputs"; time inputs use the existing `clock` mask). The reference is guarded:
while `--gh-octicon-calendar` is undefined the indicator falls back (`revert-layer`) to Chrome's own glyph, but the shoot
audit lists the var as unresolved on pages with a date input (issue sidebar due date, milestone new, admin config).

# pages/auth (wave L2 r2, 2026-09-30) — request PA-L2-IC1: a 24px alert mask for the 404 Blankslate visual (nit)
- **What**: add a 24-grid Octicon mask `--gh-octicon-alert-24` (source `@primer/octicons/build/svg/alert-24.svg`).
- **Why**: the 404/500/503 Blankslate (src/pages/auth/status.css) draws its 32px visual (24px below 544) from
  `--gh-octicon-alert`, a 16-grid drawing scaled 2x, so the stroke reads ~3px — heavier than Primer's Blankslate, which
  uses the 24px octicon (critic auth-wL2-r1 issue 3). Once the mask exists pages/auth swaps `var(--gh-octicon-alert)` for
  `var(--gh-octicon-alert-24)` in `.page-content .status-page-error::before`.
- **Proposed diff** (src/icons/gen-icons.mjs): allow an explicit size suffix in MASKS —
  ```diff
  -  'id-badge', 'sliders', 'meter', 'pulse', 'graph', 'clock', 'stack', 'cpu',
  +  'id-badge', 'sliders', 'meter', 'pulse', 'graph', 'clock', 'stack', 'cpu',
  +  'alert-24', // pages/auth PA-L2-IC1: 404 Blankslate visual (24-grid drawing)
  ...
  -    const src = path.join(OCTICONS, `${n}-16.svg`);
  +    const src = path.join(OCTICONS, /-(12|16|24|48)$/.test(n) ? `${n}.svg` : `${n}-16.svg`);
  ```
  (then regenerate octicon-masks.css; the build keeps only referenced masks, so no bundle cost until pages/auth uses it).
