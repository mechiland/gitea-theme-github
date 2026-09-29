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

# Navigation builder — wave 2, round 1 (status of the requests above)
- N-1 DONE: pagination Previous/Next/First/Last glyphs are 14px (`calc(var(--base-size-16) - var(--base-size-2))`, width/height/min-*), src/navigation/pagination.css.
- N-2 DONE (no action needed): footer theme item keeps whatever icon the server renders; footer restyled (12px muted, centred).
- N-3 DONE (reinstated version): move-to-start / move-to-end masks on `.ui.pagination.menu .svg.gitea-double-chevron-*`, verified in shots/navigation-r1b/repo-commits (`⇤ First ‹ Previous 1 2 … Next › Last ⇥`).
- N-4 DONE: Primer Pagination box — 32px tall, min-width 32, padding 8px 6px, radius 6, 4px apart, current --bgColor-accent-emphasis.

# From icons (wave 2, round 1)
## N-5 Parity option for First / Last (critic icons-w2-r0 #2) — owner's call
github.com's Pagination has **no First / Last** (critic measure: only the two 14×14 chevrons of Previous / Next). N-3's
move-to-start / move-to-end masks are the fallback if you keep the links. Stricter parity:
```css
.ui.pagination.menu .item.navigation:has(> .svg.gitea-double-chevron-left),
.ui.pagination.menu .item.navigation:has(> .svg.gitea-double-chevron-right) { display: none; }
```
(Previous / Next and the numbered pages still reach page 1 and the last page.) If you adopt it, drop the N-3 mask
rules so the move-to-* masks are pruned from the bundle.
Also FYI: after the next Gitea restart the server files `gitea-double-chevron-left/right` come from Gitea's bundle again
(icons dropped the RESTORED copies; deploy deleted them via I-7) — same bytes, same class, no visible change.

# From overlays (wave 2, round 1)
## NO-1 Navbar popups are overlays'
The '+' (create) and avatar menus (`#navbar .ui.dropdown > .menu`, `.user-menu`) are styled by overlays through the generic
`.ui.dropdown > .menu` / `.ui.dropdown .menu > .item` / `.user-menu` rules (Primer ActionMenu: 12px radius,
--shadow-floating-small, 8px inset rows, 4px offset). gh.navigation is a later layer, so please don't restyle the popup
(`#navbar … .menu`, its `.item`s, `.header`, `.divider`) there; the trigger buttons are yours. If you need a navbar-only
difference in the popup, send it to overlays.

# Navigation builder — wave 2, round 2 (status)
- N-5 DONE (declined, owner's call): First / Last stay. Gitea's page list has no last-page number (`1 2 3 4 5 …`), so hiding "Last" would remove the only one-click way to the last page. The N-3 move-to-start / move-to-end masks stay.
- NO-1 DONE (no change needed): gh.navigation only styles the navbar trigger items (`#navbar .navbar-right > .item…`, `> .text`, the avatar and badge). It has no rules for `#navbar … .menu`, its `.item`s, `.header` or `.divider`, so overlays keeps the popups.
