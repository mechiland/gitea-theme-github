# Critique: navigation, wave 2, round 1

Critic: independent design-systems review. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score 8.0 / 10. FAIL** (the pass bar is 8.5).

The other gates pass: 0 lint errors, 0 unexpected console errors, 0 literal or off-palette colours from this folder, and the smoke test is green.

The desktop work is excellent. UnderlineNav, Pagination, NavList and the signed-in header match github.com almost to the pixel in both schemes, and the tab item box is identical to the reference (75.4×30). Three things keep the score below the bar:

- **The logged-out mobile header is broken.** This affects every anonymous page below 768px, including the login page.
- **The same wrong line-height token is used in four places.**
- **Several smaller spec deviations**: TabNav colours and padding, footer box, dark repo band colour, and the mobile bell inset.

## How I verified

- **Lint.** `node build/lint.mjs navigation`: 0 errors, 0 warnings, 189 selectors.
- **Build.** `npm run build`: `folders.navigation.status = "ok"`, 0 lint errors. All 14 folders are included; `code` builds again.
- **Deploy check.** Served bytes match dist for all three theme files (sha256 prefixes: auto e7be0002, light 73416eac, dark cee278f8). I did not redeploy.
- **Screenshots.** Routes file: `shots/critic-navigation-routes.json`. It is the builder's file plus measures, extra states and 9 extra routes: issues-list-closed, directory-tree, repo-settings, site-admin-config, explore-users, user-settings-appearance, repo-home-anon, notifications, org-teams.
  - Ours: `shots/critic-navigation-r1` (100 pages, light + dark, 1440 + 390, `--states --measure`).
  - Reference: `shots/critic-navigation-r1-ref` (github.com logged out: repo-home, repo-issues, issues-list-closed, repo-pull, directory-tree, user-profile).
  - Crops and side-by-sides: `shots/critic-navigation-r1/crops/`.
- **DOM probes.** `shots/critic-navigation-probe.mjs`, `shots/critic-navigation-probe2.mjs` (Gitea) and `shots/critic-navigation-ghprobe.mjs` (github.com, read-only).
- **Audit results.** 100 pages, 0 pages with problems, 0 failed requests, 0 unresolved vars, 0 unlayered Gitea CSS.
  - 4 console errors, all the expected main-document 404 of `not-found`.
  - Off-palette colours: `svg#svg-mfi-*` fills (code folder file icons) and `.ui.dropzone` border rgba(0,0,0,.8) (not navigation). None attributable to navigation.
  - Non-Octicon icons: colorblind theme icons on the appearance page and fontawesome-openid on login (icons/auth, not navigation).
- **Smoke test.** `node tools/shoot/smoke.mjs --theme github-auto`: all 13 steps ok, 0 console errors (`shots/critic-navigation-r1-smoke.log`).

## Issues (most important first)

### 1. MAJOR: the logged-out mobile header layout is broken (<768px)

Routes: repo-home-anon, login. Both schemes, 390px. Evidence: `crops/anon-mobile.png`, `repo-home-anon/states/light-390-mobile-menu-open.png`, `login/light-390.png`, `login/dark-390.png`.

**Closed state.** The hamburger is at x=16, but `#navbar-logo` sits at **x=330** (the right edge) instead of next to the hamburger (signed-in: x=56). Signed out there is no bell in `.navbar-mobile-right`, so the item that used to get `margin-left:auto` is gone. `.navbar-left` keeps Gitea's `justify-content: space-between` and pushes the logo right.

**Open state (probe2).** `.navbar-left` shrinks to 198px wide at **x=96**, so the hamburger jumps from x=16 to **x=96** when the menu opens. "Explore" and "Help" start at x=96, while "Register" and "Sign In" start at x=16. The rows are misaligned and the toggle moves under the finger.

**Expected.** Same as signed in: hamburger at 16, logo at 56, full-width 32px rows starting at x=16.

**Suggested fix.** `justify-content: flex-start` on `#navbar .navbar-left` below 768px, and `flex: 1 1 100%` / `width: 100%` on `.navbar-left` in the open state for the anonymous case.

### 2. MINOR: wrong line-height token (`--text-caption-lineHeight`) for 12px text

`--text-caption-lineHeight` resolves to `--base-text-lineHeight-tight` = 1.25, which is **15px** at 12px. GitHub uses 18px for 12px text (`--text-body-lineHeight-small`, 1.5).

Used in:

- `footer.css:19`. Footer text and links measure **15px vs 18px** on github (repo-home light-1440 measure).
- `nav-list.css:103`. Group headings ("Admin Settings", "User Settings") measure **12/15**, row height 27px. Primer: 12/18.
- `underline-nav.css:120` and `tabnav.css:72`. Counter line-height. It renders 12px because gh.data-display wins, but even if it won it would be 15px, not the 18px measured on github (`.Counter`, repo-home). So ND-1 alone will not fix the counter: navigation's own value is wrong too.

### 3. MINOR: TabNav (PR Conversation / Commits / Files changed) differs from github's PR tabs

Route: repo-pull, 1440. Evidence: `crops/sbs-repo-pull-light.png`, `crops/tabnav-states.png`, and a github probe of `PullRequestHeaderTabNav-module__TabNavLink`.

| Property | Ours | github.com |
|---|---|---|
| Unselected tab text | --fgColor-muted rgb(89,99,110) | rgb(31,35,40), the default colour |
| Horizontal padding | 16px | 12px (padding 8px 12px) |
| Icon-to-label gap | 4px | 8px (`mr-2`) |

Height is 40px on both and the selected tab border and radius match. The reference hover/focus states could not be captured: github's `.tabnav-tab` no longer exists (`-FAILED.png` in the ref dir, which is expected).

### 4. MINOR: footer box does not match the github footer

Route: repo-home, 1440, light and dark. Evidence: `crops/footers.png`.

| Property | Ours | github.com |
|---|---|---|
| Height | 57px | 114px |
| Padding (top / bottom) | 16px / 16px | 48px / 40px |
| border-top | 1px --borderColor-muted | 0 |
| Line-height | 15px | 18px (see #2) |

The comment in footer.css says "border-top 1px --borderColor-muted", but the measured github footer has border-top-width 0. The centred single row, 12px size, muted colour and 24px mark are right.

### 5. MINOR: dark-scheme repo band colour

Route: repo-home dark, 1440. Evidence: `crops/repo-home-dark-1440-top.png` vs `crops/ref-repo-home-dark-1440-top.png`.

Pixel samples of the band background: ours rgb(1,4,9) (#010409, --bgColor-inset) vs github rgb(13,17,23) (#0d1117). GitHub's band is `--page-header-bgColor`: `--bgColor-muted` in light, `--bgColor-default` in dark. Light matches (both #f6f8fa).

The merged header + band reads like the signed-in AppHeader, which is #010409, so this is a judgement call. If the band stays merged, say so explicitly. Otherwise use `--page-header-bgColor` for `.secondary-nav`: the mapping of `--color-secondary-nav-bg` is a token request, or override it in navigation.important.css.

### 6. MINOR: signed-in mobile bell is 28px from the right edge (left side is 16px)

Route: repo-home / home, 390. Evidence: `crops/sbs-repo-home-light-390.png`.

Probe: `#navbar` padding 16. `.navbar-right` is an empty 0-wide flex item at x=374, and `#navbar`'s 12px gap still applies, so the bell box spans x=330–362. GitHub's right-side buttons end 16px from the edge.

Suggested fix: hide the empty `.navbar-right` on mobile when the menu is closed, or set gap 0.

### 7. NIT: NavList rows are 33px, not 32px

Route: site-admin-users, user-settings. Probe: summaries and items measure h=33 (6 + 21 + 6).

The github NavList item on /issues measures 32px (`prc-ActionList-ActionListContent`, padding 6px 8px). The current-item bar geometry matches github exactly: 4px wide, 24px tall, left -8px, top 4px, --borderColor-accent-emphasis.

### 8. NIT: pagination details

Route: issues-list-closed / repo-commits, 1440. Evidence: `crops/pagination-light.png` and `crops/pagination-dark.png`.

- Previous/Next padding is 8px vs 6px (ours 89px wide vs github 85.5px for "Previous").
- The Next/Last chevrons carry a trailing margin of 4.9px (Gitea `tw-ml-1`/`tw-mr-1` at a 14px root, shown as margin `0 4.9px 0 3.5px`), so the label and chevron gap is 3.5px, not 4px. There is also trailing space.
- `.page.buttons` stacks padding-top 15px (Gitea) with margin-top 20px, putting 35px above the bar.

The page box, current page, hover and focus ring otherwise match github side by side.

### 9. NIT: mobile overflow "…" button

Route: repo-home 390. Evidence: `crops/sbs-repo-home-light-390.png`.

Ours is a borderless muted glyph; github's UnderlineNav overflow is a 32px bordered IconButton on the right.

### 10. NIT: breadcrumb separators too tight

Route: directory-tree 1440. Evidence: `crops/sbs-breadcrumb.png`.

Ours: "/" with 2px padding each side ("grex / src" is 92.6px wide). GitHub leaves about 6–8px around each "/" and ends the path with a trailing "/". Sizes, colours and weights otherwise match (16/24, root accent semibold).

### 11. NIT (already documented by the builder): NavList collapsible chevron

The rotating chevron-right is not Primer's chevron-down/up. Header text links are not IconButtons, and there is no search box. I accept the builder's reasoning on both.

## What matches

- **UnderlineNav (repo tabs).** Item box 75.4×30 on both. Padding 0 8px, radius 6px, 14px, weight 600 when active, line-height 30px, 16px muted icons.
  - The nav is 48px tall with the same inset `--borderColor-muted` rule.
  - The coral 2px marker is identical.
  - Hover background and focus ring are visually identical to github in light and dark (`crops/tabs-states-*.png`).
  - Counter box is 21.9×20, 12px/500, bg rgba(129,139,152,.12); only the line-height differs (#2).
- **Repo title band.** 110px tall on both, padding-top 16px, side padding 32px. Title is 20px/30px accent, owner 400, repo 600. Repo icon is 16px muted.
- **Header (signed in).** 64px, padding 16px, --bgColor-inset, logo 32px. Text items are 32px, 14px/600, radius 6. Bell and create buttons are 32px with a 1px --borderColor-default border and radius 6. The avatar is a 32px circle. The unread dot is 12px accent.
  - Signed-out desktop shows "Sign In" then a bordered "Register" (`crops/anon-desktop.png`).
  - Hover and focus states are good (`crops/header-states-*.png`).
- **Pagination.** 32×32, radius 6, 4px gaps. Current page is --bgColor-accent-emphasis. Previous/Next use the accent colour with 14px chevrons. Hover and focus-visible match github side by side.
- **NavList.** Selected background, 4px accent bar, 12px semibold muted headings, indented sub-items. It looks right in light and dark (`crops/navlists2.png`).
- **Open/Closed state links.** Close to github's SectionFilterLink: github 30px tall, padding 0 8px, selected default semibold, other muted. Ours is 32px tall. The label order is Gitea's template.

## Measurements (ours vs github.com, light 1440 unless noted)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| underline-nav-item | box | 75.4×30 | 75.4×30 | yes |
| underline-nav-item | padding / radius / lh | 0 8px / 6px / 30px | 0 8px / 6px / 30px | yes |
| tab-bar | height / rule | 48px / inset -1px rgba(209,217,224,.7) | 48px / same | yes |
| tab-counter | box / bg | 21.9×20 / rgba(129,139,152,.12) | 21.9×20 / same | yes |
| tab-counter | line-height | 12px | 18px | no |
| repo-band | height / padding-top | 110 / 16px | 110 / 16px | yes |
| repo-band (dark) | background | rgb(1,4,9) | rgb(13,17,23) | no |
| repo-title | font | 20px/30px, 400 owner / 600 repo, rgb(9,105,218) | same | yes |
| repo-icon | size / colour | 16px rgb(89,99,110) | 16px rgb(89,99,110) | yes |
| header | height / padding / bg | 64 / 16 / rgb(246,248,250) | no signed-in ref (logged-out marketing header 72px, black) | yes |
| header-icon-button | size / border / radius | 32×32 / 1px rgb(209,217,224) / 6px | Primer AppHeader IconButton 32 / --borderColor-default / 6 | yes |
| mobile bell | right inset | 28px | 16px | no |
| pagination-item | height / radius / current bg | 32 / 6px / rgb(9,105,218) | 32 / 6px / rgb(9,105,218) | yes |
| pagination Previous | padding-inline / width | 8px / 89px | 6px / 85.5px | no |
| tabnav-tab (PR) | height | 40px | 40px | yes |
| tabnav-tab (PR) | padding | 8px 16px | 8px 12px | no |
| tabnav-tab (PR) | unselected colour | rgb(89,99,110) | rgb(31,35,40) | no |
| state-link | height / padding | 32 / 0 8px | 30 / 0 8px | no (nit) |
| navlist-item | height | 33px | 32px | no (nit) |
| navlist current bar | w×h / left / top | 4×(h-8) / -8 / 4 | 4×24 / -8 / 4 | yes |
| footer | height / padding-top / padding-bottom | 57 / 16 / 16 | 114 / 48 / 40 | no |
| footer | border-top-width | 1px | 0 | no |
| footer | line-height | 15px | 18px | no |
| breadcrumb | font / root weight | 16px/24px / 600 accent | 16px/24px / 600 accent | yes |

## Summary for the builder (round 2 priorities)

1. Fix the anonymous mobile header: logo next to the hamburger, and a full-width open menu that does not move the toggle.
2. Replace `--text-caption-lineHeight` with `--text-body-lineHeight-small` (18px) in footer, NavList headings and both counters.
3. TabNav: unselected tabs in the default colour, padding 8px 12px, icon gap 8px.
4. Footer: padding 48px/40px, no border-top (or a justified reason to keep it).
5. Decide the dark band colour (`--page-header-bgColor`) and document it.
6. Mobile bell 16px from the edge.

Then the nits: NavList 32px rows, pagination padding and chevron margins, bordered mobile overflow button, breadcrumb separator spacing.
