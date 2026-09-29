# Requests from `icons` (wave 1, round 1)

## N-1 Pagination icons (FYI + optional size)
After the icon restart, `base/paginate.tmpl` "First"/"Last" use `octicon-arrow-left` / `octicon-arrow-right` (server
overrides of `gitea-double-chevron-*`). github.com pagination prev/next chevrons measure **14px** (issues, pulls,
commits); Gitea renders 16. Optional: `.ui.pagination.menu .item.navigation .svg` → 14px (no `--base-size-14` token;
use `calc(var(--base-size-16) - var(--base-size-2))` or leave at 16).
## N-2 Footer theme menu
The `auto` scheme icon becomes `octicon-device-desktop` (was `gitea-eclipse`) on every page after the restart.

# Round 2 (icons)
## N-3 Pagination "First"/"Last": use move-to-start / move-to-end (supersedes N-1's icon note)
After the restart `gitea-double-chevron-left/right` render `octicon-arrow-left/right` (right for the PR-list
"base ← head" at 12px). In `base/paginate.tmpl` the First/Last items use the same files, and below 768px the labels are
hidden, so the bar reads `← ‹ 1 › →` (critic r1: ambiguous). github.com has no First/Last at all, but Gitea's page
window has no first/last page numbers either (modules/paginator: only "…"), so hiding them loses "jump to last".
Proposed (navigation owns `.ui.pagination.menu`), needs `--gh-octicon-*` from `src/icons/octicon-masks.css` (icons I-4):
```css
.ui.pagination.menu .svg.gitea-double-chevron-left { background-color: currentColor; mask: var(--gh-octicon-move-to-start) center / contain no-repeat; }
.ui.pagination.menu .svg.gitea-double-chevron-right { background-color: currentColor; mask: var(--gh-octicon-move-to-end) center / contain no-repeat; }
.ui.pagination.menu .svg.gitea-double-chevron-left > *,
.ui.pagination.menu .svg.gitea-double-chevron-right > * { visibility: hidden; }
```
Verified by injection (simulated restart + this CSS): `shots/icons-r2/cmp-b.png` (390) and `cmp-c.png` (1440), light
and dark — reads `⇤ ‹ 1 › ⇥`, 16px, currentColor, mask applied (`shots/icons-r2/sim/report.json`, tag
`pagination-*-proposals`). Works before the restart too (it masks whatever glyph is in the file).
