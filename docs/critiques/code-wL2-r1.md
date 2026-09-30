# Critic — code folder, wave L2, round 1

Reviewer: independent critic (no theme code written). Date 2026-09-30.
Evidence: `shots/critic-code-wL2-r1/` (ours: 14 routes × light/dark × 1440/390, 30 states, `--measure`),
`shots/critic-code-wL2-r1-ref/` (github.com logged out: repo-code-file, blame, directory-tree, file-view-markdown,
repo-home, repo-home-readme-with-images-and-tables, with states and measures), routes file
`shots/critic-code-wL2-r1-routes.json`, crops, probes and element shots in `shots/critic-code-wL2-r1-work/`.

## Verdict
**Score 8.5 / 10: PASS.** The score is at least 8.5, with 0 console errors, 0 literal colors, and smoke green.
All three majors (FG2-034, FG2-058, FG2-060) are fixed as the builder describes. The file toolbar (FG2-015) now
matches github.com's geometry to the pixel. One new visible defect is on code's surface: the image diff's
Before/After text overlaps at 390. Its root cause is in foundation. The 390 latest-commit age is misaligned with
the name baseline. Both keep this round at 8.5 rather than 9.

## Gate checks (own runs)
- `node build/lint.mjs code`: 0 errors, 0 warnings (389 selectors). Hex, rgb and hsl appear in src/code only
  inside comments (`code.important.css:56`, which describes CodeMirror's injected CSS).
- `npm run build`: `folders["code"].status = "ok"` (80,666 B source). `gh.code` layer = **28,628 B** in
  dist auto, which confirms the builder's number. The whole theme is over budget (auto 330,502 B after my rebuild,
  light 325,363, dark 326,414); this is not specific to code.
- Served = dist (SHA-256 match on all 3 before my rebuild), so I did not deploy.
- Shoot (56 pages + 30 states): **0 console errors, 0 failed requests, 0 off-palette, 0 non-Octicon, 0 problems**.
  One unresolved var is `--gh-octicon-calendar` (controls' date input, 0 matched elements; not code).
  Document width is 390 on all 14 routes at 390, with no horizontal overflow (the L1 407 px nav overflow is also gone).
- CLS: file-view-markdown is 0.255 / 0.221 at 390 (light/dark). The sources are the README paragraphs pushed down
  by badge `<img>`s without dimensions (content). This is not attributable to code.
- Smoke `node tools/shoot/smoke.mjs --theme github-auto`: **green**, all 13 steps ok, 0 console errors
  (`shots/critic-code-wL2-r1-smoke.log`).

## Verified builder claims
- **FG2-034 DONE.** The README header is one 49 px row at 390 (48 + border) on prom_ex, grex and theme-playground,
  light and dark. The pencil is a 28 px button at the right (`rd-l390.png`, `rd-d390.png`, `mdm-l390.png`).
- **FG2-058 DONE.** At 390 the split table is 720 px inside a sideways scroller. Page height is 11,880 CSS px
  (23,760 device px) and the document is 390 wide. Review threads span the visible width with a muted row
  underneath (`split-l390-a.png`, `split-l390-thread.png`). Trade-off: at 390 only the old half is visible, so a
  thread on the new side appears under a line you cannot see without scrolling. That is acceptable for split.
- **FG2-060 DONE, with an alignment defect (issue 2).** The bar has two rows, no ellipsis anywhere, and the
  "…" toggle is 20×12 (the Primer ellipsis-expander size).
- **FG2-015 DONE.** The toolbar measures identical to github.com: Raw 42.1×28, 12 px/500, radius 6 0 0 6,
  border `--button-default-borderColor-rest`; copy and download are 28×28 joined; the icons are 16 px and centred
  (offset 0). Invisible 28 px link, history and RSS buttons follow. Raw hover is rgb(239,242,245) light and
  rgb(38,44,54) dark, the same as github. Focus ring: 2 px accent, all edges visible. Trash hover is the Primer
  danger fill. Blame shows Raw, Unescape, link, history. The lone "Code" segment is hidden on image files
  (`fvi-d390.png`). Evidence: `tb-states.png`, `focus-cmp.png`, `rcf-l-tb.png`, `rcf-d-tb.png`.
- **FG2-055 / FG2-086 DONE.** The boxes sit in the 16 px gutter. The markdown paragraph is **324 px wide on both**
  ours and github at 390.
- **FG2-077 DONE (1 px nit, issue 5).** The header is white, 48 px inner, with a 2 px
  `--underlineNav-borderColor-active` bar and the book icon.
- **FG2-078 DONE.** The empty split half is rgb(246,248,250) at 1440 and 390 (probe on all 3 threads).
- **FG2-080 DONE.** The mobile blame group header has a right-aligned 12 px relative date.
- **FG2-045 DONE.** At 390 the toolbar shows "[diff icon] 20 changed files" on one line (`uni-d390.png`).
- **L1 nits resolved:** the switch focus ring is now the full 2 px on all sides, matching github
  (`focus-cmp.png`), and the mobile blame code scrolls as a unit (file-view scrollWidth 1671 over 356 px).

## Issues (most important first)
1. **major — Image diff "Side by Side": the Before info line and the "After" heading overlap at 390, and at 1440
   the text touches the images.** Route: pr-files-changed-split-playground-large-diff (logo.png), light and dark,
   390 and 1440. `gitea-auto` renders this correctly (`imgdiff-gitea-auto-390.png` vs
   `imgdiff-github-auto-390.png`; at 1440 `imgdiff-gitea-auto-1440.png` vs `imgdiff-github-auto-1440.png`).
   Cause: Gitea sets `.image-diff-container .diff-side-by-side .side { line-height: 0 }` and relies on
   `p { line-height: 1.4285 }` to restore it. Foundation's `p:where(:not(.markup *)) { line-height: inherit }`
   (`src/foundation/base.css:19`) makes the side's `<p>`s inherit 0, so they are 0 px tall
   (probe: `p.side-header` h = 0, each `.side` is 60 px with the 17 px text lines spilling out).
   Fix: foundation excludes `.image-diff-container *`, or code restores
   `.image-diff-container .side p { line-height: var(--base-text-lineHeight-normal) }` (code owns this surface).
2. **minor — The latest-commit age sits about 4–5 px below the name baseline at 390.** repo-home light 390:
   the name box is y 12–33 (14/21, baseline ≈ 27.5) and the age box is y 20.5–35.5 (12/15, baseline ≈ 32).
   github.com measures name y 11.5 (h 21) and age y 13 (h 18), so the baselines align. The age is also inline after
   the name on repo-home but pushed right on the directory page ("10 months ago" at the right, below the first name
   line). Evidence: `lc-home-l390.png`, `lc-dir-l390.png`, `ref-dir-d390-commit.png`.
   Selector: `file-list.css:235` `align-self: baseline` on `.avatar-stack-names` and
   `> div:not(.latest-commit)` does not line up the text baselines.
3. **minor — Unselected segments are still 26 px tall and 4 px narrower** (L1 #7, not addressed).
   repo-code-file 1440: "Blame" is 63.9×26 vs 67.8×28; the track is 125.3 vs 130.3. Selected items match
   (61.4×28). Primer: 28 px button with 4 px padding plus the label's 8 px padding.
4. **minor — No tooltips on the Permalink and History icon buttons.** Every other toolbar IconButton shows a
   tooltip, including a focus tooltip on github ("Copy raw file"). Gitea gives these two links no
   `data-tooltip-content` (a template or JS issue). As they are, they are unlabeled icons for sighted users.
5. **nit — The README tab bar sits 1 px above the header divider.** Ours: bar y 1043–1044, divider 1045.
   github: bar 1068–1069 covers the divider at 1069. Use `bottom: calc(-1 * (8px + 1px))`.
6. **nit — The blame message column is still narrower** (L1 #8): 168 vs 175.6 px, so "Update docs and
   release no…" is cut where github shows it in full.
7. **nit — The mobile file and blame header is still 2 rows (82 px)** (switch + info, then the actions).
   github.com uses one row with a kebab menu, which needs markup.
8. **nit (reference drift, not scored)** — The github.com logged-out tree pane is **256 px** wide in today's
   capture and in the L1 critic's reference (divider x = 256). The older `docs/reference` capture shows 320.
   Ours is 320. Re-check before changing anything.
9. **Known, not code-fixable here:** blame has no age stripe, Older/Newer legend or Preview segment; FG2-019,
   FG2-041, FG2-044 are template items; FG2-068 (stats before the name) is blocked by `tw-flex !important`
   containers; FG2-099 is a JS toggle. github.com now renders UI text in "Mona Sans VF" (foundation, all routes).

## Measurements (ours vs github.com, light)
| control | property | ours | github | ok |
|---|---|---|---|---|
| toolbar Raw button | box / font / radius | 42.1×28, 12px/500, 6 0 0 6 | 42.1×28, 12px/500, 6 0 0 6 | ✓ |
| toolbar icon button | box / icon | 28×28, 16px icon centred | 28×28, 16px icon centred | ✓ |
| Raw hover | background (light/dark) | rgb(239,242,245) / rgb(38,44,54) | same | ✓ |
| blob header | height / bg / padding | 46 / rgb(246,248,250) / 8 | 46 / rgb(246,248,250) / 8 0 8 8 | ✓ |
| file info | font | 12px mono rgb(89,99,110) | 12px mono rgb(89,99,110) | ✓ |
| segment unselected | box | 63.9×26 | 67.8×28 | ✗ |
| segment selected | box | 61.4×28 | 61.4×28 | ✓ |
| segmented track (2 items) | width | 125.3 | 130.3 | ✗ |
| blob line number / code | font | 12px/20px mono | 12px/20px mono | ✓ |
| blame message | width | 168 | 175.6 | ✗ |
| README header | inner height / bar | 47 / 2px, 1px above divider | 47 / 2px, covers divider | ✗ (1px) |
| markdown p at 390 | width | 324 | 324 | ✓ |
| latest-commit age at 390 | baseline vs name | +4.5 px | ≈0 | ✗ |
| latest-commit ellipsis toggle | box | 20×12 | 20×12 (Primer) | ✓ |
| 390 document width | px | 390 (14/14 routes) | 390 | ✓ |
| split diff 390 | page height (CSS px) | 11,880 (was 22,125) | n/a | ✓ |
| gh.code layer | bytes | 28,628 | cap 28,672 | ✓ |
