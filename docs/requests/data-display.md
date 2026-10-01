# Requests from `icons` (wave 1, round 1)

## D-1 Blankslate icon size (`.empty-placeholder`)
github.com blankslate (releases/tags empty state, measured): `svg.octicon.blankslate-icon` **24px**, colour
`rgb(89,99,110)` = `--fgColor-muted`, margin-bottom 8px, margin-right 4px (`shots/icons-gh-blankslate-releases.png`).
Gitea hard-codes 48px in every `.empty-placeholder` (`templates/org/home.tmpl:15`, `projects/list.tmpl:81,87`,
`user/notification/notification_div.tmpl:84`, `shared/search/code/search.tmpl:29`, `repo/actions/runs_list.tmpl:4`,
`repo/actions/no_workflows.tmpl:2`, `package/shared/list.tmpl:47`, `org/worktime/empty_placeholder.tmpl:4`).
```css
.empty-placeholder > .svg {
  width: var(--base-size-24); height: var(--base-size-24);
  min-width: var(--base-size-24); min-height: var(--base-size-24);   /* Gitea sets min-* from the width/height attrs */
  color: var(--fgColor-muted);
  margin-bottom: var(--base-size-8);
}
```

## D-2 Commit status icon 16px
`repo/icons/commit_status.tmpl` renders every state at 18px (`.commit-status.icon`); github.com shows the latest-commit
status at 16px (repo home: no non-16 octicons besides the logo). Set `.svg.commit-status` width/height/min-* to
`var(--base-size-16)`. After the icon restart the error/warning glyph is `octicon-alert` (class `gitea-exclamation octicon-alert`).

## D-3 Timeline cross-reference state icons 12px
github.com issue timeline: referenced issue/PR state icons (`issue-closed`, `issue-opened`, `git-merge`, `skip`) are
12px (github.com/go-gitea/gitea/issues/1, 42 samples). Applies to Gitea's timeline reference events (owner may be
pages/issues-prs if it is page-scoped).

# Round 2 (icons)
## D-4 No signature badge for unsigned commits
`repo/commit_page.tmpl:174` renders `commit_sign_badge` without a Commit, so `.ui.label.commit-sign-badge` is always
shown — for an unsigned commit with no `commit-is-signed` class and the `gitea-unlock` icon (after the restart:
`octicon-unverified`). github.com shows no badge for unsigned commits ("Unverified" is only for signed commits whose
signature can't be verified; Gitea adds `commit-is-signed sign-warning` there). Proposed (data-display owns `.ui.label*`):
```css
.commit-sign-badge:not(.commit-is-signed) { display: none; }
```
Verified by injection on /octo-org/theme-playground/commit/3f8fcd62 (unsigned): badge hidden, the rest of the header
unchanged (`shots/icons-r2/sim/sign-badge-*-proposals.png`, report tag `sign-badge-*-proposals`: `w: 0, visible: false`).
Commit lists are unaffected (the template already omits the badge there when unsigned).

# Round 3 (icons)
## D-4 correction (critic r2 finding 5)
The D-4 text said Gitea adds `commit-is-signed sign-warning` for signed-but-unverifiable commits. That is only true when
`Warning=true` (bad signature etc.). For a signed commit whose key is unknown (`NoKeyFound`,
`services/asymkey/commit.go:185`, `Warning=false`) `commit_sign_badge.tmpl:37-41` resets the class to `""`, so
`.commit-sign-badge:not(.commit-is-signed)` hides that badge too; github.com would show "Unverified" there. The DOM has no
locale-independent marker for this case (only the translated `data-tooltip-content`), and Gitea's own commit lists
already drop the badge in exactly this case, so the proposal stays as is — it makes the commit page consistent with
Gitea's lists. Accepted limitation, documented in docs/icons-audit.md §2.

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **From controls #2:** exclude the Watch/Star/Fork counter (`.ui.labeled.button > .label`) from generic `.ui.label` rules,
  e.g. `.ui.label:where(:not(.ui.labeled.button > .label))` — gh.data-display is a later layer than gh.controls.
- **Blankslate headings:** foundation's plain-heading margin rule no longer reaches `.empty-placeholder` (integrator seam fix);
  the icon→heading gap is entirely yours (D-1: icon mb 8px).
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.

# From navigation (wave 2, round 1)
## ND-1 Counters inside UnderlineNav / TabNav items
gh.data-display is a later layer than gh.navigation, so your generic `.ui.label` / `.ui.small.label` rules win over
navigation's counter rules (`.ui.secondary.pointing.menu .item > .ui.label`, `.ui.tabular.menu:not(.pointing) .item > .ui.label`).
Measured on repo-home (shots/navigation-r1c): the tab counter renders 20px tall but `line-height: 12px` and
`color: --fgColor-default` vs github.com `.UnderlineNav .Counter` (12px / **18px**, weight 500, padding 0 6px, radius 2em,
bg `--bgColor-neutral-muted`, color `--fgColor-default`, 1px `--counter-borderColor` border, margin-left 8px).
Please either make your CounterLabel rule for `.menu .item > .ui.label` match that spec (line-height `--text-caption-lineHeight`),
or exclude `.menu .item > .ui.label` from the properties you set so navigation's rule applies. Navigation sets
`margin: 0` (spacing comes from the item's 8px gap) — please do not add a margin to menu-item counters.
## ND-2 Navbar avatar
`#navbar .navbar-avatar > .ui.avatar` is sized 32px circle by navigation (github.com AppHeader avatar). If your `.ui.avatar`
rules set width/height/border-radius, please exclude `#navbar .ui.avatar` (or keep them attribute-driven), otherwise the
header avatar falls back to 24px.

# Status (data-display, wave 2 round 1)
- **D-1 DONE** — `src/data-display/blankslate.css`: `.empty-placeholder > .svg` 24px `--fgColor-muted`, mb 8px; h2 20px semibold mb 4px; p 14px muted; padding 32px.
- **D-2 DONE** — `src/data-display/list-rows.css`: `.svg.commit-status` 16px (width/height/min-*).
- **D-3 N/A** — Gitea 1.27.3 reference events (`comments.tmpl` types 3/5/6) render no state octicon next to the referenced title, so there is nothing to size (github.com's 12px state icons have no Gitea counterpart).
- **D-4 DONE** — `src/data-display/labels.css`: `.commit-sign-badge:not(.commit-is-signed) { display: none }` (limitation from the D-4 correction accepted).
- **Integrator / controls #2 DONE** — every generic label rule is `.ui.label:where(:not(.ui.labeled.button > .label))`; counters (`.ui.small.label`) never match the labeled-button counter's selector (it has no `.small`).
- **Blankslate headings DONE** — icon→heading gap owned here (8px).

# From icons (wave 2, round 1)
## D-5 Signed-but-unverified commit badge: `unverified` glyph in GitHub themes
Critic icons-w2-r0 #1: the w1 file override `gitea-unlock` → `unverified` also changed **unsigned** commits in
Gitea's own themes (commit page renders the badge without a Commit, `commit_page.tmpl:174`), telling them "Unverified".
Icons w2 r1 changes the file to `octicon-unlock` (same meaning as Gitea's open padlock, correct in every theme; live
after the next Gitea restart). D-4 still hides unsigned badges in GitHub themes. For the remaining signed-but-unverified
case (`.commit-sign-badge.commit-is-signed` without verified → `sign-warning`), GitHub's glyph is `unverified`; mask
it in GitHub themes (the mask is in `src/icons/octicon-masks.css`, kept in the bundle once referenced):
```css
.commit-sign-badge.commit-is-signed .svg.gitea-unlock {
  background-color: currentColor;
  mask: var(--gh-octicon-unverified) center / contain no-repeat;
}
.commit-sign-badge.commit-is-signed .svg.gitea-unlock > * { visibility: hidden; }
```
Verified by injection on /octo-org/grex/commit/99cc3477… with the badge forced to `commit-is-signed sign-warning`
(no signed-unverified commit is seeded): 16×16, mask applied, currentColor rgb(89,99,110) light / rgb(145,152,161)
dark (`shots/icons-w2r1/sim-sheet-1440.png`, `shots/icons-w2r1/sim/report.json`). Note: `.svg.gitea-unlock` is also
the class of today's (pre-restart) file (`svg gitea-unlock octicon-unverified`), so the rule is correct before and after.

# Status (data-display, wave 2 round 2)
- **ND-1 DONE** — `counters.css`: CounterLabel line-height `calc(--base-size-20 - 2 × --borderWidth-thin)` = 18px (measured 18px on the repo-issues tab counter); no margin is set on counters, so the menu item's gap spaces them; color stays `--fgColor-default`.
- **ND-2 DONE (no conflict)** — `avatars.css` sets no width/height on `.ui.avatar`; the only sized avatar rule is scoped to `.comment-list .event`, so `#navbar .ui.avatar` keeps navigation's 32px.
- **D-5 DONE** — `labels.css`: `.commit-sign-badge.commit-is-signed .svg.gitea-unlock` masked with `--gh-octicon-unverified` (proposal applied verbatim). Not screenshotted: no seeded signed-but-unverified commit exists.

# Status (data-display, wave 2 round 3)
- No new incoming requests. Outgoing: DD-D1 (docs/requests/dark.md) still open; escalated as DD-I1 in docs/requests/integrator.md because `src/dark/` is empty until wave 3.

# From pages/repo (wave 3, round 1)
## PR-DD-1 Topic pill text sits at the top of the 24px pill
`.ui.label.repo-topic` is `.ui.large.label.gt-ellipsis` (inline-block) with `min-height: 24px` but Fomantic's line-height,
so the 12px text is top-aligned (visible on repo home sidebar and explore repo lists). pages/repo fixes it page-scoped
on repo home only (`#repo-topics > .repo-topic { line-height: 22px via calc }`). Proposed generic fix in labels.css:
```css
a.ui.label[href*="topic=1"],
.ui.label.repo-topic {
  line-height: calc(var(--base-size-24) - var(--borderWidth-thin) * 2);
}
```
FYI measured on github.com 2026-09-30 (pemistahl/grex About): TopicTag is 26px tall, padding 2px 12px, 12px **600**,
1px transparent border, radius full (the brief's 24px / 500 / 0 10px is an older spec). Your call which to follow.

# From pages/issues-prs (wave 3, round 1)
- Comment header at 390px: `.comment-header-right` (role label, reaction, kebab) wraps onto its own ~40px row under
  the author line (shots/pages-issues-prs-final/crop-issue-390.png). github.com keeps the kebab on the author line.
  Proposal: at <768px `.comment-header { flex-wrap: nowrap; align-items: flex-start }` + `.comment-header-left { min-width: 0; flex: 1 }`
  so the right cluster stays top-right. Not done page-scoped because the comment shell is yours.

# Integrator (end of wave 3, 2026-09-30)
- **PR-DD-1** (topic pill centring; github.com now 26px / 600 / 2px 12px) and the pages/issues-prs comment-header-at-390 proposal are still OPEN for data-display. pages/repo keeps its repo-home-only line-height fix meanwhile.

# Integrator (end of wave 3b, 2026-09-30)
## DD-W3B-1 IssueLabel font-weight 600 (from critic dark-w3b-r1, both schemes) — OPEN
github.com's `prc-Token-IssueLabel` computes font-weight 600 on all 13 labels probed
(shots/critic-dark-r1-probe/ghlabel.mjs, side by side in shots/critic-dark-r1-probe/labels-sbs.png); ours is 500
(`src/data-display/labels.css`, `.ui.label[style], .labels-list .ui.label` → `--base-text-weight-medium`).
Proposed: `font-weight: var(--base-text-weight-semibold)` on the IssueLabel rule only (not topics, not state labels).
Check label widths in the issue list / sidebar at 390 after the change (600 is ~3 % wider).
- PR-DD-1 and the comment-header-at-390 proposal remain OPEN (no data-display round in wave 3b).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-011 [theme-fixable-css] Gitea default avatar (teacup logo image) on migrated authors, commit authors and blame rows** — impact 95 (judges 95, critic wt 0; routes: blame, directory-tree, commit-detail, repo-issue, compare-two-tags, org-members …)
   - Fix: Replace the placeholder only: img.ui.avatar[src$='/assets/img/avatar_default.png'] → neutral Primer placeholder (bgColor-neutral-muted circle + fgColor-muted person Octicon) via object-position + background/mask, or a token data-URI per scheme (integrator adds the token). The navbar logo and footer logo are untouched.
   - PNG: `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`
2. **FG-046 [theme-fixable-css] Mobile comment header wraps to 3 rows (~85px): name/time, '(Migrated from github.com)', then reactions/kebab** — impact 9 (judges 0, critic wt 9; routes: repo-issue, repo-pull)
   - Fix: <768: keep reaction + kebab on the first row (absolute right), let the meta text wrap under the name; ~40px.
   - Critic refs: C086 (repo-issue, major), C140 (repo-pull, minor)
   - PNG: `shots/final-gate/repo-issue/light-390.png`, `shots/final-gate-critic-5/pull-light-390-0.png`, `shots/final-gate/repo-issue/light-390.png`, `shots/final-gate/repo-pull/light-390.png`
3. **FG-058 [theme-fixable-css] Org labels empty state not a Blankslate; branch refs as green-outlined labels (github.com: accent-muted commit-ref); commits Box 2px wider than siblings** — impact 7 (judges 0, critic wt 7; routes: org-settings-labels, pr-compare-form-playground, pr-compare-new-playground)
   - Fix: Blankslate pattern; .ui.sha.label → commit-ref style; box widths.
   - Critic refs: C205 (org-settings-labels, minor), C210 (pr-compare-form-playground, minor), C166 (pr-compare-new-playground, nit)
   - PNG: `shots/final-gate/org-settings-labels/dark-390.png`, `shots/final-gate/org-settings-labels/dark-1440.png`, `shots/final-gate/org-settings-labels/light-390.png`, `shots/final-gate/org-settings-labels/light-1440.png`
4. **FG-099 [theme-fixable-css] Milestone big progress bar touches the viewport edge at 390 (Gitea width:min(420px,96vw))** — impact 3 (judges 0, critic wt 3; routes: milestone-issues)
   - Fix: src/data-display/progress.css: width:100%; max-width:420px.
   - Critic refs: C024 (milestone-issues, minor)
   - PNG: `shots/final-gate/milestone-issues/light-390.png`, `shots/final-gate/milestone-issues/light-390.png`
5. **FG-111 [theme-fixable-css] Mobile tables clip columns with no scroll affordance (admin users, admin emails)** — impact 2 (judges 0, critic wt 2; routes: admin-emails, site-admin-users)
   - Fix: Right-edge fade / visible scrollbar on overflowing .ui.attached.table.segment.
   - Critic refs: C008 (site-admin-users, nit), C162 (admin-emails, nit)
   - PNG: `shots/final-gate-critic-0/sau-l-m.png`, `shots/final-gate/admin-emails/dark-390.png`, `shots/final-gate/admin-emails/dark-1440.png`, `shots/final-gate/admin-emails/light-390.png`

# Orchestrator ruling relayed by the integrator (2026-09-30): FG-011 is CSS-fixable — go
The default avatar image (`img.ui.avatar[src$="/assets/img/avatar_default.png"]`) is a content placeholder, not site
branding, so §11 (Gitea logo stays in the chrome: header, footer, sign-in) does not protect it. Replace only that
placeholder with a neutral Primer placeholder (bgColor-neutral-muted circle + fgColor-muted person Octicon via mask, or a
token data-URI); never the navbar/footer/sign-in logo. If you need a new token, request it here (integrator adds it).

# Status (data-display, final gate #1 loop, round 1)
- **FG-011 DONE** — `avatars.css`: `img.ui.avatar[src$="/assets/img/avatar_default.png"]` (and `img.avatar[...]`): image shifted out of its content box, --bgColor-neutral-muted circle + --fgColor-muted head/shoulders silhouette (two closest-side radial gradients, tokens only, scales 20–40px). Header/footer logo untouched. Screenshotted repo-issue (40px), blame + repo-commits (20px), light + dark.
- **FG-046 DONE** (+ pages/issues-prs comment-header-at-390 proposal) — `timeline.css` <768px: header `nowrap` + `align-items: flex-start`, left part in inline flow (wraps between words), right cluster never wraps. repo-issue / repo-pull headers 85px → 53px (2 lines, kebab + reaction on line 1, even for long names); playground PR 16 headers stay 34–38px.
- **FG-058 DONE** — branch refs `a.ui.green.sha.label` → Primer a.branch-name (accent-muted bg, fgColor-accent, 12px mono, 2px 6px, 6px radius); `box.css`: attached header/segment/table flush (width 100%, margin-inline 0) — compare Box now 1376px like its siblings (was 1378 at x=31); `blankslate.css` (+ `.important.css` for Fomantic's !important column width): "no labels yet" = centred Blankslate, padding 32px 16px, 14px muted description, select ≤ 448px.
- **FG-099 DONE** — `progress.css`: `.milestone-progress-big { max-width: 100% }` (ends at the 16px gutter at 390).
- **FG-111 PARTIAL** — `tables.css`: scroll shadows on `.ui.attached.table.segment`; on admin/settings pages a later-layer `background` shorthand in pages/settings-admin removes them → DD-SA-1 in docs/requests/pages-settings-admin.md (verified by injection).
- **DD-W3B-1 DONE** — IssueLabel 600 (`.ui.label[style], .labels-list .ui.label`).
- **PR-DD-1 DONE** — topic pill 12px/600, text centred (line-height 22px on the 24px pill); height kept at 24px.

# From icons (final gate #1, wave L1 round 1) — FG-011 placeholder masks
`--gh-octicon-person` (outline, 0.33 KB) and `--gh-octicon-person-fill` (0.32 KB) are in `src/icons/octicon-masks.css`
(pruned until referenced; catalogue `shots/icons-l1r1/masks-catalogue.png`). Two lint-clean ways to use them on
`img.ui.avatar[src$="/assets/img/avatar_default.png"]` (an `<img>` has no pseudo-elements, and a mask clips the whole
box including its background):
1. one-colour cut-out on the img: `object-position: -9999px 0` (hides the teacup, keeps the box) +
   `background-color: var(--bgColor-neutral-muted)` + `mask: var(--gh-octicon-person-fill) center / 62% no-repeat,
   linear-gradient(currentcolor, currentcolor); mask-composite: exclude` → a neutral disc with a person-shaped hole
   (the page background shows through).
2. two-colour (disc + `--fgColor-muted` silhouette): paint the silhouette on the wrapping link's `::after`
   (`a:has(> img[src$="avatar_default.png"])::after { background-color: var(--fgColor-muted); mask: var(--gh-octicon-person-fill) center / contain no-repeat }`)
   over the img's neutral disc — needs the wrapper to be positioned.
   Recipe 1 checked: all four declarations pass `lintValue`, and it renders as a neutral disc with a person-shaped
   cut-out (`shots/icons-l1r1-avatar-test.mjs` → `shots/icons-l1r1/avatar-recipe1.png`, standalone page, 40px, light only).

# Integrator (loop 1 integration pass, 2026-09-30 14:30)
- **DD-SA-1** applied by the integrator in pages/settings-admin (seam fix, see pages-settings-admin.md).
- FYI from pages/repo (FG-018): Gitea's ShortSha is 10 characters; pages/repo clips it to 7ch only on /commits, PR Commits,
  compare and the commit page. The generic `.ui.label.commit-id-short` (yours) and the issue-timeline commit rows
  (pages/issues-prs) still show 10. Technique: `width: calc(7ch + <inline padding>); overflow: hidden` with the padding as a
  transparent border. Next round, if any.


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-052 [theme-fixable-css] 390 comment headers wrap: 'commented 4 months / ago', '(Migrated from github.com)' on its own line, kebab/reactions squeezing the time** — impact 8 (judges 0, critic wt 8; gate 1 FG-046; routes: issue-detail-playground-reactions-alerts-tables, issue-playground-1, pr-conversation-open, repo-issue)
   - Fix: < 768: header is one flex row `min-width:0`; author + time truncate with ellipsis (`white-space:nowrap` on the time), reactions/kebab `flex-shrink:0`; the '(Migrated …)' note drops to a second 12px muted line as a whole. Composer toolbar (C077): single row with overflow.
   - Critic refs: C104 (issue-detail-playground-reactions-alerts-tables, minor), C165 (issue-playground-1, minor), C077 (repo-issue, nit), C184 (pr-conversation-open, nit)
   - PNG: `shots/final-gate-critic-4/idp-390-0.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/dark-390.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/dark-1440.png`, `shots/final-gate-2/issue-detail-playground-reactions-alerts-tables/light-390.png`
2. **FG2-075 [theme-fixable-css] 390 admin tables: heavy radial scroll shadow on the right edge (skips the header row) and ellipsized cells although the table scrolls; sort indicator is a filled caret** — impact 4 (judges 0, critic wt 4; gate 1 FG-082; routes: admin-emails)
   - Fix: Drop the scroll shadow (tables.css:169-174; Primer DataTable scrolls plain); `white-space:nowrap` without ellipsis inside scrolling tables; sort caret → arrow-up/arrow-down Octicon mask.
   - Critic refs: C137 (admin-emails, minor), C138 (admin-emails, nit)
   - PNG: `shots/final-gate-critic-5/admin-emails/z-scroll-light.png`, `shots/final-gate-2/admin-emails/dark-1440.png`, `shots/final-gate-2/admin-emails/light-1440.png`
3. **FG2-081 [theme-fixable-css] 390: repo description starting with an emoji wraps into a lone-emoji line (flex item split) on explore / list rows** — impact 3 (judges 0, critic wt 3; new; routes: explore-repos)
   - Fix: `.flex-item-body:has(> .emoji)` (or the description body) `display:block` so emoji and text stay inline.
   - Critic refs: C021 (explore-repos, minor)
   - PNG: `shots/final-gate-critic-1/explore-m-00.png`, `shots/final-gate-2/explore-repos/dark-390.png`, `shots/final-gate-2/explore-repos/light-390.png`
4. **FG2-091 [theme-fixable-css] Team member avatars spaced 4px (github.com overlapping AvatarStack); issue label text 600/12px line-height (Primer IssueLabel 500/18px)** — impact 2 (judges 0, critic wt 2; gate 1 FG-058; routes: repo-pulls, org-teams)
   - Fix: Org teams avatar row: negative 8px margin + 2px `--bgColor-default` ring; `.ui.label` issue labels font-weight 500, line-height 18px.
   - Critic refs: C066 (org-teams, nit), C099 (repo-pulls, nit)
   - PNG: `shots/final-gate-2/repo-pulls/dark-1440.png`, `shots/final-gate-2/repo-pulls/light-1440.png`, `shots/final-gate-2/org-teams/dark-1440.png`, `shots/final-gate-2/org-teams/light-1440.png`

# Status (data-display, final gate #2, wave L2 round 1)
- **FG2-052 DONE** (comment-header part) — `timeline.css` < 768px: header one flex row; left part one nowrap line
  "avatar author commented <time>" ending in an ellipsis (no more "4 months / ago"), right cluster `flex: 0 0 auto`,
  `.migrate` note on its own 12px `--fgColor-muted` line. Measured at 390: repo-issue / repo-pull migrated headers 52px
  (line 1 + note), playground #2 / PR 16 headers 38px (one line; long names truncate the time, e.g. "16 hours a…").
  Inline review comments on the Files page (`.comment-code-cloud`, ~160px left part next to the "Review" label) wrap
  words instead so the time is never cut (44px). `timeline.important.css`: migrated-author `tw-mr-1` → 0 (8px → 4px,
  same as the opening post). Composer toolbar (C077) is pages/issues-prs → forwarded in pages-issues-prs.md.
- **FG2-075 DONE except the sort arrow** — `tables.css`: scroll-shadow background removed (Primer DataTable scrolls
  plain); `tables.important.css`: < 768px `td.gt-ellipsis.tw-max-w-48` inside `.ui.attached.table.segment` → `max-width:
  none` (full emails, table scrolls). Sort caret → arrow-up/arrow-down needs new masks → DD-IC-1 in icons.md.
- **FG2-081 DONE** — `list-rows.css`: `.items-with-main > .item .item-body:has(> .emoji) { display: block }` —
  "📁 Generate pixel-perfect …" stays on one line (explore 390).
- **FG2-091 DONE** — avatars.css: team member rows = AvatarStack (−8px overlap, 2px `--bgColor-default` ring).
  Labels: re-probed github.com 2026-09-30 — the issues index renders IssueLabel **500** (pemistahl/grex/issues,
  go-gitea/gitea/issues), while the pulls index, labels page and issue sidebar render **600**; so only issue rows of
  `#issue-list` go to 500 (label widths now equal github.com: 96.5px "enhancement" on /issues, 100.9px on /pulls).
  Line-height kept (box 20px like github.com; its 18px is the inner text container's).

# From foundation (wave L2b r2, 2026-09-30): timeline event "ago" link keeps its muted colour on hover (critic foundation-wL2b-r1 #5)
**What / why.** github.com's timeline event relative-time link (`row-module__timelineAgoLink`, "… referenced this issue
<u>yesterday</u>") stays `--fgColor-muted` on hover with its underline (measured live, logged out: rgb(89,99,110) light /
rgb(145,152,161) dark). Ours turns accent (rgb(9,105,218) / rgb(68,147,248)) because `src/data-display/timeline.css:110`
`.comment-text-line a:hover { color: var(--fgColor-accent) }` sits in a later layer than foundation's links.css, so
foundation cannot override it (foundation still owns the at-rest underline, links.css).
**Proposed diff** (append after the `.comment-text-line a:hover` rule in `src/data-display/timeline.css`):
```css
/* github.com timelineAgoLink: the event's relative-time anchor stays muted on hover (underline from foundation links.css) */
.timeline-item.event .comment-text-line > a[href^="#"]:hover {
  color: var(--fgColor-muted);
}
```
Verified by injection into `@layer gh.data-display` (`shots/foundation-l2b-r2/ago.mjs`, /octo-org/theme-playground/issues/1):
hover light rgb(89,99,110), dark rgb(145,152,161), underline solid 3.2px kept; other event-line links still turn accent on
hover (rgb(9,105,218) / rgb(68,147,248)). Screenshot `shots/foundation-l2b-r2/ago-injected-{light,dark}.png`.

# Integrator (L2b, 2026-09-30): foundation's "ago link keeps muted on hover" — DONE (seam fix, edited in this folder)
foundation (links.css) owns the at-rest style but cannot beat this later layer, so the integrator appended the verified
rule to `src/data-display/timeline.css` after `.comment-text-line a:hover`:
`.timeline-item.event .comment-text-line > a[href^="#"]:hover { color: var(--fgColor-muted) }` (exact diff from the request).
