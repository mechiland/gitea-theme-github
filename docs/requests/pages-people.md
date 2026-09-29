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
