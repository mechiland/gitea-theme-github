# Requests for pages/issues-prs

# Pointer from the integrator (2026-09-30)
- **P-1 (from icons, docs/requests/icons.md "P-1 → pages/issues-prs"):** PR-list "base ← head" glyph. The server file
  `gitea-double-chevron-left` is Gitea's original `«`; mask it in GitHub themes with `--gh-octicon-arrow-left` (12px):
  `#issue-list .branches > .svg.gitea-double-chevron-left { background-color: currentColor; mask: var(--gh-octicon-arrow-left) center / contain no-repeat; }`
  `#issue-list .branches > .svg.gitea-double-chevron-left > * { visibility: hidden; }`
- **From controls #3/#10:** issue-title buttons height; issue-list toolbar upsizing to 32px (github.com medium);
  comment-form buttons on mobile (controls keeps natural width — say if you want full width).
- **From data-display D-3:** timeline cross-reference state icons 12px (if page-scoped).
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.

# Requests from data-display (wave 2, round 1)
## DD-1 Issue/PR list toolbar as the Box-header of the list
data-display now boxes `#issue-list` (1px `--borderColor-default`, 6px radius, rows 8px 16px, hover `--bgColor-muted`,
see `src/data-display/list-rows.css`). github.com puts the Open/Closed counters + filters in the Box-header of the same
Box (48px, `--bgColor-muted`, padding 8px, radius 6px 6px 0 0). Proposed (page-scoped, yours):
```css
#issue-filters.issue-list-toolbar { margin: 0; padding: var(--base-size-8) var(--base-size-16);
  border: var(--borderWidth-thin) solid var(--borderColor-default); border-bottom: 0;
  border-radius: var(--borderRadius-medium) var(--borderRadius-medium) 0 0; background: var(--bgColor-muted); }
#issue-filters.issue-list-toolbar + #issue-actions + #issue-list,
#issue-filters.issue-list-toolbar ~ #issue-list { border-top-left-radius: 0; border-top-right-radius: 0; }
```
(`#issue-list > .item:first-child` top radii would then also go to 0 — restate in your folder.)
## DD-2 Milestone list as a Box
`.flex-divided-list.milestone-list` (repo milestones, projects list) is unboxed; github.com boxes it (header Open/Closed
+ Sort, rows padding 16px). Rows/separators already come from data-display (`--borderColor-muted`, 16px padding);
the frame is page-scoped: `.milestone-list { border: 1px solid var(--borderColor-default); border-radius: 6px }` and
`.milestone-list > .item { padding-inline: var(--base-size-16) }`.

# From icons (wave 2, round 1)
## P-2 PR-list branch chips: parity option (critic icons-w2-r0 #2) — owner's call
github.com's PR list shows **no** base/head branch chips (critic `shots/critic-icons-r0/crops/gh-pulls-bottom.png`). Two options:
- parity: `#issue-list .item .branches { display: none; }` (the `gitea-double-chevron-left` 12px glyph goes with it), or
- keep the chips and apply P-1 (mask the 12px « with `--gh-octicon-arrow-left`, reads `main ← head`).
Either removes the 236 `gitea-double-chevron-left` non-Octicon hits (36 pages) the audit reports today on PR lists.

# Integrator (end of wave 2, 2026-09-30) — seams with data-display
- `#issue-list` Box and rows (`#issue-list > .item…`, 20 selectors in src/data-display/list-rows.css) are data-display's
  (shared/issuelist.tmpl is used on repo, dashboard and milestone pages). You win by layer anyway: restate page-only
  deviations with a page-scoped selector (e.g. `.page-content.repository.issue-list #issue-list …`), never the exact same
  selector (the lint rejects it). DD-1 (toolbar as Box-header) and DD-2 (milestone list box) are yours.
- The issue/PR sidebar (`.issue-content-right`) is drawn as a bordered Box because it is a `.ui.segment` (data-display
  Box rule). github.com's sidebar has no frame (shots/integrate-w2/repo-issue/dark-1440.png) — unframe it page-scoped.
- Migrated-comment headers wrap badly at 390 ("comme-nted", shots/integrate-w2/repo-issue/dark-390.png, data-display known gap).

# Handled by pages/issues-prs (wave 3, round 1)
- P-1 → DONE: PR-list « masked with `--gh-octicon-arrow-left` (page-scoped, list.css); branch chips restyled as Primer BranchName tokens.
- P-2 → DONE (chose "keep chips + P-1"): chips carry base/head info github.com shows in the PR header; restyled rather than hidden.
- controls #3/#10 → DONE: issue-title buttons 32px, list top bar (search, Labels/Milestones ButtonGroup, New) 32px; comment-form buttons keep natural width on mobile (no full-width request).
- D-3 → not done (timeline cross-reference icons are data-display's generic timeline; no page deviation needed yet).
- DD-1 → DONE: #issue-filters / #issue-actions as the Box header (48px, --bgColor-muted), rows' top radii squared (list.css).
- DD-2 → DONE: milestone list boxed under the Open/Closed header, rows 16px (labels-milestones.css).
- Integrator: sidebar unframed → DONE (sidebar.css, github.com discussion-sidebar spec); migrated-comment header wrap at 390 → DONE (header.css, mobile-only `overflow-wrap: normal` on header parts).

# Handled by pages/issues-prs (wave 3, round 2) — critique docs/critiques/pages/issues-prs-w3-r1.md
- #1 merge-style menu under the composer → DONE page-scoped (merge-box.css: `.pull-merge-box .ui.buttons` isolation auto;
  ButtonGroup look restored while `:has(> .active.dropdown.button)`, also for "Update branch by merge"); generic fix
  requested from controls (docs/requests/controls.md IP-C3).
- #2 new-PR compare form → DONE: layout/sidebar/composer scopes include `.repository.compare.pull`.
- #3 Close issue icon purple → DONE (`#status-button > .status-button-icon > .svg { color: inherit }`).
- #4 diffstat → DONE: 12px (header.important.css), github.com DiffSquares (whole 8px squares r2, green/red/neutral).
- #5 390 header → DONE: actions above title, 26px title, StateLabel row + full-width meta, branch tokens ellipsis.
- #6 toolbar centred on the tabs, #7 search input 14px, #8 labels one-line rows 57px, #9 reply form = composer → DONE.
- #10 PR-list branch chips → kept (P-2 decision). #11 → "#N" 300, gap 10px, filter labels button-invisible fg,
  pressed state = --control-transparent-bgColor-active, PR sidebar empty values default (issue sidebar stays muted).
- D-3 still not done (timeline cross-reference icons are data-display's generic timeline).

# Integrator (end of wave 3, 2026-09-30)
- Critic w3-r2 #1 (PR Commits tab 32px wider, pages/repo selector leak) — FIXED in pages/repo (`.repository.commits:not(.pull)`),
  verified shots/integrate-w3-seam/pr-commits-tab-playground/light-1440.png.
- Your page-scoped merge-box workaround stays; the generic fix IP-C3 (docs/requests/controls.md) is still open for controls.
- Routes merged into tools/shoot/routes.json: issue-new-playground, pr-compare-new-playground, issue-playground-1,
  pr-compare-form-playground, milestone-issues + your r2 states.
