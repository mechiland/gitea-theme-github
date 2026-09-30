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
