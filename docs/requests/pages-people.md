# Requests from `icons` (wave 1, round 1)

## P-1 Dashboard repo list (Vue `DashboardRepoList.vue`) non-Octicons → CSS mask
JS-bundled, so the server overrides don't reach them. Needs `src/icons/octicon-masks.css` (docs/requests/icons.md I-4).
- commit status error/warning `gitea-exclamation` (`:38,40`) → `--gh-octicon-alert` (matches the server override).
- pagination first/last `gitea-double-chevron-left/right` (`:500,519`) → `--gh-octicon-arrow-left` / `--gh-octicon-arrow-right`.
```css
.dashboard-repos .gitea-exclamation,
.dashboard-repos .gitea-double-chevron-left,
.dashboard-repos .gitea-double-chevron-right { background-color: currentColor; mask: var(--gh-octicon-alert) center / contain no-repeat; }
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-arrow-left); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-arrow-right); }
.dashboard-repos :is(.gitea-exclamation, .gitea-double-chevron-left, .gitea-double-chevron-right) > * { visibility: hidden; }
```
(Scope selector to be confirmed against the live DOM: `#dashboard-repo-list` / `.dashboard-repos`.)

# Round 3 (icons)
Dashboard repo-list pagination (Vue, `DashboardRepoList.vue:500,519`): to match the server pagination (whose files are
now `move-to-start` / `move-to-end`), use `--gh-octicon-move-to-start` / `--gh-octicon-move-to-end` instead of
`arrow-left` / `arrow-right` in lines 11–12 of the proposal above:
```css
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-move-to-start); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-move-to-end); }
```

# Round 4 (icons)
No change: the dashboard pagination masks from round 3 (`move-to-start` / `move-to-end`) still match the server
pagination, which now gets the same glyphs through navigation N-3 masks (the server files are Gitea's `«`/`»` again).

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
  P-1 (dashboard repo list masks, move-to-start/end) can ship in wave 3.
