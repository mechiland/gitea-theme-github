# Critique: pages/repo, wave L2b, round 0 (re-score of the unscored L2 round-2 build)

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score: 8.4 / 10. NOT PASS.** Lint, literal colours, console errors and smoke are all clean. The score is under the 8.5 bar.

The round-1 list is almost entirely fixed, and I checked each fix myself:
- The release card works from 768 to 1280.
- The compare title has no rule.
- The release byline SHA is 7ch mono.
- The Insights frame matches github.com.
- The compare row fill and the chart CLS reservations are in.

One new defect blocks the pass. The compare-row redesign draws its button borders with `outline`, and that removes the keyboard focus ring from copy, SHA and browse on every compare row. The rest are nits.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings, 422 selectors. No literal colours.
- **Build:** `npm run build` gives `folders["pages/repo"].status = "ok"` (13 files, 94,334 B of source).
  - All three theme files are over the 300 KB theme budget: auto 325.3, light 320.3, dark 321.3. That is theme-wide, not this folder.
- **Folder size:** `@layer gh.pages-repo{…}` is 32,227 B, which is 31.47 KiB. The cap is 31.5 KiB (32,256 B), so there are 29 B left.
- **Deploy:** not run. The served `theme-github-auto.css` is byte-identical to dist (333,131 B).
- **Audit:** 88 captures (22 routes × light/dark × 1440/390) with `--states --measure`, in `shots/critic-pages/repo-wL2b-r0/`. My routes file is `shots/critic-pages/repo-wL2b-r0-routes.json`.
  - 0 console errors, 0 failed requests, 0 non-Octicon icons, 0 pages with unlayered Gitea CSS.
  - Off-palette: only `rgba(0,0,0,1)` as the SVG `fill` of `#repo-activity-top-authors-chart` groups on Pulse, both schemes. That is Gitea's vue-bar-graph default, not this folder's surface.
  - Unresolved var: `--gh-octicon-calendar`, owned by controls, 0 live elements.
  - Six state failures, all selector misses in my routes file: `history-focus` on file-view-markdown, and `pages-item-hover` on a wiki with one page.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` is green. Every step passed, 0 console errors. Log: `shots/critic-pages/repo-wL2b-r0-smoke.log`.
- **CLS above 0.01:**

  | route | 390 | 1440 | cause |
  |---|---|---|---|
  | file-view-markdown | 0.23–0.28 | 0.09–0.10 | README images (not this folder) |
  | contributors | 0.14 | 0.068 | per-contributor grid mounts after the reserved chart |
  | code-frequency | 0.022 | 0 | |
  | recent-commits | 0.019 | 0 | |
  | wiki-page-playground | 0.05 | 0 | markdown content (known) |

- **github.com reference:** captured fresh, logged out, with `--measure --states`, in `shots/critic-pages/repo-wL2b-r0-ref/`. Routes: releases, release-detail, compare-two-tags, repo-activity, contributors, code-frequency, branches.

## Issues (ranked)

1. **MAJOR (a11y): compare rows have no visible keyboard focus on copy, SHA and browse.**
   - Cause: `src/pages/repo/commits.css:282-285`. `.diff:not(.pull) #commits-table :is(.copy-commit-id, .view-commit-path, .commit-id-short) { outline: 1px solid var(--button-default-borderColor-rest); outline-offset: -1px }` draws the button border as an outline. Its specificity (id + classes) beats the shared `:focus-visible` ring.
   - Measured on compare-two-tags at 1440, keyboard Tab, `:focus-visible` true:
     - copy (dark): `1px solid rgb(61,68,77) off -1px`
     - browse (light): `1px solid rgb(209,217,224) off -1px`
     - SHA (light): `1px solid rgb(209,217,224) off -1px`
   - The same copy button on /commits gets `2px solid rgb(9,105,218) off -2px`, which is correct.
   - PNG: `shots/critic-pages/repo-wL2b-r0-crops/f-cmp-copy-d.png`, `f-cmp-browse-l.png`, `f-cmp-sha-l.png`, `cmp-copyfocus-z.png`, `cmp-browsefocus-z.png`. The state shots `compare-two-tags/states/*-copy-focus*.png` and `*-browse-focus*.png` show no ring either.
   - This probably also hits the new-PR compare form, which uses the same `.diff:not(.pull)` rows.
   - Fix: add `:not(:focus-visible)` to that selector, or use an inset `box-shadow` for the border. Either costs about 20 B, and there are 29 B left.

2. **MINOR: an Insights Subhead rule under the title where github.com has none.**
   - Pulse: ours has `border-bottom: 1px solid rgba(209,217,224,.7)` under "September 23 – September 30, 2026". github.com's h2 has border 0.
   - Code frequency: github.com draws no rule under "Code frequency over the history of …". Ours does.
   - `commits.css:481-489` applies the Subhead rule to every activity title.
   - PNG: `repo-wL2b-r0-crops/act-l1440.png`, `cf-l1440.png`.
   - Removing the border (and the 8px padding) saves bytes.

3. **MINOR: contributors CLS at 390 is still 0.14 (1440: 0.068).**
   - The chart itself is reserved now. The remaining shift is the per-contributor card grid, which is Gitea's Vue mount.
   - The builder documented this as a partial fix.

4. **NIT: compare row copy and browse icons are `--fgColor-muted` (rgb 89,99,110).**
   - github.com's Button--secondary icons are `--button-default-fgColor-rest` (rgb 37,41,46).
   - Measured with the probe: `repo-wL2b-r0-p-cmp-*.json`. PNG: `cmp-btn-d3.png`.

5. **NIT: Pulse stat labels are `--fgColor-default`.**
   - Ours: "Merged Pull Requests" and the other labels are rgb(31,35,40).
   - github.com: the labels are muted grey.
   - PNG: `act-l1440.png`, `act-l390.png`.

6. **NIT: Pulse at 390, the last stacked stat cell keeps its segment radius.**
   - Its rounded top-right corner cuts a notch into the outer box's right border between "Closed Issues" and "New Issues".
   - PNG: `repo-wL2b-r0-crops/act-l390-seam.png`.

7. **NIT: the compare "74 Commits" tab has no git-commit Octicon and no Counter.**
   - github.com shows "(commit icon) Commits [74]".
   - The count text is Gitea's, so only the icon is reachable, through the existing mask pattern.

8. **FYI (template-bound, unchanged):**
   - Releases: no "Release list" sidebar or "Find a release" search.
   - Release detail: no breadcrumb.
   - Branches: no title, tabs or column header.
   - Contributors: the heading uses Gitea's relative-time range ("on Sep 29, 2019 - in 4 days").
   - Single release: the English-only `@scope` trade-off.

## Verified fixed since round 1

- **Release card at 768–1280.** Probe `repo-wL2b-r0-relw.mjs` at 768, 800, 900, 1011, 1012, 1100 and 1280. There is no overflow at any width.
  - Below 1012, tag and SHA go on their own row. At 800 the SHA ends at x=227 and the card's inner edge is 735.
  - From 1012 up they sit on the byline row.
  - PNG: `c-rel-800.png`, `c-rel-1280.png`.
- **Compare title rule.** `h2` border-bottom is 0.
- **Release byline SHA.** 7 characters, 14px/21px ui-monospace, 60.6px of text. github.com: `db9275a` in 14px ui-monospace, 60.6px.
- **Insights nav.** Both are 296px wide at x=112 with 1px `rgb(209,217,224)` borders, r6, rows padded 8/16, a 2px coral bar, and content at x=432, w=896.
  - Rows: ours 38px (37 for the first), github.com 38.
  - Headings: Pulse 20/32.5/600 and Contributors 24/36/600 match github.com.
- **Compare row fill.** Copy, SHA and browse are all `rgb(246,248,250)`. Rows are 57.6px (github.com 58.5).
  - Button group: copy 32×28 (github.com 34×28), SHA 67.9×28 (69.9×28), browse 28×28.
- **Other checks:**
  - Downloads focus ring is rounded.
  - The repo-create error keeps the subtitle above the flash.
  - Releases compare dropdown opens correctly in dark.
  - Branches row icons are revealed on focus.

## Measurements (light 1440 unless noted; live probes on both targets)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| compare copy button | focus-visible ring | 1px borderColor outline, offset -1 (no ring) | 2px accent ring | no |
| compare copy button | box / fill | 32×28, rgb(246,248,250) | 34×28, rgb(246,248,250) | yes |
| compare SHA button | box / font | 67.9×28, mono 7ch | 69.9×28, 12/500 mono | yes |
| compare browse button | box / fill | 28×28, rgb(246,248,250) | 28×28 (Button--secondary) | yes |
| compare icon colour | color | rgb(89,99,110) | rgb(37,41,46) | no |
| compare commit row | height | 57.6 | 58.5 | yes |
| compare title | font / border-bottom | 24/36/400, 0 | 24/36/400, 0 | yes |
| release title | font | 32/48/600 | 32/48/600 | yes |
| release Compare | box | 94.4×28 | 28 tall | yes |
| release byline SHA | font / width | 14/21 ui-monospace, 7ch | 14/21 ui-monospace, 60.6px | yes |
| release card @800 | SHA right vs card inner edge | 227 < 735 (own row) | wraps | yes |
| Downloads summary | font | 20/32.5/600 | 20/30/600 ("Assets") | yes |
| Releases segment | h / pad / radius | 32, 0 16, r6 | 32, 5 16, r6 | yes |
| Insights nav | x / w / radius / border | 112 / 296 / 6 / 1px rgb(209,217,224) | 112 / 296 / 6 / same | yes |
| Insights nav row | h / padding | 38 (first 37) / 8 16 | 38 / 8 16 | yes |
| Insights content | x / w | 432 / 896 | 432 / 896 | yes |
| Pulse heading | font | 20/32.5/600 | 20/32.5/600 | yes |
| Pulse heading | border-bottom | 1px rgba(209,217,224,.7) | 0 | no |
| Contributors heading | font | 24/36/600 | 24/36/600 | yes |
| commits copy (/commits) | focus ring | 2px rgb(9,105,218) off -2 | 2px accent | yes |
