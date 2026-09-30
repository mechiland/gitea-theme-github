# Critique: navigation, wave L1, round 3

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Build revision `1bd1fd49f0`. The served CSS was byte-identical to dist for all 3 themes (sha256 of dist vs `http://localhost:3000/assets/css/theme-github-*.css`), so no deploy was needed.

**Score: 8.6 / 10. Pass.** Round 2 was 8.4.
- The score is at least 8.5.
- There are 0 unexpected console errors. The 4 raw entries are all the not-found route's own expected main-document 404.
- Lint: 0 literal colours.
- The smoke test is green.

- Lint (navigation): 0 errors, 0 warnings, 217 selectors.
- Build: `folders["navigation"].status = "ok"`, 11 files, 50,582 B source. The whole build is still over budget: light 333.7, dark 335.0, auto 339.0 KB against 300 KB. This is shared, not this folder.
- Smoke test (`shots/critic-navigation-wL1-r3-smoke.log`): green, 12 of 12 steps ok, 0 console errors.
- Capture `shots/critic-navigation-wL1-r3/` covers 27 routes × light/dark × 1440/390 with `--states --measure`, 108 pages:
  - 0 off-palette colours;
  - 0 unresolved variables;
  - no horizontal overflow on any page;
  - max CLS 0.0012.
- Non-Octicon icons: `fontawesome-openid` (login and signup, owned by pages/auth) and `gitea-running` (actions list, owned by pages/actions). Neither belongs to navigation.
- Failed states are only the known ones:
  - `create-menu-open` at 390, because "+" is hidden below 768px by design;
  - `crumb-hover` on home, because the Dashboard crumb is not a link.

## Runs and probes

- Routes: `shots/critic-navigation-wL1-r3-routes.json`, the round-2 set plus `overflow-open` at 390 on repo-settings, repo-issues and repo-home.
- Geometry probe `shots/critic-navigation-wL1-r3-probe.mjs` (output in `-probe.json`):
  - repo overview, PR, repo settings, org, profile and explore;
  - light at 1440, 1280, 1024, 800 and 390; dark at 1440 and 390;
  - popup geometry and row hover, light and dark.
- Mid-width screenshots `shots/critic-navigation-wL1-r3/mid/`: repo, org and profile at 1024 and 800, light and dark. The builder did not shoot this range.
- Overflow probes `shots/critic-navigation-wL1-r3-ovf*.mjs`: explore at 1280 and 1024.
- Reference: `docs/reference/critic-nav-wl1-*` (logged-out github.com, same day). The AppHeader values come from github.com's live `.AppHeader*` CSS, read in round 2.

## Builder's claims, verified

1. **Overflow popup (round-2 major): fixed.**
   - In light and dark, on repo-pull and repo-settings at 390, the rows are 176×32 at x=190 in a 192px popup at x=182. They have padding 6px 8px, margin 0 8px, radius 6 and 14px/20px text.
   - Popup: radius 12, padding 8px 0, `--overlay-bgColor` (light #fff, dark #010409 per Primer dark), `--shadow-floating-small`.
   - Hover: light rgba(129,139,152,.10), dark rgba(101,108,118,.20).
   - Selected (Settings on repo settings): background rgba(129,139,152,.15) in light and rgba(101,108,118,.20) in dark, weight 600, icon `--fgColor-default`. The ::after is 4×24 at left −8, radius 6, rgb(9,105,218) in light and rgb(31,111,235) in dark.
   - The 2px tab underline no longer shows inside the popup.
   - Screenshots:
     - `repo-settings/states/{light,dark}-390-overflow-open.png`;
     - `repo-pull/states/dark-390-overflow-open-clip.png`.
2. **Tabs at 390 (round-2 minor 6): fixed.**
   - The repo bar shows Code, Issues 8 and Pull Requests 12. The last tab ends at x=315 and "…" sits at x=342.
   - The current PR tab is now visible with its underline (`crops/repo-pull-light-390-top.png`).
   - Explore keeps its icons at 390; its 3 tabs fit, ending at x=372.
3. **Overview title row (round-2 minor 3): fixed, in the signed-in style.**
   - The row shows only "grex": 20px, weight 600, `--fgColor-default` (light rgb(31,35,40), dark rgb(240,246,252)).
   - The owner link is display:none. The "/" is sized away with `font-size:0` on the tw-text-18 wrapper, which holds only the two links and the slash. The Public label and the header's other children are unaffected.
   - The 16px muted repo octicon stays.
   - Screenshots: `crops/repo-home-light-1440-top.png` and `crops/repo-home-dark-390-top.png`.
4. **Org and profile tabs in the local bar: not done.** NAV-P1 is filed with pages/people and the state is unchanged (`crops/org-home-light-1440-top.png`, `crops/user-profile-light-1440-top.png`). It is still listed as issue 2 below.

## Issues (most important first)

1. **Minor: org and profile tabs overflow into "…" while they still show their icons, between 768 and about 1100px.**
   - Where:
     - `/octo-org` at 1024 light: Settings goes into "…".
     - `/octo-org` at 800 dark: Teams, Worktime and Settings go into "…".
     - `/alice-dev` at 1024 light: Public Activity and Starred Repositories go into "…". This leaves a gap of about 140px between Packages (right edge about 821) and "…" (x=960).
     - `/alice-dev` at 800: Packages, Public Activity and Starred Repositories go into "…".
   - In all four cases the tab icons stay `display:block`.
   - Evidence:
     - `shots/critic-navigation-wL1-r3/mid/org-home-dark-800.png`;
     - `shots/critic-navigation-wL1-r3/mid/user-profile-light-1024.png`;
     - probe keys `light-1024-/octo-org`, `light-800-/alice-dev`.
   - Expected: Primer UnderlineNav drops the leading icons before it moves any tab into the overflow menu. That is the builder's own rule for the repo bar.
   - Cause: the profile/org icon rule `:is(.user.profile,.organization) overflow-menu … > .svg {display:none}` starts only below 768px. The repo bar uses 1200px and is fine: at 1024 all 10 repo tabs fit without icons, and the last one ends at x=888.
   - Fix: raise the org/profile breakpoint (org 8 tabs with icons is about 1060px wide; profile 6 tabs about 1260px from x=432). Or use one width that matches each row's content column.
2. **Minor (shared with pages/people, NAV-P1 pending): org and profile tabs are not in the AppHeader local bar.**
   - Signed-in github.com puts them directly under the global bar, as ours does for repos.
   - Ours:
     - the org page shows header, then the org band, then the tabs;
     - the profile page puts its tabs in the right column beside a 64px empty band.
   - Evidence: `crops/org-home-light-1440-top.png`, `crops/user-profile-light-1440-top.png`.
3. **Minor (template, integrator NAV-I4 pending): the AppHeader crumb reads "Dashboard" on /-/admin and "Profile" on /user/settings.** This is unchanged since round 2.
4. **Minor: FG-050 is still open.** The settings and admin NavLists have no leading Octicons (for example the repo settings list in `repo-settings/states/light-390-overflow-open.png`). It is blocked on the budget (ORC-4 / NAV-I3).
5. **Nit: the selected row's 4px accent bar in the "…" popup sits flush against the popup's 1px ring (x=182–186).**
   - In a NavList the bar sits in an 8px gutter inside the pane, away from any border. Here it touches the overlay's rounded edge (`repo-settings/states/light-390-overflow-open.png`).
   - Primer's UnderlineNav swaps the current item out of the menu, so there is no exact precedent. Acceptable either way.
6. **Nit (template text): "Pull Requests" is capitalised; github.com has "Pull requests".** The search placeholder is "Search code…" / "Search repos…".
7. **Nit: the drawer close X has no hover background or focus ring** (masked summary::after). This is unchanged.
8. **Outside this folder, for the orchestrator: /explore/repos overflows horizontally between about 1060 and 1340px.**
   - scrollWidth is 1316 at 1280 and at 1024, both signed-in and anonymous.
   - Cause: pages/people makes `.explore` a grid (`calc(var(--pD)*2) minmax(0,1fr)`) with the container in column 2. foundation's `.ui.container { width: calc(var(--p7a) - 2*var(--page-margin-x)) }` keeps it at a fixed 1060px, so it starts at x=256 and ends at 1316.
   - Fix: `.explore > .ui.container { width: auto }` (pages/people).
   - The 1440/390 captures do not show it. Evidence: `shots/critic-navigation-wL1-r3-ovf.mjs` output.
9. **Shared: the build is over budget** (333.7 / 335.0 / 339.0 KB). Per the builder, the navigation layer grew 136 B this round.

## Measurements (light 1440 unless noted)

| control | property | ours | github | ok |
|---|---|---|---|---|
| AppHeader global bar | height / padding | 64 / 16 | 64 / 16 (live `.AppHeader-globalBar`) | yes |
| AppHeader IconButton | size / radius / border | 32×32 / 6 / 1px rgb(209,217,224) | 32×32 / 6 / 1px --borderColor-default | yes |
| AppHeader search | h / w / radius | 32 / 272 / 6 | 32 / ~272 / 6 | yes |
| AppHeader avatar | size | 32 | 32 | yes |
| UnderlineNav item | box / font / lh | 75.4×30, 14px 600, lh 30 | 75.4×30, 14px 600, lh 30 | yes |
| Counter in tab | h / pad / bg | 20 / 0 6 / rgba(129,139,152,.12) | 20 / 0 6 / rgba(129,139,152,.12) | yes |
| Public label | h / pad / lh / border | 20 / 0 6 / 18 / 1px rgb(209,217,224) | 20 / 0 6 / 18 / 1px rgb(209,217,224) | yes |
| Overflow popup row (390) | box / padding / margin / radius | 176×32 at x=190 / 6 8 / 0 8 / 6 | ActionList item 32 / 6 8 / inset 8 / 6 | yes |
| Overflow popup (390) | radius / padding / bg / shadow | 12 / 8 0 / #fff (dark #010409) / shadow-floating-small | Overlay 12 / 8 0 / --overlay-bgColor / floating-small | yes |
| Popup selected row | bg / weight / bar | rgba(129,139,152,.15) / 600 / 4×24 accent at −8 | --control-transparent-bgColor-selected / 600 / 4×24 accent | yes |
| Popup hover row | bg light / dark | rgba(129,139,152,.10) / rgba(101,108,118,.20) | --control-transparent-bgColor-hover | yes |
| Repo tabs visible at 390 | count before "…" | 3 (Code, Issues, Pull requests) | 3 | yes |
| Org tabs at 1024 / 800 | icons shown while overflowing | yes / yes | icons dropped first | no |
| Repo title row | font | 20px 600 --fgColor-default, repo name only | signed-in: 20px 600 default (logged-out ref: 20px 400 accent) | yes (unverified signed-in) |
| Footer | h / padding-top / font | 112 / 48 / 12px rgb(89,99,110) | 114 / 48 / 12px rgb(89,99,110) | yes |

## Screenshots reviewed

- `shots/critic-navigation-wL1-r3/repo-settings/states/light-390-overflow-open.png` and `dark-390-overflow-open.png`
- `shots/critic-navigation-wL1-r3/repo-settings/states/light-390-overflow-open-clip.png`
- `shots/critic-navigation-wL1-r3/repo-pull/states/dark-390-overflow-open-clip.png`
- `crops/repo-home-light-1440-top.png`, `crops/repo-home-dark-390-top.png`, `crops/repo-pull-light-390-top.png`
- `crops/org-home-light-1440-top.png`, `crops/user-profile-light-1440-top.png`, `crops/explore-repos-dark-390-top.png`
- `crops/states-sheet.png`: create menu, avatar menu (dark), IconButton focus, search focus (dark), tab focus, tab hover (dark)
- `home/states/dark-390-drawer-open.png`
- `mid/repo-home-light-1024.png`, `mid/org-home-dark-800.png`, `mid/user-profile-light-1024.png`
