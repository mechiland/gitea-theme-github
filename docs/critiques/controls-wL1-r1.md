# Critique: controls, wave L1, round 1 (final gate #1: FG-048 / FG-060 / FG-089 + SA-C1 / IP-C3)

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score: 8.3 / 10. FAIL**, because the score is below 8.5. Console errors, literal colours and smoke all pass.
One selector change (below, already verified by injection) should take it to about 8.6.

## Verification done (own runs, not the builder's)
- `node build/lint.mjs controls`: 0 errors, 0 warnings, 308 selectors. `npm run build`: `folders["controls"].status = "ok"`
  (the budget overage is theme-wide, not this folder).
- The served `/assets/css/theme-github-auto.css` has the same sha1 as `dist/` (8553ff20…), so no deploy was needed.
- Gitea capture: `shots/critic-controls-r1` (own routes `shots/critic-controls-wL1-r1-routes.json`, 19 routes, light + dark, 1440 + 390,
  `--states --measure`). Results: 76/76 pages ok, 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours,
  0 unresolved vars, 0 unlayered Gitea CSS. The only non-Octicon icon is `gitea-npm` (package-type brand logo, not this folder).
- github.com reference (logged out): `docs/reference/cc-{org-projects,org-members,branches,explore-repos}` with `--measure`,
  plus a search-focus state on /orgs/github/projects. Primer docs: FormControl caption measured on primer.style.
- Probes with my own Playwright script: `shots/critic-controls-r1/probe/*.png`.
- Smoke: `node tools/shoot/smoke.mjs --theme github-auto` → **green** (12/12 steps, 0 console errors,
  `shots/20260930-124837-smoke-github-auto`). The admin theme is still github-auto.

## Measurements (ours vs github.com)
| control | property | ours | github | ok |
|---|---|---|---|---|
| search TextInput (org projects, admin users/orgs, explore, members, teams, unadopted) | height / font | 32px / 14px | 32px / 14px | yes |
| search TextInput | padding-left (text start) | 32px | 32px (orgs/*/projects, orgs/*/people) | yes |
| search TextInput | radius / border (light) / border (dark) | 6px / rgb(209,217,224) / rgb(61,68,77) | 6px / rgb(209,217,224) / rgb(61,68,77) | yes |
| search TextInput | inset shadow (light) | rgba(31,35,40,.04) 0 1px 0 inset | same | yes |
| search leading icon | size, offset from input box | 16x16 at x=8, y=8 | 16x16 at x=8, y=8 | yes |
| search leading icon | colour light / dark | rgb(89,99,110) / rgb(145,152,161) | same | yes |
| search TextInput | focus ring | 2px rgb(9,105,218) (dark rgb(31,111,235)), outline offset -1px, so 1px outside the 32px box | 2px same colours, fully inside the 32px box | nit |
| repo projects list search (/octo-org/theme-playground/projects) | layout | input padding-left 12px + joined trailing 32x32 button, bg rgb(246,248,250) | leading icon, padding-left 32px (the org projects list here matches) | **no** |
| dependency Select + '+' IconButton (theme-playground/issues/2) | height | 28 / 28 (293x28, 28x28) | same size in a group | yes |
| label edit dialog Name / Description / Color | height / font | 32 / 32 / 32, all 14px | Primer medium 32px | yes |
| settings/branches default-branch value | colour | rgb(31,35,40) fgColor-default | fgColor-default | yes |
| form caption `.help` | size / line-height / weight | 12px / 18px / 400, muted | Primer FormControl.Caption 12px / 18px / 400 | yes |
| SegmentedControl (graph Mono/Color) | height, selected item | 28px, selected item bgColor-default with border | Primer SegmentedControl small | yes |

## Issues (ranked)
1. **MINOR: FG-048 is still incomplete on a brief route.** The repo projects list keeps the joined, Semantic-style trailing search
   button, while the org projects list has the leading icon. Evidence: `shots/critic-controls-r1/probe/sheet-top-light-a.png`
   (org projects vs repo projects) and `cc-projects-list/*.measure.json` (input padding 0 12 0 12, button 32x32 with bg
   rgb(246,248,250) and a 1px border).
   - Cause: pages/issues-prs has already narrowed its scope to `.repository.milestones:not(.projects)` (their note in
     docs/requests/controls.md, and it is in src and deployed). controls still excludes plain `.repository.milestones`, so on
     `.repository.projects.milestones` neither folder lays out the search.
   - Fix (controls/inputs.css, the 5 leading-visual selectors plus the comment):
     `:not(:is(.issue-list, .milestone-issue-list, .repository.milestones) .list-header-search > *)` →
     `:not(:is(.issue-list, .milestone-issue-list, .repository.milestones:not(.projects)) .list-header-search > *)`.
   - Verified with `--theme-css` (sed of dist): repo projects 1102x32, padding-left 32px, leading icon 32x32 transparent.
     Milestones and repo issues are unchanged (trailing, pages/issues-prs). Evidence: `shots/critic-controls-r1-proposed/`,
     `probe/sheet-proposed.png`.
2. **NIT: the claimed hover change on the search icon does not show.** `.ui.button > .svg { color: --fgColor-muted }` (buttons.css) pins
   the svg. On hover the button's `color` changes to rgb(31,35,40), but the svg stays rgb(89,99,110) (light) and
   rgb(145,152,161) (dark) (probe on /-/admin/users). Visually this matches github.com, whose leading visual is static. Either
   drop the dead hover rule or target the svg; do not claim the effect.
3. **NIT: the leading icon is a tab stop after the input, but sits before it visually.** The focus ring draws on the left 32px
   (`cc-admin-users/states/*-icon-focus-clip.png`, `probe/admin-users-390-tab.png`). On github.com the leading visual is
   decorative and never focusable. This is acceptable because it keeps Gitea's submit control, but the focus order runs
   right-to-left.
4. **NIT: the focus ring extends 1px outside the box.** It measures 34px outer vs github's 32px (ring pixels 15–16 / 47–48 vs 16–17 / 46–47 in the
   same clip). This follows Primer React TextInput (outline offset -1px), so it is not a regression. Listed only for completeness.
5. **NIT: SA-C1 site-wide `padding-bottom: 0` on `.help`.** On /repo/migrate the "Access Token is required…" caption sits about 6px above
   the disabled Labels/Issues checkboxes (`probe/migrate-light.png`). It is readable, but tight next to the field rhythm elsewhere.

## Builder claims checked
- FG-048 32px / 14px / padding 32px / button 32x32 at x=0: **confirmed** on admin users/orgs, org projects, explore repos,
  org members, org teams and unadopted. Dashboard /issues is trailing 352+82+32, all 32px: **confirmed**. "fgColor-default on hover":
  **not visible** (issue 2).
- FG-060: the builder listed it as open. **It is now aligned**: pages/issues-prs applied CT-FG060, and the select and button both measure 28px
  in light and dark (`cc-issue-dep/states/*-dep-open-clip.png`). The ⇕ glyph matches Primer's Select ArrowIndicator (up and down).
- FG-089 a/b/c: **confirmed** (label dialog 32/32/32 at 14px on edit and new; "main" in fgColor-default; captions wrap
  to the 734px field). d is forwarded (not reviewed here).
- SA-C1: **confirmed** (12 / 18 / 400 / muted on org settings and repo create).
- IP-C3: the merge button stays green with the merge-style menu open in light and dark (`cc-pr-merge/states/*-merge-menu-open-clip.png`).
  The graph SegmentedControl renders correctly (`probe/sheet-seg.png`). As the builder said, the merge check runs with
  pages/issues-prs' workaround still active.

## Out of scope (FYI for other folders, not scored)
- navigation: at 390px the navbar avatar (`.gh-app-header-avatar`) ends at x=407, a 17px horizontal page scroll on
  /octo-org/theme-playground/projects, /issues/2 and /pulls/16.
- PR merge-style menu rows are about 54px tall (lazy PullRequestMergeForm CSS). Primer ActionList items are 32px (pages/issues-prs or overlays).
