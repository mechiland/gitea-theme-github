# Critique: navigation, wave L1, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Build revision `a909e2f1e1`. The served files were byte-identical to dist for all 3 themes (sha256 checked), so no deploy was needed.

**Score: 8.4 / 10. Not a pass: the score is below 8.5.** Round 1 was 8.2.
- Lint (navigation): 0 errors, 0 warnings, 215 selectors.
- Build: `folders["navigation"].status = "ok"`, 49,355 B of source. The whole build is over budget: light 333.3, dark 334.5, auto 338.6 KB against 300 KB.
- Smoke test: green, all steps ok, 0 console errors (`shots/critic-navigation-wL1-r2-smoke.log`). It ran at the same time as the capture; no capture reported a wrong `data-theme`.
- Console errors: 0 unexpected. There were 4 in total, all the expected main-document 404 on not-found.
- Off-palette colours: 0. Unresolved variables: 0. Horizontal overflow: none on any of the 108 captures.
- Non-Octicon icons: `fontawesome-openid` on login and signup (belongs to pages/auth) and `gitea-running` in the actions run list (belongs to pages/actions). Neither is this folder's.
- Failed states:
  - `create-menu-open` at 390: expected, because "+" is now hidden below 768px.
  - `crumb-hover` on home: expected, because the Dashboard crumb is not a link.

## Runs

- Ours: `shots/critic-navigation-wL1-r2/`. It covers 27 routes × light/dark × 1440/390, with `--states --measure`. The routes file is `shots/critic-navigation-wL1-r2-routes.json`: my round-1 routes, plus the builder's playground-file, actions-list and repo-empty-or-tree. Added states:
  - avatar-focus on home and repo-home;
  - overflow-open and trigger focus on repo-pull at 390;
  - hamburger-focus on repo-issues.
- Probes:
  - `shots/critic-navigation-wL1-r2-probe.mjs`: geometry on 11 pages × schemes, including the local bar, the title row, the trigger ::after, header children and scrollWidth.
  - `shots/critic-navigation-wL1-r2-popup.mjs`: geometry of the overflow popup.
- Reference: my round-1 logged-out captures in `docs/reference/critic-nav-wl1-*` (same day). I also downloaded github.com's live `global-54ba76e934a49d7c.css` again and read the `.AppHeader*` rules.
- Crops: `shots/critic-navigation-wL1-r2/crops/`.

## Builder's claims, verified

1. **Avatar focus ring: fixed.** The 2px accent ring is drawn outside the 32px circle in light and dark (`crops/focus-states.png`, rows 1–3). The Fomantic menu also opens on focus; that is Gitea behaviour.
2. **FG-029 trigger bar: fixed.** On `/octo-org/grex/pulls/42` at 390, `.overflow-menu-button.active::after` measures 2px × 30px, bottom −9px, translate (15, −1). The colour is `--underlineNav-borderColor-active` (light rgb(253,140,115), dark rgb(247,129,102)). It sits on the local-bar edge like the tab bars (`crops/repo-pull-dark-390-top.png`, `crops/390-states.png`).
3. **Local bar: fixed.**
   - The header is 64px; the local bar follows at y=64, 48px tall, on --bgColor-inset, with the tabs starting at x=16. This holds on every repo page probed: overview, issues, tree, actions, settings, pulls.
   - The title row shows only on the overview (display:block, 46px at 1440, 82px at 390) and is `none` elsewhere.
   - The Issues, Actions and file-tree panes start at the rule (y=112). Repo settings starts at y=136 (24px gap).
   - Screenshots: `crops/repo-home-light-1440-top.png`, `crops/repo-issues-light-1440-top.png`, `crops/page-tops.png`.
   - The result reads very much like signed-in github.com.
   - I agree with the decision to show the title row only on the overview. Signed-in github.com shows the repo title row (with Watch/Fork/Star) only on the Code overview.
4. **Below 768px: fixed.** At 390 the header children are hamburger (16), logo (56), crumb "grex" (96), search IconButton (262), bell (302) and avatar (342). scrollWidth is 390 on the theme-playground file route.
   - Note: github's live CSS also has a `responsive-context-region` variant that keeps the full crumbs below 768px with ellipsis. Either choice is defensible.
5. **Public label: fixed.** Measured 49.6 × 20, padding 0 6px, line-height 18px, 1px border. This equals the github.com measurement.

## Issues (most important first)

1. **Major: the "…" overflow popup draws the tab underline inside the menu, and its rows are misaligned.**
   - Where: `/octo-org/grex/pulls/42` at 390, light and dark, overflow-open state. It happens on every narrow repo page whose current tab has moved into the popup.
   - Evidence: `crops/overflow-open.png`, `repo-pull/states/{light,dark}-390-overflow-open-clip.png`.
   - Measured (probe `shots/critic-navigation-wL1-r2-popup.mjs`):
     - The selected row "Pull Requests" gets `.ui.secondary.pointing.menu .active.item::after`: a 2px coral bar, bottom −9px. It runs across the row and cuts into the "Actions" row below.
     - The rows are 176 × 30 at x=182, flush with the popup's left edge (popup at x=182, 192 wide), leaving a 16px gap on the right only.
     - Row padding resolves to `0 8px`. The important-file rule `overflow-menu .overflow-menu-popup > .item { padding: 6px 8px !important }` loses to `.ui.secondary.pointing.menu .item { padding: 0 … !important }` on specificity.
   - Expected (Primer ActionMenu / ActionList): rows inset 8px on both sides (x=190, width 176), 32px tall, padding 6px 8px, radius 6. The selected row shows no underline; it shows the selected background, and the ActionList puts its 4px accent bar on the left.
   - Fix: exclude `.overflow-menu-popup .item` from the shared ::after rule, and set `margin: 0 var(--base-size-8)` and the padding with a selector that beats `.ui.secondary.pointing.menu .item`.

2. **Minor: org and user-profile tabs are not in the local bar, unlike the repo tabs.**
   - Where: `/octo-org` and `/alice-dev` at 1440 (`crops/page-tops.png` row 4, `crops/page-tops2.png` row 3).
   - What happens: repo pages now put their UnderlineNav in the AppHeader local bar. The org page instead has a 64px header, then the org profile on a grey band, then the tabs with a rule. The profile page has its tabs inline beside the avatar.
   - Expected: signed-in github.com puts the org tabs (Overview, Repositories, Projects, Packages, People, Teams, Settings) and the user tabs in the same local bar under the global bar. The pages are now internally inconsistent.
   - Ownership: this is shared with pages/people. The org case might be done with the same flex `order` trick on `.page-content.organization`.

3. **Minor (unverified against signed-in github.com): the overview title row still uses the logged-out style.**
   - Measured: repo octicon, then "octo-org / grex" in --fgColor-accent at 20px, the owner regular. The header crumbs already say "octo-org / grex" 80px higher.
   - Expected (from memory of signed-in github.com, not captured): the owner's 24px avatar, the repo name only in --fgColor-default semibold, then "Public"; the actions are Pin / Watch / Fork / Star.
   - I could not capture signed-in github.com, so I rank this minor.

4. **Minor (template, integrator NAV-I4 pending): the crumb reads "Dashboard" on /-/admin and "Profile" on /user/settings.** Evidence: `crops/page-tops.png` rows 5 and 6.

5. **Minor: FG-050 (leading Octicons in the settings and admin NavLists) is still open**, blocked on budget. Evidence: `crops/page-tops.png` rows 2, 5 and 6 (no leading icons).

6. **Minor (behaviour): at 390 the local bar shows only Code and Issues, then about 130px of empty space before "…".**
   - Cause: Gitea's overflow-menu.ts measuring, not CSS.
   - github fits more items at this width: Code, Issues, Pull requests, Actions…
   - Evidence: `crops/repo-home-light-390-top.png`.

7. **Nit: search placeholder.** Ours is "Search code…" / "Search repos…". github's reads "Type / to search" with a kbd hint.

8. **Nit: the drawer close X** has no hover background and no focus target of its own.

9. **Shared: the build is over budget** (light 333.3, dark 334.5, auto 338.6 KB). Navigation stayed about flat.

## Measurements (light 1440 unless noted)

| control | property | ours | github | ok |
|---|---|---|---|---|
| AppHeader global bar | height | 64 | 64 (live CSS: padding 16 + 32) | yes |
| AppHeader local bar | y / height / padding / bg | 64 / 48 / 0 16 / rgb(246,248,250) | directly under global bar / 48 / 0 16 (`.AppHeader-localBar`) / --bgColor-inset | yes |
| Local bar, dark | bg | rgb(1,4,9) | --bgColor-inset dark #010409 | yes |
| Content start, repo issues/actions/tree | y | 112 (at the rule) | at the rule | yes |
| Avatar button | focus ring | 2px accent, offset +2, visible | visible ring outside the avatar | yes |
| Overflow trigger (390, selected in menu) | ::after | 2px × 30, bottom −9, --underlineNav-borderColor-active | selected item visible with a 2px bar | yes |
| Overflow popup row | box / padding / inset | 176×30 at popup x+0, padding 0 8, stray 2px bar | 32 tall, padding 6 8, inset 8 both sides, no underline | no |
| Header children at 390 | set | menu, logo, repo crumb, search, bell, avatar | `.AppHeader-actions` hidden < 768 | yes |
| scrollWidth at 390 | px | 390 (playground file route) | 390 | yes |
| Public label | size / padding / lh / border | 49.6×20 / 0 6 / 18 / 1px | 49.6×20 / 0 6 / 18 / 1px | yes |
| UnderlineNav item | box / font | 75.4×30, 14px 600 | 75.4×30, 14px 600 | yes |
| Repo title row (overview) | style | repo icon + owner/repo accent 20px | avatar + repo name default fg (unverified) | partly |

## Screenshots reviewed

- `crops/repo-home-light-1440-top.png`, `crops/repo-issues-light-1440-top.png`, `crops/repo-home-light-390-top.png`, `crops/repo-pull-dark-390-top.png`
- `crops/focus-states.png`: avatar focus in light and dark on home and repo, icon-button focus, hamburger focus, tab focus
- `crops/390-states.png`, `crops/overflow-open.png`
- `crops/drawer-avatar.png`: drawer in light 1440 and dark 390, avatar menu in light 390, anonymous drawer in dark 390
- `crops/page-tops.png`: actions, repo settings (dark), tree, org, admin (dark), user settings
- `crops/page-tops2.png`: PR (dark), anonymous explore, profile, footer with pagination
