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
