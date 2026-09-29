# Critique: navigation, wave 2, round 2

Critic: independent design-systems review. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score 8.5 / 10. PASS.** All four gates are met:

- 0 lint errors.
- 0 unexpected console errors. The raw count is 4, all the expected main-document 404 on `not-found`.
- 0 literal or off-palette colours attributable to navigation.
- Smoke test green, 13/13 steps.

I re-verified all 11 of round 1's items myself, with my own probes, screenshots and pixel samples. All are fixed as claimed. The logged-out mobile header, which was the one major issue, is now correct in both schemes.

What still separates this from github.com:

- One new minor: the Releases / Tags switcher is styled as state links, where GitHub uses a segmented subnav.
- A handful of nits.
- The already-accepted structural gaps: text links in the header, no search input, and First/Last in pagination.

## How I verified

- **Lint.** `node build/lint.mjs navigation`: 0 errors, 0 warnings, 191 selectors.
- **Build.** `npm run build`: `folders.navigation = {status: ok, lintErrors: 0, files: 10, bytes: 41327}`, revision 65b6a9d6cb.
- **Deploy check.** Served files equal dist (sha256 prefixes: auto b97263d2, light f49337ba, dark ce99830c). I did not redeploy.
- **Screenshots.** `shots/critic-navigation-r2`: 25 routes, light and dark, 1440 and 390, `--states --measure`, 100 pages.
  - Routes file: `shots/critic-navigation-r2-routes.json`. It is round 1's file plus a `mobile-menu-open` state on `login`.
  - Crops: `shots/critic-navigation-r2/crops/`.
- **Audit.** 0 pages with problems, 0 failed requests, 0 unresolved vars, 0 pages with unlayered Gitea CSS. maxCLS 0.3745 (home 390), the same as round 1.
  - Off-palette: `.ui.dropzone` border rgba(0,0,0,.8) on repo-pull (forms/editor, not navigation).
  - Non-Octicon icons: colorblind icons on the appearance page and fontawesome-openid on login (not navigation).
- **Reference.** github.com captures from round 1 (`shots/critic-navigation-r1-ref`, one day old) and `docs/reference/releases`, `docs/reference/labels`.
- **DOM probes.** `shots/critic-navigation-probe3.mjs` (generic Gitea probe: path, auth, viewport, scheme, pre-click, script).
- **Smoke.** `node tools/shoot/smoke.mjs --theme github-auto`: 13/13 ok, 0 console errors (`shots/critic-navigation-r2-smoke.log`).
  - An earlier smoke run that I started in parallel with the shoot was stopped at step merge-pr, before any theme switch. It left PR #65 open in octo-org/theme-playground. I checked the admin theme afterwards: still github-auto.

## Round-1 items re-checked

| # | Item | Result |
|---|---|---|
| 1 | Logged-out mobile header | Fixed (details below) |
| 2 | Line-height token | Fixed |
| 3 | PR TabNav | Fixed |
| 4 | Footer | Fixed |
| 5 | Dark repo band | Fixed |
| 6 | Mobile bell inset | Fixed |
| 7 | NavList rows | Fixed |
| 8 | Pagination | Fixed |
| 9 | Mobile overflow "…" | Fixed |
| 10 | Breadcrumb separators | Fixed |
| 11 | Open/Closed state links | Fixed |

1. **Logged-out mobile header.** Evidence: `crops/mobile-closed.png`, `crops/mobile-open.png`, `repo-home-anon/states/light-390-mobile-menu-open.png`, `login/states/dark-390-mobile-menu-open*.png`.
   - Signed out, closed: toggle at x=16 and logo at x=56.
   - Signed out, open: the toggle stays at 16. Explore, Help, Register and Sign In all start at x=16, 358×32.
   - Signed in, open: all six rows are 32px, including the avatar row.
2. **Line-height token.**
   - Footer 12/18. NavList group heading 12/18 in a 30px row (6+18+6).
   - Repo tab counter and PR tab counter now measure **18px** line-height. The builder's known gap says 12px; that is no longer true in the current build.
3. **PR TabNav.** repo-pull 1440 measures 40px tall, padding 8px 12px, gap 8px. Unselected text is rgb(31,35,40), icons rgb(89,99,110). Evidence: `crops/pull-sbs.png`, `crops/tabnav-states.png`.
4. **Footer.** 112px tall, padding 48/16/40, border-top 0, 12/18 muted. The side-by-side with github in both schemes (`crops/footers-sbs.png`) is near-identical.
5. **Dark repo band.** Pixel samples at x=1300 in dark: header rgb(1,4,9), rule rgb(61,68,77) at y=63, band rgb(13,17,23). This matches github's rgb(13,17,23). Light is unchanged (246,248,250). Evidence: `crops/repo-top-sbs.png`.
   - I also checked home and explore-repos in dark, which the builder had not screenshotted (`crops/dash-explore-top.png`). Both bars are now #0d1117, the same as the body, with only the header rule above them.
   - Explore keeps its UnderlineNav bottom rule, so it reads fine.
   - The dashboard "admin ▾" context strip is visually part of the page in dark and a grey strip in light. Acceptable.
6. **Mobile bell inset.** The bell spans x=342–374, which is 16px from the right edge.
7. **NavList rows.** Items, summaries and sub-items are 32px (6+20+6). Evidence: `crops/navlists.png`, `crops/navlist-states.png` (hover, focus, press, summary hover).
8. **Pagination.** Previous 85.5×32 (github 85.5×32), Next 60×32 (github 60×32), padding 8px 6px, gap 4px, chevron margin 0. `.page.buttons` has margin-top 20px and padding 0. Evidence: `crops/pagination.png`.
9. **Mobile overflow "…".** Now a 32px bordered IconButton, matching github's UnderlineNav overflow. Evidence: `crops/overflow-390.png`.
10. **Breadcrumb separators.** "/" has 4px padding plus a 2px gap. Evidence: `crops/breadcrumb.png`.
11. **Open/Closed state links.** 30px tall, padding 0 8px. Selected is 600 in the default colour, the other muted.

## Issues (most important first)

### 1. MINOR (new): Releases / Tags switcher is styled as state links, not GitHub's segmented subnav

Route: releases (also tags, and the same markup on labels/milestones via `.issue-list-navbar`, and the org team navbar). Both schemes, 1440.

- **Evidence.** `crops/rel-tabs.png` vs `crops/ref-rel.png` (github.com/pemistahl/grex/releases).
- **Measured.** Ours: `h2.ui.compact.small.menu.small-menu-items` items are borderless text links.
  - "16 Releases": 96×30, 600, rgb(31,35,40).
  - "16 Tags": 400, muted.
- **Expected.** github.com shows a joined, bordered two-button group, Primer `subnav-item` (`@primer/css/navigation/subnav.scss`):
  - Padding 5px 16px, line-height 20px, 1px `--control-borderColor-rest`, so 32px tall; items overlap by -1px; outer radius 6px.
  - All items are semibold in `--fgColor-default`; hover is `--bgColor-muted`.
  - Selected item: `--bgColor-accent-emphasis` background, `--fgColor-onEmphasis` text, `--borderColor-accent-emphasis` border.
- **Cause.** `tabnav.css` (`.small-menu-items.ui.compact.menu …`) treats every `.small-menu-items` as the issue-list Open/Closed state switcher. Gitea's markup separates them:
  - State toggles are `div.small-menu-items.tiny` (repo/issue/openclose.tmpl, dashboard issues/milestones, projects list).
  - Section switchers are `h2.small-menu-items.small` (release_tag_header.tmpl, repo/issue/navbar.tmpl, org/team/navbar.tmpl).
- **Suggested fix.** Scope the state-link rules to `.small-menu-items.tiny`, and give `.small-menu-items.small` (h2) the Primer subnav segmented look. The "16 " count prefix is template text and cannot be removed by CSS; that is acceptable.

### 2. NIT: mobile open menu, first row touches the toggle row

Routes: repo-home-anon, login, home. 390, both schemes.

- **Evidence.** `crops/mobile-open.png`, `repo-home-anon/states/light-390-mobile-menu-open.png`.
- **Measured.** The toggle occupies y=16–48 and the first row (Explore / Issues) starts at y=48, so the gap is 0.
- **Cause.** `header.css:290`, `#navbar.navbar-menu-open .navbar-left > .item:not(#navbar-logo):first-of-type { margin-top: 8px }`, is dead. `:first-of-type` is evaluated against the element type, and the first `<a>` in `.navbar-left` is the logo, so the rule never matches.
- **Suggested fix.** An 8px `row-gap` on the open `.navbar-left`, or `margin-top` on `#navbar-logo + .item`.

### 3. NIT: current tab inside the mobile overflow

Route: repo-pull dark-390 (`crops/m390.png`).

When the current tab ("Pull Requests") is in the overflow, the coral 2px marker is drawn under the bordered "…" IconButton. GitHub's UnderlineNav keeps the current item visible instead (it swaps it in). The overflow is Gitea's JS; CSS cannot reorder it. Acceptable as is. The marker under the button does convey state.

### 4. NIT: light-scheme header rule between two #f6f8fa blocks on repo pages

This is a deliberate choice for consistency with the dark band decision, and I accept it. github.com logged-out has no such rule because its marketing header is black, so there is no direct reference.

### 5. Accepted and known gaps (not scored again)

- Header text links instead of IconButtons, and no search input (no template override).
- First/Last kept in pagination (N-5 declined, with sound reasoning).
- No trailing "/" after a directory breadcrumb.
- Footer 112 vs 114px, and the logo-to-text gap of 16 vs about 8px.
- No "Public" label next to public repo names: the template renders labels only for private, internal and similar repos.

### Out of scope, observed (not navigation)

- **directory-tree 390 horizontal overflow (regression since round 1).** The document is 421px wide at 390, in both schemes. It was 390 in round 1. The overflowing element is `a.m-commit-count` (the latest-commit "History" link), x=393–421. It is not matched by any navigation selector; `.m-commit-count` / latest-commit styling lives in `src/code/`. **Forward to code.**
- The `.ui.dropzone` rgba(0,0,0,.8) border on repo-pull belongs to forms/editor, as in round 1.

## Measurements (ours vs github.com, light 1440 unless noted)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| underline-nav-item | box | 75.4×30 | 75.4×30 | yes |
| tab-counter | box / line-height | 21.9×20 / 18px | 21.9×20 / 18px | yes |
| repo-band (dark) | background | rgb(13,17,23) | rgb(13,17,23) | yes |
| repo-band (light) | background | rgb(246,248,250) | rgb(246,248,250) | yes |
| repo-band | height / padding-top | 110 / 16 | 110 / 16 | yes |
| tabnav-tab (PR) | height / padding / gap | 40 / 8px 12px / 8px | 40 / 8px 12px / 8px | yes |
| tabnav-tab (PR) | unselected colour | rgb(31,35,40) | rgb(31,35,40) | yes |
| footer | height / padding | 112 / 48 16 40 | 114 / 48 · 40 | yes (2px) |
| footer | border-top / line-height | 0 / 18px | 0 / 18px | yes |
| pagination Previous | box | 85.5×32 | 85.5×32 | yes |
| pagination Next | box | 60×32 | 60×32 | yes |
| pagination item | padding / radius / current bg | 8px 6px / 6px / rgb(9,105,218) | same | yes |
| state-link | height / padding | 30 / 0 8px | 30 / 0 8px | yes |
| navlist-item | height | 32 | 32 | yes |
| navlist group heading | font / row | 12/18 600 / 30px | 12/18 600 | yes |
| mobile bell (390) | right inset | 16px | 16px | yes |
| mobile anon logo (390) | x | 56 | hamburger + logo left | yes |
| mobile anon open rows (390) | x / w / h | 16 / 358 / 32 | full width | yes |
| mobile open first row | gap below toggle row | 0 | ~8 (dead rule intended 8) | no (nit) |
| breadcrumb separator | spacing | 4px padding + 2px gap | about 6–8px | yes |
| releases switcher | style | text links, 30px, no border | segmented subnav, 32px (5px 16px, lh 20, 1px border), selected accent-emphasis | no |
