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


## PPL-N1 (from pages/people, wave 3 r1) — UnderlineNav items keep Gitea's tab radius `4px 4px 0 0`
Measured on /alice-dev and /octo-org (1440 light): `overflow-menu .item` computed `border-radius: 4px 4px 0 0`
(github.com `.UnderlineNav-item`: 6px all round), so the hover background has square bottom corners. Probably Gitea's
`.ui.tabular.menu .item` radius beating `.ui.secondary.pointing.menu .item { border-radius: var(--borderRadius-medium) }`
for the `pointing tabular` combination (profile/org/explore tabs). Proposed (navigation.important.css if the Gitea
rule is !important):
```css
.ui.secondary.pointing.tabular.menu .item { border-radius: var(--borderRadius-medium) !important; }
```

# Integrator (end of wave 3, 2026-09-30)
- **PPL-N1** (UnderlineNav/NavList items keep Gitea's `.ui.tabular.menu .active.item` radius 4px 4px 0 0 via !important; seen on profile/org/explore tabs and the explore NavList) is still OPEN for navigation (navigation.important.css). Not an ownership conflict, so not applied by the integrator.


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

**Header:** FG-007 is a template override (spec in docs/final-gate/issues.md → “Header decision”). Build the `.gh-app-header*` styles against the spec; the integrator installs `base/head_navbar.tmpl` + `custom/gh_head_navbar.tmpl`.

1. **FG-007 [theme-fixable-template] Global header is Gitea's text-link bar (Issues / Pull Requests / Milestones / Explore), not github.com's signed-in AppHeader** — impact 130 (judges 124, critic wt 6; routes: blame, directory-tree, commit-detail, branches, not-found, repo-issue …)
   - Fix: github-* branch in templates/base/head_navbar.tmpl rendering the AppHeader markup specified in docs/final-gate/issues.md → 'Header decision' (hamburger that opens a nav drawer holding Gitea's links, logo, context crumbs, search field, create menu, Issues / Pull requests / Notifications icon buttons, avatar); navigation restyles it. Gitea logo stays as the AppHeader mark.
   - Critic refs: C033 (not-found, minor), C189 (site-admin, nit), C027 (explore-repos, nit), C190 (repo-issues, nit)
   - PNG: `shots/final-gate-critic-1/er-l-a.png`, `shots/final-gate/repo-issues/light-1440.png`, `shots/final-gate/blame/dark-1440.png`, `shots/final-gate/blame/light-1440.png`
2. **FG-026 [theme-fixable-css] Footer shows 'Version: 1.27.3' and 'Page: 27ms Template: 3ms' diagnostics next to the attribution** — impact 21 (judges 21, critic wt 0; routes: directory-tree, milestones, org-members, wiki-home, wiki-page-list, labels …)
   - Fix: In github-* themes render the version/timing spans as the least prominent footer items (after the link row, fgColor-muted, same 12px) — or hide only the timing span (diagnostic output, not a function). Keep the Gitea logo, 'Powered by Gitea', language and theme menus, Licenses, API. Alternative (integrator, all themes): app.ini SHOW_FOOTER_VERSION / SHOW_FOOTER_TEMPLATE_LOAD_TIME — needs the owner's consent, not a theme change.
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/milestones/dark-1440.png`, `shots/final-gate/milestones/light-1440.png`
3. **FG-029 [theme-fixable-css] Mobile UnderlineNav: selected tab clipped off-screen ('± Fi…') with no scroll cue; selected underline drawn under the overflow '…' button** — impact 17 (judges 0, critic wt 17; routes: pr-files-changed-split-playground-large-diff, pr-conversation-playground-large-diff-reviews, pr-conversation-closed-unmerged, pr-files-changed-unified, repo-pull-files, org-settings-hooks …)
   - Fix: <768px: tighten item padding/gap so PR tabs (Conversation / Commits / Files changed) fit 358px; add a right-edge fade mask as scroll affordance; when the selected item is inside the overflow menu, do not paint the selected underline on the '…' trigger (Primer keeps the selected item visible, so style the trigger as neutral).
   - Critic refs: C016 (pr-commits-tab, nit), C045 (pr-conversation-closed-unmerged, nit), C074 (pr-files-changed-unified, minor), C099 (pr-conversation-playground-large-diff-reviews, minor), C123 (pr-files-changed-split-playground-large-diff, minor), C175 (repo-pull-files, minor), C022 (org-settings-hooks, nit), C070 (tags, nit), C093 (releases, nit)
   - PNG: `shots/final-gate-critic-2/prf-l390.png`, `shots/final-gate-critic-4/pr-files-changed-split-playground-large-diff-390-0.png`, `shots/final-gate-critic-6/prf-m0.png`, `shots/final-gate-critic-2/tags-l390.png`
4. **FG-030 [theme-fixable-css] Org header / dashboard context bar have no 1px bottom border (repo header has one); schemes treat the bar differently** — impact 15 (judges 0, critic wt 15; routes: home, org-settings-labels, org-settings, package-versions, packages-org)
   - Fix: Give the org header UnderlineNav (.overflow-menu under the org header container) and the dashboard context bar the same full-width 1px --borderColor-default bottom rule as the repo header, in both schemes.
   - Critic refs: C002 (home, minor), C100 (packages-org, minor), C202 (org-settings, minor), C207 (org-settings-labels, minor), C208 (package-versions, minor)
   - PNG: `shots/final-gate/home/light-1440.png`, `shots/final-gate-critic-0/home-l-a.png`, `shots/final-gate-critic-7/org-settings/zoom-dark-orgnav.png`, `shots/final-gate/home/dark-1440.png`
5. **FG-041 [theme-fixable-css] No 'Public' Label beside the repo name in the repo header** — impact 10 (judges 10, critic wt 0; routes: directory-tree, compare-two-tags, pr-conversation-closed-unmerged, repo-pull, wiki-page-list, file-view-markdown …)
   - Fix: html:lang(en) .repo-header .repo-title:not(:has(~ .ui.label, .ui.label)) ::after → Primer Label 'Public' (only when Gitea renders no Private/Internal/Mirror/Template label). Scope to :lang(en) so other locales get no English text.
   - PNG: `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/compare-two-tags/dark-1440.png`, `shots/final-gate/compare-two-tags/light-1440.png`
6. **FG-042 [theme-fixable-css] Repo header: action order RSS / Unwatch / Star / Fork (github.com: Watch / Fork / Star) and Settings tab pushed to the far right** — impact 10 (judges 8, critic wt 2; routes: directory-tree, branches, milestones, repo-pull, pr-conversation-open, repo-settings …)
   - Fix: flex order: RSS icon button last (or first, visually separated), then Watch, Fork, Star; Settings tab flows after the other tabs (no margin-left:auto). Keep every control.
   - Critic refs: C009 (repo-settings, nit), C040 (branches, nit)
   - PNG: `shots/final-gate/repo-settings/light-1440.png`, `shots/final-gate/directory-tree/dark-1440.png`, `shots/final-gate/directory-tree/light-1440.png`, `shots/final-gate/branches/dark-1440.png`
7. **FG-050 [theme-fixable-css] Settings / admin NavList items have no leading 16px Octicons (github.com settings sidebars always have them)** — impact 8 (judges 0, critic wt 8; routes: org-settings, user-settings, site-admin-config, user-settings-keys)
   - Fix: Add ::before masks (var(--gh-octicon-…), request the masks from icons/integrator) keyed on the item href (user settings: person, gear, paintbrush, shield-lock, key, apps, organization, …; repo settings: gear, people, shield, webhook, key, …; admin: server, people, organization, repo, …). Group headings (Access / Code…) are template-only: skip.
   - Critic refs: C029 (site-admin-config, minor), C063 (user-settings, minor), C111 (user-settings-keys, nit), C204 (org-settings, nit)
   - PNG: `shots/final-gate-critic-1/sac-light-a.png`, `shots/final-gate/user-settings/light-1440.png`, `shots/final-gate/user-settings-keys/light-1440.png`, `shots/final-gate/org-settings/dark-1440.png`
8. **FG-059 [theme-fixable-css] Mobile pagination shows only the current page and chevrons (no Previous/Next labels, page numbers hidden)** — impact 7 (judges 0, critic wt 7; routes: home, issues-list-closed, releases)
   - Fix: At <768px show 'Previous'/'Next' labels (Gitea hides them) or at least the page numbers around the current page, like github.com mobile.
   - Critic refs: C004 (home, nit), C091 (releases, minor), C095 (issues-list-closed, minor)
   - PNG: `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/dark-1440.png`, `shots/final-gate/home/light-390.png`, `shots/final-gate/home/light-1440.png`
9. **FG-068 [theme-fixable-css] Mobile (390) signed-in header shows only hamburger, logo and bell; avatar and create (+) are missing** — impact 6 (judges 0, critic wt 6; routes: not-found, user-profile)
   - Fix: At <768px keep the '+' and avatar dropdown triggers visible in the collapsed bar (github.com mobile AppHeader keeps the avatar at the right). If the head_navbar override (header issue) lands first, do it there.
   - Critic refs: C032 (not-found, minor), C169 (user-profile, minor)
   - PNG: `shots/final-gate-critic-1/not-found-mob.png`, `shots/final-gate-critic-6/up-m.png`, `shots/final-gate/not-found/dark-390.png`, `shots/final-gate/not-found/light-390.png`
10. **FG-109 [theme-fixable-css] Mobile repo header keeps a full RSS / Watch / Star / Fork button row (~40px) under the title** — impact 3 (judges 0, critic wt 3; routes: repo-pulls)
   - Fix: At <768px collapse the row to icon-only 28px buttons on the title line (github.com shows title + Public only on sub-pages). Do not remove the buttons.
   - Critic refs: C113 (repo-pulls, minor)
   - PNG: `shots/final-gate-critic-4/pulls-390-top.png`, `shots/final-gate/repo-pulls/dark-390.png`, `shots/final-gate/repo-pulls/light-390.png`
11. **FG-115 [theme-fixable-css] Repo UnderlineNav: Issues tab not selected on milestone issue lists (only PageIsIssueList sets it)** — impact 1 (judges 0, critic wt 1; routes: milestone-issues)
   - Fix: Mark the Issues tab selected on .repository.milestone-issue (and other issue sub-pages) by CSS on the existing a.item[href$='/issues'].
   - Critic refs: C025 (milestone-issues, nit)
   - PNG: `shots/final-gate/milestone-issues/light-1440.png`
12. **FG-117 [theme-fixable-css] Admin NavList group chevrons (right/down) differ from Primer (down rotating to up)** — impact 1 (judges 0, critic wt 1; routes: site-admin-users)
   - Fix: Mask chevron-down and rotate 180deg when expanded.
   - Critic refs: C007 (site-admin-users, nit)
   - PNG: `shots/final-gate/site-admin-users/dark-1440.png`, `shots/final-gate/site-admin-users/light-1440.png`

# Integrator (final gate #1 follow-up, 2026-09-30): FG-007 AppHeader template APPROVED — markup ready, pending install (ORC-5)
Project copies: `templates/base/head_navbar.tmpl` (github-* branch → `custom/gh_head_navbar`, else Gitea 1.27.3 verbatim)
and `templates/custom/gh_head_navbar.tmpl` (the markup; spec: docs/final-gate/issues.md → "Header decision"). Nothing is
styled by the integrator: until you style it, the github themes show a bare flex row. Style it in the round that follows
the install (ask the orchestrator to install ORC-5 together with your round, not before a critic run).

Structure (github-* themes only; every other theme keeps `.navbar-left` / `.navbar-right` / `#navbar-expand-toggle`):
```
nav#navbar.gh-app-header[.gh-app-header--auth]           (Gitea base CSS still applies: #navbar flex/space-between, bg, border-bottom)
  div.gh-app-header-start
    details.gh-app-header-menu                           (absent while MustChangePassword)
      summary.item.gh-icon-btn > svg.octicon-three-bars  (native disclosure, no JS; aria-label = home.nav_menu)
      div.gh-app-header-drawer                           (only rendered by the browser while details[open])
        div.gh-drawer-head > img (logo, 32px)
        nav.gh-drawer-list > a.item[.active] > svg + span   (Dashboard, Issues, Pull Requests, Milestones, Explore — same
                                                          conditions/hrefs/active logic as upstream; anonymous: Explore, Help;
                                                          custom/extra_links output lands here too)
          [auth pages only] div.gh-drawer-divider[role=separator] + Register / Sign In items
    a.item#navbar-logo > img (32px)
    div.gh-app-header-context                            (not rendered on auth pages)
      a.gh-context-item.gh-context-owner + span.gh-context-sep("/") + a.gh-context-item.gh-context-repo   (repo pages)
      | span.gh-context-item ("Dashboard")  | a.gh-context-item (org/user name)  | span.gh-context-item (page .Title)
  div.gh-app-header-end                                  (not rendered on auth pages)
    form.gh-app-header-search[role=search] > svg.octicon-search + input[type=search][name=q]
                                                          (repo pages → <repo>/search "Search code…", else /explore/repos "Search repos…")
    a.item.gh-icon-btn.gh-app-header-search-link         (same target; meant for < 768px only — hide it ≥ 768, hide the form < 768)
    signed in:
      span.gh-app-header-divider[aria-hidden]
      div.ui.dropdown.jump.item.gh-app-header-create     (upstream create menu verbatim: contains span.not-mobile caret and
                                                          span.only-mobile "Create…" text — hide the text at every width)
      a.item.gh-icon-btn[.active] (Issues, octicon-issue-opened) ; a.item.gh-icon-btn[.active] (Pull requests)
      [a.item.active-stopwatch.gh-icon-btn] ; a.item.gh-icon-btn (bell, .notification_count inside)   (base/head_navbar_icons)
      div.ui.dropdown.jump.item.gh-app-header-avatar > span.text > span.navbar-avatar > img.avatar (32px) [+ svg.navbar-admin-badge]
                                                          (menu .user-menu verbatim; no caret, no name text)
    signed out:
      a.item.gh-app-header-signup[.active] ("Register", text only) ; a.item.gh-app-header-signin[.active] ("Sign In")
  div.active-stopwatch-popup.tippy-target               (unchanged)
{{template "base/head_banner"}}
```
Behaviour/styling targets are in the Header decision (64px bar, 32px bordered IconButtons, drawer = left Overlay 320px with
`details[open] > summary::before` backdrop, < 768 rules, `body:has(.repo-header) #navbar` drops the rule, no `/` kbd hint).
Your current `.navbar-left` / `.navbar-right` / `.navbar-mobile-right` / `#navbar-expand-toggle` rules become dead for the
github themes after the install — remove them (budget). Overlays keeps the dropdown popups (NO-1). Closes FG-068 once styled
(create + avatar stay visible at 390).

# From pages/auth (wave L1, round 1, 2026-09-30): FYI for the drawer on the slim auth header
pages/auth styles `.gh-app-header--auth` (src/pages/auth/app-header.css): transparent bar, no rule, the 48px mark centred,
and `details.gh-app-header-menu` is `position: absolute; top: 16px; left: 16px` with the summary as a 32px invisible
IconButton. The drawer (`.gh-app-header-drawer`) is yours and unstyled today: on the auth pages it currently opens as bare
inline links under the button (shots/pages-auth-r1/login/states/light-1440-menu-open.png). Please make the drawer
`position: fixed` (left overlay, as the Header decision says) so it does not depend on the summary's box; nothing else in
pages/auth touches the drawer or `.gh-drawer-*`.

# Navigation builder — wave L1, round 1 (2026-09-30): status
- FG-007 DONE: AppHeader styled (header.css + drawer.css) from github.com's live .AppHeader / .Overlay CSS — 64px bar
  (padding 16, gap 12, --bgColor-inset, inset 1px --borderColor-default; dropped on repo pages), 32px bordered IconButtons
  (radius 6, muted), 32px round logo, crumbs 4px/6px 14/20 (last semibold, owner shrinks first), search 272px from 1012px
  (IconButton below), 1×20 divider, "+ ▾" 50px, 8px accent unread dot, 32px avatar. Drawer: fixed left Overlay
  min(320px, 100vw-32px), --shadow-floating-small, 12px right radius, backdrop + close (Gitea's --octicon-x) both drawn by
  the summary, page scroll locked while open, NavList rows with 4px accent bar. Old .navbar-* / #navbar-expand-toggle rules removed.
- FG-068 DONE: at 390 the bar keeps hamburger, logo, crumbs, search, "+" (icon only), bell and avatar.
- pages/auth drawer note DONE: `.gh-app-header-drawer` is `position: fixed` (independent of the summary's box).
- FG-026 DONE: timing span hidden; the version string moved to the end of the footer row; logo + Powered by Gitea stay.
- FG-029 DONE (partly): the "…" trigger no longer carries the selected underline; < 768 TabNav hides icons, 8px padding,
  scrolls sideways (PR "Files Changed" still needs a scroll at 390, like github.com's Checks tab). The selected tab can still
  end up inside the overflow menu (Gitea's overflow-menu.ts cannot swap it).
- FG-030 DONE: dashboard context bar 1px --borderColor-muted rule; org header tab row rule edge to edge (pages/people told).
- FG-041 DONE: "Public" Label (English UI only) when no lock / shield-lock icon is rendered.
- FG-042 DONE: Watch, Fork, Star, RSS order; the UnderlineNav spacer is hidden, so Settings follows the other tabs.
- FG-050 NOT DONE: needs ~25 new masks, no budget (docs/requests/integrator.md NAV-I3).
- FG-059 DONE: < 768 pagination shows "Previous" / "Next" labels (First / Last stay icon-only).
- FG-109 NOT DONE this round (impact 3).
- FG-115 DONE: Issues tab selected on labels / milestones / milestone issue lists.
- FG-117 DONE: chevron points down when closed, up when open (Gitea's chevron-right mask rotated ±90°).
- PPL-N1 DONE: `.ui.secondary.pointing.tabular.menu .active.item` radius 6 (important file); measured 6px on /alice-dev,
  /explore/repos, /octo-org.

# From icons (final gate #1, wave L1 round 1) — masks available
- **FG-050** settings / org / repo / admin NavList leading visuals: `src/icons/octicon-masks.css` now has gear, paintbrush,
  shield-lock, key, key-asterisk, apps, organization, repo, package, play, webhook, server, mail, bell, blocked, git-branch,
  globe, terminal, file-binary, checklist, id-badge, sliders, meter, pulse, graph, clock, stack, cpu, person, people, tag
  (+ the earlier 21). Suggested Gitea-item → Octicon mapping (github.com's sidebars where an equivalent exists) is in
  docs/icons-audit.md §5 "Final gate #1". Each mask is pruned until referenced (0.2–1.1 KB each once used).
- **FG-117** NavList group chevrons: `--gh-octicon-chevron-down` (and `-chevron-up`, `-chevron-right`) exist.
- AppHeader: `--gh-octicon-three-bars` exists if a JS/Vue copy ever needs it (the server-rendered hamburger is already
  `octicon-three-bars`).
- **FG-114** (PR "Files changed" tab icon): handled in icons (`src/icons/pr-tabs.css`, `.pull.tabular.menu > .item >
  .svg.octicon-diff` → file-diff), pending integrator IC-1 (icons layer). Please don't add a rule for it.
Catalogue (all 65, mask vs source SVG): `shots/icons-l1r1/masks-catalogue.png`.

# From code (wave L1, round 1) — FYI, not a code selector
## Header avatar pushes the page to 407px at 390 on theme-playground routes
`div.ui.dropdown.jump.item.gh-app-header-avatar` ends at x=407 (viewport 390) on every octo-org/theme-playground page
whose crumb is long (e.g. /octo-org/theme-playground/src/branch/main/internal/palette/generated.go,
/octo-org/theme-playground/blame/branch/main/internal/render/render.go, /octo-org/theme-playground/pulls/16/files):
`document.scrollWidth` 407 (shots/code-r1/{file-view-large-file-playground,blame-playground-multiple-authors,
pr-files-changed-*-playground-large-diff}/*-390.json → horizontalOverflow true). The code surfaces themselves stay
inside 390 (probe: the only elements past 390 are the avatar dropdown and its children). Likely the context crumb
(`octo-org / theme-playground`) needs `min-width: 0` + ellipsis so the right-hand icon group keeps its width.

# Navigation builder — wave L1, round 2 (2026-09-30): status
- From code (header avatar pushes the page to 407px at 390) DONE: below 768 the create button and the owner crumb are
  hidden (github.com .AppHeader-actions / compact crumb); document.scrollWidth = 390 on
  /octo-org/theme-playground/src/branch/main/internal/palette/generated.go (probe shots/navigation-wL1r2-probe.mjs) and no
  horizontal overflow on any of the 88 captures in shots/navigation-wL1r2.
- FG-029 DONE (rest): when overflow-menu.ts moves the selected tab into "…", the trigger keeps the 2px selected bar on the
  nav's edge (same ::after as the tabs), so narrow repo pages always show the current tab.
- FG-068 REVISED: below 768 github.com hides the whole actions group ("+", Issues, PRs); ours now does too (bar = hamburger,
  logo, repo crumb, search, bell, avatar). Create stays reachable from ≥ 768 and the dashboard.
- FG-041 / FG-042: unchanged, but the repo title row now shows on the repo overview only (NAV-I5 in integrator.md).
  "Public" Label padding 0 6px (github.com measure).
- FG-050 NOT DONE: budget (the build is still over 300 KB); masks exist in icons.
- FG-109 NOT APPLICABLE any more below the overview: sub-pages have no title row; on the overview the row stays.

# Navigation builder — wave L1, round 3 (2026-09-30): status
- Critic nav-wL1-r2 #1 (overflow popup) DONE: popup rows are ActionList items — 32px, padding 6px 8px, 8px inset on both
  sides, radius 6; the selected row has --control-transparent-bgColor-selected, semibold and NavList's 4×24
  --borderColor-accent-emphasis bar in the inset; the tab underline no longer leaks into the popup (probe
  shots/navigation-wL1r3-popup.mjs: rows 176×32 at x=190 in a 192px popup at x=182).
- Critic #6 (only Code + Issues at 390) DONE in CSS: UnderlineNav hides its leading icons before overflowing (Primer
  React behaviour) — repo local bar < 1200px, other tab rows < 768px. 390: Code, Issues, Pull Requests, then "…".
- Critic #3 (overview title row) DONE: repo name only, 20px semibold --fgColor-default (owner hidden; the crumbs carry
  it). Owner avatar would need a template change (repo/icon renders the repo's own avatar / octicon).
- Critic #2 (org / profile tabs in the local bar): request NAV-P1 in pages-people.md (their later layer owns the band).
- NAV-I4 (crumb text) / FG-050 (NavList icons, budget ORC-4): still pending elsewhere.

# Integrator (loop 1 integration pass, 2026-09-30 15:05) — FYI / next round
- **Anonymous AppHeader overflows at 390 when the crumb is long** (audit shots/integrate-wL1): not-found-anon 396px and
  forgot-password 399px wide (light + dark). Probe (anonymous, 390): on `/nope-404` `.gh-app-header-start` keeps 96–192
  ("Page Not …" crumb) while `.gh-app-header-end` (min-width 0, flex-shrink 1) is squeezed to 204–374 and its children
  (search IconButton, Sign In, Register) overflow to x=396. Normal anonymous pages (repo, explore, issues) fit (end 182–374).
  Suggested: `.gh-app-header-end { flex-shrink: 0 }` so only the crumb shrinks/ellipsizes (forgot-password goes to the slim
  auth header once ORC-11 is installed, but any long page title reproduces it).
- NAV-I4 (crumb text) accepted; live once ORC-11 is installed. NAV-I3 (FG-050) rejected for this loop (budget) — see
  integrator.md.
- Size: the build now writes the minified files with CSS nesting (build/nest.mjs, lossless, self-checked); `*.src.css` stays
  flat. Nothing to change in your sources.
