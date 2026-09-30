# Critique: navigation, wave L1, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Build revision `c00b8655b1`. The served files were byte-identical to dist for all 3 themes (sha256 checked), so no deploy was needed.

**Score: 8.2 / 10. Not a pass: the score is below 8.5.**
- Lint (navigation): 0 errors, 0 warnings, 212 selectors.
- Build: `folders["navigation"].status = "ok"`.
- Smoke test: green, 13/13 steps (`shots/critic-navigation-wL1-r1-smoke.log`).
- Console errors: 0 unexpected. There were 4 in total, all the expected main-document 404 on not-found (one per scheme × viewport).
- Off-palette colours: 0. Unresolved variables: 0.
- Non-Octicon icons: only `fontawesome-openid` on login and signup. That is the OpenID sign-in button, which belongs to pages/auth, not this folder.
- Horizontal overflow: none on any of the 96 captures.

## Runs

- Ours: `shots/critic-navigation-wL1-r1/`. It covers 24 routes × light/dark × 1440/390, with `--states --measure`. The routes file is `shots/critic-navigation-wL1-r1-routes.json`: the builder's file plus labels, signup, notifications, repo-settings, the profile repositories tab and explore-users. Extra states: icon button press, hamburger hover and focus, logo hover, create hover, avatar focus, tab hover and focus, a 390 overflow menu, and NavList hover and focus. Crops and composites are in `crops/`.
- Probes:
  - `shots/critic-navigation-wL1-probe.mjs` (computed geometry)
  - `shots/critic-navigation-wL1-focus.mjs` (a real keyboard Tab walk)
  - `shots/critic-navigation-wL1-focus2.mjs` (@2x keyboard-focus crops)
  - `shots/critic-navigation-wL1-pseudo.mjs` (the "Public" ::before)
- Reference: `docs/reference/critic-nav-wl1-{repo-home,repo-pull,repo-commits,explore-repos,login}/`, logged out, with `--measure`. The routes file is `shots/critic-navigation-wL1-r1-ghroutes.json`.
- Header spec check: I downloaded github.com's live `global-54ba76e934a49d7c.css` and read the `.AppHeader*` rules myself. They are quoted below where relevant.
- Mishap (disclosed): my first run used the name `shots/critic-navigation-r1`, which already belonged to the wave-2 critic. Before I stopped it, it overwrote `shots/critic-navigation-r1-routes.json`, `shots/critic-navigation-r1.log` and part of `shots/critic-navigation-r1/login/` from that old round. No theme or source file was touched.
- Environment note: one capture (repo-pull-files, light, 390) first rendered with `data-theme=gitea-auto`, probably because another session's smoke test switched the theme at the same moment. I re-shot it and it was clean. The admin theme is `github-auto` now.

## What is right (verified)

- **AppHeader geometry matches github.com's live CSS.** Bar 64px, padding 16, gap 12, --bgColor-inset, inset -1px --borderColor-default. The IconButtons are 32×32, 1px --button-default-borderColor-rest, radius 6, --fgColor-muted. The create button is 50×32 with padding 0 4 0 8. The divider is 1×20 with 4px margins. Logo 32px, round hover. Avatar 32px on --bgColor-neutral-muted. Crumbs are 28px tall, padding 4/6, 14/20; the last one is semibold and the "/" is muted.
- **Hover and pressed colours are exact.** Hover: light (234,236,239) = #818b98 at 10% on #f6f8fa. Pressed: (228,232,235) = 15%. Dark hover: (20,25,31) on #010409.
- **Keyboard focus rings work** on the hamburger, logo, crumbs, search (offset −1), create, Issues, PRs and bell: 2px --focus-outlineColor, offset −2px. The exception is the avatar (issue 1).
- **Drawer:** left sheet, 12px right corners, backdrop, close X, NavList rows with the 4px accent bar. It looks right in light and dark at both widths. Page scroll is locked.
- **Anonymous header:** "Sign In" as an invisible button, then "Register" as a default button, both 32px.
- **Repo band and UnderlineNav** match the logged-out reference exactly. UnderlineNav item: 75.4×30, padding 0 8, radius 6, 14px 600, line-height 30, nav 48px. Band: 110px on #f6f8fa, padding-top 16. "Public" label: 20px, 12px 500 muted, 1px --borderColor-default, pill.
- **Pagination** matches github's `prc-Pagination` exactly: 32px tall, padding 8/6, radius 6, 14px, line-height 14, disabled #818b98.
- **Footer:** 12/18 muted, padding-top 48. The server-timing text is gone, the Version item is last, and the logo and "Powered by Gitea" stay.
- **FG-115:** the Issues tab is selected on the labels and milestones pages.
- **FG-117:** closed groups show a chevron-down, the open group a chevron-up.
- **FG-042:** repo actions read Watch, Fork, Star, then RSS, and Settings follows the other tabs.
- **FG-030:** the dashboard context-bar rule and the org band rule are both present.
- **PR TabNav** at 1440 is right.

## Issues (most important first)

1. **Major (a11y): the avatar menu trigger has no visible keyboard focus.**
   - Where: every signed-in page. Seen on `/octo-org/grex`, 1440, light and dark.
   - Measured: the Tab walk reaches `div.gh-app-header-avatar`, which matches `:focus-visible` with `outline: 2px solid rgb(9,105,218)`, offset −2px. The outline is drawn inside the 32px circle, under the `<img>`, so nothing shows.
   - Evidence: `crops/kbd-focus.png`, rows 1 and 3 (avatar) against rows 2 and 4 (bell with its ring). Also `home/states/*-1440-avatar-focus-clip.png`.
   - Expected: github draws a visible ring around the avatar button.
   - Fix: use a positive outline offset on `.gh-app-header-avatar:focus-visible`, or put a ring box-shadow on the img.
   - Also: keyboard focus opens the Fomantic menu. That is Gitea behaviour and out of CSS scope.

2. **Major: FG-029 made narrow repo pages lose their current-section cue.**
   - Where: `/octo-org/grex/pulls/42` at 390, light and dark. The same happens on every repo tab past "Issues".
   - Measured: overflow-menu.ts moves the selected "Pull Requests" tab into the "…" popup. The new rule `overflow-menu.ui.secondary.pointing.menu .overflow-menu-button.active` removes the underline Gitea drew on the trigger. The visible tab row (Code, Issues, …) then marks nothing as current.
   - Evidence: `crops/repo-pull-light-390-top.png`.
   - Expected: github never hides the selected UnderlineNav item; it swaps it into the visible row. The CSS cannot swap it, so keeping the trigger's selected underline was the more faithful choice.
   - Recommendation: revert that part of FG-029, or mark the trigger as selected: a semibold kebab plus the 2px --underlineNav-borderColor-active bar.

3. **Major (structural, needs a decision): signed-in header on top of the logged-out repo layout.**
   - Where: `/octo-org/grex` at 1440, light.
   - Measured: the header (64px, --bgColor-inset) is followed by the repo band (110px, --bgColor-muted, the same #f6f8fa). It contains the title "octo-org / grex Public" plus Watch, Fork and Star, then the UnderlineNav, making a 174px grey block. The crumbs already say "octo-org / grex", so the owner/repo appears twice within 100px.
   - Expected: github.com's signed-in AppHeader carries the repo UnderlineNav in its local bar (`.AppHeader .AppHeader-localBar{padding:0 var(--base-size-16)}` is in the live CSS I downloaded). The title row sits below the header on --bgColor-default.
   - Evidence: `crops/repo-home-light-1440-top.png` against `crops/ref-repo-home-light-1440-top.png`.
   - Caveat: I could not screenshot signed-in github.com, so this rests on the live CSS and known GitHub behaviour, not a side-by-side.
   - Feasibility: CSS can do it. `.secondary-nav` has two `.ui.container` children (repo/header.tmpl lines 3 and 82), so a flex column with `order`, and the band background limited to the tab container, would reproduce github's order.

4. **Major (shared): the build is over budget.**
   - Measured: `npm run build` prints `✗ OVER BUDGET`: auto 333.2 KB, light 327.9 KB, dark 329.2 KB, against a 300 KB limit (ARCHITECTURE §10).
   - Navigation's part: its layer grew about 3.3 KB this round, and it is now 47.8 KB of source.
   - Owner: mostly the integrator, but the folder should not grow further.

5. **Minor: the "+" button stays visible below 768px.**
   - Where: 390 px, all signed-in pages.
   - Expected: github's CSS has `@media (width<=767.98px){.AppHeader .AppHeader-globalBar .AppHeader-actions{display:none}}`. The actions group (create, Issues, PRs and the divider) hides as a whole; only search, bell and avatar stay.
   - Measured: ours shows "+" as a 32px icon button at x=262. Evidence: `crops/repo-home-light-390-top.png`.

6. **Minor: the narrow context crumbs differ from github.**
   - Expected: below 768px github hides `.AppHeader-context-full` and shows the compact single crumb (the repo name).
   - Measured: ours shows "octo-o… / grex" at 390. Evidence: `crops/repo-home-light-390-top.png`.

7. **Minor (template, integrator): the header crumb text is misleading on some pages.**
   - On `/-/admin` the crumb reads "Dashboard", the same as the real dashboard. On `/user/settings` it reads "Profile".
   - Evidence: `site-admin/light-1440.png` and `crops/mix-tops.png`.
   - This comes from template `.Title` data. Admin pages need an explicit label, for example the locale key `admin_panel`.

8. **Minor: FG-050 (leading Octicons in settings and admin NavLists) is still open.** Evidence: `crops/tab-navlist-states.png`.

9. **Nit: search placeholder.** github's is invisible until focus and shows "Type / to search" with a kbd hint. Ours always shows "Search code…" / "Search repos…". The width of 272px sits inside github's 12–24rem range.

10. **Nit: "Public" label padding.** It is 0 7px; github measures 0 6px (49.6px wide on github.com).

11. **Nit: the drawer close X** has no hover background, and there is no Overlay close-button focus target. The whole summary is the control.

## Measurements (light 1440 unless noted)

| control | property | ours | github | ok |
|---|---|---|---|---|
| AppHeader bar | height / padding / gap | 64 / 16 / 12 | 64 / 16 / 12 (live CSS) | yes |
| AppHeader bar | bg / rule | #f6f8fa / inset −1px #d1d9e0 | --bgColor-inset / inset −1px --borderColor-default | yes |
| IconButton | size, border, radius | 32×32, 1px #d1d9e0, 6 | 32×32, 1px --button-default-borderColor-rest, 6 | yes |
| IconButton | hover / pressed bg | rgb(234,236,239) / rgb(228,232,235) | 10% / 15% --control-transparent | yes |
| IconButton | focus ring | 2px #0969da, offset −2 | --focus-outline | yes |
| Avatar button | focus ring | not visible (under img) | visible ring | no |
| Create "+▾" | size / padding | 50×32 / 0 4 0 8 | auto×32 / 0 4 0 8 | yes |
| Crumb | height / padding / font | 28 / 4 6 / 14/20, last 600 | 4 6 / 14/20, last semibold | yes |
| Divider | size / margin | 1×20 / 0 4 | 1×20 / 4 | yes |
| Unread dot | size / pos | 8px + 2px ring, centre (1381,19) | 8px, top/right −2px, centre (1382,18) | yes |
| Search | size | 272×32, pad-left 31 | 12–24rem ×32, pad-inline 31 | yes |
| "+" at 390 | display | visible | hidden (<768) | no |
| UnderlineNav item | box / pad / radius | 75.4×30 / 0 8 / 6 | 75.4×30 / 0 8 / 6 | yes |
| UnderlineNav item | font | 14px 600, lh 30 | 14px 600, lh 30 | yes |
| UnderlineNav | height | 48 | 48 | yes |
| Repo band | height / padding-top / bg | 110 / 16 / #f6f8fa | 110 / 16 / #f6f8fa | yes |
| Repo title | font | 20px / 30px | 20px / 30px | yes |
| Public label | h / pad / font | 20 / 0 7 / 12px 500 | 20 / 0 6 / 12px 500 | partly |
| Pagination item | h / pad / radius / font | 32 / 8 6 / 6 / 14, lh 14 | 32 / 8 6 / 6 / 14, lh 14 | yes |
| Footer | pad-top / font | 48 / 12px 18px muted | 48 / 12px 18px muted | yes |
| PR TabNav tab | pad / radius / lh | 8 12 / 6 6 0 0 / 23 | 8 12 / 6 6 0 0 / 23 (builder's github measurement; my .tabnav-tab selector matched nothing on the logged-out page) | not verified |

## Screenshots reviewed

- `crops/repo-home-{light,dark}-1440-top.png`, `crops/home-light-1440-top.png`, `crops/repo-home-light-390-top.png`, `crops/repo-pull-light-390-top.png`
- `home/states/light-1440-drawer-open.png`, `home/states/dark-390-drawer-open.png`, `home/states/light-1440-avatar-focus.png`
- `crops/home-{light,dark}-header-states.png`, `crops/kbd-focus.png`, `crops/390-menus.png`
- `crops/repo-home-light-{1440,390}-bottom.png`, `crops/repo-commits-light-390-bottom.png`, `crops/repo-commits-dark-1440-bottom.png`
- `crops/repo-pull-light-1440-tabs.png`, `crops/repo-pull-light-390-tabs.png`
- `site-admin/light-1440.png`, `crops/mix-tops.png`, `crops/tab-navlist-states.png`
- Reference: `crops/ref-repo-home-light-1440-top.png`
