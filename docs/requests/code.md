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


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-020 [theme-fixable-css] Horizontal page overflow at 390: directory latest-commit row (404-421px) and unified diff with inline review comment (754px)** — impact 30 (judges 0, critic wt 30; routes: pr-files-changed-unified-playground-large-diff, directory-tree, pr-files-changed-split-playground-large-diff)
   - Fix: directory-tree: let a.m-commit-count wrap/shrink (github.com wraps into a 2-line commit box). Unified diff: contain the table (overflow-x:auto on .file-body, pre in inline comments white-space:pre-wrap / max-width:100%). Split diff at <768: let .conversation-holder span both columns (colspan via grid) or fall back to unified layout for comment rows.
   - Critic refs: C143 (directory-tree, blocker), C152 (pr-files-changed-unified-playground-large-diff, blocker), C122 (pr-files-changed-split-playground-large-diff, major)
   - PNG: `shots/final-gate/directory-tree/light-390.png`, `shots/final-gate-critic-5/prf-l390-tail.png`, `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-44230.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-390.png`
2. **FG-021 [theme-fixable-template] File / blame header: Gitea 'Raw | Permalink | Blame | History' group (+ 'Normal View' / 'Unescape') instead of github.com's Code | Blame (Preview for .md) SegmentedControl with Raw / copy / download icon buttons** — impact 29 (judges 29, critic wt 0; routes: blame, file-view-markdown, repo-code-file)
   - Fix: github-* branch in templates/repo/view_file.tmpl (and repo/blame.tmpl header): left SegmentedControl [Preview (markdown only) | Code | Blame] built from the existing links (Preview/Code = the current file URL with/without ?display=source, Blame = .RepoLink/blame/…), right: Raw button + copy-raw / download icon buttons; Permalink, History, RSS, edit, delete stay as icon buttons (or in a kebab ActionMenu using a Fomantic dropdown). code styles it.
   - PNG: `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/file-view-markdown/dark-1440.png`, `shots/final-gate/file-view-markdown/light-1440.png`
3. **FG-025 [theme-fixable-template] Branch picker, 'Go to file' and 'Add File' sit above the content instead of in the file-tree pane header (github.com: branch picker + search at the top of the tree)** — impact 22 (judges 22, critic wt 0; routes: blame, directory-tree, file-view-markdown, repo-code-file)
   - Fix: Additive github-* branch in the Modern-owned override templates/repo/view_content.tmpl (integrator only, additive, CONTEXT): when the file tree is shown, render the branch dropdown + 'Go to file' search in the tree pane header; keep the main toolbar's other controls. code styles the pane header.
   - PNG: `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`
4. **FG-028 [theme-fixable-css] Mobile blame: code is entirely off-screen (blame column ~312px, table 1038-2031px wide)** — impact 18 (judges 0, critic wt 18; routes: blame, blame-playground-multiple-authors)
   - Fix: <768px: stack each blame hunk header (avatar, message, age) above its lines (github.com), or collapse .blame-info to avatar + age (~72px) so code starts on screen.
   - Critic refs: C176 (blame, major), C194 (blame-playground-multiple-authors, blocker)
   - PNG: `shots/final-gate/blame/light-390.png`, `shots/final-gate-critic-6/bl-m0.png`, `shots/final-gate/blame-playground-multiple-authors/{light,dark}-390.png`, `shots/final-gate-critic-7/blame-playground-multiple-authors/light-390-0.png`
5. **FG-032 [theme-fixable-css] Dark diffs painted twice (tr and td both tinted): additions/deletions/hunk rows visibly over-saturated** — impact 15 (judges 0, critic wt 15; routes: pr-compare-form-playground, pr-files-changed-unified, repo-pull-files)
   - Fix: Paint only the cells (or only the row) in src/code/diff.css (~224-280); re-check hunk row (#152843 → #111d2e) and number cells against github.com dark. Light is correct (opaque tokens).
   - Critic refs: C073 (pr-files-changed-unified, major), C209 (pr-compare-form-playground, major), C174 (repo-pull-files, minor)
   - PNG: `shots/final-gate/pr-files-changed-unified/dark-1440.png`, `docs/reference/.../dark-1440.png`, `shots/final-gate-critic-7/pr-compare-form-playground/zoom-dark-diff.png`, `shots/final-gate/repo-pull-files/dark-1440.png`
6. **FG-034 [theme-fixable-template] README box header is a single 'README.md' bar with a pencil; github.com has 'README | <license> license' tabs** — impact 13 (judges 10, critic wt 3; routes: repo-home, repo-home-readme-with-images-and-tables)
   - Fix: github-* branch in the README header (repo/view_file.tmpl, ReadmeInList): UnderlineNav-style tabs 'README' + '<license name> license' (from .DetectedRepoLicenses / LICENSE file link) + edit pencil at the right; also fix the 390 wrap (C170: header 75px, pencil drops to a 2nd line).
   - Critic refs: C170 (repo-home, minor)
   - PNG: `shots/final-gate-critic-6/rh-m1.png`, `shots/final-gate/repo-home/dark-390.png`, `shots/final-gate/repo-home/dark-1440.png`, `shots/final-gate/repo-home/light-390.png`
7. **FG-044 [theme-fixable-template] Directory listing has no 'Name | Last commit message | Last commit date' Box header row** — impact 9 (judges 9, critic wt 0; routes: directory-tree)
   - Fix: Additive github-* branch in templates/repo/view_list.tmpl (Modern's override; integrator only, additive) emitting a header row in sub-directories using existing locale keys where they exist (fallback: :lang(en) CSS text). code styles it as a Box header (#f6f8fa / #151b23, 12px/600 muted).
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`
8. **FG-054 [theme-fixable-css] File-tree pane is inset with no full-height right border (github.com: flush-left 320px pane with border-right); file box not full-bleed at 390** — impact 7 (judges 0, critic wt 7; routes: blame, directory-tree, repo-code-file)
   - Fix: Make the tree pane flush with the page edge with a full-height 1px --borderColor-default right border; content starts after it. At 390 make the file box full-bleed.
   - Critic refs: C065 (repo-code-file, nit), C145 (directory-tree, minor), C178 (blame, minor)
   - PNG: `docs/reference/repo-code-file/light-1440.png`, `shots/final-gate-critic-2/rcf-l390.png`, `shots/final-gate-critic-6/bl-light-0.png`, `shots/final-gate/blame/dark-390.png`
9. **FG-075 [theme-fixable-css] Split diff: addition-side line-number cells are neutral grey instead of green (#aceebb / #1c4428)** — impact 6 (judges 0, critic wt 6; routes: repo-pull-files)
   - Fix: Style the right-hand .lines-num of added lines with --diffBlob-additionNum-bgColor.
   - Critic refs: C173 (repo-pull-files, major)
   - PNG: `shots/final-gate-critic-6/prf-num.png`, `shots/final-gate/repo-pull-files/{light,dark}-1440.png`, `shots/final-gate/repo-pull-files/dark-390.png`, `shots/final-gate/repo-pull-files/dark-1440.png`
10. **FG-076 [theme-fixable-css] Markdown-source syntax rules leak into rendered .md preview code blocks (.na underlined navy, .nt uncoloured)** — impact 6 (judges 0, critic wt 6; routes: file-view-markdown)
   - Fix: Exclude .markup descendants from the .md-file selectors in src/code/syntax.css:95 and src/code/editor.css:107.
   - Critic refs: C067 (file-view-markdown, major)
   - PNG: `shots/final-gate-critic-2/fvm-light-script.png`, `shots/final-gate/file-view-markdown/light-1440.png`
11. **FG-081 [theme-fixable-css] Blame metadata ~5px above the code baseline; irregular hunk row heights (20/25/26/31px)** — impact 4 (judges 0, critic wt 4; routes: blame, blame-playground-multiple-authors)
   - Fix: Align .blame-info text to the first code line; fixed 20px row pitch.
   - Critic refs: C177 (blame, minor), C195 (blame-playground-multiple-authors, nit)
   - PNG: `shots/final-gate-critic-6/bl-zoom.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/blame-playground-multiple-authors/dark-1440.png`
12. **FG-088 [theme-fixable-css] ```console block renders monochrome; github.com colours the output lines (chroma emits .go spans)** — impact 4 (judges 4, critic wt 0; routes: repo-pull)
   - Fix: Map .chroma .go (Generic.Output) / .gp (prompt) to the prettylights tokens github.com uses for ShellSession output; verify on /octo-org/grex/pulls/42.
   - PNG: `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-1440.png`
13. **FG-093 [theme-fixable-css] File info bar ('798 lines · 39 KiB · Go', '676 B · 96x96px') in monospace; github.com uses 12px sans muted** — impact 4 (judges 0, critic wt 4; routes: file-view-large-file-playground, file-view-image-playground)
   - Fix: .file-info: --fontStack-sansSerif 12px fgColor-muted (beats tw-font-mono via code.important.css if needed).
   - Critic refs: C089 (file-view-large-file-playground, minor), C115 (file-view-image-playground, nit)
   - PNG: `shots/final-gate/file-view-image-playground/light-1440.png`, `shots/final-gate/file-view-large-file-playground/light-1440.png`, `shots/final-gate/file-view-image-playground/light-1440.png`
14. **FG-096 [theme-fixable-css] Diff row pitch 20px (github.com commit view ~24px); bottom expander cell 72px inset vs 88px gutter** — impact 3 (judges 0, critic wt 3; routes: pr-files-changed-unified-playground-large-diff, commit-detail, pr-compare-new-playground)
   - Fix: Check the new github.com diff row height before changing; align the bottom expander with the line-number gutter.
   - Critic refs: C013 (commit-detail, nit), C154 (pr-files-changed-unified-playground-large-diff, nit), C167 (pr-compare-new-playground, nit)
   - PNG: `shots/final-gate-critic-5/cmp-expander.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`, `shots/final-gate/commit-detail/dark-1440.png`
15. **FG-097 [theme-fixable-css] Directory icons: outlined grey in dark / different style from github.com's filled folders** — impact 3 (judges 3, critic wt 0; routes: directory-tree, repo-code-file)
   - Fix: Use the filled octicon-file-directory-fill in --treeViewItem-leadingVisual-iconColor-rest for both schemes (check the dark token).
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/repo-code-file/dark-1440.png`, `shots/final-gate/repo-code-file/light-1440.png`
16. **FG-100 [theme-fixable-css] Mobile code chrome: 88px line-number gutter, latest-commit message dropped, diff summary text hidden** — impact 3 (judges 0, critic wt 3; routes: compare-two-tags, pr-compare-form-playground, file-view-large-file-playground)
   - Fix: Narrower gutter at 390; keep the '25 changed files with…' summary visible (wrap instead of hide).
   - Critic refs: C090 (file-view-large-file-playground, nit), C019 (compare-two-tags, nit), C211 (pr-compare-form-playground, nit)
   - PNG: `shots/final-gate/compare-two-tags/dark-390.png`, `shots/final-gate/compare-two-tags/light-390.png`, `shots/final-gate/pr-compare-form-playground/dark-390.png`, `shots/final-gate/pr-compare-form-playground/light-390.png`

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
