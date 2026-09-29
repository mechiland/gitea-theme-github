# Critique: pages/people, wave 3, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Served CSS was current: `dist/theme-github-auto.css` and `/assets/css/theme-github-auto.css` have the same SHA-256 (750f6f54…), so I did not deploy.

## Verdict

**Score: 8.0 / 10. NOT A PASS** (the pass bar is 8.5).

Housekeeping is all clean:
- **Lint.** `node build/lint.mjs pages/people` gives 0 errors, 0 warnings and 322 selectors. `build-report.json` shows `folders["pages/people"].status = "ok"` (9 files, 65,686 B src).
- **Colours.** No literal colours, no `!important` in normal files, and no display or visibility rules in `people.important.css`.
- **Audit.** 44 main captures, 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars and 0 non-Octicon icons. No horizontal overflow at 390.
- **Extra captures.** I also shot 36 captures on 9 extra routes: org settings, org projects and packages, team members, user projects, profile activity, read notifications, anonymous org home and your own profile. They show 0 console errors and 0 off-palette colours. The only non-Octicon icon is on org packages, which is outside this folder.
- **CLS.** home 1440 = 0.0001 (gitea-auto baseline 0.065–0.19); home 390 = 0.365 (baseline 0.345–0.394), within baseline noise; every other page = 0.
- **Smoke.** Green, 12/12 steps (`shots/20260930-045818-smoke-github-auto/smoke.json`).

The profile sidebar is very close to github.com: every measured property matches. The repositories tab, org header band, notifications inbox and dashboard are recognisably GitHub in both schemes. What keeps the score below 8.5:
- Org-home repo titles use the profile-tab type scale.
- Explore cards have 24px leading icons.
- On load the dashboard's search input is auto-focused, and its leading icon disappears.
- The theme file is 33% over budget, and this folder is one of the largest contributors.
- Several smaller spec gaps: the NavList radius, 28px/12px filter inputs, and the phone layouts of the heatmap and members pages.

## Evidence

- Ours: `shots/critic-pages/people-r1/`
  - 11 routes × light/dark × 1440/390, with `--states --measure`.
  - Routes file: `shots/critic-pages/people-routes.json`, the builder's file plus 6 states.
  - 4 of my own added state selectors were wrong and FAILED; I do not count those against the builder. The builder's `notifications action-focus` also fails, as the builder says.
- Extra routes: `shots/critic-pages/people-r1-extra/` (`people-extra-routes.json`).
- Reference: `docs/reference/{user-profile,user-profile-repositories-tab,user-profile-stars-tab,org-home,org-members,explore-repos}`.
- Side-by-side computed styles on both targets use the same logical selectors:
  - Probe: `shots/critic-pages/people-probe.mjs`.
  - Output: `shots/critic-pages/people-probe/{gitea,github}-light-1440.json`, diffed with `people-diff.py`.
  - Extra github.com probe: `people-probe2.mjs`, which covers org repo rows and the search NavList.
  - github.com search capture: `shots/critic-pages/people-probe/gh-search-light-1440.png`.
- Dashboard search focus clip: `shots/critic-pages/people-dsearch-focus.png` (focused) and `people-dsearch-ours.png` (blurred).

## Measurements (ours vs github.com, 1440 light)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| profile avatar | size / radius / ring | 296×296, full, 1px avatar-borderColor | 296×296, 50%, 1px | yes |
| profile name | font | 24/600/30 fgColor-default | 24/600/30 | yes |
| profile username | font | 20/300/24 muted | 20/300/24 muted | yes |
| Follow button | box | 296×32, r6, 14/500, bg #f6f8fa, border #d1d9e0 | 296×32, r6, 14/500, same colours | yes |
| Follow button | padding | 0 12px | 5px 16px (legacy .btn) | nit |
| bio | font | 16/24 | 16/24 | yes |
| followers line | colour | all muted, counts regular | counts 600 fgColor-default, words muted | no |
| vcard row | padding / gap / icon | 4px top, 8px gap, 16px muted icon | same | yes |
| profile tabs | top / height | y=88, 48px | y=96, 48px | nit |
| tab item | radius | 4px 4px 0 0 | 6px | no (navigation, PPL-N1) |
| repo row (profile tab) | name | 20/600/30 accent | 20/600/30 accent | yes |
| repo row (profile tab) | description | 14/21 muted, 8px to meta | 14/21 muted, 8px | yes |
| repo row (profile tab) | meta | 12/18 muted, 16px icons | 12/18 muted, 16px icons | yes |
| repo row (**org home**) | name | **20/600/30** | **16/600/24** | **no** |
| repo row (org home) | Box-row padding | 16px | 16px | yes |
| filter input (profile / org) | box | 32px, 14px, trailing attached search button | 32px, 14px, leading search icon (pl 32) | partial |
| Filter / Sort button | box | 32px, 14/500, r6 | 32px, 14/500, r6 | yes |
| members filter | box | **293×28, 12px** + button | **320×32, 14px** | **no** |
| org avatar | size / radius / ring | 100×100, r6, 1px | 100×100, r6, 1px | yes |
| org name | font | 24/600/30 | 24/600/30 | yes |
| org description | font | 14/21 muted | 14/21 muted | yes |
| org sub-page header avatar | size / radius | 24px r3 | 30px r6 | nit |
| members avatar | size | 48px | 48px | yes |
| members row | height | 100px | 81px | no (Gitea role/2FA lines) |
| explore card | padding / radius / border | 16px, r6, 1px borderColor-default | 16px, r6, 1px | yes |
| explore card | leading glyph | **24×24 repo octicon** | 20px owner avatar | **no** |
| explore title | font | 16/500 (owner 400) accent | 16/500 accent | yes |
| explore NavList item | height / padding | 32px, 0 8px | 32px, 6px 8px | yes |
| explore NavList item | radius | **4px 4px 0 0 (selected)**, 6px otherwise | 6px | **no** |
| explore NavList item | selected weight | 600 | 600 | yes |
| heatmap cell (dashboard 1440 / 390) | size | 14.8px / **4.9px** | 11px (scrolls at 390) | partial |
| heatmap legend | gap from squares to "More" | ~24px | 4px | nit |
| notification unread dot | size / colour | 8px, bgColor-accent-emphasis | (no logged-out reference) | n/a |
| focus rings (Follow, Filter, tabs, NavList) | ring | 2px accent outline | 2px accent | yes |

## Issues, most important first

1. **major: the org-home repo list uses the profile-tab type scale.**
   - Where: `org-home`, both schemes, 1440. Rule `repo-list.css :is(.profile, .repositories) .item-header > .item-title` (the org page carries `.profile`).
   - Measured: repo names are 20px/600/30px. On github.com/go-gitea the list-view title is **16px/600/24px** (`a[href="/go-gitea/gitea"]` in the list, probe2). GitHub's org description is 14px muted, which already matches.
   - The org list therefore looks visibly heavier than GitHub's (`people-r1/org-home/light-1440.png` vs `docs/reference/org-home/light-1440.png`).
   - Fix: scope 16px/24px to `.organization.profile`, keeping 20px on `.user.profile`.
2. **major: explore cards show a 24px repo octicon.**
   - Where: `explore-repos`, all schemes and viewports (`people-r1/explore-repos/light-1440.png`). The octicon is visibly larger and heavier than the 16px meta icons.
   - Cause: the template emits `svg width=24`. Gitea's `.svg[width="24"] { min-width: 24px }` (layer gitea) beats the builder's `width: 16px`, so the computed size is 24×24. The only matching width rule is `.repositories .item-leading > .svg`.
   - Fix: add `min-width` (and `min-height`) to that rule. github.com uses a 20px owner avatar there; a 16px muted octicon is an acceptable substitute.
3. **major (cross-folder root, visible on this page): the dashboard search input loses its search icon.**
   - Where: `home`, 1440 and 390, both schemes.
   - Gitea auto-focuses `#dashboard-repo-list input` on load (DashboardRepoList.vue:302). On focus, `controls/inputs.css:217` `.ui.action.input > input:focus { position: relative; z-index: 1 }` paints the opaque input over the absolutely positioned leading `i.icon`. The field shows a 32px empty left padding and no magnifier (`people-dsearch-focus.png`; the blurred state `people-dsearch-ours.png` shows the icon).
   - Fix: a page-scoped `#dashboard-repo-list .repos-search .icon { z-index: 2 }`, or a controls change request to raise the icon for every `.ui.left.icon.action.input`.
4. **major (shared, filed as PPL-1): the theme is over budget.**
   - The build reports light and dark at 387.8 KB and auto at 399 KB, against the 300 KB limit in ARCHITECTURE §10.
   - pages/people adds 40.6 KB minified in its layer plus 2.7 KB of important rules (lightningcss minify of this folder's section).
   - The r1 claim is correct, but the folder must shrink. Candidate cuts:
     - `people.important.css` duplicates of normal rules;
     - long `#profile-avatar-card .extra > ul > li…` chains;
     - per-page duplicate Box rules (`.organization.members`, `.explore.users`, `.explore .flex-divided-list`) that could share one selector list.
5. **minor: the explore NavList selected item has square bottom corners.**
   - The `.active.item` inherits the UnderlineNav radius `4px 4px 0 0`; the other items are 6px (probe). Primer NavList items are 6px on all corners.
   - Visible on the selected-item background (`explore-repos/states/*-navlist-hover-clip.png`).
6. **minor: the members and teams filter inputs are small inputs with an attached button.**
   - Members: 293×28px with 12px text. GitHub's filter is 320×32 at 14px with a leading search icon.
   - The builder claims "a 320px filter", but only the form is 320px; the input itself is small.
   - Profile and org filter inputs are 32px but keep the trailing attached search button; GitHub's input is plain with a leading icon.
7. **minor: followers line.** GitHub renders the counts semibold in `--fgColor-default` ("**297** followers · **18** following"). Ours are all muted and regular weight.
8. **minor: the org members and teams intro at 390 is squeezed.**
   - "Members are managed through teams…" wraps in a ~130px column next to the "Manage teams and members" button (`people-r1/org-members/light-390.png`).
   - Fix: let the row wrap, or stack the button below at < 768px.
9. **minor (known gap): heatmap on phones.**
   - Cells are 4.9px at 390, not the ~6px the builder claims, and the month and day labels are unreadable.
   - The legend's "More" sits ~24px after the last visible square (the hidden 6th rect plus a -16px margin). GitHub's gap is 4px.
10. **nit: profile at < 768px.** GitHub puts the full-width Follow button after the website and followers lines, with a rule above Achievements. Ours puts Follow directly under the name.
11. **nit: explore sidebar rule.** The sidebar's right rule ends where the results end (explore-users about 640px, explore-orgs about 447px). On github.com the rule runs to the bottom of the viewport.
12. **nit: notification row focus ring.** The ring on `.notifications-link` hugs the text and touches the first glyph (`notifications/states/light-1440-row-focus-clip.png`). Give it a 2px offset, or put the ring on the row.
13. **nit: org sub-page compact header.** The avatar is 24px with radius 3, where github.com's is 30px with radius 6. The container is at x=112 vs GitHub's 96 (foundation-owned).
14. **nit (content, accepted gaps):**
    - no Organizations or Achievements headings, pinned grid, Star buttons or Public labels;
    - the gear next to the username;
    - "Starred Repositories" / "Public Activity" tab copy;
    - the green icon-only "mark all read" button;
    - the RSS icon button on the org header.

## What is good

- The profile sidebar matches github.com in every measured property: avatar, name, username, Follow, bio, vcard spacing and icons.
- The repositories-tab rows match GitHub's type scale and colours exactly, including the meta line and the rule under the filter bar.
- The org header band (100px r6 avatar, 24/600 name, muted description, tabs closing the band, edge-to-edge rule) is faithful in both schemes.
- The notifications inbox is a convincing Primer inbox: NavList with accent bar, Box, unread dot, semibold unread titles and hover actions.
- The dashboard at 1440 is laid out well, with layout shift fixed.
- The Primer contribution palette is correct in light and dark.
- Hover, press, focus and open states render correctly in both schemes: Follow, Filter/Sort, tabs, NavList, the segmented control, repo rows, feed links and heatmap cells.
- No bleed onto org settings, org projects or packages, team members or user projects, which I checked because `.organization > .flex-container` also matches the settings body container.

## For round 2 (priority)

1. Org-home repo titles to 16px/600/24px.
2. Explore leading icon `min-width` / `min-height`.
3. Dashboard search icon z-index, or a controls change request.
4. Cut ≥ 15 KB from the folder.
5. NavList selected radius 6px.
6. Members filter 32px/14px.
7. Bold default-coloured follower counts.
8. Members intro wrap at 390.
9. Heatmap legend gap.
