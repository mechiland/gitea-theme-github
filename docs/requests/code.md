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
## C-5 **DONE (code L1r1, with FG-020)** Horizontal overflow on the directory view at 390 (regression vs built-in)
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
- **PERF-1 DONE (code L1r1):** `:has(+ tr.top-line-blame)` removed (next segment draws the rule), Rust/markdown syntax rules keyed by subject class; blame style recalc code share ≈ 56 ms → ≈ 17 ms (CDP RecalcStyleDuration median of 14 loads: 156 vs 139 ms without code); computed colours of every chroma span identical on 7 pages.
- **PERF-1 (new, budget ARCHITECTURE §10): blame DCL +150 ms vs built-in.** Route blame (/octo-org/grex/blame/…):
  gitea-auto 278–329 ms, github-auto 446–483 ms on all 4 variants in 3 runs (shots/integrate-w3,
  shots/integrate-w3-budget/run-{1,2}). Folder bisect (build --exclude, 8 loads each,
  shots/integrate-w3-budget/bisect/*): all folders 476 ms median; without `code` 366; without pages/* 424; without
  controls/overlays/navigation 479; without data-display/markdown/foundation 468. So `code` costs ≈ 110 ms here.
  Prime suspect: `src/code/blame.css:89-90` `.file-view tr:has(+ tr.top-line-blame) > td` and
  `tr:has(> .lines-commit):last-child` — relative `:has(+ …)` on every row of a thousands-row table forces sibling
  invalidation during parse. Proposed: put the separator on the following row instead
  (`.file-view tr.top-line-blame > td { border-top: … }`), which needs no `:has`, and re-measure.


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-020 [theme-fixable-css] Horizontal page overflow at 390: directory latest-commit row (404-421px) and unified diff with inline review comment (754px)** — impact 30 (judges 0, critic wt 30; routes: pr-files-changed-unified-playground-large-diff, directory-tree, pr-files-changed-split-playground-large-diff)
   - Fix: directory-tree: let a.m-commit-count wrap/shrink (github.com wraps into a 2-line commit box). Unified diff: contain the table (overflow-x:auto on .file-body, pre in inline comments white-space:pre-wrap / max-width:100%). Split diff at <768: let .conversation-holder span both columns (colspan via grid) or fall back to unified layout for comment rows.
   - Critic refs: C143 (directory-tree, blocker), C152 (pr-files-changed-unified-playground-large-diff, blocker), C122 (pr-files-changed-split-playground-large-diff, major)
   - PNG: `shots/final-gate/directory-tree/light-390.png`, `shots/final-gate-critic-5/prf-l390-tail.png`, `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-44230.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-390.png`
   - **DONE (code L1r1):** directory latest-commit authors ellipsize (file-list.css), diff table `width:100%` so Gitea's `table-layout: fixed` applies (diff.css), mobile split threads widen over the empty half; document width 390 on all 8 diff/dir routes × 2 schemes (shots/code-r1/*/{light,dark}-390.json).
2. **FG-021 [theme-fixable-template] File / blame header: Gitea 'Raw | Permalink | Blame | History' group (+ 'Normal View' / 'Unescape') instead of github.com's Code | Blame (Preview for .md) SegmentedControl with Raw / copy / download icon buttons** — impact 29 (judges 29, critic wt 0; routes: blame, file-view-markdown, repo-code-file)
   - Fix: github-* branch in templates/repo/view_file.tmpl (and repo/blame.tmpl header): left SegmentedControl [Preview (markdown only) | Code | Blame] built from the existing links (Preview/Code = the current file URL with/without ?display=source, Blame = .RepoLink/blame/…), right: Raw button + copy-raw / download icon buttons; Permalink, History, RSS, edit, delete stay as icon buttons (or in a kebab ActionMenu using a Fomantic dropdown). code styles it.
   - PNG: `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/file-view-markdown/dark-1440.png`, `shots/final-gate/file-view-markdown/light-1440.png`
   - **DONE (code L1r1):** src/code/view-switch.css — Primer SegmentedControl 28px, knob/track/divider/hover/press/focus; duplicates hidden (toggle icons, Blame link, Normal View). shots/code-r1/blame/states/*-switch-*.png.
3. **FG-025 [theme-fixable-template] Branch picker, 'Go to file' and 'Add File' sit above the content instead of in the file-tree pane header (github.com: branch picker + search at the top of the tree)** — impact 22 (judges 22, critic wt 0; routes: blame, directory-tree, file-view-markdown, repo-code-file)
   - Fix: Additive github-* branch in the Modern-owned override templates/repo/view_content.tmpl (integrator only, additive, CONTEXT): when the file tree is shown, render the branch dropdown + 'Go to file' search in the tree pane header; keep the main toolbar's other controls. code styles the pane header.
   - PNG: `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`
   - REJECTED by integrator (template) — no CSS action.
4. **FG-028 [theme-fixable-css] Mobile blame: code is entirely off-screen (blame column ~312px, table 1038-2031px wide)** — impact 18 (judges 0, critic wt 18; routes: blame, blame-playground-multiple-authors)
   - Fix: <768px: stack each blame hunk header (avatar, message, age) above its lines (github.com), or collapse .blame-info to avatar + age (~72px) so code starts on screen.
   - Critic refs: C176 (blame, major), C194 (blame-playground-multiple-authors, blocker)
   - PNG: `shots/final-gate/blame/light-390.png`, `shots/final-gate-critic-6/bl-m0.png`, `shots/final-gate/blame-playground-multiple-authors/{light,dark}-390.png`, `shots/final-gate-critic-7/blame-playground-multiple-authors/light-390-0.png`
   - **DONE (code L1r1)** except the age: mobile blame = per-segment 37px header row (avatar · message … re-blame) above its lines (blame.css). The age needs a lint exception (Gitea `.not-mobile` is `display:none !important`): requested in docs/requests/integrator.md CODE-L1-1.
5. **FG-032 [theme-fixable-css] Dark diffs painted twice (tr and td both tinted): additions/deletions/hunk rows visibly over-saturated** — impact 15 (judges 0, critic wt 15; routes: pr-compare-form-playground, pr-files-changed-unified, repo-pull-files)
   - Fix: Paint only the cells (or only the row) in src/code/diff.css (~224-280); re-check hunk row (#152843 → #111d2e) and number cells against github.com dark. Light is correct (opaque tokens).
   - Critic refs: C073 (pr-files-changed-unified, major), C209 (pr-compare-form-playground, major), C174 (repo-pull-files, minor)
   - PNG: `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `docs/reference/.../dark-1440.png`, `shots/final-gate-critic-7/pr-compare-form-playground/zoom-dark-diff.png`, `shots/final-gate/repo-pull-files/dark-1440.png`
   - **DONE (code L1r1):** rows transparent, only cells painted (diff.css); dark unified/split checked against the reference.
6. **FG-034 [theme-fixable-template] README box header is a single 'README.md' bar with a pencil; github.com has 'README | <license> license' tabs** — impact 13 (judges 10, critic wt 3; routes: repo-home, repo-home-readme-with-images-and-tables)
   - Fix: github-* branch in the README header (repo/view_file.tmpl, ReadmeInList): UnderlineNav-style tabs 'README' + '<license name> license' (from .DetectedRepoLicenses / LICENSE file link) + edit pencil at the right; also fix the 390 wrap (C170: header 75px, pencil drops to a 2nd line).
   - Critic refs: C170 (repo-home, minor)
   - PNG: `shots/final-gate-critic-6/rh-m1.png`, `shots/final-gate/repo-home/dark-390.png`, `shots/final-gate/repo-home/dark-1440.png`, `shots/final-gate/repo-home/light-390.png`
   - REJECTED by integrator (template) — no CSS action.
7. **FG-044 [theme-fixable-template] Directory listing has no 'Name | Last commit message | Last commit date' Box header row** — impact 9 (judges 9, critic wt 0; routes: directory-tree)
   - Fix: Additive github-* branch in templates/repo/view_list.tmpl (Modern's override; integrator only, additive) emitting a header row in sub-directories using existing locale keys where they exist (fallback: :lang(en) CSS text). code styles it as a Box header (#f6f8fa / #151b23, 12px/600 muted).
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`
   - REJECTED by integrator (template) — no CSS action.
8. **FG-054 [theme-fixable-css] File-tree pane is inset with no full-height right border (github.com: flush-left 320px pane with border-right); file box not full-bleed at 390** — impact 7 (judges 0, critic wt 7; routes: blame, directory-tree, repo-code-file)
   - Fix: Make the tree pane flush with the page edge with a full-height 1px --borderColor-default right border; content starts after it. At 390 make the file box full-bleed.
   - Critic refs: C065 (repo-code-file, nit), C145 (directory-tree, minor), C178 (blame, minor)
   - PNG: `docs/reference/repo-code-file/light-1440.png`, `shots/final-gate-critic-2/rcf-l390.png`, `shots/final-gate-critic-6/bl-light-0.png`, `shots/final-gate/blame/dark-390.png`
   - **DONE (code L1r1):** tree pane flush left (−page-margin-x), full-height 1px rule as the content's left border, pane + rule start at the repo band; 390: latest-commit box and file Box edge to edge (file-tree.css, file-view.css).
9. **FG-075 [theme-fixable-css] Split diff: addition-side line-number cells are neutral grey instead of green (#aceebb / #1c4428)** — impact 6 (judges 0, critic wt 6; routes: repo-pull-files)
   - Fix: Style the right-hand .lines-num of added lines with --diffBlob-additionNum-bgColor.
   - Critic refs: C173 (repo-pull-files, major)
   - PNG: `shots/final-gate-critic-6/prf-num.png`, `shots/final-gate/repo-pull-files/{light,dark}-1440.png`, `shots/final-gate/repo-pull-files/dark-390.png`, `shots/final-gate/repo-pull-files/dark-1440.png`
   - **DONE (code L1r1):** paired deletion rows keep the addition number colour on the right (diff.css).
10. **FG-076 [theme-fixable-css] Markdown-source syntax rules leak into rendered .md preview code blocks (.na underlined navy, .nt uncoloured)** — impact 6 (judges 0, critic wt 6; routes: file-view-markdown)
   - Fix: Exclude .markup descendants from the .md-file selectors in src/code/syntax.css:95 and src/code/editor.css:107.
   - Critic refs: C067 (file-view-markdown, major)
   - PNG: `shots/final-gate-critic-2/fvm-light-script.png`, `shots/final-gate/file-view-markdown/light-1440.png`
   - **DONE (code L1r1):** .md source rules scoped to `.file-view.code-view` (syntax.css, editor.css).
11. **FG-081 [theme-fixable-css] Blame metadata ~5px above the code baseline; irregular hunk row heights (20/25/26/31px)** — impact 4 (judges 0, critic wt 4; routes: blame, blame-playground-multiple-authors)
   - Fix: Align .blame-info text to the first code line; fixed 20px row pitch.
   - Critic refs: C177 (blame, minor), C195 (blame-playground-multiple-authors, nit)
   - PNG: `shots/final-gate-critic-6/bl-zoom.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/blame-playground-multiple-authors/dark-1440.png`
   - **DONE (code L1r1):** commit info padded inside .blame-info (Gitea's td `padding:0 !important`), 5/11px segment padding, 20px pitch; segments 5 + n×20 + 5 + 1.
12. **FG-088 [theme-fixable-css] ```console block renders monochrome; github.com colours the output lines (chroma emits .go spans)** — impact 4 (judges 4, critic wt 0; routes: repo-pull)
   - Fix: Map .chroma .go (Generic.Output) / .gp (prompt) to the prettylights tokens github.com uses for ShellSession output; verify on /octo-org/grex/pulls/42.
   - PNG: `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`
   - **DONE (code L1r1):** `.chroma .go` → --prettylights-syntax-constant (pl-c1 as github.com's shell-session output).
13. **FG-093 [theme-fixable-css] File info bar ('798 lines · 39 KiB · Go', '676 B · 96x96px') in monospace; github.com uses 12px sans muted** — impact 4 (judges 0, critic wt 4; routes: file-view-large-file-playground, file-view-image-playground)
   - Fix: .file-info: --fontStack-sansSerif 12px fgColor-muted (beats tw-font-mono via code.important.css if needed).
   - Critic refs: C089 (file-view-large-file-playground, minor), C115 (file-view-image-playground, nit)
   - PNG: `shots/final-gate/file-view-image-playground/light-1440.png`, `shots/final-gate/file-view-large-file-playground/light-1440.png`, `shots/final-gate/file-view-image-playground/light-1440.png`
   - NO CHANGE (code L1r1): github.com renders the size line in 12px ui-monospace --fgColor-muted for both text and image blobs (probed pemistahl/grex blob main.rs and logo.png) — ours matches.
14. **FG-096 [theme-fixable-css] Diff row pitch 20px (github.com commit view ~24px); bottom expander cell 72px inset vs 88px gutter** — impact 3 (judges 0, critic wt 3; routes: pr-files-changed-unified-playground-large-diff, commit-detail, pr-compare-new-playground)
   - Fix: Check the new github.com diff row height before changing; align the bottom expander with the line-number gutter.
   - Critic refs: C013 (commit-detail, nit), C154 (pr-files-changed-unified-playground-large-diff, nit), C167 (pr-compare-new-playground, nit)
   - PNG: `shots/final-gate-critic-5/cmp-expander.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`
   - **DONE (code L1r1)** (expander): hunk expander cell padding 0 (code.important.css), last-row cell no longer hunkLine-coloured; row pitch kept at 20px (classic PR diff reference = 20px).
15. **FG-097 [theme-fixable-css] Directory icons: outlined grey in dark / different style from github.com's filled folders** — impact 3 (judges 3, critic wt 0; routes: directory-tree, repo-code-file)
   - Fix: Use the filled octicon-file-directory-fill in --treeViewItem-leadingVisual-iconColor-rest for both schemes (check the dark token).
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/repo-code-file/dark-1440.png`, `shots/final-gate/repo-code-file/light-1440.png`
   - NO CHANGE: folders are filled octicon-file-directory-fill; dark = --fgColor-muted grey like github.com dark (docs/reference/blame/dark-1440.png).
16. **FG-100 [theme-fixable-css] Mobile code chrome: 88px line-number gutter, latest-commit message dropped, diff summary text hidden** — impact 3 (judges 0, critic wt 3; routes: compare-two-tags, pr-compare-form-playground, file-view-large-file-playground)
   - Fix: Narrower gutter at 390; keep the '25 changed files with…' summary visible (wrap instead of hide).
   - Critic refs: C090 (file-view-large-file-playground, nit), C019 (compare-two-tags, nit), C211 (pr-compare-form-playground, nit)
   - PNG: `shots/final-gate/compare-two-tags/dark-390.png`, `shots/final-gate/compare-two-tags/light-390.png`, `shots/final-gate/pr-compare-form-playground/dark-390.png`, `shots/final-gate/pr-compare-form-playground/light-390.png`
   - PARTIAL (code L1r1): gutter matches github.com mobile (code text 92px from the box edge on both); the diff summary is hidden by Gitea `display:none !important` below 800px → lint exception requested (integrator.md CODE-L1-1).

# Integrator (final gate #1 follow-up, 2026-09-30): FG-021 SegmentedControl template APPROVED (pending install, ORC-7)
`templates/repo/view_file.tmpl` (file view only, not the README box) and `templates/repo/blame.tmpl`, github-* themes only:
first child of `.file-header-left` is
```
div.gh-file-view-switch[role=group] > a.gh-file-view-switch-item[.selected][aria-current=page]
   file view: [Preview (only when HasSourceRenderedToggle, → ?display=rendered)] Code (→ file URL[?display=source]) [Blame (text files)]
   blame:     Code (→ /src/…)  Blame (selected)
```
Labels are locale keys `preview`, `repo.code`, `repo.blame`. Style it as a Primer SegmentedControl (small, 28px, selected
segment `--controlKnob-bgColor-rest` look; see controls' SegmentedControl rules if they exist). The old controls stay in the
DOM (no functionality removed) — hide the duplicates for the github themes: `.file-view-toggle-buttons` (source/rendered
icons) and, in the right `.ui.buttons` group, the Blame link (`a[href*="/blame/"]`) in file view and the "Normal View" link
(`a[href*="/src/"]:not([href*="/src/commit/"])`) in blame. Raw / Permalink / History / escape buttons and the icon buttons
stay. FG-025 (branch picker in the tree pane, Modern's view_content.tmpl) and FG-034 (README | license tabs) and FG-044
(directory header row, Modern's view_list.tmpl) were REJECTED (see docs/requests/integrator-tools.md).


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-015 [theme-fixable-css] File toolbar: 'Raw | Permalink | History' as text buttons plus copy/download/edit/delete/RSS icons; lone 'Code' segment on images; file info in mono; no lines/loc** — impact 27 (judges 24, critic wt 3; gate 1 FG-021; routes: blame, file-view-image-playground, file-view-markdown, repo-code-file)
   - Fix: Keep Raw as the one text button; Permalink → link IconButton, History → history IconButton (aria-label/tooltip from the existing text via `font-size:0` + mask, text stays for AT); trash/RSS keep IconButton style in a second group. Hide the SegmentedControl when it has a single item (image/binary). File info sans 12px muted. '(N loc)' is Gitea data (inherent FG-009).
   - Critic refs: C049 (repo-code-file, nit), C051 (file-view-markdown, nit), C101 (file-view-image-playground, nit)
   - PNG: `shots/final-gate-2/file-view-image-playground/light-1440.png`, `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-390.png`
   - **DONE (code L2 r1):** file-view.css: Gitea's text group flattened (display: contents) and regrouped [Raw | copy | download] [pencil | trash] + invisible 28px IconButtons link (Permalink) / history (History) / rss, labels kept for AT (font-size 0); blame: Raw, Unescape, link, history. Lone "Code" segment hidden (view-switch.css). File info stays 12px **mono**: github.com renders it monospace (docs/reference/repo-code-file/light-1440.png, zoomed). Masks: request CODE-L2-1 in integrator.md (served Octicon files are the fallback meanwhile). shots/code-l2-r1-final, states shots/code-l2-r1-states.
2. **FG2-019 [theme-fixable-template] Branch picker, 'Go to file' and 'Add File' sit in the content toolbar; github.com puts branch picker + file search at the top of the Files tree pane** — impact 24 (judges 20, critic wt 4; gate 1 FG-025; routes: blame, directory-tree, file-view-markdown, repo-code-file)
   - Fix: Still blocked: the markup lives in the Modern theme's `repo/view_content.tmpl` override (gate-1 FG-025, rejected: a, d). Not proposed for the last slot. No CSS path (cross-container move).
   - Critic refs: C048 (repo-code-file, minor), C126 (directory-tree, nit)
   - PNG: `shots/final-gate-critic-2/rcf-light-top.png`, `docs/reference/directory-tree/light-1440.png`, `shots/final-gate-2/blame/dark-1440.png`, `shots/final-gate-2/blame/light-1440.png`
   - Not done (template/Modern-owned, still blocked).
3. **FG2-034 [theme-fixable-css] 390: README box header wraps to two rows (pencil alone on row 2, ~66px) — the blob-header mobile rule `.file-header .file-header-left { flex: 1 0 100% }` also hits `#readme h4.file-header`** — impact 12 (judges 0, critic wt 12, majors C025 C030; new; routes: repo-home-markdown-showcase-playground, repo-home-readme-with-images-and-tables)
   - Fix: Scope the rule in src/code/file-view.css (~l.284, mobile block) to the file view: `.non-diff-file-content > .file-header .file-header-left`, or exclude `#readme`. Verify repo-home, repo-home-readme-with-images-and-tables and the markdown showcase at 390.
   - Critic refs: C025 (repo-home-markdown-showcase-playground, major), C030 (repo-home-readme-with-images-and-tables, major)
   - PNG: `shots/final-gate-critic-1/mdm-01.png`, `shots/final-gate-critic-1/rdm-01.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/dark-390.png`, `shots/final-gate-2/repo-home-markdown-showcase-playground/light-390.png`
   - **DONE (code L2 r1):** mobile rule scoped to `.non-diff-file-content:not(#readme) > .file-header .file-header-left`; README header is one 48px row at 390 (repo-home-readme-with-images-and-tables, markdown showcase, light + dark).
4. **FG2-041 [theme-fixable-template] README header is a single 'README.md' bar, not github.com's 'README | <license> license' tabs** — impact 10 (judges 10, critic wt 0; gate 1 FG-034; routes: repo-home-readme-with-images-and-tables, repo-home)
   - Fix: Rejected in gate 1 (FG-034: impact 13, §7 e) and not proposed for the last slot (lower impact than the labels/milestones NavList). CSS part: readme-header-style.
   - PNG: `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`
   - Not done (template, rejected). CSS part done under FG2-077.
5. **FG2-044 [theme-fixable-template] Directory listing has no 'Name | Last commit message | Last commit date' header row; '..' parent row sits flush at the top** — impact 9 (judges 9, critic wt 0; gate 1 FG-044; routes: directory-tree)
   - Fix: Gate-1 FG-044 rejected (Modern-owned `repo/view_list.tmpl`). A CSS approximation exists: the list is a grid, so `#repo-files-table::before` (col 1 'Name') and `::after` with `order:-1` (last column 'Last commit date') under `:lang(en)` give 2 of 3 labels — judge it at the next critic round; not scheduled here.
   - PNG: `shots/final-gate-2/directory-tree/dark-1440.png`, `shots/final-gate-2/directory-tree/light-1440.png`
   - Not done (not scheduled).
6. **FG2-045 [theme-fixable-css] 390: diff summary ('20 changed files with 106 additions…') and the file-tree toggle are hidden in the PR Files / compare toolbars** — impact 9 (judges 0, critic wt 9; new; routes: pr-compare-form-playground, pr-compare-new-playground, pr-files-changed-unified-playground-large-diff)
   - Fix: < 768 keep `.diff-detail-stats` visible as a 12px muted line under the toolbar (stack) and keep the tree toggle IconButton; hide nothing that Gitea shows at 1440.
   - Critic refs: C132 (pr-files-changed-unified-playground-large-diff, minor), C142 (pr-compare-new-playground, minor), C197 (pr-compare-form-playground, minor)
   - PNG: `shots/final-gate-critic-5/pr-files-changed-unified-playground-large-diff/light-390-0.png`, `shots/final-gate-2/pr-compare-form-playground/dark-390.png`, `shots/final-gate-2/pr-compare-form-playground/light-390.png`, `shots/final-gate-2/pr-compare-new-playground/dark-390.png`
   - **DONE (code L2 r1), differently:** < 768 the stats stay on the 44px sticky toolbar line as [diff icon] "N changed files" (12px, ellipsis); the additions/deletions words are dropped (a second line would slide under the sticky file headers at top: 44px; the PR tab bar already shows +A −D). display override in code.important.css (allow-listed selector). Tree toggle stays hidden on mobile (Gitea hides the tree there too).
7. **FG2-055 [theme-fixable-css] 390: full-bleed file box / commit bar / blame box keep 6px radius and side borders at the viewport edge while the breadcrumb keeps the 16px gutter** — impact 7 (judges 0, critic wt 7; gate 1 FG-054; routes: blame-playground-multiple-authors, file-view-image-playground, file-view-large-file-playground)
   - Fix: Either drop radius + left/right borders on the full-bleed boxes (Primer responsive Box) or return them to the 16px gutter; pick one for file view, image view and blame (code/file-view.css:303, FG-054).
   - Critic refs: C079 (file-view-large-file-playground, minor), C100 (file-view-image-playground, minor), C180 (blame-playground-multiple-authors, nit)
   - PNG: `shots/final-gate-critic-4/fvi-390-zoom.png`, `shots/final-gate-2/blame-playground-multiple-authors/dark-390.png`, `shots/final-gate-2/blame-playground-multiple-authors/light-390.png`, `shots/final-gate-2/file-view-image-playground/dark-390.png`
   - **DONE (code L2 r1):** full-bleed margins removed; commit box, file box and blame box sit in the 16px gutter like the breadcrumb and the repo-home file list.
8. **FG2-058 [theme-fixable-css] 390: split diff soft-wraps into ~13-character columns (page 44,250px tall vs 9,236 at 1440)** — impact 6 (judges 0, critic wt 6, majors C106; new; routes: pr-files-changed-split-playground-large-diff)
   - Fix: < 768 in split view: `.code-diff-split td.lines-code { white-space: pre }` inside a horizontally scrolling `.diff-file-body` (overflow-x:auto), min column width ~40ch; or render the split table with `table-layout:auto` + scroll. Do not force unified (user preference).
   - Critic refs: C106 (pr-files-changed-split-playground-large-diff, major)
   - PNG: `shots/final-gate-critic-4/pfs-390-0.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-390.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-390.png`
   - **DONE (code L2 r1):** < 768 split table min width 720px (≈40 ch of code per half) in a sideways-scrolling `.code-diff-split` (position: relative so the absolutely positioned "+" buttons are clipped; no page overflow); single-sided review threads span the visible width (100cqw). Page 44,250 → 23,760px at 390.
9. **FG2-060 [theme-fixable-css] 390 latest-commit bar: both author names and the connector are ellipsized ('Joel Nati… a… Peter M. …'); github.com keeps names on one line and moves actions to a second line** — impact 6 (judges 0, critic wt 6, majors C125; new; routes: directory-tree)
   - Fix: < 768: `#repo-files-table .repo-file-line` (latest commit) wraps into two rows: avatars + authors + 'and' (no ellipsis on the connector, `flex-shrink:0`) + time on row 1; message/SHA/history on row 2.
   - Critic refs: C125 (directory-tree, major)
   - PNG: `shots/final-gate-2/directory-tree/light-390.png`, `shots/final-gate-2/directory-tree/light-390.png`
   - **DONE (code L2 r1):** < 768 the bar wraps: row 1 avatars + names (no ellipsis; long lists wrap inside the names block) + age, row 2 [… message toggle] [history]. Known gap: "Joel Natividad and Peter M. Stahl" + age do not fit one 332px line, so the names take two lines (github.com: one line, shorter logins).
10. **FG2-068 [theme-fixable-css] Diff file header: diffstat '+3 −3 ■■■■■' at the right (github.com: count + blocks before the file name), no expand/collapse chevron look, rename-only files show an empty body** — impact 5 (judges 2, critic wt 3; gate 1 FG-096; routes: pr-files-changed-split-playground-large-diff, repo-pull-files, pr-files-changed-unified)
   - Fix: `.diff-file-header`: `order` the stats before the name, chevron fold button first (Octicon chevron-down, rotate when folded); rename-only (empty body) → muted 'File renamed without changes.' is template text — style the empty body as a 32px muted row. C060 markdown highlighting is Chroma: skip.
   - Critic refs: C059 (pr-files-changed-unified, nit), C060 (pr-files-changed-unified, nit), C109 (pr-files-changed-split-playground-large-diff, nit)
   - PNG: `shots/final-gate-critic-4/pfs-light-3.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/dark-1440.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`, `shots/final-gate-2/repo-pull-files/dark-1440.png`
   - Not done: stats live in `.diff-file-header-actions`, name/chevron in `.diff-file-name` (tw-flex !important → cannot be flattened); CSS cannot put the stats between chevron and name.
11. **FG2-077 [theme-fixable-css] README box header: 46px grey bar with 'README.md' + pencil; github.com draws a white header with an underlined 'README' tab (accent bar) and a TOC button** — impact 4 (judges 0, critic wt 4; gate 1 FG-034; routes: repo-home-readme-with-images-and-tables, repo-home)
   - Fix: `#readme > .file-header`: `--bgColor-default`, 16px inset, the file name styled as a selected UnderlineNav item (book icon, 2px `--underlineNav-borderColor-active` bar at the bottom edge); pencil as a 28px invisible IconButton at the right. The 'README | license' tab pair itself is template-only (FG-034, rejected).
   - Critic refs: C148 (repo-home, minor), C032 (repo-home-readme-with-images-and-tables, nit)
   - PNG: `shots/final-gate-critic-1/rd-00.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/dark-1440.png`, `shots/final-gate-2/repo-home-readme-with-images-and-tables/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`
   - **DONE (code L2 r1):** `#readme > .file-header` white, 48px, the name as a selected UnderlineNav item (book icon, 2px --underlineNav-borderColor-active bar on the bottom edge, 8px inline padding); pencil stays the 28px invisible IconButton.
12. **FG2-078 [theme-fixable-css] Split diff: the inline review comment row's empty left half is white while neighbouring empty split cells are muted** — impact 3 (judges 0, critic wt 3; new; routes: pr-files-changed-split-playground-large-diff)
   - Fix: `.code-diff-split tr.add-comment td:empty, … td.add-comment-left:not(:has(.comment))` → `--diffBlob-emptyLine-bgColor` / `--bgColor-muted`, both schemes.
   - Critic refs: C107 (pr-files-changed-split-playground-large-diff, minor)
   - PNG: `shots/final-gate-critic-4/pfs-light-3.png`, `shots/final-gate-2/pr-files-changed-split-playground-large-diff/light-1440.png`
   - **DONE (code L2 r1):** `.code-diff-split tr.add-comment > td:not(:has(.conversation-holder))` → --diffBlob-emptyLine-bgColor.
13. **FG2-080 [theme-fixable-css] 390 blame group header: no relative date (github.com right-aligns '3 years ago') and muted background (github.com default bg)** — impact 3 (judges 0, critic wt 3; gate 1 FG-028; routes: blame)
   - Fix: < 768: show the blame info's `relative-time` right-aligned in the group header and use `--bgColor-default`.
   - Critic refs: C152 (blame, minor)
   - PNG: `shots/final-gate-2/blame/dark-390.png`, `shots/final-gate-2/blame/light-390.png`
   - **DONE (code L2 r1), partly:** relative date shown right-aligned (12px muted) in the mobile group header (display override allow-listed). Background kept --bgColor-muted: the github.com reference header row is rgb(246,248,250) = --bgColor-muted (docs/reference/blame/light-390.png), not the default bg the item claims.
14. **FG2-086 [theme-fixable-css] 390 markdown file view: body padding 16px (github.com 32px) — paragraphs 356px wide vs 324** — impact 3 (judges 0, critic wt 3; new; routes: file-view-markdown)
   - Fix: `.file-view.markup` at < 768: padding 32px (github.com `.markdown-body` at small widths keeps 32px in the blob view).
   - Critic refs: C050 (file-view-markdown, minor)
   - PNG: `shots/final-gate-2/file-view-markdown/dark-390.png`, `shots/final-gate-2/file-view-markdown/light-390.png`
   - **DONE (code L2 r1) via FG2-055:** the box is back in the 16px gutter, so 16px padding gives the same 324px text measure as github.com's full-bleed box with 32px padding.
15. **FG2-099 [theme-fixable-css] Commit page diff: file tree collapsed by default (github.com shows it left of the diff)** — impact 1 (judges 0, critic wt 1; new; routes: commit-detail)
   - Fix: Nit. The tree visibility is a per-user Gitea toggle (localStorage/JS); CSS cannot open it without fighting the toggle. Tooling option: open it in the capture state. Otherwise leave.
   - Critic refs: C010 (commit-detail, nit)
   - PNG: `shots/final-gate-critic-0/cd-l.png`, `shots/final-gate-2/commit-detail/dark-1440.png`, `shots/final-gate-2/commit-detail/light-1440.png`
   - Not done (per-user JS toggle; nit).

# Integrator (L2b, 2026-09-30)
- CODE-L2-1 — DONE: `--gh-octicon-link` / `--gh-octicon-history` defined (they now point at the same served files as your
  fallback, so the fallback in file-view.css is redundant: ~80 B to drop in your next round).
