# Critique: pages/repo, wave L2b, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score: 8.6 / 10. PASS.**
- 0 console errors, 0 literal colours (lint 0/0), smoke green.
- The round-0 blocker is fixed. I checked it with my own keyboard probe on both compare surfaces, in light and dark, and in the state clips.
- What is left is nits, known byte-cap gaps, and template-bound gaps.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings, 424 selectors.
- **Build:** `npm run build` gives `folders["pages/repo"].status = "ok"` (13 files, 94,554 B of source). The theme-wide over-budget warning is unchanged: auto is 326.5 KB. That is not this folder.
- **Layer size:** `@layer gh.pages-repo{…}` is 32,238 B, measured by me. The builder said 32,237. The cap is 32,256, so there are 18 B left.
- **Deploy:** not run. The served `theme-github-auto.css` is byte-identical to `dist/`.
- **Audit:**
  - Scope: 60 captures (15 routes × light/dark × 1440/390) with `--states --measure`, in `shots/critic-pages/repo-wL2b-r1/`. Routes file: `shots/critic-pages/repo-wL2b-r1-routes.json`. It is the round-0 file, plus a sha-focus state on compare, plus `pr-compare-form-playground` with copy, SHA and browse focus.
  - Totals: 0 console errors, 0 failed requests, 0 non-Octicon icons, 0 pages with unlayered Gitea CSS.
  - Off-palette: only `rgba(0,0,0,1)` as the SVG fill in `#repo-activity-top-authors-chart` on Pulse, 7 elements in both schemes. That is Gitea's vue-bar-graph default, not this folder.
  - Unresolved var: `--gh-octicon-calendar`, owned by controls, with 0 matched elements.
  - State failures: the three pr-compare-form focus states timed out. My `nth-child(1)` selector is wrong there. I covered those states with a separate probe (below).
- **CLS above 0.01:** the same as round 0.
  - contributors: 0.14 at 390, 0.0675 at 1440.
  - code-frequency: 0.022 at 390.
  - recent-commits: 0.020 at 390.
  - Pulse: 0.015 at 1440.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` is green. Every step passed and there were 0 console errors. Log: `shots/critic-pages/repo-wL2b-r1-smoke.log`.
- **github.com reference:** the round-0 captures (same day), `shots/critic-pages/repo-wL2b-r0-ref/`, plus fresh live probes of github.com Pulse and Code frequency, logged out.

## Round-0 findings, re-checked

1. **Compare focus ring: FIXED.**
   - Probe: `repo-wL2b-r0-focus.mjs`, keyboard Tab, `:focus-visible` true.
   - Both surfaces pass: compare-two-tags, and the new-PR form `/compare/main...experiment/alt-renderer?expand=1`.
   - All three controls (copy, SHA, browse) show a ring in both schemes:
     - light: `2px solid rgb(9,105,218) off -2px`
     - dark: `2px solid rgb(31,111,235) off -2px`
   - PNG: `repo-wL2b-r1-crops/focus-sheet.png`, `cmp-states.png`, and `compare-two-tags/states/*-{copy,sha,browse}-focus-clip.png`.
2. **Insights rule: FIXED, and part of my round-0 finding was wrong.**
   - The live github.com Pulse draws a rule under the date-range Subhead wrapper. The h2 itself has border 0, which is what I measured last round.
   - Ours matches: 8px, then a 1px `--borderColor-muted` rule, then 8px to the Overview Box. github.com: h2 bottom at 238.5, rule at about 247, Box at 256.
   - Code frequency, contributors and recent commits have no rule now. Code frequency: title 24/36/400, border 0, title top to chart Box 60px.
   - PNG: `repo-wL2b-r1-crops/sbs-cf.png`, and the scratchpad `gh-pulse.png` / `ours-pulse.png`, which I looked at.
3. **Compare icon colour: FIXED.** The icons use `--button-default-fgColor-rest`, which is visually dark in the states sheet.
4. **Pulse labels: FIXED.** The labels are rgb(89,99,110) muted, 14/21/400.
5. **Pulse at 390, stacked cells: FIXED.** There is no notch at the right border (`act-390-sbs.png`).

## Issues (ranked)

1. **MINOR: contributors CLS at 390 is 0.14 (0.0675 at 1440).**
   - The per-contributor Vue grid mounts after the reserved chart. This is unchanged and documented.
   - A `min-height` reservation on the grid container, sized for Gitea's fixed top-N count, would remove most of it, if there were bytes for it.
2. **MINOR: the new-PR compare form rows do not get github.com's compare row actions.**
   - The builder said this form "uses the same `.diff:not(.pull)` rows". It does not.
   - `templates/repo/diff/compare.tmpl:2` adds `compare pull` when `PageIsComparePull`, so every compare-row rule is excluded there.
   - The PR form shows a bare SHA, then copy, then browse: no Button--secondary fill or border, and a different order.
   - compare-two-tags shows [copy | SHA] as a ButtonGroup, then [<>].
   - On github.com, the "Open a pull request" compare page uses the same classic rows as a tag compare.
   - The focus ring is correct on both.
   - PNG: `repo-wL2b-r1-crops/focus-sheet.png`, the last six strips.
3. **NIT: the compare tab reads "74 Commits".** github.com has the git-commit Octicon, then "Commits", then Counter 74. Known, and there are no bytes for it.
4. **NIT: Pulse Overview padding above the progress bars.**
   - From screenshot pixels at 1440: ours is about 40px from the header rule to the bars, github.com about 27px.
   - At 390, github.com stacks the two bars at full width. Ours keeps them side by side.
   - At 390, github.com keeps "Period: 1 week" to the right of the wrapped title. Ours drops it below the title.
   - PNG: `act-390-sbs.png`, and `ours-pulse.png` compared with `gh-pulse.png`.
5. **FYI (template-bound or byte-cap, unchanged):**
   - Releases: no sidebar and no "Find a release" search. The release-detail page has no breadcrumb.
   - Branches: no title, tabs or column header.
   - Contributors: the heading uses Gitea's relative range, and there is no subtitle.
   - The single-release layout is English-only.
   - FG2-062 Downloads Counter and FG2-067 are not done.
   - The repo-home footer gap is still 87px, against github.com's 168px.

## Regression check

- **Releases (dark 1440) and repo-home (light 1440):** no regressions (`rel-home.png`).
- **390 sheet:** Pulse, compare dark, releases, repo-create dark and branches look clean (`sheet-390.png`).
- **Shortened selectors:** `.horizontal.segments` and `.activity-header` appear only in `templates/repo/pulse.tmpl`, so they do not leak.

## Measurements (light 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| compare copy (light) | focus-visible | 2px solid rgb(9,105,218) off -2 | 2px accent ring | yes |
| compare copy / SHA / browse (dark) | focus-visible | 2px solid rgb(31,111,235) off -2 | 2px accent ring | yes |
| PR-form copy / SHA / browse | focus-visible | 2px accent off -2 (both schemes) | 2px accent ring | yes |
| compare copy | box | 32×28 | 34×28 | yes |
| compare SHA | box | 67.9×28 | 69.9×28 | yes |
| compare browse | box | 28×28 | 28×28 | yes |
| PR-form row actions | style | bare SHA, then copy, then browse | ButtonGroup [copy\|SHA], then [<>] | no |
| Pulse heading | font | 20/32.5/600 | 20/32.5/600 | yes |
| Pulse Subhead rule | position | 8px pad + 1px rule + 8px to Box | h2 bottom 238.5, rule ~247, Box ~256 | yes |
| Pulse stat label | colour / font | rgb(89,99,110) 14/21/400 | muted 14px | yes |
| Pulse stat cell | height | 74 | ~77 | yes |
| Pulse Overview | header to bars | ~40px | ~27px | no |
| Code frequency title | font / border | 24/36/400, 0 | 24/36/400, 0 | yes |
| Code frequency | title top to chart Box | 60 | ~59 (builder's number; visually equal in sbs-cf.png) | yes |
| Insights content | x / w | 432 / 896 | 432 / 896 | yes |
| contributors @390 | CLS | 0.14 | ~0 | no |
