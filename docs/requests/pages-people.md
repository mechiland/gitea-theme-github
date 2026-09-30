# Requests from `icons` (wave 1, round 1)

## P-1 Dashboard repo list (Vue `DashboardRepoList.vue`) non-Octicons → CSS mask
JS-bundled, so the server overrides don't reach them. Needs `src/icons/octicon-masks.css` (docs/requests/icons.md I-4).
- commit status error/warning `gitea-exclamation` (`:38,40`) → `--gh-octicon-alert` (matches the server override).
- pagination first/last `gitea-double-chevron-left/right` (`:500,519`) → `--gh-octicon-arrow-left` / `--gh-octicon-arrow-right`.
```css
.dashboard-repos .gitea-exclamation,
.dashboard-repos .gitea-double-chevron-left,
.dashboard-repos .gitea-double-chevron-right { background-color: currentColor; mask: var(--gh-octicon-alert) center / contain no-repeat; }
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-arrow-left); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-arrow-right); }
.dashboard-repos :is(.gitea-exclamation, .gitea-double-chevron-left, .gitea-double-chevron-right) > * { visibility: hidden; }
```
(Scope selector to be confirmed against the live DOM: `#dashboard-repo-list` / `.dashboard-repos`.)

# Round 3 (icons)
Dashboard repo-list pagination (Vue, `DashboardRepoList.vue:500,519`): to match the server pagination (whose files are
now `move-to-start` / `move-to-end`), use `--gh-octicon-move-to-start` / `--gh-octicon-move-to-end` instead of
`arrow-left` / `arrow-right` in lines 11–12 of the proposal above:
```css
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-move-to-start); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-move-to-end); }
```

# Round 4 (icons)
No change: the dashboard pagination masks from round 3 (`move-to-start` / `move-to-end`) still match the server
pagination, which now gets the same glyphs through navigation N-3 masks (the server files are Gitea's `«`/`»` again).

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
  P-1 (dashboard repo list masks, move-to-start/end) can ship in wave 3.

# pages/people wave 3 round 1 (builder)
- **P-1 DONE** (wave 3 r1): masks shipped in `src/pages/people/dashboard.css` (`.dashboard-repos .gitea-exclamation` →
  `--gh-octicon-alert`, `gitea-double-chevron-left/right` → `--gh-octicon-move-to-start/-end`, children hidden).
  Not visually verified yet: the seeded dashboard has < 1 page of repos and no error/warning commit status, so none of
  the three glyphs renders on `home`.

# From pages/settings-admin (wave 3, round 2) — SA-P1 [blocker per critic]: `.organization > .flex-container` also matches org SETTINGS
What: every `.organization > .flex-container …` rule in src/pages/people/org.css (lines 17, 29, 35, 40, 53, 60, 66, 72,
98, 104, 115, 259 …) also matches the org settings grid: templates/org/settings/layout_head.tmpl:4 renders
`.page-content.organization.settings > .ui.container.flex-container > .flex-container-nav + .flex-container-main`
right after the org header band. Result (critic, shots/critic-pages/settings-admin-r1/org-settings/): the whole settings
area becomes a --page-header-bgColor full-bleed band, align-items:center drops the nav to y=583, every Subhead
(`.ui.top.attached.header` matches `.organization > .flex-container .ui.header`) gets the band box-shadow, and at 390
`flex-direction: row` squeezes the main column to ~70px (document 434px wide).
Why: the header band is only `templates/org/header.tmpl`'s container; the settings container is pages/settings-admin's.
Proposed diff (scope every header-band selector to the container that has no settings nav):
```css
/* before */ .organization > .flex-container { … }
/* after  */ .organization > .flex-container:not(:has(> .flex-container-nav)) { … }
```
(same `:not(:has(> .flex-container-nav))` on each `.organization > .flex-container` / `.organization:not(.profile) > .flex-container`
selector, including the `+ .ui.container` tab-band rules, which are unaffected but read more clearly with it).
Meanwhile pages/settings-admin guards the grid itself (layout.css: background/box-shadow/clip-path/align-items/
flex-direction reset on `.page-content.settings > .flex-container:has(> .flex-container-nav)`, subhead.css resets the
band box-shadow/clip-path on its Subheads), so either order of landing is safe.
- **SA-P1 DONE** (pages/people wave 3 r2): every header-band selector is now `.organization > .flex-container:first-child`
  (org/header.tmpl is the page's first child on every org page; the settings grid is the third child), so nothing in
  org.css / people.important.css matches `.page-content.organization.settings > .ui.container.flex-container` any more
  (checked: the settings container's margin/background/box-shadow now come only from Gitea + pages/settings-admin).

# Integrator (end of wave 3, 2026-09-30)
- **PPL-1 addendum — DONE** (short custom-property names at build time: auto 435 → 335 KB). Budget still exceeded;
  decision escalated as ORCHESTRATOR.md ORC-4.
- **PPL-N1** (UnderlineNav radius) — still open in docs/requests/navigation.md (no navigation round scheduled).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-047 [theme-fixable-css] Notifications: unread counter outlined (not a CounterLabel), icon-only green 'Mark all as read', no selected state on mobile Unread/Read** — impact 9 (judges 0, critic wt 9; routes: notifications)
   - Fix: CounterLabel fill; default (neutral) button; SegmentedControl selected state.
   - Critic refs: C136 (notifications, minor), C137 (notifications, minor), C138 (notifications, minor)
   - PNG: `shots/final-gate-critic-5/notif-light-top.png`, `shots/final-gate/notifications/light-390.png`, `shots/final-gate/notifications/dark-390.png`, `shots/final-gate/notifications/dark-1440.png`
2. **FG-052 [theme-fixable-css] Profile: follower counts not bold, Follow button has a person icon, Overview tab uses info icon (github.com: book), topic tags oversized** — impact 8 (judges 5, critic wt 3; routes: user-profile, user-profile-repositories-tab, user-profile-stars-tab)
   - Fix: Counts 600 fgColor-default; hide the svg inside the Follow button (icon only, button stays); mask the Overview tab icon with octicon-book; topic-tag 22px / 10px padding.
   - Critic refs: C020 (user-profile-repositories-tab, nit), C168 (user-profile, nit), C201 (user-profile-stars-tab, nit)
   - PNG: `shots/final-gate/user-profile-repositories-tab/light-1440.png`, `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate/user-profile/dark-1440.png`, `shots/final-gate/user-profile/light-1440.png`
3. **FG-053 [theme-fixable-template] Profile README Box has no '<user> / README.md' mono caption header** — impact 8 (judges 7, critic wt 1; routes: user-profile)
   - Fix: github-* branch in templates/user/profile.tmpl (README block): Box header with '<name> / README.md' in 12px mono.
   - Critic refs: C168 (user-profile, nit)
   - PNG: `shots/final-gate/user-profile/light-1440.png`, `shots/final-gate/user-profile/dark-1440.png`, `shots/final-gate/user-profile/light-1440.png`
4. **FG-067 [theme-fixable-css] Dashboard CLS 0.365 at 390 (Vue repo list grows 4 times while loading)** — impact 6 (judges 0, critic wt 6; routes: home)
   - Fix: Reserve the repo-list height (min-height placeholder) in .flex-container-main.
   - Critic refs: C001 (home, major)
   - PNG: `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/light-390.png`
5. **FG-077 [theme-fixable-css] Repo rows on org home / profile / explore have no 'Public' Label** — impact 6 (judges 5, critic wt 1; routes: org-home, user-profile-repositories-tab)
   - Fix: Same technique as public-badge (html:lang(en), only when Gitea renders no visibility label on the row).
   - Critic refs: C010 (org-home, nit)
   - PNG: `shots/final-gate/org-home/dark-1440.png`, `shots/final-gate/org-home/light-1440.png`, `shots/final-gate/user-profile-repositories-tab/dark-1440.png`, `shots/final-gate/user-profile-repositories-tab/light-1440.png`
6. **FG-080 [theme-fixable-css] Explore users/orgs listed as separate bordered cards with 16px gaps; sidebar rule stops mid-page** — impact 5 (judges 0, critic wt 5; routes: explore-orgs, explore-users)
   - Fix: One Box with divided rows; sidebar border full height.
   - Critic refs: C062 (explore-users, minor), C082 (explore-orgs, nit), C083 (explore-orgs, nit)
   - PNG: `shots/final-gate/explore-users/light-1440.png`, `shots/final-gate/explore-orgs/light-1440.png`, `shots/final-gate/explore-orgs/dark-390.png`, `shots/final-gate/explore-orgs/dark-1440.png`
7. **FG-083 [theme-fixable-css] Dashboard: heatmap does not fill its Box (~165px empty), repo search autofocused with accent ring in every capture** — impact 4 (judges 0, critic wt 4; routes: home)
   - Fix: Heatmap width 100%; focus ring only on :focus-visible.
   - Critic refs: C003 (home, minor), C005 (home, nit)
   - PNG: `shots/final-gate/home/dark-390.png`, `shots/final-gate/home/dark-1440.png`, `shots/final-gate/home/light-390.png`, `shots/final-gate/home/light-1440.png`
8. **FG-101 [theme-fixable-css] Org members at 390: ~170px rows (names wrap, Hidden label on its own line, buttons stacked); '2FA: ×' bare glyph** — impact 3 (judges 0, critic wt 3; routes: org-members)
   - Fix: One-line rows with a single trailing button group; 2FA as a muted Label.
   - Critic refs: C051 (org-members, minor)
   - PNG: `shots/final-gate-critic-1/om-mob.png`, `shots/final-gate/org-members/dark-1440.png`, `shots/final-gate/org-members/light-1440.png`
9. **FG-102 [theme-fixable-css] Org teams: staggered two-column card grid with unequal headers (github.com: one Box, one row per team)** — impact 3 (judges 0, critic wt 3; routes: org-teams)
   - Fix: Single Box with a row per team.
   - Critic refs: C077 (org-teams, minor)
   - PNG: `shots/final-gate/org-teams/light-1440.png`, `shots/final-gate-critic-2/ot-l390.png`, `shots/final-gate/org-teams/light-390.png`, `shots/final-gate/org-teams/light-1440.png`
10. **FG-104 [theme-fixable-css] Explore meta-row link hover underlines the '·' separator** — impact 3 (judges 0, critic wt 3; routes: explore-repos)
   - Fix: src/pages/people/repo-list.css:127: separator pseudo-element display:inline-block (or outside the link).
   - Critic refs: C026 (explore-repos, minor)
   - PNG: `shots/final-gate-critic-1/live/explore-repos/states/light-1440-meta-hover-clip.png`, `shots/final-gate-critic-1/er-meta.png`, `shots/final-gate/explore-repos/light-1440.png`
11. **FG-106 [theme-fixable-css] /user/settings header 8px lower than other settings tabs (profile.css:24 .user.profile > :first-child also matches settings)** — impact 3 (judges 0, critic wt 3; routes: user-settings)
   - Fix: Add :not(.settings) to src/pages/people/profile.css:24.
   - Critic refs: C064 (user-settings, minor)
   - PNG: `shots/final-gate/user-settings/light-1440.png`, `shots/final-gate/user-settings/light-1440.png`
