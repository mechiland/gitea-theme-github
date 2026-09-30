# Critique: pages/actions-packages-projects, final gate loop 1 (wL1), round 2

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.3 / 10: FAIL** (bar 8.5). Console errors 0, literal colours 0 (lint 0/0), off-palette 0, unresolved vars 0, smoke green (13/13 steps ok, 0 console errors).

The round-1 blocker is fixed, and so are all six minors the builder claimed. One new problem was introduced this round: the sticky Actions pane now has a fixed height, so its divider stops partway down the viewport when the page is scrolled. The fixed offset it depends on was also broken by another folder's deploy while I was reviewing. That problem comes from **my own round-1 finding 4, which was wrong**, so part of the fix below is to undo it.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` → 0 errors, 0 warnings, 313 selectors.
- **Build:** `npm run build` → `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 7, bytes: 65444}`.
  - The served CSS matched dist (sha1 `85aa747f…`) when I started, so no deploy was needed.
  - Another agent deployed at 13:06 (served sha1 now `1167bb11…`, which also equals dist).
- **Screenshots:** shots/critic-pages/actions-packages-projects-wL1-r2, from routes file shots/critic-pages/actions-packages-projects-wL1-r2-routes.json.
  - I used a `-wL1-r2` folder because `actions-packages-projects-r2` already holds wave-3 captures.
  - 13 routes × light/dark × 1440/390 with `--states --measure`: 52 pages, all states ok.
  - Totals: 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colours.
- **One bad capture:** apx2-action-job-ok dark-1440 came back with `html[data-theme]=gitea-auto` (CLS 0.28), the same capture the builder saw.
  - Other agents' shoots were running at the same time. I re-shot the route and it came back clean: github-auto, CLS 0, 0 off-palette.
  - The admin theme reads `github-auto` in /api/v1/user/settings. So this is a transient caused by a concurrent process, not this folder.
- **CLS:**

  | route | 1440 | 390 |
  |---|---|---|
  | action-run | 0.0036 | 0 |
  | action-job | 0 | 0 |
  | action-job-ok | 0 | 0 |
  | actions-list | 0.0003 | 0.0001 |
  | packages-org | 0.0005 | 0 |
  | all others | 0 | 0 |

- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` exited 0, 13/13 steps ok, 0 console errors (shots/critic-pages/actions-packages-projects-wL1-r2-smoke.log). The admin theme is github-auto afterwards.
- **Reference:** docs/reference/apx1-* (github.com logged out, captured earlier today). I also measured github's sticky pane while scrolled (shots/critic-pages/apx-wL1-r2-ghscroll.mjs → apx-wL1-r2-gh-al-scrolled.png).

## Builder claims checked
| # | claim | verdict | evidence |
|---|---|---|---|
| 1 | FG-085 body no longer hidden on old attempts; 2s fail-safe | **confirmed** | apx-wL1-r2-nolink.mjs replays the real POST with `workflowLink ''` + `pullRequest null`. Run 19 @1440: `back:false`, 8 jobs, body+footer `visible`, 0 errors (apx-wL1-r2-nolink-run.png). Job 89 @390 light and @1440 dark: same result (apx-wL1-r2-nolink-job390.png, -nolink-job-dark.png). Aborted POST: body+footer `hidden` at 0.8s (apx-wL1-r2-abort-08.png), `visible` at 2.6s with Gitea's empty state (apx-wL1-r2-abort-26.png, -abort-job390.png). `ActionStatusIcon` is `v-if="status"` (web_src/js/components/ActionStatusIcon.vue), so the `:first-child` marker is sound. No `prefers-reduced-motion` rule in Gitea or the theme cancels the reveal animation (checked). |
| 2 | footer rule valid, footer hidden before load | **confirmed** | footer `hidden` at 0.8s on aborted POST, `visible` once loaded |
| 3 | disabled graph control = --fgColor-disabled; Tab follows visual order | **confirmed** | disabled "+" light rgb(129,139,152), dark rgb(101,108,118), bg --control-bgColor-disabled; `reading-flow: flex-visual` computed. Tab from the graph goes screen-full@1296 → dash@1332 → footer (apx-wL1-r2-tab.mjs). Focus ring on screen-full: 2px accent (apx-wL1-r2-graphctl-focus.png) |
| 4 | pane sticky, 336×724, stops at the fold | **measured true at scroll 0 with the old repo header, but wrong design**: see finding 1 | |
| 5 | run rows 79 | **confirmed** | 78/79/79 vs github 79/79/79 |
| 6 | projects Box header 65, meta 12/18 | **confirmed** | header 65 (gh 65), meta 12px/18px (gh 12/18); "2 Open" text order remains (template) |
| 7 | board filters x=16 at 390 | **confirmed** | apx-wL1-r2-pb-390.png: Label/Assignee/Milestone flush with the h2 |
| 8 | Installation header sr-only, one headerless Box | **confirmed** | clip-path inset(50%) 1px box (not display:none); package-detail-npm light-1440 shows one bordered install Box |
| 9 | run summary stacks <1012 | **confirmed** | 390: trigger row, divider, then Status/Total duration/Artifacts in one row (apx-wL1-r2-ar-390-top.png) |

## Findings (most important first)

### 1. MAJOR (regression this round, caused by my round-1 finding 4): the Actions pane divider floats mid-viewport when scrolled, and its fixed offset is already stale
- **The rule:** `actions-list.css:53-62` gives `.flex-container:has(.run-list) > .flex-container-nav` these properties: `position: sticky; top: 0; height: calc(100vh - 176px); border-right: …`.
- **When scrolled** (1440×900, scrollY 1500) the pane sits at y=0 with h=724, so the divider line ends at y=724. The bottom 176px of the viewport has no divider (shots/critic-pages/apx-wL1-r2-al-scrolled-1012.png, same result at 1440 and 800).
- **github.com in the same state:** the pane is **900** tall (0→900) and the line spans the whole viewport. Measured with `.PageLayout-pane` `{y:0, h:900, sticky, max-height:100vh}`, and its PaneDivider is 2232px (the full content height). PNG: apx-wL1-r2-gh-al-scrolled.png.
- **The offset is already wrong:** after the 13:06 deploy by another folder, the repo title row is gone on repo sub-pages (repo header now 48px). The pane now starts at y=112 and ends at 836, **64px above the fold** at every viewport I tried (1440×900, 1280×720, 1012, 800, 1440×1300). PNG: apx-wL1-r2-now-al.png, apx-wL1-r2-al-800-top.png. The builder listed this as a known gap, and it has now happened.
- **My round-1 mistake:** finding 4 compared full-page PNGs.
  - In a real viewport, the round-1 full-height divider already matched github at scroll 0 (the line reaches the viewport bottom) and while scrolled (it spans the viewport).
  - Only the full-page capture differed, because github's pane is sticky, so the capture stops the line at 900.
  - I withdraw that finding.
- **Fix:**
  - Put the divider back on a full-height element, e.g. the pane with `align-self: stretch` and `border-right`, as in round 1.
  - Make only the pane's **content** sticky: `.flex-container-nav > .menu { position: sticky; top: 0; max-height: 100vh; overflow-y: auto }`.
  - This needs no magic number, matches github in every scroll position, and keeps the empty-filter page correct.

### 2. NIT (template, known): projects Box header reads "2 Open" / "0 Closed" with leading octicons
github shows "Open [16]" with a Counter and no icons. The count is a bare text node in templates/projects/list.tmpl. The row icon is octicon-project, where github uses octicon-table. Everything else in the header matches: 65px, 12/18 meta, Sort on the right.

### 3. NIT (template, known): Actions page has no "Actions" pane title, "All workflows" heading or "Filter workflow runs" input
github has all three above the runs Box (docs/reference/apx1-actions-list/light-1440.png). FG-049 was rejected as template work. The runs Box itself matches: 1056 at x=360, header 66, rows 79.

### 4. NIT: graph zoom controls at 100%
github shows all three controls in the disabled look at 100% (docs/reference/apx1-action-run/dark-1440.png). Gitea enables screen-full and dash and disables only "+". That is Gitea's logic, so this is information only.

### 5. NIT (template, known)
- Package keywords are plain text, not topic Labels.
- The org projects search has a leading icon, while the repo projects and packages searches use a trailing search button.

### 6. INFO (not this folder)
- **390 overflow:** the document is 407px wide on repo-scoped pages (actions-list, action-run, action-job, empty-filter, projects-list, project-board, packages-repo), because of the AppHeader avatar (navigation).
- **Non-Octicon icons:** `gitea-running` shows in the runs status menu (icons FG-091). `gitea-npm` is a brand exemption.
- **Concurrent header change:** the repo header lost its title row on sub-pages at 13:06 (another folder). It directly affects finding 1.

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| actions pane (scroll 0) | box | 336×724 @y174 (then 336×724 @y112 after 13:06 deploy) | 336×718 @y182 | no (offset fixed) |
| actions pane (scrolled 1500) | height / divider end | 724 / y=724 | 900 / y=900 | no |
| runs Box | width / x | 1056 / 360 | 1054–1056 / 360 | yes |
| runs Box header | height / padding / bg | 66 / 16 / #f6f8fa | 66 / 16 / #f6f8fa | yes |
| run row | height | 78/79/79 | 79/79/79 | yes |
| graph control | size / radius | 28×28 / 6 | 28×28 / 6 | yes |
| graph control disabled | icon colour light / dark | rgb(129,139,152) / rgb(101,108,118) | rgb(129,139,152) / rgb(101,108,118) | yes |
| graph control disabled | bg light | rgb(239,242,245) | --control-bgColor-disabled | yes |
| graph control | Tab order | screen-full → dash (→ plus) | visual order | yes |
| re-run button | height / font | 32 / 14/500 | 32 (Primer medium) | yes |
| projects Box header | height | 65 | 65 | yes |
| projects row meta | font / line-height | 12 / 18 | 12 / 18 | yes |
| projects row | height | 111/112 | 116/116/87 | yes |
| projects title | font | 16/600/24 | 16/600/24 | yes |
| New Project | height / font | 32 / 14/500 | 32 | yes |
| projects search | height / padding-left | 32 / 32 | 32 / 32 | yes |
| board filter text x @390 | x | 16 | h2 at 16 | yes |
| CLS action-run | 1440 / 390 | 0.0036 / 0 | — | yes |
