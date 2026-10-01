# Requests for pages/actions-packages-projects

# Integrator (end of wave 2, 2026-09-30)
## A-1 Action run view: layout shift above the built-in theme (budget, ARCHITECTURE §10)
Route action-run (/octo-org/theme-playground/actions/runs/19), 3 runs each theme: CLS 0.4861 → **0.5973** at 390 and
0.3443 → **0.4245** at 1440 (gitea-auto → github-auto; shots/integrate-w2/budget-compare.json,
shots/integrate-w2-budget/compare-{1,2}.json). Same single shift in both themes (sources `div.action-view-body`,
`div.action-info-summary`, t≈100–140 ms): the Vue RepoActionView mounts its summary after first paint. The theme makes
the moved distance larger: measured after load, light — 390: header 109→184px tall, summary 85→160px, body y 297→418;
1440: header 50→68px, summary 26→44px, body y 206→266. Fix idea: reserve the summary/header height
(`min-height` on `.action-view-header` / the run-view root) or keep the pre-mount placeholder the same height.

**A-1 DONE** (pages/actions-packages-projects, wave 3 r1): header reserves its loaded height (`.action-view-header` min-height 60px desktop / 124px <768px, pre-load padding-top 28px so the title never moves), empty jobs list reserves 4 rows, and on <768px `#repo-action-view` keeps 100vh until the run is loaded (footer no longer jumps). Measured by tools/shoot (shots/pages-actions-packages-projects-r1/action-run/*.json): CLS 390 **0.0733** (built-in 0.4861), 1440 **0.0207** (built-in 0.3443), light and dark.

**Critic W3-R1 findings (wave 3 r2) DONE**: board toolbar → Primer invisible-button filters + ButtonGroup (32px, 14px/500); board/header/description share the page edge (x=32 at 1440); column counter is the 20px CounterLabel; package search is medium (32px/14px); run summary + graph Boxes have --shadow-resting-small, graph 8px padding, graph SVG fill currentcolor (0 off-palette); run NavList items 272px inset 8px; run-list branch column + 24x34 kebab; package h1 40px line, install code 12px; runs Box edge to edge below 768px with the kebab centred on the row.

# Integrator (end of wave 3, 2026-09-30)
- **APP-1 — DONE** (routes + states merged into tools/shoot/routes.json). **APP-C1** — closed (your correction).
- **A-1** — re-measured in the wave-3 budget comparison (docs/STATUS.json budget).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-027 [theme-fixable-css] Actions list is a centred container with a borderless NavList, not github.com's full-bleed split PageLayout (sidebar pinned left with border, 1056px runs Box)** — impact 19 (judges 7, critic wt 12; routes: actions-empty-filter, actions-list)
   - Fix: Full-bleed two-pane layout at ≥1012px: sidebar flush left (~336px) with border-right, main pane from x≈360. The 'Actions' / 'All workflows' headings need template text: see actions-headings.
   - Critic refs: C046 (actions-list, major), C080 (actions-empty-filter, major)
   - PNG: `shots/final-gate-critic-1/al-l-a.png`, `docs/reference/actions-list/light-1440.png`, `shots/final-gate/actions-empty-filter/light-1440.png`, `shots/final-gate/actions-empty-filter/dark-390.png`
2. **FG-035 [theme-fixable-css] Projects list: Open/Closed switch outside the Box, 28px 'New Project', inline red Delete per row, mobile order flips** — impact 12 (judges 0, critic wt 12; routes: projects-list, org-projects)
   - Fix: Counters in the Box header; 32px primary; row actions as muted text/invisible buttons (danger only on hover); keep desktop order at 390.
   - Critic refs: C155 (projects-list, minor), C156 (projects-list, minor), C157 (projects-list, minor), C158 (projects-list, nit), C058 (org-projects, nit), C059 (org-projects, nit)
   - PNG: `docs/reference/crit-app-projects-list/light-1440.png`, `shots/final-gate-critic-1/org-projects-mob.png`, `shots/final-gate/projects-list/dark-390.png`, `shots/final-gate/projects-list/dark-1440.png`
3. **FG-038 [theme-fixable-css] Run graph: zoom controls top-right (github.com bottom-right) with non-Octicon icons; matrix/node cards use default bg in dark; 390 graph node off-canvas and full job list stacked** — impact 11 (judges 7, critic wt 4; routes: action-run)
   - Fix: Position the graph toolbar bottom-right, mask its icons with Octicons (zoom-in/zoom-out/screen-full), overlay bg for nodes in dark, fit the graph at 390.
   - Critic refs: C075 (action-run, minor), C076 (action-run, nit)
   - PNG: `shots/final-gate-critic-2/ar-l390.png`, `docs/reference/action-run/light-390.png`, `shots/final-gate/action-run/dark-390.png`, `shots/final-gate/action-run/dark-1440.png`
4. **FG-049 [theme-fixable-template] Actions list has no 'Actions' sidebar heading and no 'All workflows' title + subtitle** — impact 8 (judges 8, critic wt 0; routes: actions-list)
   - Fix: Low priority: github-* branch in templates/repo/actions/list.tmpl adding the two headings (actions.actions / existing keys). The 'Filter workflow runs' input has no Gitea backend: out of scope.
   - PNG: `shots/final-gate/actions-list/dark-1440.png`, `shots/final-gate/actions-list/light-1440.png`
5. **FG-055 [theme-fixable-css] Project board: toolbar button group truncated at 390 ('New Column' off-screen), 4th column cut at the container edge at 1440** — impact 7 (judges 0, critic wt 7; routes: project-board)
   - Fix: Wrap the toolbar (or overflow menu) at <768; board scroll container with padding-right.
   - Critic refs: C184 (project-board, major), C185 (project-board, nit)
   - PNG: `shots/final-gate/project-board/light-390.png`, `shots/final-gate-critic-6/pb-m.png`, `shots/final-gate/project-board/light-1440.png`, `shots/final-gate/project-board/light-390.png`
6. **FG-061 [theme-fixable-css] Packages: names not Link blue, meta links bold+underlined, install <pre> overflows at 390, keywords plain text, 'View all' misaligned** — impact 7 (judges 0, critic wt 7; routes: packages-org, packages-generic, packages-repo, package-detail-npm)
   - Fix: Link colours per github.com; pre overflow-x:auto with padding for the copy button; keywords as topic Labels; baseline align.
   - Critic refs: C101 (packages-org, nit), C187 (packages-repo, nit), C126 (package-detail-npm, minor), C127 (package-detail-npm, nit), C023 (packages-generic, nit)
   - PNG: `shots/final-gate/packages-repo/light-1440.png`, `shots/final-gate-critic-4/package-detail-npm-390-0.png`, `shots/final-gate/package-detail-npm/light-1440.png`, `shots/final-gate/packages-generic/light-1440.png`
7. **FG-072 [theme-fixable-css] Actions controls: row kebab hover turns accent-blue, Re-run split button 28px, gear menu uses checkbox squares, mobile job list ignores the 16px gutter** — impact 6 (judges 0, critic wt 6; routes: action-job-ok, actions-list, action-job)
   - Fix: Invisible IconButton hover; 32px re-run; checkmarks only on selected; 16px gutter.
   - Critic refs: C047 (actions-list, minor), C163 (action-job-ok, nit), C132 (action-job, nit), C165 (action-job-ok, nit)
   - PNG: `shots/final-gate-critic-1/live/actions-list/states/light-1440-row-kebab-hover-clip.png`, `shots/final-gate-critic-4/actionjob-states.png`, `shots/final-gate/action-job-ok/dark-390.png`, `shots/final-gate/action-job-ok/dark-1440.png`
8. **FG-085 [theme-fixable-css] Action run/job views shift on mount at 390 (CLS 0.06-0.074)** — impact 4 (judges 0, critic wt 4; routes: action-job-ok, action-job)
   - Fix: Reserve .action-view-left / .action-view-body sizes before mount.
   - Critic refs: C131 (action-job, minor), C164 (action-job-ok, nit)
   - PNG: `shots/final-gate/action-job-ok/dark-390.png`, `shots/final-gate/action-job-ok/dark-1440.png`, `shots/final-gate/action-job-ok/light-390.png`, `shots/final-gate/action-job-ok/light-1440.png`

## Final gate #1 — status (pages/actions-packages-projects, loop 1 round 1; shots/pages-actions-packages-projects-fg1-r4..r6)
- **FG-027 DONE (CSS part)** — ≥768px the runs page is a full-bleed PageLayout: pane flush left 256/320/336px (md/lg/xl), 16px padding, 1px --borderColor-default divider, min one viewport tall; content 16px 24px → runs Box 1056px at x=360 at 1440 (github.com: 1056 at 360, measured). Row trailing = 50% (branch column ≈ x 889, time + 24px kebab at the end). The 'Actions' / 'All workflows' headings stay FG-049 (template, rejected).
- **FG-035 DONE** — projects list is a grid: search + 32px "New Project" on top, one Box whose muted header holds Open/Closed (left) and Sort (right), rows below; same order at 390; row actions 12px muted, Delete muted at rest / danger on hover (tw-text-red reset in pages.important.css).
- **FG-038 DONE except icons** — graph controls at the Box's bottom-right (20px in), reset first, zoom-out|zoom-in joined, 28px; node cards --card-bgColor (dark = --bgColor-muted); <768 summary/graph/log Boxes edge to edge and the NavList moved below the content. Glyphs need masks plus/dash/screen-full → request APK-M1 in docs/requests/icons.md (CSS already wired, falls back to the magnifiers). Graph still wider than 390 (drag/scroll canvas).
- **FG-055 DONE** — board bleeds to the viewport edges (columns start at the page edge, 4th column scrolls under the viewport edge like github.com); <768 the toolbar wraps into separate 32px buttons (all 5 visible at 390).
- **FG-061 DONE except keywords** — install commands one line, scrolling in the <code> with a free lane for the copy button (no overlap at 390); "View all" on the "Versions (N)" baseline. Package names/meta links already match github.com (probed github/codeql-action/packages: name Link--primary fgColor-default 600, meta links Link--secondary underlined, repo link 600) — left as is. Keywords are bare text nodes in npm.tmpl → not CSS-reachable (template).
- **FG-072 DONE** — run-row kebab: invisible IconButton hover/open bg + default icon; run header buttons 32px/14px (re-run split 32 + 32); gear menu hides the empty-checkbox squares (checkmark only on selected); job NavList inside the 16px gutter below md.
- **FG-085 DONE** — until the run is loaded the body and the footer are visibility:hidden, so mount causes no shift: CLS 0 at 390 on action-run / action-job / action-job-ok (was 0.074 / 0.0599 / 0.0599), 1440: 0.0036 / 0 / 0.

# From icons (final gate #1, wave L1 round 1)
- **APK-M1 DONE** — `plus`, `dash`, `screen-full` masks added; live since deploy 9ee594a4be: `.graph-controls` shows
  screen-full / dash / plus, 16×16, `--fgColor-muted` in both schemes (`shots/icons-l1r1/live/cmp-live.png`, `live/report.json`).
- FYI (FG-091): the Status filter's `gitea-running` icon stays — it is github.com's own in-progress indicator (same paths,
  `--fgColor-attention`, 1s rotation). github.com's Status filter shows **no** icons at all (checkbox SelectPanel,
  `shots/icons-l1r1/gh-actions-status-open-light.png`); hiding the status icons inside that menu would be the parity
  option, which is layout in your scope, not an icon swap.

## Final gate #1 — critic wL1-r1 findings (pages/actions-packages-projects, loop 1 round 2; shots/pages-actions-packages-projects-wL1-r2)
- **#1 blocker DONE** — FG-085 "loaded" marker is now the run status icon (`.action-info-summary-title > .action-info-summary-title-text:first-child` = no icon yet; ActionStatusIcon is `v-if="status"`, empty run status ''), not the back link; plus a 2s `gh-apx-reveal` fail-safe. Replayed old-attempt POST (workflowLink '' + pullRequest null): run 19 and job 89 body visible, 8 jobs (nolink-run.png, nolink-job-390.png); aborted POST: hidden at 0.8s, visible at 2.5s. CLS unchanged: action-run 0.0036/0, action-job(-ok) 0/0.
- **#2 DONE** — footer rule rewritten with a single :has() level (valid; footer hidden before load, measured).
- **#3 DONE** — disabled graph control `--fgColor-disabled` (light rgb(129,139,152), dark rgb(101,108,118) = github); `reading-flow: flex-visual` → Tab order screen-full → dash → plus.
- **#4 DONE** — Actions pane sticky, align-self start, height 100vh − 176px (336×724 at y=174, ends at the fold).
- **#5 DONE** — run rows 79px (right column 2px margins).
- **#6 partly** — projects Box header 65px, row meta 12px/18px; "N Open" text order is template text (not CSS-reachable).
- **#7 DONE** — board filters at <768 pulled 12px into the gutter (label text x=16 = h2).
- **#8 partly** — package "Installation" header kept for screen readers only, install block is one headerless Box; org vs repo project search markup differs by template (left).
- **#9 DONE** — run summary uses the stacked form (trigger row, divider, stats row) below 1012px.

## Final gate #1 — critic wL1-r2 findings (pages/actions-packages-projects, loop 1 round 3; shots/pages-actions-packages-projects-wL1-r3, -wL1-r3b)
- **#1 major DONE** — the fixed-height sticky pane is gone (no magic number). ≥768px the chain `.full.height > .page-content > .ui.container > .flex-container` on the runs page grows to the footer (bottom page space moved into the content column, same pattern as people/explore); the nav is the full-height bordered pane (divider = layout height, like github's PaneDivider) and only its NavList is sticky (top 16px, max-height 100vh − 32px, scrolls inside). Measured 1440×900 / 1280×720 / 1012 / 800 / 1440×1300: divider reaches the viewport bottom at scroll 0 and while scrolled (scrollY 1500 → visible divider end = viewport height), and ends at the footer at the page end; empty filter: pane 112→788 = footer top (no gap). Menu scroll box widened 8px each side (width in pages.important.css, Gitea's `.ui.vertical.menu.fluid` width is !important) so the current-item accent bar at x=8 is not clipped; items stay 303px at x=16; focus ring inset, unclipped.
- **#2 partly** — Open/Closed header links no longer show leading octicons (github has none); "N Open" order / Counter stays template text; row icon octicon-project vs table left (icon choice in template).
- #3, #4, #5 — template / Gitea logic, unchanged.


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-022 [theme-fixable-css] Actions list: no 'Actions' sidebar heading and no 'All workflows' title + 'Showing runs from all workflows' subtitle above the runs Box (also on the empty-filter state)** — impact 19 (judges 13, critic wt 6; gate 1 FG-049; routes: actions-empty-filter, actions-list)
   - Fix: English-only generated text (precedent FG-041): `html:lang(en)` `::before` 'Actions' (20px/600) above the workflow NavList; on the runs column `::before` 'All workflows' (20px/600) + `::after`-free subtitle via a second pseudo on the Box header wrapper, shown only when the first NavList item is selected (`:has(.ui.vertical.menu > .item.active:first-child)`); for a selected workflow show nothing (its name is not reachable in CSS). 'Filter workflow runs' input: no Gitea feature (inherent).
   - Critic refs: C035 (actions-list, minor), C072 (actions-empty-filter, minor)
   - PNG: `shots/final-gate-critic-1/act-light-0.png`, `shots/final-gate-2/actions-empty-filter/light-1440.png`, `shots/final-gate-2/actions-empty-filter/dark-1440.png`, `shots/final-gate-2/actions-empty-filter/light-1440.png`
2. **FG2-029 [theme-fixable-css] Packages: list rows lack the leading 16px package icon; search + Type select + button fused into one 1216px input group; detail title '(1.0.0)' bold in parentheses; versions page has no title and version names are not links-blue; install command clipped at 390 with no copy** — impact 13 (judges 0, critic wt 13; gate 1 FG-061; routes: package-detail-npm, package-versions, packages-generic, packages-org)
   - Fix: Row icon via mask; split the filter into TextInput (flex 1) + Type select as a separate 32px button; title: name 600, version muted 400 (parentheses are template text: leave); versions page: 24px Subhead from the breadcrumb's last item, version name `--fgColor-accent` 600; install `<pre>` `overflow-x:auto` (copy button is template: skip).
   - Critic refs: C087 (packages-org, minor), C110 (package-detail-npm, minor), C194 (package-versions, minor), C195 (package-versions, minor), C019 (packages-generic, nit)
   - PNG: `docs/reference/apx1-package-detail-npm/light-1440.png`, `shots/final-gate-2/package-detail-npm/light-1440.png`, `shots/final-gate-2/package-versions/light-1440.png`, `shots/final-gate-critic-0/pg-390.png`
3. **FG2-051 [theme-fixable-css] Projects: board's 4th column clipped at 1440 with no scroll cue; column wells end at y≈763 regardless of content; mobile header buttons break into two rows; list Open/Closed without Counters and inline Edit/Close/Delete** — impact 8 (judges 0, critic wt 8; gate 1 FG-055; routes: project-board, projects-list)
   - Fix: Board: `overflow-x:auto` + right fade, columns `min-height: calc(100vh - header)` instead of a fixed height; header button group `flex-wrap:nowrap` with overflow; list header counts as Counters if separate spans; row actions revealed on hover.
   - Critic refs: C158 (project-board, minor), C159 (project-board, minor), C160 (project-board, nit), C134 (projects-list, nit)
   - PNG: `docs/reference/apx1-projects-list/light-1440.png`, `shots/final-gate-2/projects-list/light-1440.png`, `shots/final-gate-2/project-board/dark-390.png`, `shots/final-gate-2/project-board/dark-1440.png`
4. **FG2-056 [theme-fixable-css] 390 run / job view: full Summary / jobs sidebar stacks below the content; no job selector under the title; no 'Search logs' input** — impact 7 (judges 0, critic wt 7; new; routes: action-job, action-run, action-job-ok)
   - Fix: < 768: move the jobs list above the content (`order:-1`) as a compact 1-row list (selected job only + count), keep the rest reachable below. 'Search logs' has no Gitea feature (Vue view): skip.
   - Critic refs: C062 (action-run, minor), C115 (action-job, minor), C140 (action-job-ok, nit)
   - PNG: `docs/reference/crit-app-action-job/light-390.png`, `shots/final-gate-critic-4/aj-390.png`, `shots/final-gate-2/action-job/dark-390.png`, `shots/final-gate-2/action-job/light-390.png`
5. **FG2-071 [theme-fixable-css] Actions run rows: 'Commit 9994cec061' shows the 10-character SHA underlined** — impact 5 (judges 5, critic wt 0; gate 1 FG-018; routes: actions-list)
   - Fix: Clip the commit link in `.run-list-item-meta` (or equivalent) to 7ch, no underline until hover, mono 12px.
   - PNG: `shots/final-gate-2/actions-list/dark-1440.png`, `shots/final-gate-2/actions-list/light-1440.png`
6. **FG2-085 [theme-fixable-css] Workflow graph: connector edges invisible (horizontal path with a zero-height bbox is fully masked by the objectBoundingBox edge mask); only port dots render** — impact 3 (judges 0, critic wt 3; gate 1 FG-038; routes: action-run)
   - Fix: `.workflow-graph .graph-svg g[mask] { mask: none }` (nodes paint above edges), both schemes; verify Lint → Build edge on action-run light/dark. Upstream bug, visible only because our graph draws edges.
   - Critic refs: C061 (action-run, minor)
   - PNG: `shots/final-gate-critic-2/ar-graph-l.png`, `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`
7. **FG2-095 [theme-fixable-css] Actions details: matrix label inside the node card (github.com: tab on the card's top edge); job log panel has a 1px border (github.com borderless)** — impact 2 (judges 0, critic wt 2; gate 1 FG-072; routes: action-run, action-job-ok)
   - Fix: Matrix label as a 20px tab above the card border; drop the log container border (keep the muted/inset bg).
   - Critic refs: C063 (action-run, nit), C139 (action-job-ok, nit)
   - PNG: `docs/reference/crit-app-action-job/light-1440.png`, `shots/final-gate-2/action-job-ok/light-1440.png`, `shots/final-gate-2/action-run/dark-1440.png`, `shots/final-gate-2/action-run/light-1440.png`

## Final gate #2 — status (pages/actions-packages-projects, wave L2 round 1; shots/pages-actions-packages-projects-fg2-r0 = before, -fg2-r3 = after, 11 routes x light/dark x 1440/390 + states)
- **FG2-022 DONE** — `html:lang(en)` generated text: pane "Actions" h2 20px/30px 600 (4px above, 8px to the NavList; ≥768 only, like github's d-md-block) and a 1px --borderColor-muted rule between "All workflows" and the workflow names (7px/8px, spanning the list's 8px insets, drawn by the 2nd item because Gitea hides `.ui.vertical.menu .item:first-child::before` !important; `mask: none` beats navigation's NavList icon mask). Content column PageHeader "All workflows" 20px/400 on a 32px row + "Showing runs from all workflows" 14px/21px muted, 24px to the Box — only while "All workflows" is current, all widths (also on the empty filter). Measured at 1440: pane h2 +4, first item +42, Box +77 from the column top = github.com (198/202/240/275). Not done: the item still reads "All Workflows" (Gitea locale text; both pseudos of that item are taken), no "Filter workflow runs" input (no feature).
- **FG2-029 DONE (CSS part)** — list rows: leading 16px `package` octicon (mask, --fgColor-default, 8px gap); filter row: Type select moved first as a default button (--button-default-*, 14px/500, 16px start padding, left radius), input joined after it, group capped at 640px ≥768 (github ≈645px); package title: 32px muted package icon 12px before the name; versions page: breadcrumb link accent without underline, last crumb 400, `html:lang(en)` spacious Subhead "Versions" 24px/36px 400 (44px above = crumb 4 + 40, 8px + 1px --borderColor-muted + 16px below). Not done: "(1.0.0)" is one text node with the name (template) → cannot be muted; version names stay 16px/600 --fgColor-default — that IS github.com's versions list (measured Box-row link 16px/600 rgb(31,35,40)), so C195 is left as parity; install copy button + one-line scroll already there (now visible at 390).
- **FG2-051 DONE** — board: right-edge fade over the board's end padding (mask-image; nothing faded at the scroll end); columns now reach the footer (page chain grows, board flex-grow, page bottom space → board's 8px), cards still scroll per column; <768 the header actions stay ONE joined ButtonGroup of 32px IconButtons (label text kept as accessible name via font-size 0) — title + group share one row at 390. List: Edit/Close/Delete hidden until the row is hovered/focused (`@media (hover: hover)`; always visible on touch). Not done: Open/Closed "N Open" is one text node → no Counter pill.
- **FG2-056 DONE** — <768 the pane and its lists dissolve (display: contents): the current item moves under the run header as github's 20px/600 selector row (status icon 24px at x=16 like the title's, name at x=48; "Summary" on the run page without the home icon), content next, the rest of the NavList below. No "Search logs" (no feature).
- **FG2-071 DONE** — commit link clipped to 7 mono cells (51.9px at 12px), underline kept (github.com: Link--muted underlined, 7 chars).
- **FG2-085 DONE** — `.graph-svg > g[mask] { mask: none }`: Lint → Build edge visible in both schemes (r3 action-run light/dark 1440).
- **FG2-095 DONE** — matrix label is a 22px tab on the card's top edge (12px/18px, 4px 16px 0, --card-bgColor, 1px --borderColor-default on three sides, square card corner under it; accent border on hover/related); job log panel borderless, --bgColor-inset, 3px radius (github.com actions-fullwidth-module: no border, 3px radius).

## Final gate #2 — critic wL2-r1 findings (pages/actions-packages-projects, wave L2 round 2; shots/pages-actions-packages-projects-wl2-r3, routes shots/pages-actions-packages-projects-wl2-routes.json incl. awl2-actions-workflow)
- **#1 major DONE** — workflow selected (`?workflow=ci.yml`): the workflow_dispatch `.ui.attached.message` is a blue Box-row inside the runs Box (margin 0, 16px padding, Box side borders, --borderColor-muted rule to the first run, no radius; edge to edge < md). Measured 1440: header y128 h66 → message y194 h61 → runs y255, no gaps, both schemes.
- **#2 DONE** — < md the generated "All workflows" heading is dropped (the NavList right above already starts with the current "All Workflows"); the muted subtitle stays. ≥ md unchanged.
- **#3 DONE (trade-off)** — < md the board header keeps Fullscreen / Edit / New column as IconButtons, Close (Reopen) and Delete show their text (no icon), still one joined group; the group now sits on its own row under the title at 390 (text labels do not fit beside it). No CSS tooltip possible for the icons.
- **#4 DONE** — matrix tab 20px above the card border (12px/18px 500, 2px 16px 0), right edge bends into the card top through a 6px concave corner (::after radial gradient, follows the accent border on hover/related); collapsed body centred, "N jobs completed" 14px/400, "Show all jobs" 12px under the icon, 16px inset.
- **#5 DONE** — < md on the run page the divider after the (moved) Summary list is hidden: one rule under the graph.
- **#6 partly** — run title status icon 22px at ≥ md (centred on the 30px line), 16px < md; the < md selector-row icon is 16px too, both names at x=40. Re-run on its own row at 390: Vue markup, left.
- **#7 DONE** — packages Type / versions sort: placeholder in --button-default-fgColor-rest, triangle-down octicon (template svg, Select arrows mask removed), chosen type reads "Type: npm" (English-only muted label).
- **#8 DONE** — versions breadcrumb "/" --fgColor-muted; last crumb and "Versions" Subhead --fgColor-default.

# Integrator (L2b, 2026-09-30): page-scope LEAK fixed in this folder (FG2-105)
`packages.css`: the 12 `.packages .items-with-main …` rules also matched the org / user **settings** Packages pages
(`organization settings packages`, `user settings packages`): the "No cleanup rules available" text became a bordered Box
with 0 padding (shots/l2b-leaks/org-pkg.png). They now read `.packages:not(.settings) .items-with-main …` (packages list,
package view, versions and the profile Packages tab keep them). `src/pages/actions-packages-projects/scopes.json` declares
the folder's scopes; `.actions.repository` on repo settings → Actions is inert (probe 0/18).
