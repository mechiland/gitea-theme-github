# Critique: navigation, wave L2, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. My build was revision `f8a759f325`; at that point dist and the served files had the same sha256 for all 3 themes, so I did not deploy. Other folders deployed during my capture (served revision later `4ec6ea91fe`, then `b0b91315a8`). The `src/navigation/*` files were last modified at 16:42, before my 16:49 build, so the navigation layer I reviewed is the builder's final state.

**Score: 8.4 / 10. Not a pass.** The previous round (wL1-r3) scored 8.6.

This round clearly improves the settings/admin NavList, the footer and the anonymous header. It fails because the FG2-020 `order` hack and the FG2-050 scroll row each cause a new visible defect (issues 1 and 2 below). Both are narrow-viewport bugs, and each fix is a few lines.

Gate checks:
- Lint (navigation): 0 errors, 0 warnings, 237 selectors. No literal colours.
- Build: `folders["navigation"].status = "ok"`, 11 files, 57,477 B source. The whole build is over budget (auto 320.4 KB, light 315.3 KB, dark 316.4 KB at my build). That is shared, not this folder alone.
- Smoke test: green. All steps passed, `consoleErrors: []` (`shots/critic-navigation-wL2-r1-smoke.log`).
- Capture: `shots/critic-navigation-wL2-r1/`, 24 routes × light/dark × 1440/390, with `--states --measure`, 96 pages:
  - 0 off-palette colours after a re-shoot (explained below);
  - 0 unresolved live variables;
  - 0 failed states;
  - no horizontal overflow on any page.
- Console errors, 5 raw entries, none caused by this folder:
  - 4 are the expected main-document 404 of `not-found-anon`.
  - 1 was `ERR_CONTENT_LENGTH_MISMATCH` on the theme CSS for `site-admin/dark-390`. Another folder deployed while the page loaded. I re-shot `site-admin`: 0 errors, 0 off-palette.
- Non-Octicon icons: only the `gitea-*` webhook-type icons on repo-settings-hooks and the package-type icon. These belong to pages, not navigation.
- CLS: admin-repos 0.2482 and site-admin-users 0.0612 (light) / 0.091 (dark), both at 390.
  - I bisected by serving the build without one layer (`shots/critic-navigation-wL2-r1-cls.mjs`):
    - without the navigation layer: still 0.2258 / 0.0555;
    - without pages/settings-admin: 0 / 0.0004.
  - The shift comes from pages/settings-admin, not navigation. The builder's attribution is correct.

## Probes

- `shots/critic-navigation-wL2-r1-probe.mjs` → `-probe.json`:
  - anonymous header at 390, 360 and 320;
  - NavList geometry and each item's `::before` mask;
  - UnderlineNav visible order and popup at 390, 600 and 1440 over 17 pages;
  - PR TabNav scroll state at 390 and 600;
  - footer and pagination at 1440, 1011 and 390.
- `shots/critic-navigation-wL2-r1-600.mjs`: PR tab rows at 600px.
- `shots/critic-navigation-wL2-r1-order.mjs`: the order-rule regression test.
- `shots/critic-navigation-wL2-r1-cls.mjs`: the CLS bisect.
- References: `docs/reference/critic-nav-wl2-*`, logged-out github.com, captured today (repo-pull, repo-pull-files, repo-issues, not-found, user-profile-stars-tab, issues-list-closed, org-home).

## Builder's claims, verified

- **FG2-054 anonymous header: fixed.**
  - `/this-page-does-not-exist-theme-seed` in light and dark:

    | width | scrollWidth | crumb | Register ends at |
    |---|---|---|---|
    | 390 | 390 | 74px "Page N…" (ellipsis) | x=374 |
    | 360 | 360 | 44px | — |
    | 320 | 320 | 28px | — |

  - The claim about /user/forgot_password is moot: auth pages have no AppHeader at all (`crops/forgot-light-390-top.png`). The page is still 390 wide.
- **FG2-014 NavList: fixed, and it looks right.**
  - The top heading is `display:none` in all four sidebars.
  - Every top-level item and group summary has a 16px mask icon in `--fgColor-muted` (light rgb(89,99,110)). The label starts at x=144 with the item at x=112, i.e. 8px padding + 16px icon + 8px gap.
  - Sub-item labels also start at x=144, so they line up with the parent label.
  - Every mapped glyph is served with status 200: 22 of 22 `/assets/img/svg/octicon-*.svg` files checked.
  - No item was left without an icon.
  - The collapsed group that holds the current page keeps its 4px accent bar via `details::before` (`admin-monitor-stats/states/*-group-collapse-clip.png`).
  - Hover, focus (2px accent ring) and press are correct in light and dark (`crops/navlist-states.png`).
- **FG2-028 footer: fixed.**
  - 1440: top rule 1px `rgba(209,217,224,.7)` light / `rgba(61,68,77,.7)` dark (`--borderColor-muted`), padding 16px, 12px/18px muted text. One centred row: 24px logo, "Powered by Gitea", then the links 16px apart.
  - Below 1012: column-reverse with an 8px gap.
  - Version and timing spans: `display:none`. The version still shows on /-/admin/config.
  - The 390 layout matches github.com's 390 footer (`crops/gh-footer-light-390.png` against `home/states/light-390-footer-link-hover-clip.png`).
- **FG2-089 feed pagination: fixed.** The dashboard's "1" is a 32×32 pill, radius 6, `rgb(9,105,218)` light / `rgb(31,111,235)` dark, white text.
- **FG2-050 PR tabs at 390: fixed at 390, but it regresses at 544–767 (issue 2).**
  - 390 /pulls/42/files: Files Changed at x 112.6–254 inside 16–374, counter fully visible. Icons are hidden below 544. The fade and 24px end padding are present.
  - The editor Write/Preview tabs are not affected (`issue-new-playground/states/light-390-preview-tab-clip.png`).
- **FG2-020 UnderlineNav at 390: the current tab is now visible on all 12 repo, org, profile and package pages I probed, but it regresses explore (issue 1).**
  - Settings → Code, Settings, Issues 8, "…".
  - Actions, Wiki and Packages → Code, <current>, Issues, "…".
  - Stars → Overview, Starred Repositories 2, "…".

## Issues (most important first)

1. **Major (regression from the FG2-020 `order` rule): /explore/organizations at 390 puts "Users" into "…", and the "…" button touches the viewport edge.**
   - The same three tabs fit on /explore/repos and /explore/users (Repositories 18–143, Users 151–230, Organizations 238–372, no "…").
   - On /explore/organizations: Repositories 42–166, Organizations 174–308, "…" at x 358–390 (0px gutter instead of 16). The popup contains only "Users". Seen in light and dark.
   - Cause: the rule reorders the tabs even when all of them fit. `overflow-menu.ts` then treats the reordered row as overflowing.
   - Proof: with `order` neutralised, the page shows all 3 tabs at 18–372 and no button (`shots/critic-navigation-wL2-r1-order.mjs`).
   - Evidence: `crops/explore-orgs-light-390-top.png`; probe keys `tabs-light-390-/explore/organizations` and `tabs-dark-390-…`.
   - Fix: scope the rule to the bars that really overflow at <768, i.e. `.secondary-nav` (repo) and the org/profile bars. Leave explore alone.
2. **Minor-major (regression from FG2-050): between 544 and 767px the PR tab row scrolls even though every tab fits, which cuts off the first tab.**
   - At 600px the three tabs end at x=471 inside a 16–584 row. The 24px end padding plus the diff stat make scrollWidth 575 against clientWidth 568 (609 against 568 on playground PR 16).
   - `scroll-initial-target` then scrolls by 7px or 41px:
     - grex /pulls/42/commits and /files: "Conversation" starts at x=9;
     - playground /pulls/16/files: it reads "onversation" and starts at x=−25.
   - There is no left fade. Seen in light and dark (`crops/prtabs-600.png`).
   - At 390 on /files the row also scrolls Conversation fully out of view with no left affordance. github.com at 390 leaves the row at its start (`crops/gh-pullfiles-light-390-top.png`). The gate asked for the selected tab to be visible, so that part is acceptable.
   - Fix: apply `scroll-initial-target` only below 544 (where the row really overflows). Or drop the end padding when the row fits.
3. **Minor: below 768 the current tab is always moved to second place, even when nothing overflows.**
   - 600px: explore → Repositories, Organizations, Users; `/alice-dev?tab=stars` → Overview, Starred Repositories, Repositories 1, "…".
   - 390 repo settings reads Code, Settings, Issues 8. Primer React swaps the selected item into the last visible slot, which keeps the order Code, Issues, Settings.
   - The builder acknowledged this. It is the root cause of issue 1.
4. **Minor (pre-existing): pagination below 768 hides the page numbers.**
   - github.com at 390 shows "Previous 1 2 3 Next" (`crops/gh-footer-light-390.png`).
   - Ours shows "First Previous 1 Next Last", with 2 and 3 set to `display:none` (probe `footer-light-390-/octo-org/grex/issues?state=closed`).
5. **Nit: a focused Previous/Next pagination link turns `--fgColor-default`** (the `a.item[href]:focus` rule beats `.navigation`). Hover keeps it accent. Evidence: `home/states/{light,dark}-1440-pagination-focus-clip.png`, where "Next" is black/white.
6. **Nit: the anonymous "Register" button underlines its text on hover**, in light and dark (`not-found-anon/states/light-1440-signup-hover-clip.png`, `dark-390-signup-hover-clip.png`). Primer buttons never underline. `.gh-app-header-signup:hover` needs `text-decoration: none`.
7. **Nit / FYI: the NavList icons rely on relative `url("../img/svg/octicon-*.svg")` masks (NAV-I6).**
   - All 22 URLs resolve on this server.
   - The approach breaks if the theme is ever inlined, or served from another path or CDN prefix. That is the integrator's call.
8. **Not done (acknowledged):**
   - FG2-088: org tabs are not flush-left.
   - FG2-092: search placeholder and admin shield.
   - Org/profile tabs are not in the local bar (NAV-P1).
9. **Shared: the build is over budget.** At my build, auto was 320.4 KB against the 300 KB limit and the 295 KB gate. Navigation grew by about 2.5 KB this round.

## Measurements

| control | property | ours | github | ok |
|---|---|---|---|---|
| UnderlineNav item (repo-issues 1440) | box / colour | 75.4×30, rgb(31,35,40) | 75.4×30, rgb(31,35,40) | yes |
| UnderlineNav item (repo-pull 390) | box | 75.4×30 | 75.4×30 | yes |
| Counter in tab | height | 20 | 20 | yes |
| AppHeader (390) | height | 64 | 64 | yes |
| Anonymous header 390 | scrollWidth / Register right | 390 / 374 | 390 / — | yes |
| NavList item | height / padding / radius | 32 / 6px 8px / 6 | 32 / 6px 8px / 6 (Primer NavList) | yes |
| NavList leading icon | size / gap / colour | 16 / 8 / rgb(89,99,110) | 16 / 8 / --fgColor-muted | yes |
| NavList sub-item | label x relative to parent label | 144 = 144 | aligned to parent label | yes |
| NavList selected | bg / weight / bar | rgba(129,139,152,.15) / 600 / 4px accent | selected bg / 600 / 4px accent | yes |
| Footer (1440) | border-top / padding / font | 1px rgba(209,217,224,.7) / 16 / 12px/18px | 1px --borderColor-muted / 16 / 12px | yes |
| Footer (390) | layout | links above the logo row, 8px gap | links above the mark row | yes |
| Pagination current (feed) | size / radius / bg | 32×32 / 6 / rgb(9,105,218) | 32×32 / 6 / --bgColor-accent-emphasis | yes |
| PR TabNav tab (390) | height / padding | 40 / 8px 12px | 40 / 8px 12px | yes |
| PR TabNav at 600 | first tab clipped | yes (x=9 / x=−25) | no | no |
| Explore tabs /explore/organizations 390 | visible tabs / "…" right edge | 2 / 390 | 3 / no "…" (our own /explore/repos) | no |

## Screenshots reviewed

- `crops/nf-anon-light-390-top.png`, `crops/forgot-light-390-top.png`, `crops/gh-pull-light-390-top.png`, `crops/gh-pullfiles-light-390-top.png`
- `crops/pullfiles-light-390-top.png`, `crops/explore-orgs-light-390-top.png`, `crops/stars-light-390-top.png`, `crops/gh-stars-light-390-top.png`
- `crops/user-settings-light-1440-top.png`, `crops/site-admin-dark-1440-top.png`, `crops/repo-settings-light-390-top.png`
- `admin-monitor-stats/states/light-1440-group-collapse-clip.png`, `admin-monitor-stats/states/dark-390-group-collapse-clip.png`
- `crops/navlist-states.png`, `crops/home-states.png`, `crops/gh-footer-light-390.png`, `crops/prtabs-600.png`, `crops/anon-states.png`
- `not-found-anon/states/light-1440-signup-hover-clip.png`
