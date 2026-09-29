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

# Round 3 (icons)
## N-3 WITHDRAWN, N-1 icon note superseded
The server files `gitea-double-chevron-left/right` now contain `octicon-move-to-start` / `octicon-move-to-end` (icons
round 3), so after the restart pagination First/Last read `⇤ ‹ 1 › ⇥` with **no CSS from navigation** (simulated,
`shots/icons-r3/cmp-a.png` 390 and `cmp-b.png` 1440, light + dark). Please do **not** add the N-3 masks (harmless but
redundant). N-1's size note (github.com chevrons are 14px) still stands.

# Round 4 (icons)
## N-3 REINSTATED (supersedes the round-3 withdrawal)
Critic r3 found that the round-3 file change (`gitea-double-chevron-*` → `move-to-start/end`) also changed the 12px
PR-list base/head arrow in **every theme**, including Gitea's default `gitea-auto`. The files are Gitea's original
`«`/`»` again (round 4). So in GitHub themes pagination First/Last need the N-3 masks from round 2 above, unchanged:
```css
.ui.pagination.menu .svg.gitea-double-chevron-left { background-color: currentColor; mask: var(--gh-octicon-move-to-start) center / contain no-repeat; }
.ui.pagination.menu .svg.gitea-double-chevron-right { background-color: currentColor; mask: var(--gh-octicon-move-to-end) center / contain no-repeat; }
.ui.pagination.menu .svg.gitea-double-chevron-left > *,
.ui.pagination.menu .svg.gitea-double-chevron-right > * { visibility: hidden; }
```
Needs `--gh-octicon-move-to-start/end` (icons I-4). Re-verified by injection in sim r4 (`shots/icons-r4/cmp-pag-branches.png`,
column `proposals`): 390 reads `⇤ ‹ 1 › ⇥`, 1440 reads `⇤ First ‹ Previous 1 2 3 4 5 … Next › Last ⇥`, light and dark,
mask applied, 16×16, background = currentColor rgb(31,35,40) light / rgb(240,246,252) dark. It works before and
after the restart (the masked file is Gitea's original either way). Without it the GitHub themes show Gitea's `«`/`»`
(today's state). N-1 (github.com chevrons are 14px, not 16) still stands; if you apply it, set width, height,
min-width and min-height together (Gitea's `svg.css` sets min-* from the attributes).
## N-4 Pagination item box (critic r3 measurement, cc)
Critic r3 (`docs/critiques/icons-w1-r3.md`, measure run `shots/critic-icons-r3/run`) measured the Gitea pagination
item at **43px tall, 4px radius, icon 16×16** vs github.com's Pagination **32px, 6px radius, chevrons 14×14**
(Primer `pagination/pagination.scss`: `min-width: 32px; padding: 5px 10px; line-height: 20px; border-radius: 6px`).
Owner: navigation (`.ui.pagination.menu`). Tokens: `--control-medium-size` (32px), `--borderRadius-medium` (6px).
Not an icon change; filed so it is not lost.

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
  N-3 (pagination First/Last masks) can ship now. N-1/N-4 are in your wave-2 brief.
