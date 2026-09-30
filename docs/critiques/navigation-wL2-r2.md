# Critique: navigation, wave L2, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. My build was revision `bbf57c7ae8`. Served and dist files differ in sha256, but the navigation layer (`@layer gh.navigation{…}`, 22,745 B in both) differs only in renamed custom-property names (`--pi`/`--pj` swapped by the token pruner after other folders changed). So the served navigation CSS is the builder's source, and I did not deploy.

**Score: 8.6 / 10. Pass on the visual bar.** Round 1 scored 8.4. Both round-1 regressions are fixed, and every fix I re-measured holds in light and dark. What remains is small ordering and gutter behaviour at phone widths, plus the shared size budget, which this folder was told to help with and did not.

## Gate checks

- **Lint:** `node build/lint.mjs navigation` gives 0 errors, 0 warnings, 241 selectors. No literal colours.
- **Build:** `folders["navigation"]` = `{status: "ok", lintErrors: 0, files: 11, bytes: 59,629}`. The whole build is over budget: light 319.1 KB, dark 320.2 KB, auto 324.2 KB.
- **Smoke test:** green. Every step `ok: true`, `consoleErrors: []`. Log: `shots/critic-navigation-wL2-r2-smoke.log`, run `shots/20260930-173000-smoke-github-auto`.
- **Capture:** `shots/critic-navigation-wL2-r2/`, 28 routes × light/dark × 1440/390 with `--states --measure`, 112 pages. Routes: `shots/critic-navigation-wL2-r2-routes.json`.
  - Off-palette colours: 0.
  - Failed requests: 0.
  - Horizontal overflow at 1440 and 390: none.
- **Console errors:** 4 raw entries. All 4 are the main-document 404 of `not-found-anon`, which is the intended status of that route. Nothing comes from the theme.
- **Unresolved live variable:** `--gh-octicon-calendar` on repo-pull and on the playground PR conversation. It comes from `src/controls/inputs.css:381` (date input), not navigation.
- **Failed states:** 2, `repo-commits-p3 pagination-next-focus` at 390. This is my own selector error: `a.item.navigation:last-of-type` is "Last", which is hidden below 544 by design. The 1440 focus shots of the same state are fine.
- **CLS:** admin-repos 390 at 0.2355 / 0.249 and site-admin-users 390 at 0.091. These are the same pages as round 1, and my round-1 bisect attributed them to pages/settings-admin.
- **Non-Octicon icons:** page content only (webhook and package types).

## Probes

- `shots/critic-navigation-wL2-r2-probe.mjs` writes `-probe.json` and crops in `shots/critic-navigation-wL2-r2-crops/`. It covers:
  - UnderlineNav on 18 pages at 320, 360, 390 (light and dark), 600, 700 and 1440;
  - the PR TabNav at 320, 390, 543, 600 and 700, including the scroll state and computed `mask-position`;
  - pagination at 1440, 767, 600, 543, 390, 360 and 320;
  - the anonymous header and Register/Sign in hover at 1440, 390 and 320;
  - NavList icons on the four settings/admin menus.
- `shots/critic-navigation-wL2-r2-explore360.mjs` captures the explore row at 360 and 320.
- github.com references were re-captured today with `--measure`: `docs/reference/critic-nav-wl2-{repo-issues,issues-list-closed,repo-pull}`.

## Builder's claims, verified

1. **Explore at 390: fixed.**
   - All three explore pages, light and dark: Repositories 18–143, Users 151–230, Organizations 238–372, no "…".
   - At 360 all three tabs also fit (3–357).
   - At 320 "Organizations" stays visible through the < 360 reorder, and "Users" goes into "…" (x 280–312).
   - Evidence: `crops/tabs-{light,dark}-390-explore_organizations.png`, `sheet-explore.png`.
2. **PR tabs at 544–767: fixed.**
   - At 600 and 700, `scrollLeft` is 0 and Conversation starts at x=16 on grex /pulls/42 (conversation, commits, files) and on playground /pulls/16 (+ /files), light and dark.
   - The fade logic works:

     | state | `mask-position` | fades shown |
     |---|---|---|
     | row fits | `-24px 0, 0 0` | none |
     | 390, unscrolled | `-24px 0, -24px 0` | right only |
     | 390 /files (scrollLeft 49) | `0 0, -24px 0` | both |
     | scrolled to the end | `0 0, 0 0` | left only |

   - At 390 on /files, Files Changed sits at 208.6–350, clear of the fade at 350–374. At 320 it sits at 138.6–280.
   - Evidence: `crops/prtabs-*.png`, `sheet-prtabs.png`.
3. **Current tab placement: partly fixed, as the builder stated.**
   - At 600: Code, Issues, <current>, then the remaining tabs. This holds for Settings, Actions, Wiki, Packages, Activity and Releases.
   - At 390 and 360: Code, <current>, Issues, "…".
   - Profile Stars at 320 and 360 stays inside "…", and the button carries the underline.
4. **Pagination numbers: fixed.**
   - Every page item shows at every width.
   - First/Last are icon-only (32×32) from 544 to 767 and hidden below 544.
   - Previous/Next become icon-only below 544 only with 6+ page items. /commits page 3 at 320 is one row at x 18–302, 32px tall.
   - /issues?state=closed at 390 reads "Previous 1 2 3 Next".
   - Current page: rgb(9,105,218) light / rgb(31,111,235) dark, white text, 32×32, radius 6.
   - The "…" gap item is `--fgColor-disabled`.
5. **Focused Previous/Next: fixed.**
   - Focused "Next" and "Last" are rgb(9,105,218) light / rgb(68,147,248) dark, with a 2px inset accent ring.
   - Evidence: `home/states/*-1440-pagination-focus-clip.png`, `repo-commits-p3/states/*-1440-pagination-next-focus-clip.png`.
6. **Register underline: fixed.**
   - `text-decoration-line: none` at rest and on hover, at 1440, 390 and 320, light and dark.
   - Hover background: rgb(246,248,250) → rgb(239,242,245) light, rgb(33,40,48) → rgb(38,44,54) dark.
   - Evidence: `not-found-anon/states/{light-1440,dark-390}-signup-hover-clip.png`.
7. **NAV-I6: still open.** It is the integrator's decision.

Also re-checked:
- **NavList:** every top-level item on the user, repo and org settings menus and the admin menu has a 16px icon. Items are 32px tall. No item lacks an icon.
- **Anonymous header:** scrollWidth 390 and 320 on the 404 page. Register ends at 374 (390) and 304 (320).
- **Footer at 390:** links above, logo row below, and the version is hidden.

## Issues (most important first)

1. **Major, shared gate: the size budget is not met, and this folder grew.**
   - The brief said all theme files must stay ≤ 295 KB and to trim this folder to make room.
   - The build is light 319.1 / dark 320.2 / auto 324.2 KB. The navigation layer is 22,745 B, about +950 B this round, with no trim.
   - Not a visual defect, and most of the overage belongs to other folders. It is still an unmet brief item.
   - Cheap candidates:
     - share one `@media (max-width:767.98px)` block for the tabnav, underline-nav and pagination rules;
     - drop the `@keyframes` 10%/90% stop if a plain two-stop timeline is acceptable.
2. **Minor: at 360 and 390, the repo tab row puts the current tab second.** Settings reads "Code, Settings, Issues 8". The same happens for Actions, Wiki, Packages and Activity.
   - Primer React keeps DOM order and swaps the selected tab into the last visible slot.
   - At 360 and 390 this is a real constraint, because "Pull Requests 12" (167px) does not fit.
   - Note: github.com logged-out at 390 on /pull/42 shows only Code and Issues 9 plus "…", and does not pull "Pull requests" forward (`crops/gh-pull-light-390-top.png`). So showing the current tab at all is already beyond the reference.
3. **Minor: profile "Starred Repositories 2" at 320 and 360 stays in "…", and the "…" button carries the underline** (probe `tabs-light-{320,360}-/alice-dev?tab=stars`). It is visible from 390. This is a known gap.
4. **Nit: the explore row ignores the 16px page gutter at 320 and 360.**
   - The centred three-tab row spans 3–357 at 360: the first item box sits 3px from the edge and the underline ends 3px from the right edge.
   - At 320 on /explore/organizations, the row is Repositories 3–127, Organizations 135–269, "…" 280–312. That is 3px on the left against 8px on the right.
   - Evidence: `sheet-explore.png` (light and dark). github.com keeps 16px.
5. **Nit: at about 544–616, the diff stat squares on a wide PR sit under the right fade.** Seen on playground /pulls/16 at 600: scrollWidth 585 > clientWidth 568 (`crops/prtabs-light-600-octo_org_theme_playground_pulls_16_files_style_spl.png`). Acknowledged by the builder.
6. **Nit / FYI: NAV-I6.** The NavList masks use relative `url("../img/svg/octicon-*.svg")`. They work on this server; the integrator decides.
7. **Nit: the counter text in UnderlineNav** is rgb(31,35,40), while github.com today measures rgb(37,41,46) (light, repo-issues 1440). The size, radius, padding, weight and background match. This is probably a primitives version difference, not a folder bug.
8. **Not done, acknowledged:** FG2-088 (org tabs inset) and FG2-092 (search placeholder, admin shield).
9. **Tool note (not a theme defect):** the full-page shoot injects a style that zeroes animations. This cancels the scroll-driven fade, so `repo-pull-files/*-390.png` shows the scrolled PR row with hard edges and no fades. The probe crops, taken without that style, show the fades correctly. Pixel-diff runs will not see the fades.

## Measurements

| control | property | ours | github | ok |
|---|---|---|---|---|
| UnderlineNav item (repo-issues 1440 light) | box / padding / radius / font / line-height | 75.4×30 / 0 8px / 6 / 14px 400 / 30px | 75.4×30 / 0 8px / 6 / 14px 400 / 30px | yes |
| UnderlineNav item (repo-issues 390 dark) | box / colour | 75.4×30 / rgb(240,246,252) | 75.4×30 / rgb(240,246,252) | yes |
| Counter in tab (light 1440) | height / padding / font / bg | 20 / 0 6px / 12px 500 lh18 / rgba(129,139,152,.12) | 20 / 0 6px / 12px 500 lh18 / rgba(129,139,152,.12) | yes |
| Counter in tab (light) | text colour | rgb(31,35,40) | rgb(37,41,46) | no (nit) |
| Counter in tab (dark 390) | bg / colour | rgba(101,108,118,.2) / rgb(240,246,252) | rgba(101,108,118,.2) / rgb(240,246,252) | yes |
| Explore tabs /explore/organizations 390 | visible tabs / "…" | 3 (18–372) / none | all tabs visible | yes |
| Explore tabs 360 | outer gutter | 3px | 16px | no (nit) |
| PR TabNav at 600 (grex + playground) | scrollLeft / first tab x | 0 / 16 | 0 / 16 | yes |
| PR TabNav 390 /files | selected tab box / fade zone | 208.6–350 / 350–374 | selected visible (github.com row at 390 does not scroll) | yes |
| PR TabNav edge fade | mask-position (fit / start / mid / end) | -24,0 · -24,-24 · 0,-24 · 0,0 (px) | right fade only where content continues | yes |
| Pagination page | size / radius / gap | 32×32 / 6 / 4 | 32×32 / 6 / 4 (Primer Pagination) | yes |
| Pagination current | bg / fg | rgb(9,105,218) / #fff light; rgb(31,111,235) / #fff dark | --bgColor-accent-emphasis / --fgColor-onEmphasis | yes |
| Pagination Next focused | colour / ring | rgb(9,105,218) / 2px accent inset | accent / 2px focus ring | yes |
| Pagination /issues?state=closed 390 | items | Previous 1 2 3 Next, 32px row | Previous 1 2 3 Next | yes |
| Pagination /commits p3 320 | rows / height | 1 / 32 (icon-only Prev/Next) | 1 row | yes |
| Register button (anon) | height / radius / font / hover decoration | 32 / 6 / 14px 500 / none | 32 / 6 / 14px 500 / none | yes |
| Anonymous header 390 / 320 | scrollWidth / Register right | 390 / 374; 320 / 304 | no overflow | yes |
| NavList item | height / leading icon | 32 / 16px on 100% of items (4 menus) | 32 / 16px | yes |
| Repo tabs 390 current = Settings | order | Code, Settings, Issues 8, "…" | Primer: Code, Issues, Settings | no (minor) |

## Screenshots reviewed

- `shots/critic-navigation-wL2-r2-sheet-tabs.png` (repo settings 390 light and dark, 600; explore orgs 390 light and dark, 320; stars 320 and 390)
- `shots/critic-navigation-wL2-r2-sheet-prtabs.png` (390 conversation, files and scrolled-end; dark playground files; 320 files; 600 light and dark)
- `shots/critic-navigation-wL2-r2-sheet-pag.png` (pagination at 1440, 600, 390, 320, light and dark; feed; anonymous header 390 and 320)
- `shots/critic-navigation-wL2-r2-sheet-states.png` (pagination focus and hover, Register hover and focus)
- `shots/critic-navigation-wL2-r2-sheet-states2.png` (overflow popup, tab focus and hover, PR tab focus and hover)
- `shots/critic-navigation-wL2-r2-sheet-pullfiles.png`, `-sheet-1440.png` (explore sidebar, user settings, site admin dark), `-sheet-misc.png` (footer at 390, repo settings dark at 390), `-sheet-explore.png`
- References: `shots/critic-navigation-wL2-r2-crops/gh-pull-light-390-top.png`, `docs/reference/critic-nav-wl2-repo-issues/*.measure.json`
