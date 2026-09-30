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

# From controls (final gate #1, wave L1 r1, 2026-09-30) — FYI, optional cleanup
controls now styles every `shared/search/*` search group generically (`src/controls/inputs.css`, "search field"): medium
32px/14px input, padding-left 32px, the adjacent submit `.ui.icon.button` drawn as the leading muted search octicon
(32px wide, transparent, hover --fgColor-default, focus-visible ring). Your page-scoped copies in `repo-list.css`
(`:is(.profile, .explore, .members, .teams) .action.input > [name="q"]` and `… ~ .button`) render the same numbers
(measured /explore/repos and /org/octo-org/members: input 32px, 14px, padding 0 12px 0 32px; button 32x32 at x=0) and
can be deleted in a later trim. Keep the hover colour rule in merged.css or drop it too (controls sets the same).

# pages/people — final gate #1, wave L1 round 1 (builder)
Verified in shots/pages-people-r1b (light+dark, 1440+390, states + measure) unless noted.
- **FG-067 DONE** — home CLS at 390: 0.322 → 0 (light and dark). Two causes: the Vue list grew in 4 steps, and the feed
  was painted before the (later-parsed, order −1) sidebar existed. Phones now reserve 384px at the top of the container
  (padding-top) and the sidebar pulls itself into it (margin-top −384px) with a fixed 384px height; the rows scroll
  inside (≈6 visible). media.css.
- **FG-047 DONE** — unread counter is a CounterLabel (counter-bgColor-muted fill, no outline); "Mark all as read" is a
  small default Button with the octicon + the button's own localized title as text (`::after { content: attr(title) }`);
  phones: Unread | Read is a SegmentedControl (track + knob). notifications.css, media.css, people.important.css.
- **FG-052 PARTIAL** — Follow button text only (icon hidden); topic tags 24px, padding 0 10px, weight 500, rows 8px /
  tags 2px apart (github.com measured); Overview tab book icon wired to `--gh-octicon-book` but the mask does not exist
  yet → request PPL-I1 in docs/requests/icons.md (until then Gitea's info icon stays, by construction). Follower counts
  NOT bold: the number shares one text node with the word (profile_big_avatar.tmpl:21), no CSS can split it.
- **FG-077 DONE** — `html:lang(en)` "Public" Label on profile Repositories / org home rows that carry no Gitea
  visibility label (not on Stars rows, where github.com has none either). repo-list.css.
- **FG-080 DONE** — explore users / organizations: one Box with divided rows (repository results stay cards); the
  sidebar rule now continues through the footer's empty 48px top padding to its text row.
- **FG-083 DONE** — heatmap svg fills its Box (no 832px cap; the fixed-height formula follows); the autofocused empty
  repo filter shows the accent border without the 2px ring (outline kept once text is typed).
- **FG-101 DONE** — org People: role and 2FA on one line, "2FA: ×" is a muted Label (12px glyph); phones: name one line
  with ellipsis, buttons side by side under it (row ≈117px, was ≈170px); desktop rows 81px (github.com 81px).
- **FG-102 DONE** — org Teams: one Box, one row per team (name + Label, muted description, 20px avatars, 12px counts);
  phones stack the row.
- **FG-104 DONE** — explore meta " · " separators are out-of-flow (absolute) pseudo-elements centred in a 16px gap, so
  the link's hover underline no longer runs under them.
- **FG-106 DONE** — `.user.profile:not(.settings) > :first-child`; /user/settings header now at the same y (88px) as
  the other settings tabs (checked /user/settings, /account, /appearance).

# From navigation (wave L1, round 1, 2026-09-30): FYI org header band rule (FG-030)
`.organization > .flex-container:first-child + *` (org.css) draws its "edge to edge" rule with a second box-shadow
`0 var(--borderWidth-thin) 0 100vmax var(--borderColor-muted)`, but the first shadow (`0 0 0 100vmax` bg) also spreads
100vmax downward and covers it, so no rule is painted (pixel-checked on /octo-org light: rows 252/253 go straight from the
band colour to white). navigation now draws the rule itself as a `::after` (1px, --borderColor-muted, at `bottom: -1px`,
with ±50vw box-shadow copies) on `.page-content.organization > .flex-container:first-child + .ui.container`, which relies on
your `clip-path: inset(0 -100vmax calc(var(--borderWidth-thin) * -1))` keeping 1px below the element visible — please
keep that clip-path. You can drop the dead second shadow (saves bytes). Verified in shots/navigation-r1/org-home and
org-settings (light/dark, 1440/390).

# From icons (final gate #1, wave L1 round 1)
- **PPL-I1 DONE** — `book`, `home`, `people` masks added. `book` switched on with deploy 9ee594a4be: the profile Overview
  tab shows the book glyph (16×16, both schemes; `shots/icons-l1r1/live/cmp-live.png`). `home` / `people` are pruned until
  you reference them.

# pages/people — final gate #1, wave L1 round 2 (builder; critic L1r1 issues)
Verified in shots/pages-people-l1r2c (light+dark, 1440+390, states + measure; 52 pages: 0 console errors, 0 failed
requests, 0 off-palette, max CLS 0.0023) plus probes in shots/pages-people-l1r2/*.mjs.
- **FG-067 follow-up DONE** — phone dashboard: no nested scroller any more. The fixed 445px reservation (tabs, heading,
  search, filter, 8 rows) holds only while the Vue list loads; once `.dashboard-repos .repo-owner-name-list` exists (or
  the Organizations tab is shown) the list is in the flow at its natural height: all 8 rows visible, no scroller
  (probe: scrollers []). Home 390 CLS 0 (light/dark); the feed moves by (rows − 8) × 29px for other list sizes.
- **Org sidebar headings DONE** — "Members" / "Teams" 16/400/24 (the `<strong>` inherits), 16px below (github.com).
- **Follower counts** — template: request PPL-T1 in docs/requests/integrator.md; the CSS for the count span is already in
  profile.css (inert until the span exists).
- **Org Overview / Projects tab icons DONE** — octicon-home (org Overview) and octicon-table (user + org Projects) masks;
  request PPL-I2 in icons.md for `table` (it rendered already in this run).
- **Teams DONE** — rows share the Box's columns (subgrid): avatars at x=1015 in every row (was ≈55px off in Owners);
  Leave button 8px after the counts (was 4).
- **Phone heatmap DONE** — the Box's 16px side insets are borders in the Box colour and the outline is a 1px ring, so
  the scrolled weeks clip 16px inside the outline (box x=17, clip x=33).
- **Notifications 390 DONE** — "Mark all as read" is a medium Button (32px, 14px) next to the 32px SegmentedControl.
- **Org home CLS DONE** — the one-column fallback keyed on `:has(> .column + .column)` flipped to two columns when the
  sidebar column was parsed after a first paint (the 0.024 shift); now keyed on the server-rendered `.eleven.wide`
  class of the first column. Org home CLS 0 in this run (3/3 probe loads: 0 after the change).
- **Not doable in CSS**: "Public archive" / "Public template" — the row labels differ only by text, so a lone
  "Archived" / "Template" label on a public repo cannot be told apart from one on a private repo.

# From icons (final gate #1, wave L1 round 2, 2026-09-30)
- The `--gh-octicon-table` mask exists now (`src/icons/octicon-masks.css`). Your Projects tab rule (`profile.css:224-232`)
  went live with deploy c4118f2801. Probe on profile and org, light and dark, 1440: 16×16 table, `--fgColor-muted`.
- The `…` overflow popup (`.overflow-menu-popup`, used at narrow widths) is covered by icons `nav-tabs.css` once IC-1
  lands. The same file swaps the repo tab bar's `octicon-project`. The selectors don't overlap with yours, so there's
  no ownership clash.

# From navigation (final gate #1, wave L1 round 3, 2026-09-30) — NAV-P1: org + profile tabs in the AppHeader local bar
Critic nav-wL1-r2 #2 (minor): repo pages now put their UnderlineNav in the AppHeader's local bar (navigation
repo-header.css: directly under the 64px global bar, 48px, `--bgColor-inset`, padding 0 16px, 1px `--borderColor-default`
rule, content 24px below). Signed-in github.com does the same for org and user pages (the band + tabs you built follow the
logged-out org / profile pages). Your layer is later than gh.navigation, so this can only land in pages/people. Proposal
(org, all org pages that render org/menu.tmpl):
```css
.page-content.organization:has(> .flex-container:first-child + .ui.container > overflow-menu) {
  display: flex;
  flex-direction: column;
}
/* the tab container becomes the local bar (replaces your band box-shadow / clip-path on `+ *`) */
.organization > .flex-container:first-child + .ui.container {
  order: -1;
  width: auto;
  max-width: none;
  margin: 0;
  padding: 0 var(--base-size-16);
  background: var(--bgColor-inset);
  box-shadow: inset 0 calc(var(--borderWidth-thin) * -1) 0 var(--borderColor-default);
  clip-path: none;
}
/* overflow-menu carries tw-mb-4 (!important) → 0 in your important file */
/* the org profile (avatar, name, meta) then sits on the page background 24px below the bar, no grey band */
.organization > .flex-container:first-child {
  margin-top: var(--base-size-24);
  background: none;
  box-shadow: none;
  clip-path: none;
}
```
Check Gitea's < 768 `.ui.container` rules inside the flex column (auto margins). Profile: `.user.profile .ui.grid` is
already `display: grid`; making the second column `display: contents` lets `overflow-menu` take
`grid-column: 1 / -1; grid-row: 1` (full-bleed with your 100vmax shadow trick, `--bgColor-inset`, the 1px
`--borderColor-default` rule) above the sidebar. When you do the org part, tell me: navigation's edge-to-edge org rule
(`.page-content.organization > .flex-container:first-child + .ui.container::after`, repo-header.css) then goes away.
Unverified against signed-in github.com screenshots (the tools capture github.com logged out) — your call.


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-057 [theme-fixable-template] Profile README Box has no '<user> / README.md' caption header** — impact 7 (judges 7, critic wt 0; gate 1 FG-053; routes: user-profile)
   - Fix: Gate-1 FG-053 rejected (a ≤ 10). CSS could only add a static 'README.md' caption (the user name is not reachable in CSS); worth it as a cheap partial: `.user.profile #readme::before { content: "README.md" }` mono 12px in a Box header.
   - PNG: `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`
2. **FG2-066 [theme-fixable-css] People details: dashboard repo filter looks focused at rest (autofocus + accent border), 40px README inset at 390 on org home, row avatars centred against multi-line meta, ragged team meta column, 'Block user' 12px and tight vcard rows, no Star button on starred rows** — impact 6 (judges 0, critic wt 6; gate 1 FG-083; routes: org-home, user-profile, user-profile-stars-tab, org-teams, home, explore-users)
   - Fix: `.repos-search input:focus:placeholder-shown` border `--borderColor-default`; org README Box-body 16px < 768; `align-items:flex-start` on explore/user rows; fixed-width right column for team meta; 'Block user' 14px, vcard row gap 8px. C188 needs markup: skip.
   - Critic refs: C002 (home, nit), C007 (org-home, nit), C043 (explore-users, nit), C065 (org-teams, nit), C145 (user-profile, nit), C188 (user-profile-stars-tab, nit)
   - PNG: `shots/final-gate-critic-0/home-left-zoom.png`, `shots/final-gate-critic-0/oh-390-a.png`, `shots/final-gate-critic-2/explore-users-390-pair.png`, `shots/final-gate-2/org-home/dark-390.png`
3. **FG2-070 [theme-fixable-template] Profile: follower / following counts not bold (github.com: bold default-colour counts, muted lowercase labels)** — impact 5 (judges 2, critic wt 3; gate 1 FG-052; routes: user-profile, user-profile-stars-tab)
   - Fix: No CSS path: count and label are one text node (`{{.NumFollowers}} {{ctx.Locale.Tr "user.followers"}}` in shared/user/profile_big_avatar.tmpl) and that override was rejected (PPL-T1). Not proposed for the last slot (impact below the labels/milestones NavList).
   - Critic refs: C144 (user-profile, minor)
   - PNG: `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-critic-6/up-l-left.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`
4. **FG2-084 [theme-fixable-css] Notifications: row title turns accent blue on hover (github.com does not); Unread/Read nav without icons** — impact 3 (judges 0, critic wt 3; gate 1 FG-047; routes: notifications)
   - Fix: No colour change on row hover (background `--bgColor-muted` only); inbox/check icons on the two NavList items via masks. Filter bar / grouping / Saved-Done are github.com-only (inherent).
   - Critic refs: C121 (notifications, minor)
   - PNG: `shots/final-gate-2/notifications/light-1440.png`, `shots/final-gate-critic-5/live/notifications/states/light-1440-row-hover-clip.png`, `shots/final-gate-2/notifications/light-1440.png`
5. **FG2-094 [theme-fixable-css] Profile sidebar: the organizations avatar row has no 'Organizations' heading** — impact 2 (judges 0, critic wt 2; new; routes: user-profile, user-profile-repositories-tab)
   - Fix: `html:lang(en)` generated 16px/600 'Organizations' heading before the org avatar row (precedent FG-041).
   - Critic refs: C016 (user-profile-repositories-tab, nit), C146 (user-profile, nit)
   - PNG: `shots/final-gate-critic-0/up-l.png`, `shots/final-gate-2/user-profile/dark-1440.png`, `shots/final-gate-2/user-profile/light-1440.png`, `shots/final-gate-2/user-profile-repositories-tab/dark-1440.png`

# pages/people — final gate #2, wave L2 round 1 (builder)
Verified in shots/pages-people-fg2-r1 (home, user-profile, org-home, explore-users, org-teams; light+dark, 1440+390,
states + measure: 20 pages, 0 console errors, 0 failed requests, max CLS 0.0117) plus probes in shots/pages-people-fg2/*.mjs.
- **FG2-066 DONE (5 of 6 parts)**
  - Dashboard filter: while the autofocused input is still empty it keeps the resting border (`--borderColor-default`,
    no ring); probe: rest 209,217,224 / no outline; after typing: accent border + 2px accent ring.
  - Explore users / orgs rows: avatar top-aligned (Gitea's `tw-items-center` is !important → people.important.css);
    avatar top = title top (16/17px) at 390 and 1440.
  - Org Teams: counts column left-aligned inside the shared column 3, so "N members · N repositories" starts at x=1099
    on every row (was 1099 vs 1158); the Leave button trails.
  - Profile: "Block user" 14px (was 12px, github.com 14px); vcard rows 29px apart (was 25; github.com 25px rows 29px
    apart); follower line margin 16 → 12 so the first detail keeps github.com's 20px distance.
  - Org README at 390: NO CHANGE on evidence. github.com's org and user READMEs keep `Box-body p-4` (24px) at 390
    (measured github.com/github and /microsoft at 390: article x=41 inside a Box at x=16); ours measures the same
    (box x=16 w=358, padding 24, content x=41). The critic's 40px is the list/alert indentation inside the markdown.
  - Star button on starred rows (C188): skipped, needs markup.
- **FG2-057 DONE (partial, CSS-only)** — profile README Box starts with a 12/18 mono "README.md" caption 16px above the
  markdown (github.com `text-mono text-small mb-3`), "README" --fgColor-default and ".md" --fgColor-muted (6ch colour
  stop, mono glyph = 1ch = 7.42px measured). The "<user> /" part needs the template. Only on `.user.profile`.
- **FG2-094 DONE** — `html:lang(en)` "Organizations" heading (16/600/24, --fgColor-default, 8px above the avatars) in
  the organisations section of the profile sidebar, light + dark, 1440 + 390.
- Not in this round's scope: FG2-070 (template, rejected), FG2-084 (notifications).
