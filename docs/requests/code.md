# Requests from `icons` (wave 1, round 1)

## C-1 File-type icons like github.com (colours verified live on github.com/go-gitea/gitea)
**DONE (code w2r1):** `src/code/file-icons.css`; measured light rgb(84,174,255)/files rgb(89,99,110), dark rgb(145,152,161) for both.
Light: directory `rgb(84,174,255)` = `var(--treeViewItem-leadingVisual-iconColor-rest)`, file `rgb(89,99,110)` = `var(--fgColor-muted)`.
Dark: both `rgb(145,152,161)` = `--fgColor-muted` (the token already resolves that way in dark). 16px.
Gitea hooks (`web_src/css/base.css:878-889`, global): `.svg.octicon-file-directory-fill, .svg.octicon-file-directory-open-fill,
.svg.octicon-file-submodule { color: var(--color-primary) }` and `.svg.octicon-file, .svg.octicon-file-symlink-file,
.svg.octicon-file-directory-symlink { color: var(--color-secondary-dark-7) }`. Proposed (code owns these selectors):
```css
.svg.octicon-file-directory-fill,
.svg.octicon-file-directory-open-fill { color: var(--treeViewItem-leadingVisual-iconColor-rest); }
.svg.octicon-file, .svg.octicon-file-symlink-file, .svg.octicon-file-directory-symlink,
.svg.octicon-file-submodule { color: var(--fgColor-muted); }   /* submodule colour on GitHub not verified yet */
```
(Note: `--treeViewItem-leadingVisual-iconColor-rest` is currently pruned from dist — referencing it keeps it.)

## C-2 Material file icons → Octicons, theme-scoped (only needed if the integrator keeps FILE_ICON_THEME = material)
**DONE (code w2r1):** mask + hidden <use> + `fill: currentColor`; symbol pool fills flattened (audit offPalette 0 on file pages).
Needs `src/icons/octicon-masks.css` in the build (docs/requests/icons.md I-4). Tested by injection on /admin/jiri under
the GitHub preview: `shots/icons-r1-mask-filelist-compare.png`.
```css
svg.git-entry-icon { background-color: var(--fgColor-muted); mask: var(--gh-octicon-file) center / contain no-repeat; }
svg.git-entry-icon > use { visibility: hidden; }
svg.git-entry-icon.octicon-file-submodule { mask-image: var(--gh-octicon-file-submodule); }
```
(Directories are already basic Octicons: `FOLDER_ICON_THEME` defaults to `basic`.)

## C-3 Tree view chevrons 12px
**DONE (code w2r1):** `src/code/file-tree.css` (view tree) and `diff-tree.css` (diff tree).
github.com code tree: `octicon-chevron-right` / `chevron-down` render at 12px (103 samples). Vue file tree
(`.view-file-tree-items .item-toggle .svg`) uses 16. Set width/height/min-width/min-height to `var(--base-size-12)`.

# Round 2 (icons)
## C-1 (clarified) directory colour depends on the token being kept AND on integrator I-6
- Referencing `var(--treeViewItem-leadingVisual-iconColor-rest)` from `src/code` keeps it in dist (pruning keeps
  referenced tokens). **After your build, verify** `svg.octicon-file-directory-fill` computes to rgb(84,174,255) light
  and rgb(145,152,161) dark. If the token were pruned the colour falls back to inherit (critic r1: black / invisible
  folders in the round-1 mask test — that test injected C-1 without the token).
- On repo home / file view the rule is currently overridden ~1 s after load by an **unlayered** copy of Gitea's
  index.css that Vite re-inserts (integrator request I-6 in docs/requests/icons.md). Measured with C-1 in `@layer gh.code`
  and the token defined: before the lazy load rgb(84,174,255); after: rgb(9,105,218). With the I-6 fix it stays
  rgb(84,174,255) / rgb(145,152,161) (`shots/icons-r2/unlayered-index-css.json`).
- C-2 re-verified with the token and masks defined: every material file icon renders a muted octicon-file mask,
  light rgb(89,99,110) / dark rgb(145,152,161), 16px (`shots/icons-r2/cmp-d.png`, `sim/report-filelist.json`).

# Round 4 (icons)
## C-4 Diff toolbar icon buttons (critic r3 measurement, cc controls) — renamed from a duplicate C-3 by the integrator
**DONE (code w2r1):** `.diff-detail-actions` basic buttons + commit selector + file-tree toggle → 32×32 transparent invisible IconButton (measured 32×32, bg transparent, border transparent, radius 6).
After the icon restart the diff toolbar shows `gear` (whitespace), `split-view`/`rows` and the kebab. Critic r3 measured
the button box at **34×28, bg rgb(246,248,250), 1px rgb(209,217,224) border, radius 6** vs github.com's diff settings
button **32×32, transparent, radius 6** (Primer invisible IconButton: `--control-medium-size`,
`--button-invisible-bgColor-rest`, no border). Selector: `.diff-detail-actions .ui.button` / whitespace dropdown
(`repo/diff/whitespace_dropdown.tmpl`). Owner: code (diff chrome) or controls (IconButton variant).

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
- **FILE_ICON_THEME stays `material`** (icons I-3 rejected: global, would change the Gitea/Modern/Studio themes). So C-1
  **and** C-2 are yours in wave 2. Verify directory colours after the build (token must be referenced to survive pruning).
- controls #3 (restate diff/code-line/add-comment button geometry) is part of your wave-2 brief.
  **DONE (code w2r1):** diff toolbar (C-4), `.diff-file-header .ui.button` 28px, `.code-line-button` 20px bordered, `.add-code-comment` 20px accent square.
- Until the inert-link template fix is installed live (foundation #1, pending approval), repo home / file view measurements
  show Gitea's unlayered CSS; the shoot audit flags those pages (`unlayeredGiteaCss`).

# From markdown (wave 2, round 1)
## M-1 Markdown fences: base text / whitespace tokens render muted (FYI, your `.chroma` scope)
**DONE (code w2r1):** `.chroma .nx` and `.chroma .w` → inherit (syntax.css); `.file-view.markup` padding 32px (16px < 768px) in file-view.css.
In `.markup pre.code-block > code.chroma` (e.g. octo-org/theme-playground README, Go block) identifiers such as `main`,
`name`, `fmt` (`.nx`) and the whitespace spans render in a muted gray, while github.com renders plain identifiers in
`--fgColor-default` (prettylights has no color for them). Side-by-side: `shots/markdown-r1/sbs2-light-2.png` /
`sbs2-dark-2.png` (left github.com, right ours). The markdown folder owns only the pre/code box (padding 16, 85%,
1.45, bgColor-muted, radius 6, copy button); token colors are yours. The markdown folder leaves
`.file-view.markup` padding to you (github.com: 32px on every side, confirmed at 1440 and 390).

# Integrator (end of wave 2, 2026-09-30)
## C-5 Horizontal overflow on the directory view at 390 (regression vs built-in)
/octo-org/grex/src/branch/main/src at 390 (route directory-tree, both schemes): document 421px wide; the only element
past the viewport is `a.m-commit-count.muted` (x 393–421), the latest-commit History link un-hidden by
src/code/file-list.css. gitea-auto has no overflow on this page (shots/baseline-gitea-auto-w2). Also reported by the
navigation critic (w2 r2). Needs a mobile rule (hide the label / let the header wrap / `min-width: 0` on the message).

## From pages/repo (wave 3, round 3): C-5 still open — directory-tree overflows 31px at 390
The pages/repo critic (docs/critiques/pages/repo-w3-r2.md #5) measured it again on route directory-tree (light + dark
390): document 421px wide, `A.m-commit-count` (history icon) at x 393–421, outside the file Box, triggered by the long
latest-commit author string ("Joel Natividad and Peter M. Stahl"). The rules are src/code/file-list.css:254-259 (code
folder), so pages/repo cannot fix it. Proposed (inside the existing `max-width: 767.98px` block):
```css
#repo-files-table .repo-file-last-commit .latest-commit { min-width: 0; flex: 1 1 0; }
#repo-files-table .repo-file-last-commit .latest-commit .author-wrapper { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
#repo-files-table .repo-file-last-commit .m-commit-count { flex: none; }
```
(or let the header row wrap). Evidence: shots/critic-pages/repo-r2/directory-tree/light-390.png, probe
shots/critic-pages/repo-overflow.mjs.

# Integrator (end of wave 3, 2026-09-30)
- **C-5** (directory-tree 390 overflow, 31px, regression vs built-in) is still OPEN for code; the proposed diff above (pages/repo, w3 r3) is ready. Measured again in shots/integrate-w3 (see docs/STATUS.json audit.horizontalOverflow390).
- **PERF-1 (new, budget ARCHITECTURE §10): blame DCL +150 ms vs built-in.** Route blame (/octo-org/grex/blame/…):
  gitea-auto 278–329 ms, github-auto 446–483 ms on all 4 variants in 3 runs (shots/integrate-w3,
  shots/integrate-w3-budget/run-{1,2}). Folder bisect (build --exclude, 8 loads each,
  shots/integrate-w3-budget/bisect/*): all folders 476 ms median; without `code` 366; without pages/* 424; without
  controls/overlays/navigation 479; without data-display/markdown/foundation 468. So `code` costs ≈ 110 ms here.
  Prime suspect: `src/code/blame.css:89-90` `.file-view tr:has(+ tr.top-line-blame) > td` and
  `tr:has(> .lines-commit):last-child` — relative `:has(+ …)` on every row of a thousands-row table forces sibling
  invalidation during parse. Proposed: put the separator on the following row instead
  (`.file-view tr.top-line-blame > td { border-top: … }`), which needs no `:has`, and re-measure.
