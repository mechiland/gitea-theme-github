# Final gate — group 5 (critic 5)

Theme `github-auto`, Gitea 1.27.3. Sources: `shots/final-gate/<route>/*` (full run), live re-capture with `--states --measure` into
`shots/final-gate-critic-5/live/`, crops in `shots/final-gate-critic-5/`, DOM probes via `shots/final-gate-critic-5/probe.mjs`.
References: `docs/reference/{signup (blocked by github "Access restricted" page — unusable), repo-pull, directory-tree, labels, crit-app-projects-list, crit-app-action-job}`.

Audit logs (all 48 page captures, both runs): 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colors, 0 unlayered Gitea CSS.
Only non-Octicon: `fontawesome-openid` on signup (brand icon, allowed exception). Horizontal overflow on 2 routes at 390 (see blockers). CLS: action-job-ok 0.0599 @390 (Vue mount), 0.0012 @1440; all others 0.

## Scores (1440 light / 1440 dark / 390)

| route | light | dark | 390 |
|---|---|---|---|
| signup | 8.0 | 8.0 | 8.0 |
| notifications | 7.5 | 7.5 | 7.0 |
| repo-pull | 8.5 | 8.5 | 7.5 |
| directory-tree | 8.0 | 8.0 | 5.5 |
| releases-playground-with-assets-prerelease-draft | 8.0 | 8.0 | 7.0 |
| labels | 8.5 | 8.5 | 8.0 |
| pr-files-changed-unified-playground-large-diff | 8.5 | 8.5 | 5.0 |
| projects-list | 7.5 | 7.5 | 7.0 |
| repo-settings-branches | 8.0 | 8.0 | 7.5 |
| admin-emails | 7.5 | 7.5 | 7.0 |
| action-job-ok | 8.5 | 8.5 | 7.5 |
| pr-compare-new-playground | 8.5 | 8.5 | 7.5 |

## Blockers / majors

1. **pr-files-changed-unified-playground-large-diff @390 — page is 754px wide** (`document.horizontalOverflow=true`, final-gate and live).
   Root: `table.chroma` of `web/src/tokens.ts` is 736px wide inside `.file-body.code-diff.code-diff-unified` (overflow-x: visible); the inline
   review comment in that file contains a `<pre>` (`export function cssVariables(...)`) that does not wrap/scroll and forces the table width, which also
   turns off soft-wrap for every line of that file. See `shots/final-gate-critic-5/prf-l390-tail.png`, `prf-l390-0.png` (blank right half).
   Gitea baseline also overflows (666px) but ours is worse (754px). Owner: **code** (`.code-diff*` table layout / `table-layout`, overflow on `.file-body`),
   with **markdown** for `pre` inside `.comment-code-cloud .markup` (needs `overflow:auto; max-width:100%`).
2. **directory-tree @390 — page is 404–421px wide (regression; baseline 390px)**. `a.m-commit-count` (history icon + count in the latest-commit
   header row of `#repo-files-table`) ends at x=421 with viewport 390. `shots/final-gate/directory-tree/light-390.png` (history icon outside the box, right edge).
   Owner: **code** (`#repo-files-table` latest-commit row must wrap like GitHub's 2-line mobile commit box).

## Per-route findings

### signup (Gitea-only form; github.com reference blocked → judged vs github.com/login)
- minor: controls are 40px (large) and the column 352px; GitHub login uses 32px inputs/button in a 340px column (measure: button h=40, w=352). pages/auth.
- nit: error flash (`states/dark-1440-validation-error.png`) has no leading octicon / close button as Primer Flash does. overlays.

### notifications (Gitea-only)
- minor: unread counter `.notifications-unread-count` is transparent with 1px #d1d9e0 border; Primer CounterLabel is filled `bgColor-neutral-muted`, no border (repo tab counters already are). `notif-light-top.png`. pages/people.
- minor: "Mark all as read" is an icon-only **green primary** 34×28 button (`notif-dark-right.png`); GitHub uses a default (grey) button for this action. pages/people.
- minor @390: Unread/Read tabs have no selected indicator (only bold), `final-gate/notifications/light-390.png`. pages/people.

### repo-pull
- minor: sidebar "Add dependency…" select is 32px tall next to a 28px "+" button, bottoms misaligned by ~4px; also in dark-390. `pull-light-dep.png`. controls (`.ui.action.input` / selection dropdown height) — pages/issues-prs if scoped.
- minor @390: comment header wraps to 3 lines (author / "(Migrated from github.com)" / reactions+kebab on their own line, ~85px tall). GitHub keeps the kebab on line 1. `pull-light-390-0.png`, `-1.png`. pages/issues-prs.
- nit: code-block copy button is borderless icon; github.com shows a bordered 32px IconButton (`pull-light-a.png` vs `pull-ref-a.png`). markdown.
- nit: "Files Changed" tab icon is `diff`, GitHub uses `file-diff`. icons/navigation.

### directory-tree
- major @390: overflow (above). Also the toolbar wraps into 3 rows (branch+compare+breadcrumb / Go to file+Add File / …+History); GitHub fits one row. pages/repo.
- minor @1440: no vertical divider between file-tree pane and content; tree starts at x=32 instead of GitHub's full-height 320px pane with right border (ref `docs/reference/directory-tree/light-1440.png`). code.
- nit: no "Name / Last commit message / Last commit date" header row (Gitea structure).

### releases-playground-with-assets-prerelease-draft
- minor: "Downloads" summary is 20px bold with the browser's native ▶ disclosure marker, not an Octicon triangle (GitHub "Assets" row: 16px semibold, octicon, counter). `final-gate/.../light-1440.png` y≈700. pages/repo.
- minor @390: title row wraps awkwardly — status "×" alone on a line, "Stable"/"Pre-Release" label pushed to a second right-aligned line, "· 116 commits" starts a line with the dot. `rel-light-390-1.png`. pages/repo.
- nit: bare red "×" commit-status glyph next to titles reads as stray (no hover target styling).

### labels
- minor: delete confirm modal uses a green primary "Confirm" for a destructive action (`states/dark-390-confirm-modal-open.png`); Primer uses danger. overlays.
- nit: edit modal input heights differ (Name ≈28, Description ≈27, Color 32px) `states/light-1440-edit-modal-open.png`. controls.
- nit: Labels/Milestones switch has no selected container (plain bold text). pages/issues-prs.
- dark label rendering matches GitHub's HSL formula (`labels-dark-crop.png`).

### pr-files-changed-unified-playground-large-diff
- blocker @390: overflow (above).
- minor: inline review-thread author ("carol-ops commented …") is muted regular weight, and the box has a speech caret; conversation-tab comments are bold/fg-default with no caret. `prf-inline-comment.png`. pages/issues-prs.
- nit: bottom "expand down" cell is 72px wide, inset 8px each side vs the 88px line-number columns (also on compare page). `cmp-expander.png`. code.
- diff colors light exact to Primer (`#ffebe9/#ffcecb/#dafbe1/#aceebb/#ddf4ff/#b6e3ff`).

### projects-list (Gitea-only list; GitHub repo projects list as reference)
- minor: Open/Closed toggles sit above the search, outside the Box; GitHub puts them in the Box header with counters. pages/actions-packages-projects.
- minor: "New Project" is 28px (small); page-level primary buttons on GitHub are 32px. pages/actions-packages-projects.
- minor: Edit/Close/Delete (red) always visible per row; GitHub hides them behind a kebab menu. pages/actions-packages-projects.
- nit @390: order flips (New Project left, Open/Closed right).

### repo-settings-branches
- minor: "Add New Rule" is `tiny` primary (28px) next to a 32px "Update Default Branch"; both primary green where GitHub uses default buttons in settings. pages/settings-admin.
- nit: current branch "main" rendered as `.default.text` in fgColor-muted (#59636e) so it reads as a placeholder. controls.

### admin-emails
- minor: "Activated" column checks are accent-blue (links) for 4 rows and green for one, trash icons accent blue; reads inconsistent — GitHub would render status icons in success/muted and destructive icon-buttons muted→danger on hover. `final-gate/admin-emails/light-1440.png`. pages/settings-admin.
- nit @390: table scrolls inside the box (OK) but emails are ellipsized and Primary/Activated columns are off-screen without affordance.

### action-job-ok
- nit: "Re-run failed jobs" split button is 28px; GitHub's is 32px. pages/actions-packages-projects.
- nit: CLS 0.0599 @390 from `div.action-view-body/left` at mount.
- nit @390: job sidebar list bleeds to 8px from the viewport edge while content uses the 16px gutter.

### pr-compare-new-playground
- nit: "1 Commits" Box is ~2px wider than the neighbouring boxes (1409 vs 1407 right edge; visible @390). data-display.
- nit: bottom expander inset (see pr-files).
