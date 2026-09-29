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
