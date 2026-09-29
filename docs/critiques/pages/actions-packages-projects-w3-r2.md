# Critique: pages/actions-packages-projects, wave 3, round 2

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.5 / 10: PASS** (bar 8.5). Console errors 0, literal colors 0 (lint 0/0), off-palette 0, smoke green (13/13 steps).

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` → 0 errors, 0 warnings, 296 selectors.
- **Build:** `npm run build` → `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, files: 7, bytes: 59841}` (r1: 49,713 B, so +10 KB src). Theme total still over budget (auto 424.4 KB).
- **Served CSS:** the served file's hash differs from dist only in the `gh.pages-people` layer (another folder); this folder's layer is byte-identical in served and dist, so no deploy was needed.
- **Screenshots:** shots/critic-pages/actions-packages-projects-r2 (routes: shots/critic-pages/actions-packages-projects-r2-routes.json).
  - 13 routes × light/dark × 1440/390 with `--states --measure`: 52 pages, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colours (the r1 graph-svg fill is gone), no horizontal document overflow.
  - I added 9 board states: toolbar hover/focus/press, Delete hover, filter hover/focus/open, Fullscreen click, and the New Column modal. The first attempt at 4 of them failed because of a quoting error in my own routes file; I fixed it and re-shot the board, and it is clean.
  - Non-Octicons: only `gitea-npm` (brand, exempt) and `gitea-running` (in the status filter menu, not this folder).
- **CLS:**
  - action-run: 0.0206 at 1440 and 0.0740/0.0745 at 390 (light/dark), against the built-in 0.3443/0.4861.
  - Job pages: 0.0012 at 1440 and 0.0599 at 390. All others are 0.0000–0.0004.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` passed 13/13 steps with 0 console errors (shots/critic-pages/actions-packages-projects-r2-smoke.log).
- **Reference:** docs/reference/crit-app-* (captured earlier today, logged out, still current). I compared them side by side with ours: board, runs list, run, job, packages list, package page, at 1440 and 390.

## r1 findings re-checked
| r1 # | status | evidence |
|---|---|---|
| 1 board toolbar | **fixed** | Filters are 32px, 14/500, 0 12px padding, 6px radius, transparent at rest, neutral hover and a 2px accent focus ring. The ButtonGroup items are 32px, 14/500, 0 12px padding, `--button-default-bgColor-rest`, a 1px `#d1d9e0` joined border and 6px outer radius. Hover, focus (inset 2px accent), press and danger hover on Delete all look right in light and dark (states/*-toolbar-*-clip.png, *-delete-hover-clip.png). |
| 2 board seam | **fixed** | The h2, description, divider, board and first column all start at x=32 at 1440, and the header runs 32–1408 (1376 wide). The Fullscreen state keeps the same edge. |
| 3 counter | **fixed** (nit left) | Now 20x20, 0 6px padding, 12/500/18. github measures 29.9x18 at 12/600. The weight is data-display's global CounterLabel choice, not this folder's. |
| 4 package search | **fixed** | Input 1046x32 at 14px, select 140x32 at 14px, button 32x32. github: 32px at 14px. |
| 5 Box shadows | **fixed** | Summary and graph both have `--shadow-resting-small`; the graph has 8px padding and the `--bgColor-inset` fill. |
| 6 run list | **fixed** | Kebab 24x34 (9px 4px + no border; github 8px 4px + 1px border = same box). The branch chip is in its own column. |
| 7 graph fill | **fixed** | Off-palette 0 on all 4 action-run captures. |
| 8 NavList | **fixed** | Items are 272x32, inset 8px (x=32). |
| 9 package page | **partly** | h1 32/600/40 ✓, install code 12px ✓. The "Installation" Box header remains. |
| 10 runs at 390 | **fixed** | The list is edge to edge with no side borders, and time, duration and branch stack under the meta line (matches github 390). |

## Remaining findings (most important first)
1. **MINOR: at 390 the board ButtonGroup is clipped mid-button.**
   - Where: project-board, light and dark, 390. Selector: `.projects-view .project-header > .ui.compact.menu`, which is `overflow-x: auto`, scrollWidth 503 vs clientWidth 358.
   - Result: "Delete" is cut to "De", "New Column" is off-screen, and the group has no right border or radius at the viewport edge, so it reads as broken rather than scrollable.
   - github.com at 390 collapses the header actions into icon buttons plus a `…` overflow menu (docs/reference/crit-app-project-board/light-390.png).
   - Suggested CSS-only fix, below 544px:
     - Drop the text labels (`font-size: 0` on the item, keeping the 16px svg) so each item becomes a 32x32 IconButton; 5 × 32 = 160px fits.
     - Or let the group wrap (`flex-wrap: wrap`) and give each wrapped row its own radii.
   - Also at 390, the filters row is indented 12px from the h2 by the invisible-button padding (x=16 box, text at 28). github aligns invisible-button text with a negative inline margin (`margin-inline-start: calc(-1 * var(--control-medium-paddingInline-normal))`).
   - Evidence: crit-app-project-board/light-390.png, states/dark-390-fullscreen.png.
2. **MINOR: the actions runs list is container-bound while the run page and github.com are fluid.**
   - Where: actions-list, 1440. `.flex-container` is at x=112, w=1216 (nav 240px, main 960px from x=368).
   - The repo header and the run page (`.action-view-body`, x=32, w=1376) start at x=32, so going from the list into a run moves the left edge by 80px.
   - github.com's Actions index is full width: a 303px sidebar with a right border from x=0, and main from x≈360 (docs/reference/crit-app-actions-list/light-1440.png).
   - Suggested fix: make `.page-content.repository.actions > .ui.container` fluid with the 32px page gutter and a wider nav (about 296px), matching the run page.
3. **NIT: package install code blocks mix wrapping and scrolling at 390.**
   - `.page-content.packages pre` has overflow-x auto (scrollWidth 425 vs clientWidth 326). The `.npmrc` line wraps at the "@octo-" hyphen and then scrolls the long URL, with the text flush to the edge.
   - github `.code-block` uses `white-space: pre` and scrolls only.
   - Evidence: crit-app-package-detail-npm/light-390.png.
4. **NIT: the package page still has the "Installation" Box header row** (known gap). github.com uses one bordered area with no header (docs/reference/crit-app-package-detail-npm/light-1440.png).
5. **NIT: the packages list has no count header and no leading type icon.** github.com's `#org-packages .Box` has a "30 packages" Box-header (with a package icon) and a leading package-type octicon on each row. Gitea's template renders the type as a trailing Label instead. Structural, and tolerable.
6. **INFO (upstream):** Gitea's job step summaries (`.job-step-summary`) are not focusable, so the step-focus state shows no ring (focusVisible=false). This is a Vue markup limitation, not a theme defect.
7. **INFO (global):** the theme is 424 KB (auto) against the 300 KB budget. This folder's src grew from 49.7 KB to 59.8 KB.

## Verified OK (looked at)
- **Board:** light, dark and fullscreen at 1440; the New Column modal (Primer dialog, primary "Create Column"); the Label filter overlay with its search input and 2px accent focus. Card hover, column menu open and hover, and card-title focus are unchanged from r1 and fine.
- **Runs list:**
  - Header 66px on `--bgColor-muted`, rows 80px with 16px padding, title 16/600/24, meta 12/18 muted, BranchName 12px mono accent on accent-muted.
  - Title hover and focus, the kebab hover and menu, and the Status overlay all check out in both schemes.
- **Run page:**
  - It matches the grex reference closely: back link, 20px title with muted #N, 24px status icon.
  - NavList 272x32 with a 4px bar, hover, press and focus in both schemes. Summary labels 12/18, values 16/24/600, graph Box inset with shadow.
- **Job log:** inset panel, 36px steps, open step on `--control-bgColor-active`, 12px mono lines with muted numbers, and the gear menu overlay. Light and dark.
- **Packages:** 16px rows, 16/600 names, 12/18 muted meta; medium search group; the sidebar "Details" list. Light and dark.

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| board filter item | height/font/padding/radius | 32 / 14/500 / 0 12px / 6px | 32 / 14/500 / 0 12px / 6px (Primer invisible) | yes |
| board ButtonGroup item | height/font/padding/border | 32 / 14/500 / 0 12px / 1px #d1d9e0 | 32 / 14/500 / 0 12px / 1px #d1d9e0 (Primer default) | yes |
| board ButtonGroup @390 | fits viewport | 503 in 358 (clipped) | collapses to icons + overflow | no |
| board left edge | title / column x | 32 / 32 | 16 / 16 (same edge) | yes |
| column | width / header h | 350 / 44 | 350 / 44 | yes |
| column counter | box / font | 20x20 12/500/18 | 29.9x18 12/600 | nit |
| card | padding / radius / shadow | 8 12 12 12 / 6 / resting-small | — / 6 / resting-small | yes |
| runs Box header | h / pad / bg | 66 / 16 / #f6f8fa | 66 / 16 / #f6f8fa | yes |
| run row | h / pad | 80 / 16 | 79 / 16 | yes |
| run title | font | 16/600/24 | 16/600/24 | yes |
| run kebab | box | 24x34 | 24x34 | yes |
| actions layout | content x / nav w | 112 / 240 | fluid, nav 303 | no |
| job NavList item | box | 272x32 | 272x32 | yes |
| summary/graph Box | shadow | resting-small | resting-small | yes |
| package search input | h / font | 32 / 14px | 32 / 14px | yes |
| package search select | h / font | 32 / 14px | 32 / 14px | yes |
| package row | h / pad | 74 / 16 | 75 / 16 | yes |
| package h1 | font | 32/600/40 | 32/600/40 | yes |
