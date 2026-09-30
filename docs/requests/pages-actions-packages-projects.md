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
