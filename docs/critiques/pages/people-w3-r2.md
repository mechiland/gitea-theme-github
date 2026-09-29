# Critique: pages/people, wave 3, round 2

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Served CSS was current: `dist/theme-github-auto.css` and `/assets/css/theme-github-auto.css` have the same SHA-256 (f259beaa…), so I did not deploy.

## Verdict

**Score: 8.5 / 10. PASS.** It meets the bar: at least 8.5, 0 console errors, 0 literal colours and a green smoke test.

All three round-1 visual majors are fixed and verified in screenshots. The folder shrank as claimed. What remains is minors and nits. One of them is a claimed fix that did not land: the explore NavList's selected corners.

## Housekeeping (my own runs)

- **Lint.** `node build/lint.mjs pages/people` gives 0 errors, 0 warnings and 284 selectors.
  - `npm run build` gives `folders["pages/people"] = {status: "ok", files: 10, bytes: 55832}`.
  - A grep of the folder finds no hex, rgb or hsl colours.
  - There is no `!important` outside `people.important.css`, and that file has no display or visibility rules.
- **Size.**
  - The minified `@layer gh.pages-people{…}` block in `dist/theme-github-auto.css` is **32,428 B**. Adding about 2.4 KB of important rules supports the builder's figure of 34.8 KB, down from 43.4 KB.
  - The whole theme is still over budget: auto 426.8 KB, light/dark 415.5 KB, against a 300 KB limit. That is shared work (integrator PPL-1).
- **Audit.** `shots/critic-pages/people-r2/` covers 12 routes (the builder's 11 plus `user-profile-activity`) × light/dark × 1440/390, with `--states --measure`.
  - 48 captures: 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars and 0 non-Octicon icons. No horizontal overflow.
  - Every state passed, including my 7 added ones: explore-users user-hover and search-focus, org-home tab-focus and search-focus, repos-tab repo-name-hover, members leave-hover and notifications navlist-focus.
- **Extra routes.** `shots/critic-pages/people-r2-extra/` covers org settings, org projects and packages, team members, user projects, activity, read notifications, anonymous org home and self profile (36 captures).
  - 0 errors and 0 off-palette colours.
  - Org packages shows 1 non-Octicon icon, which is outside this folder, as in r1.
- **SA-P1.** Verified: `org-settings/light-1440.png` shows no band bleed. The settings nav is at the top, the Subheads are plain and the 390 layout is intact.
- **CLS.**
  - home 390 = 0.3648, inside the gitea-auto baseline of 0.345–0.394.
  - home 1440 = 0.0001.
  - stars-tab dark 1440 = 0.0023.
  - Every other page is 0.
- **Smoke.** Green, 12/12 steps (`shots/20260930-054759-smoke-github-auto/smoke.json`).

## Round-1 items, re-verified

| r1 item | status | evidence |
|---|---|---|
| 1 org-home repo title 20/30 → 16/24 | **fixed** | org-home probe: 16px/600/24px accent; `org-home/light-1440.png` |
| 2 explore glyph 24px | **fixed** | 16×16, min-width 16px, centred on the 24px title line |
| 3 dashboard search icon lost on focus | **fixed** | `home/states/light-1440-search-focus-clip.png`: magnifier visible with the focus ring |
| 4 folder size | **fixed (folder)** | 32.4 KB layer (min) |
| 5 NavList selected radius | **NOT fixed** | see issue 1 below |
| 6 members/teams filter | **fixed** | 320×32, 14px, pl 32, leading icon; 358×32 at 390 |
| 7 follower counts | open (known gap, template) | |
| 8 members intro at 390 | **fixed** | text then button stacked (`people-r2-crops/members-390-top.png`) |
| 9 heatmap phone / legend | **fixed** | 390: 10.9px cells in an rtl scroller showing the latest weeks; legend gap 4.4px |
| 10 profile phone order | **fixed** | bio, details, followers, Follow (`user-profile/light-390.png`) |
| 11 explore sidebar rule | **fixed** | rule runs to the footer (`explore-repos/light-1440.png`) |
| 12 notification row focus | **fixed** | 4px offset (`notifications/states/light-1440-row-focus-clip.png`) |
| 13 org sub-page avatar | **fixed** | 30×30 r6, matching github.com (30×30 r6) |

## Issues, most important first

1. **minor: the explore NavList selected item still has square bottom corners.** The builder claimed this was fixed.
   - Where: `explore-repos`, `explore-users` and `explore-orgs`, ≥ 768px, both schemes.
   - Computed on `.explore > overflow-menu .overflow-menu-items > .active.item`: `border-radius: 4px 4px 0px 0px`. Unselected items are 6px.
   - Cause: Gitea's `.ui.tabular.menu .active.item { border-radius: .2857rem .2857rem 0 0 !important }` (layer gitea, `!important`) beats the normal-layer rule in explore.css:49. Found by CSSOM walk.
   - Fix: add `border-radius: var(--borderRadius-medium) !important` for that selector to `people.important.css` (≥ 768px).
   - Visible: `shots/critic-pages/people-r2-crops/navlist-active-zoom.png`.
2. **minor: the org-home sidebar headings are semibold.**
   - "Members" and "Teams" are 16px/**600**/24px.
   - github.com/go-gitea sidebar headings ("People", "Sponsors", "Top languages", "Most used topics") are `h4.f4.text-normal`, **16px/400**/24px. Measured on github.com logged out.
   - The main-column "Repositories" h3 is also 400.
3. **minor (known gap): follower counts.** They are regular weight and muted. GitHub shows the counts at 600 in `--fgColor-default`. Gitea renders a single text node, so this needs a template change.
4. **nit: the overlaid search button's focus ring has the wrong corner shape.**
   - Where: members, teams, explore, profile and org filters. The Gitea submit button is laid over the input's left edge as the leading icon.
   - It is still tabbable. On keyboard focus it draws a 32×32 ring with radius `0 6px 6px 0`: square corners on the left, where the input is rounded, and rounded corners on the right, inside the field.
   - Evidence: `people-r2-crops/members-btn-states.png`, light and dark.
   - Fix: either give it `border-radius: var(--borderRadius-medium) 0 0 var(--borderRadius-medium)`, or inset the ring. GitHub's leading visual is not focusable.
5. **nit: phone heatmap.**
   - The scroller's start padding scrolls away, so the oldest visible week is cut flush against the Box's left border ("Apr" touches the edge; `people-r2-crops/home-390-heatmap.png`).
   - It is not keyboard-scrollable (known gap).
   - The day labels are out of view on phones. That matches GitHub's scroll behaviour.
6. **nit: the org-home "New Team" button is small.** It is 28px/12px, next to 32px/14px "New Repository" and "New Migration". That is Gitea's `ui small button`. Acceptable, but inconsistent within the column.
7. **nit (shared): the dashboard search is 28px/12px.** It is a small control. Acceptable for GitHub's dashboard filter.
8. **Accepted content gaps**, unchanged:
   - no Pinned grid, Organizations or Achievements headings, Public labels or Star buttons;
   - Overview has no contribution graph (it is on Public Activity);
   - no "Edit profile" button on your own profile;
   - "Starred Repositories" / "Public Activity" copy;
   - the icon-only green "mark all read";
   - the profile tab radius `4px 4px 0 0` vs 6px (the navigation folder, PPL-N1).
9. **Shared: the theme is over budget** (PPL-1). It is no longer attributable to this folder.

## Measurements (ours vs github.com, light 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| profile avatar | size / radius | 296×296, full | 296×296, 50% | yes |
| profile name / username | font | 24/600/30; 20/300/24 muted | same | yes |
| Follow | box | 296×32 r6 14/500 | 296×32 r6 14/500 | yes |
| profile tabs | top / height | y=96, 48 | y=96, 48 | yes |
| profile repo row name | font | 20/600/30 accent | 20/600/30 accent | yes |
| org-home repo row name | font | 16/600/24 accent | 16/600/24 (list view) | yes |
| org filter input | box | 32px, 14px, pl 32 leading icon | 32px, 14px, pl 32 | yes |
| members filter | box | 320×32, 14px, pl 32 | 320×32, 14px, pl 32 | yes |
| org sub-page avatar | size / radius | 30×30 r6 | 30×30 r6 | yes |
| org sidebar heading | font | 16/600/24 | 16/400/24 | no |
| explore glyph | size | 16×16 | 20px avatar (16px octicon accepted) | yes |
| explore NavList selected | radius | 4px 4px 0 0 | 6px | no |
| heatmap cell (activity, 1440) | size / pitch | 12.5 / 15px | 11 / 15px | yes |
| heatmap cell (dashboard, 390) | size | 10.9px, scrolls | 11px, scrolls | yes |
| heatmap legend | gap to "More" | 4.4px | 4px | yes |
| notification row focus | offset | 4px | n/a | yes |

## What is good

- The profile sidebar and tabs now match github.com's geometry exactly, including the tab-bar top at 96px.
- The org header, tabs, repo list and filter bar are very close to github.com/go-gitea in both schemes.
- Explore reads as GitHub's search layout, and its sidebar rule runs to the footer.
- The contribution graph uses Primer's contribution palette with GitHub's 15px pitch and a 4px legend gap, and scrolls correctly on phones.
- Every hover, press, focus and open state renders correctly in both schemes.
- No bleed onto org settings.
