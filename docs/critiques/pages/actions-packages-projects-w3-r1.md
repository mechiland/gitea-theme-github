# Critique: pages/actions-packages-projects, wave 3, round 1

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.2 / 10: FAIL** (the pass bar is 8.5). Console errors 0, literal colors 0, smoke green.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` reports 0 errors, 0 warnings, 261 selectors.
- **Build:** `npm run build` gives `dist/build-report.json` → `folders["pages/actions-packages-projects"].status = "ok"` (49,713 B src).
- **Served CSS:** the served `theme-github-auto.css` SHA-256 matched dist at review start, so no deploy was needed. Another agent has deployed since then (revision 447a0022ed). This folder's src files were not modified during my review (mtime 04:53).
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` passed 12/12 steps with 0 console errors (shots/critic-pages/actions-packages-projects-r1-smoke.log).
- **Screenshots:** shots/critic-pages/actions-packages-projects-r1 (routes file shots/critic-pages/actions-packages-projects-r1-routes.json).
  - 13 routes, light + dark, 1440 + 390, `--states --measure`: 52 pages, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars. Max CLS is 0.0733 (action-run 390); action-run 1440 is 0.0206.
  - A first attempt was aborted: another agent's run killed the browser and flipped the admin theme to gitea-auto mid-run. I deleted it and re-shot everything cleanly.
- **github.com reference:** docs/reference/crit-app-*.
  - Pages: grex actions list, run 22496470232 and its job 65172233698, orgs/github/packages, combobox-nav npm package, orgs/github/projects, and project 4247.
  - Most github-side state selectors timed out, so github hover and focus were compared by probe and screenshot rather than state clips.
- **Job-log spec:** checked against github's actions-5fbab84bbce55307.css. `.CheckRun`, `.CheckRun-header` and `.CheckStep-header` are exactly what the builder describes (inset background, 80px header, 36px steps, `--control-bgColor-active` when open).

## Findings (most important first)

1. **MAJOR: the project board toolbar is raw Fomantic.** Route project-board, light and dark, 1440.
   - `.projects-view .project-header .ui.compact.menu` is 38.4px tall. Its items use 11px text with padding 10.2143px 12.5714px (em-based Fomantic values).
   - The Label / Assignee / Milestone filter items (`.project-header .list-header-filters > .item`) are 39px tall with 11px 13px padding.
   - Expected, per Primer: ButtonGroup / invisible buttons 32px (`--control-medium-size`), 14px/500, `--control-medium-paddingInline-normal`.
   - Evidence: crit-app-project-board/light-1440.png; probe numbers are above.
   - It is the least GitHub-looking part of this folder.
2. **MAJOR (layout seam): the board is not aligned with its header.** Route project-board, 1440.
   - Header content (h2 "Theme v1 board", description, divider) is confined to `.ui.container` at x=112.
   - `#project-board` starts at x=32, so the first column sits at x=48. That is a 64px left-edge mismatch. On the right, the toolbar ends at 1328 while the columns run past 1408.
   - github.com (docs/reference/crit-app-project-board/light-1440.png) aligns the title, view tabs, filter and columns on the same 16px edge.
   - Fix: make `.projects-view .project-header` / `.project-description` full-width with the board's 16px inline padding, or constrain the board to the container.
3. **MINOR: the column CounterLabel is squashed to 20x14.**
   - Selector: `.project-column-header .ui.label.project-column-issue-count`.
   - This folder sets `min-height: 0; line-height: 1; padding: 2px 6px`. data-display's gh-important `.ui.circular.label { padding: 0 6px !important }` wins the padding, so the pill ends up 14px tall with a 12px line-height.
   - Expected: Primer CounterLabel 18–20px tall, 18px line-height. github.com measures 29.9x18 with padding 2px 6px.
   - Fix: drop the `min-height: 0`, `line-height: 1` and padding overrides and let counters.css give 20px, or use `line-height: var(--base-size-18)` / `--text-body-lineHeight-medium`.
   - Evidence: app-board-cmp.png (ours on top, github below).
4. **MINOR: the package search row is 28px with 12px text; github.com uses 32px and 14px.**
   - Routes packages-org and packages-repo. Input 1070x28 at 12px, Type select 120x28, search button 28x28. github.com: search input 32px at 14px, filter buttons 32px.
   - The builder's CR APP-C1 says "input 28px but select/button 32px". I measured all three at 28px, so the real gap is that the whole `.ui.small.action.input` is the small size.
   - This is a page-scoped decision the folder could make itself (for example `.page-content.packages .ui.small.action.input` → medium), or it goes to controls. The CR text should be corrected.
5. **MINOR: the summary and graph Boxes on the run page have no resting shadow.**
   - `.action-run-summary-block` and `.workflow-graph` have box-shadow `none`.
   - github.com `.actions-workflow-stats` / `.WorkflowGraph` use color-shadow-small: `0 1px 1px 0 rgba(31,35,40,.04), 0 1px 2px 0 rgba(31,35,40,.03)`, i.e. `--shadow-resting-small`.
   - The github graph Box also has 8px padding; ours has 0.
6. **MINOR: the run-list trailing layout differs from github.com.** Route actions-list, 1440.
   - The BranchName chip hugs the time/duration column. github.com puts the branch in its own middle column: 200px max, left-aligned about 480px from the row start.
   - The kebab is 30x30 with 7px padding, because `tw-p-2` is `!important`. github.com's is 24x34 with 8px 4px padding.
   - Everything else in the row matches: 80 vs 79px row, 16px padding, 16/24 600 title, 12/18 muted meta, BranchName 12px mono accent on accent-muted with 6px radius, 66px Box header on `--bgColor-muted`.
7. **NIT: off-palette colors on this folder's surface.**
   - The workflow-graph SVG on action-run (all 4 captures) has 9 `fill: rgba(0,0,0,1)` hits: `svg.graph-svg`, `g.job-node-group`, `foreignobject`.
   - This is the SVG default fill on unpainted containers, so nothing visible changes. `.workflow-graph .graph-svg { fill: currentColor }` would clear it from the audit.
8. **NIT: the run page NavList items span the full 288px.** github.com job items are 272px, inset 8px inside the 288px list. The current item is semibold here but font-weight 400 on github's "Summary".
9. **NIT: package page typography.**
   - h1 line-height is 48px (github.com 40px).
   - Install code in the markdown `pre` is 11.9px (github `.code-block` is 14px with a 12px mono code).
   - The install area is a Box with a "Installation" header row. github.com uses one bordered area without a header.
   - Sidebar rows have a 29px pitch.
10. **NIT: at 390 the run list stays an inset, bordered Box.** github.com goes edge-to-edge (Box--responsive). The kebab is centred on the trailing block rather than on the row.
11. **INFO (global, not this folder alone): theme size is over budget.** All three themes exceed the 300 KB budget: 399 KB at my build, 413 KB after the latest deploy. This folder is the 7th largest at 49.7 KB src.

## Verified OK (screenshots looked at)
- **Actions list:** row metrics as listed in finding 6.
  - Filter items are 32px invisible buttons: muted, with a neutral background and default text on hover, and a 2px accent focus ring with 6px radius.
  - Title hover turns accent with an underline. The kebab turns accent on hover.
  - Dark scheme is correct. The "Status" menu opens as an overlay.
  - At 390 the time, duration and branch drop under the meta line, like github.com.
- **Run view:**
  - PageHeader: back link 14px muted, title 20/30 600, #N muted and inline, 24px status icon.
  - NavList: 32px items, 4px accent bar, "All jobs" 12px 600 muted. Hover, press and focus states are fine (focus is a 2px accent inset ring).
  - Summary: labels 12/18 muted, values 16/24 600. Graph Box is inset.
  - It matches the grex run 22496470232 reference closely.
- **Job log:**
  - Panel is inset with a muted border. Header is 80px (16px 600 title, 12px muted detail).
  - Steps are 36px and muted, with `--control-bgColor-active` when open. Log lines are 12px mono on a 20px line, with 48px muted line numbers.
  - This matches github's actions stylesheet in light and dark (dark inset is #010409, which is correct per `.CheckRun`).
- **Packages list:** one stacked Box with 16px rows, 16px 600 names and 12px muted meta with underlined links. Name hover turns accent with an underline.
- **Package page:** the sidebar is not a Box ("Details" 16px 600 with muted icons). The .npmrc line no longer overflows at 390.
- **Projects list:** a Box with 16px rows and 16px 600 titles. Hover turns the title accent with an underline; focus shows a ring.
- **Project board:**
  - Columns are 350px wide, 8px apart, inset background with a default border and 6px radius. Column header is 44px.
  - Cards use the default background and border, 6px radius, the resting shadow, 8/12/12 padding and a 14px normal-weight title. Card hover shows an emphasis border.
  - Dark board matches github (#010409 columns, #0d1117 cards).
- **CLS (A-1):** action-run 0.0733 at 390 and 0.0206 at 1440 in both schemes, well under the built-in 0.4861 / 0.3443. Job pages 0.0599 at 390 and 0.0012 at 1440. Every other route is 0.0000–0.0003.
- **Icons:** the only non-Octicons are `gitea-npm` (brand, exempt) and `gitea-running` in the status filter menu (the icons audit shows the same paths).

## Measurements (ours vs github.com, light 1440)
| control | property | ours | github | ok |
|---|---|---|---|---|
| runs Box header | height / padding / bg | 66px / 16px / #f6f8fa | 66px / 16px / #f6f8fa | yes |
| run row | height / padding | 80px / 16px | 79px / 16px | yes |
| run title | size/weight/line | 16/600/24 | 16/600/24 | yes |
| run meta | size/line/color | 12/18 #59636e | 12/18 #59636e | yes |
| branch chip | pad/radius/font/bg | 2px 6px / 6px / 12 mono / #ddf4ff | same | yes |
| run kebab | box | 30x30 | 24x34 | no |
| actions nav item | height/pad/radius | 32 / 6px 8px / 6px | 33 / 6px 8px / 6px | yes |
| job nav item | box | 288x32 | 272x32 | nit |
| summary Box | shadow | none | shadow-resting-small | no |
| summary value | size/weight/line | 16/600/24 | 16/600/24 | yes |
| project column | width / header height | 350 / 44 | 350 / 44 | yes |
| column counter | height / line-height | 14 / 12px | 18 / 18px | no |
| card title | size/weight | 14/400 | 14/400 | yes |
| board toolbar | height / font | 38.4 / 11px | 32 / 14px | no |
| package search input | height / font | 28 / 12px | 32 / 14px | no |
| package row | height / padding | 74 / 16px | 75 / 16px | yes |
| package h1 | line-height | 48px | 40px | nit |
