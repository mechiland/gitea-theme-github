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

# From controls (final gate #1, wave L1 r1, 2026-09-30)

## CT-FG060 (FG-060) Dependency Select is 32px next to the sidebar's 28px "+" IconButton
Where: issue / PR sidebar, `#addDependencyForm > .ui.fluid.action.input` = `.ui.search.selection.dropdown#new-dependency-drop-list`
+ `.ui.icon.button` (`templates/repo/issue/sidebar/issue_dependencies.tmpl:113`). Your `sidebar.css` makes every sidebar
button 28px (`.issue-content-right .ui.button { height/min-height: var(--control-small-size) }`) and the due-date input
28px, but the Select keeps controls' medium 32px → its bottom edge hangs 4px below the button (live /octo-org/grex/issues/35:
select y 1077 h 32, button h 28). Controls cannot see the page's size choice (the button has no `.small` class), and a
page-layer `height` beats controls' `align-self: stretch`, so the fix belongs next to your sidebar sizing.
Proposed (sidebar.css, same place as the 28px controls), = Primer Select size="small":
```css
.issue-content-right .ui.action.input > .ui.selection.dropdown {
  min-height: var(--control-small-size);
  padding-top: calc((var(--control-small-size) - var(--base-size-20)) / 2 - var(--borderWidth-thin));
  padding-bottom: calc((var(--control-small-size) - var(--base-size-20)) / 2 - var(--borderWidth-thin));
  padding-left: var(--control-small-paddingInline-condensed);
}

.issue-content-right .ui.action.input > .ui.search.selection.dropdown > input.search {
  padding-left: var(--control-small-paddingInline-condensed);
}
```
Verified by injecting the same rule (with the px values, the build renames tokens): select 293x28 and "+" 28x28 on one line,
light/dark, 1440 and 390 — `shots/controls-fg1/dep-proposed.png`; before: `shots/controls-fg1/r2/dep-now-light-1440.png`.
(The Select's up/down indicator is Primer Select's own glyph — `@primer/css/forms/form-select.scss` `.form-select`
background-image — not the browser's native arrow; the critic's "single chevron" note does not apply to a Select.)

## CT-FG089a (FG-089, part) comment editor "double border" — yours, FYI only
The critic (final-gate-group-4 #17, `shots/final-gate-critic-4/issue-dark-editor.png`) reads the bordered textarea inside
the comment Box as a double border. It is your composer.css layout (classic CommentBox: 8px body padding, bordered
textarea + file bar). Current github.com's React composer draws the textarea borderless inside one bordered box
(tabs strip / textarea / "Paste, drop, or click to add files" footer), with the buttons outside it. Your call; controls'
generic textarea keeps its border because the release / wiki / file editors have no surrounding Box.

## CT-FG048 (FYI) search fields: controls now draws the leading search icon generically
`src/controls/inputs.css` "search field": every `shared/search/*` group (`.ui.action.input` with `input[type=search]` or
`input[name=q]`) is a medium 32px/14px TextInput; when the submit button directly follows the input it becomes the
leading search octicon (github.com projects / repositories / branches / members look). Your trailing-IconButton issue
search is excluded by your own scope `:is(.issue-list, .milestone-issue-list, .repository.milestones) .list-header-search`.
That scope also matches the **repo projects list** (`templates/repo/projects/list.tmpl` renders
`.page-content.repository.projects.milestones`), which therefore keeps the trailing button while the org projects list
gets the leading icon (github.com projects list: leading icon). If you narrow your selector to
`.repository.milestones:not(.projects)`, tell controls (docs/requests/controls.md) and it will narrow its exclusion the
same way so both project lists match.

# Handled by pages/issues-prs (wave L1, round 1, 2026-09-30) — final gate #1
- FG-017 (NavList template, ORC-9) → DONE: issues-nav.css — full-width page, 256px NavList (32px items, selected
  --control-transparent-bgColor-selected + 4×24 accent bar, divider --borderColor-muted), title 20px/600 with New at its
  right, query bar row, list Box; measured equal to github.com (items x16 w223 h32, title +24, query/Box +16). < 1012px:
  NavList = scrolling row above the title. Gitea's Labels/Milestones buttons hidden (duplicate the NavList links).
- FG-039 → DONE: Labels | Milestones switch = Primer SegmentedControl (labels-milestones.css + .important.css).
- FG-051 → not done (template item; rejected by integrator).
- FG-066 → DONE: Files-changed inline threads as one Box, avatar inside, author 600 default, no caret, muted footer (review.css).
- FG-069 → DONE: Preview panel keeps 108px height, file bar hidden while previewing; org labels "New Label" 32px.
- FG-070 → DONE: review threads on the 16px gutter at < 768px.
- FG-071 → DONE: Reply button octicon --fgColor-muted (conversation and diff threads).
- FG-073 → DONE: milestone row = title | 320px progress column with "N%" under the bar; phones: title, bar, %, meta.
- FG-074 → DONE: bulk-select checkboxes hidden < 768px; deleted head-branch name truncates like the other BranchName tokens.
- FG-084 → DONE (partly): timeline commit summaries sans (header.important.css); label pills baseline-aligned. SHA chip
  look is FG-018 (pages/repo / data-display).
- FG-108 → DONE: list titles 500 (critic to confirm).
- PR Commits tab (FG-019 look) → DONE: "N Commits" header dropped when day groups render, 16px under the tabs,
  rows 16px/500 title + 12px muted author (github.com pull/42/commits); timeline itself is pages/repo's generic rule.
- Box header (#issue-filters) now 48px incl. border (was 49).
- CT-FG060 → DONE (sidebar.css, proposed rule applied). CT-FG089a → noted, not changed this round.
- CT-FG048 → DONE: all `.repository.milestones` selectors narrowed to `:not(.projects)`; controls told (docs/requests/controls.md).

# From icons (final gate #1, wave L1 round 1) — PR tab icon colour (measured, yours to apply)
github.com PR tab bar (pemistahl/grex/pull/42, logged out, `shots/icons-l1r1-ghtabs.mjs`): the four tab icons
(comment-discussion, git-commit, checklist, file-diff) compute to the **tab text colour**, selected or not —
rgb(31,35,40) light / rgb(240,246,252) dark (`--fgColor-default`), although they carry a `fg-muted` class. Ours
(`.pull.tabular.menu .svg`, live github-auto): rgb(89,99,110) / rgb(145,152,161) (`--fgColor-muted`), in
`shots/icons-l1r1/sim/cmp-repo-pull.png` vs `shots/icons-l1r1/gh-pr-tabs-light.png`. Proposed in header.css:
`.pull.tabular.menu .svg { margin-right: 0; color: var(--fgColor-default); }`.
The "Files changed" glyph itself (octicon-diff → file-diff) is handled by icons (`src/icons/pr-tabs.css`, pending the
integrator's icons layer IC-1); the mask paints `currentcolor`, so it follows whatever colour you set.

# Handled by pages/issues-prs (wave L1, round 2, 2026-09-30) — critique docs/critiques/pages/issues-prs-wL1-r1.md
- icons "PR tab icon colour" → DONE: `.pull.tabular.menu .svg { color: var(--fgColor-default) }` (header.css); measured rgb(240,246,252) dark.
- critic #1 (390 PR overflow) → DONE: `.issue-title-meta` keeps `justify-items:start` (StateLabel stays compact); the meta text child gets `justify-self:stretch; min-width:0` → pulls/348 and pulls/42 at 390: document 390px.
- critic #2 (FG-108) → DONE: list titles back to 600 (github.com draws the system font at 600).
- critic #3 (review-thread body offset) → DONE: `.code-comment` padding 8px 16px, header padding 0, body margin-left 24px → body x = author-name x (58/58 at 390, 226/226 at 1440).
- critic #5 (issue view avatar column) → DONE (issue-view.css, issues only, ≥768px): no avatar column, 20px avatar inside the comment header, no caret, Boxes at the content edge, timeline line 16px inside the Box edge through the event badges. PRs unchanged.
- critic #7 (NavList row cut off) → DONE: < 1012px the row fades out over its last 32px (mask), with 32px trailing padding so the last item scrolls clear.
- critic #10 (tooling) → change request written to docs/requests/integrator-tools.md.
- critic #4 (labels/milestones NavList layout) → not doable in CSS (template rejected). #6 (390 header 3 rows), #8, #9 → not changed (see round notes: 7 filters cannot fit one row at 358px without clipping their dropdown menus; counters need template markup).

# From icons (final gate #1, wave L1 round 2, 2026-09-30)
- **Withdrawn:** my L1 r1 note that the PR tab icons use `--fgColor-muted` is stale. Since build e9c90d580d they compute to
  `--fgColor-default` (rgb(31,35,40) light, rgb(240,246,252) dark), which matches github.com. No action needed.
- **Nit (critic icons wL1 r1 #4), yours if you want it:** in the repo-pull tab bar at 1440, light and dark, the svg centre
  sits +0.5px below the item centre. github.com's tabnav icons are at +0.02px. Size (16px), gap (8px) and colour already
  match. Measured by `shots/icons-l1r2-probe.mjs` → `shots/icons-l1r2/probe/report.json` (`dy`).
- FG-114: the Files changed glyph swap (`file-diff`) stays in icons (`src/icons/pr-tabs.css`). It goes live with
  integrator IC-1, and you don't need to do anything.


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-023 [theme-fixable-template] Labels and Milestones pages lack the issues NavList sidebar the Issues list now has; they show the Labels | Milestones toggle instead (github.com: left sidebar with Milestones / Labels selected)** — impact 18 (judges 18, critic wt 0; gate 1 FG-017; routes: labels, milestones)
   - Fix: **Last template slot (8/8) — proposed.** Override `templates/repo/issue/navbar.tmpl` (one file, 4 lines upstream): `{{if and (StringUtils.HasPrefix ctx.CurrentWebTheme.InternalName "github-") (or .PageIsLabels (and .PageIsMilestones .State))}}` (`.State` only exists on the Milestones list; NewMilestone/EditMilestone also set PageIsMilestones) render `<nav class="gh-issues-nav">` (Issues → {{.RepoLink}}/issues, divider, Milestones, Labels; `selected` + aria-current on the current one; keys repo.issues / repo.milestones / repo.labels; Octicons issue-opened / milestone / tag) `{{else}}` + upstream 4 lines verbatim + `{{end}}` (no trailing newline) — other themes and the other two callers (milestone_new, choose) keep upstream bytes. pages/issues-prs lays it out: `.repository:is(.labels,.milestones) > .ui.container { display:grid; grid-template-columns: 256px 1fr; gap:24px }`, `.issue-navbar { display: contents }`, nav `grid-row: 1 / span 20`, everything else column 2; < 768 the nav collapses like the Issues list. Reuses the existing `.gh-issues-nav*` styles.
   - PNG: `shots/final-gate-2/labels/dark-1440.png`, `shots/final-gate-2/labels/light-1440.png`, `shots/final-gate-2/milestones/dark-1440.png`, `shots/final-gate-2/milestones/light-1440.png`
2. **FG2-027 [theme-fixable-template] PR list shows the left NavList (ORC-9 override) but github.com's PR list has no sidebar (centred 1232px column, filters in the query bar)** — impact 14 (judges 8, critic wt 6, majors C096; gate 1 FG-017; routes: repo-pulls)
   - Fix: Edit of the existing `repo/issue/list.tmpl` override (no new slot): render `.gh-issues-nav` only when `not .PageIsPullList`; on PRs render upstream's type filter as before. pages/issues-prs: centred container layout on `.repository.pulls` (check scope: `.repository.pulls` vs `.repository.issue-list` — see the leak check).
   - Critic refs: C096 (repo-pulls, major)
   - PNG: `docs/reference/repo-pulls/light-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`
3. **FG2-031 [theme-fixable-css] 390 issue/PR lists: the NavList becomes a clipped horizontal strip ('Created by y…') and the 7 filter dropdowns wrap onto 2 rows in the Box header** — impact 12 (judges 0, critic wt 12; gate 1 FG-074; routes: repo-issues, repo-pulls, issues-list-closed)
   - Fix: < 768: NavList → a single 'All issues ▾'-style disclosure (show only the selected item; others in a `<details>`-free overflow: horizontal scroll with fade mask if no markup), filters on one horizontally scrolling row (`flex-wrap:nowrap; overflow-x:auto`) with a fade — no filter hidden.
   - Critic refs: C082 (issues-list-closed, minor), C098 (repo-pulls, minor), C170 (repo-issues, minor), C172 (repo-issues, minor)
   - PNG: `docs/reference/issues-list-closed/light-390.png`, `shots/final-gate-critic-4/pulls-390-top.png`, `docs/reference/repo-issues/light-390.png`, `shots/final-gate-critic-7/repo-issues_m_0.png`
4. **FG2-035 [theme-fixable-css] Milestone rows: bare '0%' under the bar (github.com '0% complete · 2 open · 0 closed'), inline red Delete / danger 'Close'** — impact 12 (judges 10, critic wt 2; gate 1 FG-073; routes: milestone-issues, milestones)
   - Fix: Put the percentage, open and closed counts on one muted 12px row under the bar (flex order of existing spans); Close = default button, Delete = danger only on hover (Primer). 'Dec 31, 9998' is data (inherent).
   - Critic refs: C156 (milestones, nit), C020 (milestone-issues, nit)
   - PNG: `shots/final-gate-critic-0/mi-l.png`, `shots/final-gate-2/milestone-issues/dark-1440.png`, `shots/final-gate-2/milestone-issues/light-1440.png`, `shots/final-gate-2/milestones/dark-1440.png`
5. **FG2-036 [theme-fixable-css] Open / Closed switch reads '⊙ 8 Open ✓ 51 Closed' (icons, count before label); github.com 'Open 8 | Closed 51' with CounterLabels (issues, PRs, milestones)** — impact 11 (judges 7, critic wt 4; gate 1 FG-039; routes: repo-issues, issues-list-closed, milestones)
   - Fix: Partial in CSS: hide the two state icons in `.small-menu-items` on list pages, selected item 600 + default colour, unselected muted. Count and label are one text node in openclose.tmpl, so the CounterLabel after the label needs a template (no slot) — say so in the reply.
   - Critic refs: C083 (issues-list-closed, nit), C171 (repo-issues, minor)
   - PNG: `docs/reference/repo-issues/light-1440.png`, `shots/final-gate-2/repo-issues/dark-1440.png`, `shots/final-gate-2/repo-issues/light-1440.png`, `shots/final-gate-2/issues-list-closed/dark-1440.png`
6. **FG2-039 [theme-fixable-template] Labels rows repeat '0 open issues/pull requests' and Edit / Delete on every row (github.com: non-zero icon counts only, actions in a kebab); no 'Search all labels' / Active-Archived header** — impact 11 (judges 8, critic wt 3; gate 1 FG-051; routes: labels)
   - Fix: Gate-1 FG-051 rejected (a ≤ 10). CSS mitigation: Edit/Delete as 28px invisible IconButtons revealed on row hover/focus-within (always visible < 768); counts muted 12px. Zero counts cannot be detected in CSS.
   - Critic refs: C131 (labels, minor)
   - PNG: `shots/final-gate-2/labels/light-1440.png`, `docs/reference/labels/light-1440.png`, `shots/final-gate-2/labels/dark-1440.png`, `shots/final-gate-2/labels/light-1440.png`
7. **FG2-046 [theme-fixable-css] Org settings Labels empty state: centred muted text over a 440px select with a 3-line italic option and 'Use Label Set'; '0 labels' as a 24px Subhead instead of a Box header** — impact 9 (judges 0, critic wt 9, majors C192; new; routes: org-settings-labels)
   - Fix: Blankslate Box (24px tag icon via mask, heading, the label-set select + button as the action row, select single-line with ellipsis); '0 labels' + Sort in a muted Box header like the repo labels page.
   - Critic refs: C192 (org-settings-labels, major), C193 (org-settings-labels, minor)
   - PNG: `shots/final-gate-2/org-settings-labels/light-1440.png`, `shots/final-gate-2/org-settings-labels/dark-1440.png`, `shots/final-gate-2/org-settings-labels/light-1440.png`
8. **FG2-059 [theme-fixable-css] Issue page content spans 1232px (x=104-1336) while other repo pages span 1216px; PR compare form is fluid (1376px)** — impact 6 (judges 0, critic wt 6; gate 1 FG-119; routes: pr-compare-form-playground, issue-playground-1)
   - Fix: Use the same container rule as other repo pages on `.repository.view.issue` and `.repository.compare.pull` (verify with the leak check which pages each scope reaches).
   - Critic refs: C164 (issue-playground-1, minor), C196 (pr-compare-form-playground, minor)
   - PNG: `shots/final-gate-2/pr-compare-form-playground/light-1440.png`, `shots/final-gate-2/issue-playground-1/light-1440.png`
9. **FG2-072 [theme-fixable-css] Issue/PR details: unlinked PR author muted 400 (github.com semibold default), copy icon inside the branch label, sidebar Delete not danger, uneven sidebar heading gaps, doubled gaps in 'Remove WIP: prefix', merge-box icons float on wrapped lines** — impact 4 (judges 0, critic wt 4; gate 1 FG-069; routes: pr-draft-wip-playground, issue-playground-1, repo-pull)
   - Fix: Author 600 `--fgColor-default`; copy IconButton after the branch label; sidebar Delete `--fgColor-danger`; 8px heading→content gap everywhere; collapse whitespace around the WIP `<strong>` (word-spacing on the container); merge-box icons `align-self:flex-start` with 2px top offset.
   - Critic refs: C122 (repo-pull, nit), C166 (issue-playground-1, nit), C186 (pr-draft-wip-playground, nit), C187 (pr-draft-wip-playground, nit)
   - PNG: `shots/final-gate-critic-5/repo-pull/z-meta-light.png`, `shots/final-gate-2/pr-draft-wip-playground/dark-1440.png`, `shots/final-gate-2/pr-draft-wip-playground/light-1440.png`, `shots/final-gate-2/issue-playground-1/dark-1440.png`
10. **FG2-073 [theme-fixable-css] PR timeline commit SHAs drawn as bordered chips ('2d51c41304'); github.com uses plain muted mono links** — impact 4 (judges 0, critic wt 4; gate 1 FG-084; routes: pr-draft-wip-playground, pr-conversation-playground-large-diff-reviews)
   - Fix: `.timeline .commit-sha` / `.shabox` in timeline commit rows: no border/background, `--fgColor-muted` mono 12px, 7ch clip.
   - Critic refs: C086 (pr-conversation-playground-large-diff-reviews, nit), C185 (pr-draft-wip-playground, minor)
   - PNG: `shots/final-gate-critic-7/draft_sha_zoom.png`, `shots/final-gate-2/pr-draft-wip-playground/dark-1440.png`, `shots/final-gate-2/pr-draft-wip-playground/light-1440.png`, `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/dark-1440.png`
11. **FG2-074 [theme-fixable-css] New-PR compare: '1 Commits' is an empty 54px Box header with no body; range editor on white (github.com muted); 8px timeline stub at 390** — impact 4 (judges 0, critic wt 4; new; routes: pr-compare-new-playground)
   - Fix: Collapse the empty Box header (no border when no rows follow; or restyle as a muted heading line), range editor `--bgColor-muted`, drop the rail stub < 768.
   - Critic refs: C141 (pr-compare-new-playground, minor), C143 (pr-compare-new-playground, nit)
   - PNG: `shots/final-gate-critic-5/pr-compare-new-playground/z-mobile-commits.png`, `shots/final-gate-2/pr-compare-new-playground/light-390.png`, `shots/final-gate-2/pr-compare-new-playground/light-1440.png`
12. **FG2-082 [theme-fixable-template] New-issue form: no 'Create new issue' heading and no 'Add a title' / 'Add a description' labels** — impact 3 (judges 0, critic wt 3; new; routes: issue-new-playground)
   - Fix: Template-level and low impact; not proposed (no slot).
   - Critic refs: C117 (issue-new-playground, minor)
   - PNG: `shots/final-gate-2/issue-new-playground/light-1440.png`, `shots/final-gate-2/issue-new-playground/light-390.png`, `shots/final-gate-2/issue-new-playground/light-1440.png`
13. **FG2-083 [theme-fixable-css] Merge-style dropdown items are 54px tall single-line rows (Primer ActionList 32px, or title + description)** — impact 3 (judges 0, critic wt 3; new; routes: pr-conversation-playground-large-diff-reviews)
   - Fix: Merge-style menu items: 32px min-height, 6px 8px padding (the PR merge form is lazy chunk CSS → `*.important.css`).
   - Critic refs: C084 (pr-conversation-playground-large-diff-reviews, minor)
   - PNG: `shots/final-gate-2/pr-conversation-playground-large-diff-reviews/light-1440.png`
14. **FG2-093 [theme-fixable-css] 390 issue/PR header: 'Edit' sits on its own row above the title (+40px)** — impact 2 (judges 0, critic wt 2; new; routes: pr-conversation-open, pr-conversation-closed-unmerged)
   - Fix: < 768: title first, Edit / New issue buttons on the meta row (flex `order`).
   - Critic refs: C033 (pr-conversation-closed-unmerged, nit), C183 (pr-conversation-open, nit)
   - PNG: `shots/final-gate-critic-1/prm-00.png`, `shots/final-gate-2/pr-conversation-open/dark-390.png`, `shots/final-gate-2/pr-conversation-open/light-390.png`, `shots/final-gate-2/pr-conversation-closed-unmerged/dark-390.png`

# From data-display (final gate #2, wave L2 round 1) — FG2-052 part 2: composer toolbar at 390 (critic C077)
FG2-052's fix text also covers the comment composer toolbar (`markdown-toolbar` in the reply form) wrapping to two
rows at 390. The comment-header part is done in data-display (timeline.css); the toolbar is yours
(src/pages/issues-prs/composer.css). Suggested: < 768px `.combo-markdown-editor markdown-toolbar { flex-wrap: nowrap;
overflow-x: auto; scrollbar-width: none }` so it stays one scrolling row like github.com's mobile composer.

# From controls (wave L2 r1, 2026-09-30) — CT-FG2-079: generic markdown editor chrome now lives in controls
controls/markdown-editor.css now draws the CommentBox for every `.combo-markdown-editor` **outside**
`:is(#comment-form, #new-issue, .code-comments-list form.comment-form)` (release notes, milestone / project
descriptions, wiki, admin banner, the issue comment *edit* form, review box): 1px --borderColor-default Box, radius 6,
--bgColor-muted strip (padding 8 8 0) behind the Write / Preview tabs, body panels --bgColor-default padding 8,
toolbar in the strip from 1280px, preview 8px 16px. Your composer scope is excluded, so nothing changed there
(checked: issue-playground-1 dark-1440, issue-new-playground light-1440 — no double border).
Toolbar look is now generic in controls (`.combo-markdown-editor markdown-toolbar`, `.markdown-toolbar-group`,
`.markdown-toolbar-button` 28px / muted / hover accent on --control-transparent-bgColor-hover, focus ring inset,
`[aria-checked=true]` accent, `md-header::after` digit) with the same values as composer.css, so you can drop to save
bytes (optional, no visual change):
```diff
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar .markdown-toolbar-group { gap: 0; padding: 0 var(--base-size-4); border-left: 0; }
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar .markdown-toolbar-button { … }
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar .markdown-toolbar-button:hover { … }
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar .markdown-toolbar-button:focus-visible { … }
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar .markdown-toolbar-button[aria-checked="true"] { … }
-:is(.view.issue, .new.issue, .compare.pull) markdown-toolbar md-header::after { … }
```
(keep `.markdown-toolbar-group:last-child { flex: 0 0 auto }` — controls leaves Gitea's `flex: 1` so the last group sits
right when the toolbar is in the body). Optional page deviation for you: the comment *edit* form's attachments field is
still the generic dashed dropzone below the Box (github.com attaches the file bar to the textarea as in the composer).

# Handled by pages/issues-prs (wave L2, round 1, 2026-09-30) — final gate #2
- FG2-027 → DONE (CSS live now; template edit requested, docs/requests/integrator.md IPR-L2-1): PR list without NavList,
  centred 1232px container (x=104 @1440 = github.com), title 24px under the tabs, list Box 24px under the query bar.
- FG2-023 → DONE CSS-only (template rejected): Labels / Milestones pages are full width with a 256px left NavList made
  from Gitea's Labels|Milestones switch (Milestones first, 16px milestone/tag octicons, selected bg + 4px accent bar),
  20px/600 page title (English UI only, CSS content) + New button at its right, query bar / Box in the main column;
  < 1012px the NavList is a row above the title. No "Issues / Assigned / …" items (no markup). SegmentedControl removed.
- FG2-031 → DONE: < 768px NavList = selected item with label + 32px icon-only items (labels visually hidden) on one
  row, no clipping; filters on ONE sideways-scrolling row with a 32px fade; filter menus open as bottom sheets
  (list.important.css beats Gitea's left/right:auto !important).
- FG2-035 → DONE: milestone row = title | 320px column: bar, "0% complete  2 Open  0 Closed" on one 14px row (percentage
  600 default), meta (updated / due) on that row under the title, actions 12px muted (Delete danger on hover only);
  390: title, bar, counts, meta, actions. Milestone page "Close" = default Button.
- FG2-036 → DONE (partly): Open/Closed state icons hidden; count-after-label CounterLabel needs template markup (one text node).
- FG2-039 → DONE (CSS mitigation): Edit/Delete = 28px invisible IconButtons revealed on row hover / focus-within
  (always visible on touch / < 768); zero counts cannot be detected in CSS.
- FG2-046 → DONE (Blankslate part): org settings empty labels = bordered Blankslate Box, 24px tag octicon, one action
  row (single-line Select with ellipsis, max 320px + Use Label Set). The "0 labels" Subhead is settings-admin's layer:
  request in docs/requests/pages-settings-admin.md.
- FG2-059 → DONE for the compare form (1216px container-xl). The issue view's 1232px is foundation's deliberate
  github.com React PageLayout measurement (src/foundation/layout.css FG-119) — not changed.
- FG2-072 → DONE: copy button after the head BranchName token (muted), sidebar Delete danger, Dependencies heading 8px
  above its text (all headings 8px ±1), "Remove WIP: prefix" 4px word gaps, merge-box status icons top-aligned.
  Author: github.com's PR header author is muted 600 like ours (measured rgb(89,99,110)/600); a migrated PR's
  OriginalAuthor is a bare text node — not stylable.
- FG2-073 → DONE: PR timeline commit SHA plain muted mono 12px, 7 characters, underline on hover.
- FG2-074 → DONE: "N Commits" is a 14px/600 heading line (no empty Box header), range editor --bgColor-muted.
  390 rail stub: not changed.
- FG2-082 → not done (template, rejected).
- FG2-083 → DONE: merge-style menu items 32px (merge-box.important.css).
- FG2-093 → DONE: 390 issue/PR header: title first, Edit / New on the StateLabel row (right).
- data-display FG2-052 part 2 → DONE: < 768 composer toolbar one sideways-scrolling row.
- Leak fix: new labels/milestones page rules exclude the dashboard milestones page (`page-content dashboard issues
  repository milestones` also matched `.repository.milestones:not(.projects)`).
