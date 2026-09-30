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


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-017 [theme-fixable-template] Issues / PRs / Labels / Milestones pages lack github.com's issues layout: left NavList (Issues, Assigned to me, Created by me, Mentioned, Milestones, Labels) and an 'All issues' heading + query bar** — impact 45 (judges 45, critic wt 0; routes: milestones, issues-list-closed, labels, repo-issues, repo-pulls)
   - Fix: github-* branch in templates/repo/issue/list.tmpl (+ labels / milestones pages): left NavList linking to existing Gitea filters (?type=all|assigned|created_by|mentioned, milestones, labels) and a Subhead 'Issues'/'Pull requests' above Gitea's search input restyled as the query bar. No new functionality, no removed filters.
   - PNG: `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/issues-list-closed/dark-1440.png`, `shots/final-gate/issues-list-closed/light-1440.png`
2. **FG-039 [theme-fixable-css] Labels | Milestones switch is plain text with no selected container** — impact 11 (judges 9, critic wt 2; routes: milestones, labels)
   - Fix: Primer SegmentedControl / subnav: bordered pair, selected item bgColor-emphasis-less fill.
   - Critic refs: C151 (labels, nit), C182 (milestones, nit)
   - PNG: `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`, `shots/final-gate/labels/dark-1440.png`
3. **FG-051 [theme-fixable-template] Labels rows repeat '0 open issues/pull requests' text and Edit/Delete links on every row (github.com: compact icon counts, actions in a kebab)** — impact 8 (judges 8, critic wt 0; routes: labels)
   - Fix: Low priority: github-* branch in templates/repo/issue/labels/label_list.tmpl: counts as issue-opened/git-pull-request icon + number, Edit/Delete in a kebab ActionMenu.
   - PNG: `shots/final-gate/labels/dark-1440.png`, `shots/final-gate/labels/light-1440.png`
4. **FG-066 [theme-fixable-css] Inline review thread header: author not emphasised (muted regular), caret/avatar outside the thread box** — impact 6 (judges 0, critic wt 6; routes: pr-files-changed-unified-playground-large-diff, pr-files-changed-split-playground-large-diff)
   - Fix: Author 600 fgColor-default like conversation comments; no caret on diff-embedded threads.
   - Critic refs: C124 (pr-files-changed-split-playground-large-diff, minor), C153 (pr-files-changed-unified-playground-large-diff, minor)
   - PNG: `shots/final-gate-critic-4/prsplit-thread.png`, `shots/final-gate-critic-5/prf-inline-comment.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/dark-1440.png`, `shots/final-gate/pr-files-changed-unified-playground-large-diff/light-1440.png`
5. **FG-069 [theme-fixable-css] New-issue Preview tab collapses to 0 height; org labels page mixes 28px and 32px buttons** — impact 6 (judges 0, critic wt 6; routes: org-settings-labels, issue-new-playground)
   - Fix: min-height 'Nothing to preview' area, hide the attachment bar in preview; 'New Label' medium 32px.
   - Critic refs: C133 (issue-new-playground, minor), C206 (org-settings-labels, minor)
   - PNG: `shots/final-gate-critic-4/issuenew-preview.png`, `shots/final-gate/org-settings-labels/dark-1440.png`, `shots/final-gate/org-settings-labels/light-1440.png`, `shots/final-gate/issue-new-playground/dark-1440.png`
6. **FG-070 [theme-fixable-css] Mobile PR conversation: review diff boxes break the 16px gutter (left=4px)** — impact 6 (judges 0, critic wt 6; routes: pr-conversation-playground-large-diff-reviews)
   - Fix: .conversation-holder margin to the 16px gutter at <768.
   - Critic refs: C097 (pr-conversation-playground-large-diff-reviews, major)
   - PNG: `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-390.png`
7. **FG-071 [theme-fixable-css] Review 'Reply' button icon invisible in light (white svg on #f6f8fa)** — impact 6 (judges 0, critic wt 6; routes: pr-conversation-playground-large-diff-reviews)
   - Fix: .code-comments-list .comment-form-reply svg → fgColor-muted.
   - Critic refs: C096 (pr-conversation-playground-large-diff-reviews, major)
   - PNG: `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-1440.png`
8. **FG-073 [theme-fixable-css] Milestone row: '0%' left of a fixed-width bar; github.com: full-width bar with '0% complete · 2 open · 0 closed' below** — impact 6 (judges 3, critic wt 3; routes: milestones)
   - Fix: Bar full row width; percentage text moved below the bar (order/flex-wrap).
   - Critic refs: C181 (milestones, minor)
   - PNG: `shots/final-gate-critic-6/ms-m.png`, `shots/final-gate/milestones/dark-390.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-390.png`
9. **FG-074 [theme-fixable-css] Mobile: bulk-select checkboxes on every issue row; head-branch pill wraps over 3 lines** — impact 6 (judges 0, critic wt 6; routes: pr-conversation-closed-unmerged, issues-list-closed)
   - Fix: <768: hide the bulk-select column (github.com does; bulk actions stay on desktop) — confirm with owner that this is not 'hiding functionality' (it is a narrow-viewport layout choice); branch pill nowrap + ellipsis + max-width.
   - Critic refs: C094 (issues-list-closed, minor), C044 (pr-conversation-closed-unmerged, minor)
   - PNG: `shots/final-gate-critic-1/pr-mob-l.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-390.png`, `shots/final-gate/pr-conversation-closed-unmerged/dark-1440.png`, `shots/final-gate/pr-conversation-closed-unmerged/light-390.png`
10. **FG-084 [theme-fixable-css] Timeline: commit summaries in monospace, label pills ~4px above the baseline, SHA as bordered chip** — impact 4 (judges 0, critic wt 4; routes: pr-conversation-playground-large-diff-reviews, pr-draft-wip-playground)
   - Fix: Commit messages sans, SHA mono link (see sha-style), vertical-align labels to text.
   - Critic refs: C098 (pr-conversation-playground-large-diff-reviews, minor), C199 (pr-draft-wip-playground, nit)
   - PNG: `shots/final-gate-critic-7/pr-draft-wip-playground/zoom-timeline.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/dark-1440.png`, `shots/final-gate/pr-conversation-playground-large-diff-reviews/light-1440.png`, `shots/final-gate/pr-draft-wip-playground/dark-1440.png`
11. **FG-108 [theme-fixable-css] PR/issue list titles read heavier than github.com (system font at 600; 500 matches Mona Sans visually)** — impact 3 (judges 0, critic wt 3; routes: repo-pulls)
   - Fix: Try 500 on list titles only; critic to confirm against the reference.
   - Critic refs: C112 (repo-pulls, minor)
   - PNG: `shots/final-gate-critic-4/pulls-rows.png`, `shots/final-gate/repo-pulls/light-1440.png`

# Integrator (final gate #1 follow-up, 2026-09-30): FG-017 issues NavList template APPROVED for the issue/PR LIST only (ORC-9)
`templates/repo/issue/list.tmpl`, github-* themes only (repo issues and pulls lists). Inside `.page-content.issue-list > .ui.container`:
```
div.gh-issues-layout
  nav.gh-issues-nav > a.gh-issues-nav-item[.selected][aria-current=page] > svg + span
      All issues | All pull requests (?type=all) ; signed in: Assigned to you (?type=assigned), Created by you (created_by),
      [PRs: Review requested, Reviewed by you], Mentioning you (mentioned) ; div.gh-issues-nav-divider[role=separator] ;
      Milestones (→ /milestones) ; Labels (→ /labels)          (links keep ?state=; locale keys repo.issues.filter_type.*)
  div.gh-issues-main
    h2.gh-issues-title ("All issues" / the selected type's label)
    … Gitea's alert, recently-pushed prompt, #issue-pins, .list-header (search + Labels/Milestones buttons + New issue),
      #issue-filters, #issue-actions, the issue list and pagination — unchanged
```
Style: 2 columns ≥ 1012px (nav 256px NavList rows 32px, selected = 4px accent bar + `--control-transparent-bgColor-selected`,
gap 24px), title 20px/600 with New issue at the right if you move it, search input as the query bar. The Labels/Milestones
buttons in `.list-header` duplicate the NavList — you may hide them for the github themes. < 768: one column (nav as a
horizontally scrolling row or below the title). The Labels and Milestones pages were NOT given the NavList (template cap
§7 e; they keep Gitea's Labels|Milestones switch — FG-039 CSS applies there).
