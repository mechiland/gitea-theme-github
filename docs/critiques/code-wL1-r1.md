# Critic — code folder, wave L1, round 1

Reviewer: independent critic (no theme code written). Date 2026-09-30.
Evidence: `shots/critic-code-wL1-r1/` (ours: 12 routes × light/dark × 1440/390 + 19 states, `--measure`),
`shots/critic-code-wL1-r1-ref/` (github.com, logged out, 7 routes with a github twin, same states + measures;
compare-two-tags uses `docs/reference/`), routes file `shots/critic-code-wL1-r1-routes.json`, working crops and
probes in `shots/critic-code-wL1-r1-work/`.

## Verdict
**Score 8.5 / 10 — PASS** (≥ 8.5, 0 console errors, 0 literal colors, smoke green).
Diffs (unified, split, dark) are near-indistinguishable from github.com; code view and mobile code view match;
blame is now structurally github.com's (desktop and the new mobile header rows). What keeps it from 9: blame
still lacks the age stripe / legend / mobile age, the file header keeps Gitea's text-button group, and a handful
of nits below.

## Gate checks (own runs)
- `node build/lint.mjs code`: **0 errors, 0 warnings** (363 selectors). Grep for hex/rgb/hsl/named colours in
  src/code: comment text only. No `!important` outside `code.important.css`.
- `npm run build`: `folders["code"].status = "ok"`, 74,877 source bytes. Themes are over the 300 KB cap
  (auto 341,693 B), which is not specific to this folder; code grew about 5.9 KB this round.
- Served files = dist (SHA-256 match on all 3), so I did not redeploy.
- Shoot (48 pages): **0 console errors, 0 failed requests, 0 off-palette, 0 unresolved vars, 0 non-Octicons**,
  0 problems, all 19 states ok.
- Smoke `node tools/shoot/smoke.mjs --theme github-auto`: **green**, all 12 steps
  (`shots/20260930-130240-smoke-github-auto/smoke.json`).
- 390 overflow: document is 390 px on 8 of 12 routes. It is **407 px** on file-view-large-file-playground,
  blame-playground-multiple-authors and both playground large-diff routes. Probe
  (`shots/critic-code-wL1-r1-work/probe.mjs`): the only element past the viewport is
  `.gh-app-header-avatar` (x 375–407), which belongs to navigation. FG-020 / C-5 are fixed for code.
  Mobile split threads now span both halves (thread 353 px wide, over a 177 px td).
- Blame load time (anonymous, `gitea_theme` cookie, 8 loads each, 1440/390): DCL median gitea-auto 256 / 250 ms,
  github-auto 357 / 355 ms. That is +100 ms, under the tool's max(150 ms, 25 %) noise limit. The +150 ms
  PERF-1 regression is gone, but the page is still about 100 ms slower in total (whole theme, not measured per folder).
- Blame geometry (probe): the first segment is 25 px tall, then each single-line segment is 31 px, and each
  additional line adds 20 px. The message and the code line are centred in the same 20 px line box, so FG-081 is confirmed.

## Issues (most important first)
1. **major — Blame lacks github.com's age information** (known, Gitea limit plus a lint exception, CODE-L1-1).
   Missing: the heat stripe, the Older…Newer legend row, and the age in the mobile header rows.
   Compare `shots/critic-code-wL1-r1-work/blame-l-zoom.png` and `blame-d390.png` (ref: legend row, stripe,
   "3 years ago" in each mobile header). This is the most visible remaining blame tell.
2. **minor — The file header right side is still Gitea's text group.** Ours shows `Raw | Permalink | History`
   (plus `Unescape` on blame) with separate icon buttons. github.com shows only Raw plus copy / download icons
   and an edit split button. Seen on repo-code-file, file-view-markdown and blame at 1440
   (`code-l1440.png`, `fvm-l.png`). On blame at 390 an extra "Unescape" button row appears (`blame-d390.png`).
3. **minor — The blame switch on a markdown file lacks "Preview".** github.com's blame of README.md shows
   `Preview | Code | Blame`; ours shows `Code | Blame` (track 126 px vs 210.7 px). This is template scope
   (ORC-7, `repo/blame.tmpl`), so it is for the integrator, not code.
4. **minor — Directory latest-commit row at 390 is triple-ellipsised.** It reads "Joel Nat… a… Peter M…"
   (directory-tree light/dark 390, `dir-l390.png`). github.com shows the full "jqnatividad and pemistahl" and
   wraps the box to two lines. The C-5 fix stops the overflow but ellipsises each name and even the word "and".
   Better: let `.avatar-stack-names` wrap (flex-wrap on the box) or ellipsise only the whole names span.
5. **minor — Directory boxes are not edge to edge at 390.** The latest-commit box and the file table are inset
   16 px with side borders. github.com runs both edge to edge (x≈1). The FG-054 "edge to edge" rule
   (`file-view.css:303`) covers only `#repo-file-commit-box` / `.non-diff-file-content`, not the directory's
   `#repo-files-table`.
6. **nit — Neighbouring segments paint over the switch focus ring.** On file-view-markdown light 1440 the
   `switch-focus` ring on "Code" shows only 1 px on the left edge (col 91; github 91–92), and the right edge
   varies between 1 and 2 px. The ring is 26 px tall vs github's 30 px: ours sits inside the track, github's
   covers the track border. The selected sibling (`z-index:1`) and the next `position:relative` item draw over
   the outline. Give `:focus-visible` `z-index: 2` and draw the ring on the full 28 px box.
   Evidence: `shots/critic-code-wL1-r1-work/focus-zoom.png`.
7. **nit — Unselected segments are 3–4 px narrower.** "Code" is 58.3 × 26 vs 61.4 × 28, "Blame" 63.9 vs 67.8,
   and the 3-item track 201.7 vs 210.7 px. Selected segments match exactly (79.5 / 67.8 × 28).
   Primer: button padding 4 px, then the label's own 8 px padding, and the button is the full 28 px.
8. **nit — Blame commit message column is narrower.** 168 px vs 175.6, so "Update docs and release no…" is cut
   where github.com shows the full "Update docs and release notes" (blame light 1440).
9. **nit — Mobile blame code does not scroll as a unit.** Code lines are clipped at the right edge of the box.
   github.com scrolls the code horizontally (the builder already notes this). The 390 split diff still wraps
   code in ~150 px halves ("high-/contrast"); github.com mobile shows unified. This is acceptable because the
   user chose split.
10. **nit — FG-100 partial.** The diff summary ("N changed files with …") is hidden below 800 px by Gitea's
    `display:none !important`, pending CODE-L1-1.

Not code's (recorded, not scored against code): 407 px at 390 from the navigation avatar; FG-025 / FG-034 /
FG-044 template rejections (no Name / Last commit header row in directories, branch picker above the content);
syntax-token differences come from Chroma lexers (e.g. `<div align>` in markdown is not highlighted by Chroma).

## Verified builder claims
- FG-021 switch: DONE. It sits in the header like github.com. Height 28, selected knob 1 px
  `--controlKnob-borderColor-rest`, semibold, divider, inset hover / press. Duplicates are hidden (no Blame
  button in the file view, no Normal View in blame).
- FG-032: DONE. Dark add / del / hunk / number backgrounds measure identical to github.com.
- FG-075: DONE (repo-pull-files dark: right-hand 107 / 108 numbers are green).
- FG-096: DONE. Expander cell 88 px, hover `--diffBlob-hunkNum-bgColor-hover` in both schemes.
- FG-054: DONE at 1440. Divider at x = 320 on code / blame / directory, same as github.com. At 390 it is DONE
  on the file view and blame, not on the directory (#5).
- FG-028: DONE (mobile blame header rows 38 px incl. rule, code starts at x 92). The age is missing (#1).
- FG-076, FG-088: not independently re-verified beyond the screenshots (no regressions seen).

## Measurements (ours vs github.com)
| control | property | ours | github | ok |
|---|---|---|---|---|
| segmented track | height | 28 | 28 | ✓ |
| segmented track (md, 3 items) | width | 201.7 | 210.7 | ✗ |
| segment unselected "Code" | box | 58.3×26 | 61.4×28 | ✗ |
| segment selected "Blame" | box | 67.8×28 | 67.8×28 | ✓ |
| segment focus ring | visible width / height | 1px left / 26px | 2px / 30px | ✗ |
| blob file header | height | 46 | 46 | ✓ |
| diff file header | height | 41 | 41 | ✓ |
| diff number cell | width×height | 44×20 | 44×20 | ✓ |
| diff hunk row | height | 28 | 28 | ✓ |
| diff file box | height (PR 42) | 488 | 487 | ✓ |
| diff add/del/num bg (dark) | background | = | = | ✓ |
| blame single-line segment | height | 31 | 31 | ✓ |
| blame message | width | 168 | 175.6 | ✗ |
| tree item | height | 32 | 32.2 | ✓ |
| tree pane divider | x at 1440 | 320 | 320 | ✓ |
| mobile code text | x from box edge | 93 | 92 | ✓ |
| 390 document width | px | 390 (8 routes) / 407 (4, nav) | 390 | ✓ for code |
| blame DCL (median) | ms | 357 (gitea-auto 256) | — | ✓ within budget |
