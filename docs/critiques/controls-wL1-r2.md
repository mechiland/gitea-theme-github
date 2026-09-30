# Critique: controls, wave L1, round 2 (final gate #1, follow-up to controls-wL1-r1)

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score: 8.7 / 10. PASS.** Score ≥ 8.5, 0 console errors, 0 literal colours (lint), 0 off-palette colours on this folder's surfaces, and smoke is green.

## Verification (my own runs)
- `node build/lint.mjs controls`: 0 errors, 0 warnings, 308 selectors. `npm run build` gives `folders.controls = {status: "ok", lintErrors: 0, files: 11}`.
  The build is over budget theme-wide; that is not specific to this folder.
- Served CSS vs dist: the sha1s differ. The served file dates from 12:59:12. The only `src` files newer than that are
  `src/pages/people/{org,media,profile}.css`, which belong to another folder. All `src/controls/*` files are older (newest 12:58:38), so the controls part of the served CSS is current and I did not deploy.
- Gitea capture: `shots/critic-controls-r2` (routes `shots/critic-controls-wL1-r2-routes.json`: 23 routes, light and dark, 1440 and 390, `--states --measure`).
  - The directory also holds older rounds' pages; the counts below cover only this round's 23 routes.
  - Result: 92 pages, 84 state shots, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colours.
  - Non-Octicon icons: only `gitea-npm` (package brand) and `fontawesome-openid` (login OpenID button). Neither is in this folder.
  - One page was transient: `cc-dash-issues` dark-390 was served with `data-theme=gitea-auto`, because other sessions' shoot or smoke runs were switching the admin theme at the same time. I recaptured it and it came back clean.
- github.com reference (logged out): `shots/critic-controls-wL1-r2-ref` (cc-org-projects, cc-explore-repos, cc-login, `--states --measure`).
  The github explore-repos search-focus state failed (reference selector), so I compared against org-projects instead.
- Probes: `shots/critic-controls-wL1-r2-probe.mjs` and scratch scripts. Evidence is in `shots/critic-controls-r2/probe/`.
- Smoke: `node tools/shoot/smoke.mjs --theme github-auto` → **green**. All 12 steps passed with 0 console errors (`shots/20260930-130720-smoke-github-auto`,
  log `shots/critic-controls-wL1-r2-smoke.log`). The admin theme was left at github-auto.

## Builder claims checked
1. **FG-048 repo projects list: CONFIRMED.**
   - /octo-org/theme-playground/projects now has the leading search icon, the same as /octo-org/-/projects (`probe/proj-tops.png`, `probe/proj-390.png`).
   - Input: 1102x32 at 1440 and 244x32 at 390, padding 0 12 0 32, 14px / 20px.
   - Border: rgb(209,217,224) light, rgb(61,68,77) dark. Radius 6px. Inset shadow as github.
   - Icon button: 32x32 and transparent. The svg is 16x16 in rgb(89,99,110) light and rgb(145,152,161) dark, identical to the github.com /orgs/github/projects leading visual.
   - Repo issues are unchanged: trailing IconButton, input padding 0 8 0 12.
2. **Static icon colour: CONFIRMED.** The icon-hover clip is pixel-identical to rest (`cc-projects-list/states/*-icon-hover-clip.png`). This matches github.com.
3. **Focus ring inside the box: CONFIRMED.**
   - Search fields: ring rows 16-17 and 46-47 in the clip, the same as the github.com reference rows. Colours are rgb(9,105,218) light and rgb(31,111,235) dark (`probe/focus-sheet.png`).
   - Login: ours and github both draw a 40px input with a 2px ring on its outer edge (ours rows 41-42 / 79-80, github 16-17 / 54-55).
   - Other controls: the error-state input shows a 2px ring at -2px in rgb(207,34,46) light and rgb(218,54,51) dark. The comment textarea and the keyboard-focused `.ui.selection.dropdown` (settings/branches) have 2px accent rings inside the box, with no ancestor clipping (`probe/focus2-sheet.png`, `probe/dark-select-tabfocus.png`).
   - This matches Primer CSS `focusBoxShadowInset` (border plus 1px inset, all inside the box).
4. **Caption spacing: CONFIRMED on /repo/migrate**, with 8px from the caption to the item checkboxes (`probe/help-sheet.png`). The builder's scan was incomplete, though: see issue 2.

## Measurements (ours vs github.com)
| control | property | ours | github | ok |
|---|---|---|---|---|
| repo projects search TextInput | height / font / line-height | 32 / 14 / 20px | 32 / 14 / 21px | yes |
| repo projects search TextInput | padding-left (text start) | 32px | 32px | yes |
| repo projects search TextInput | radius / border light / border dark | 6 / rgb(209,217,224) / rgb(61,68,77) | same | yes |
| search leading icon | size, colour light / dark | 16x16, rgb(89,99,110) / rgb(145,152,161) | same | yes |
| search leading icon | hover colour | unchanged | unchanged | yes |
| search focus ring | width / colour light / colour dark / rows in the 64px clip | 2px / rgb(9,105,218) / rgb(31,111,235) / 16-17, 46-47 | same | yes |
| login input focus | height / ring rows | 40px / outer 2px rows | 40px / outer 2px rows | yes |
| error input focus | ring | 2px rgb(207,34,46) inside the box | Primer danger focus | yes |
| migrate caption to checkbox group | gap | 8px | Primer CheckboxGroup caption → first option 8px | yes |
| org actions settings caption → next field | gap | 22px (was 14px before this round) | 16px (stack) | no (nit) |
| dependency Select | height | 28px, ring inside | small Select 28px | yes |

## Issues (ranked)
1. **NIT: the focus ring on the leading icon touches the placeholder text, and the focus order runs backwards.**
   - With the icon button keyboard-focused, its 32px ring's right edge is at x=32 and the text starts at x=33, so there is no gap before "Search projects…". Evidence: `cc-projects-list/states/{light,dark}-1440-icon-focus-clip.png` (bottom two rows of `probe/focus-sheet.png`).
   - The icon also takes focus after the input although it sits before it visually. On github.com the leading visual is never focusable.
   - The builder listed this as a known gap (it needs a template change). An alternative that stays within CSS would be to draw the ring 2px narrower on the right. The item stays open.
2. **NIT: the `.form .help:has(+ .field)` rule reaches more pages than the builder reported.**
   - The builder said the only other non-last caption is on repo/create. The rule also matches `shared/actions/permission_mode_select.tmpl` on repo, org and user Actions settings pages.
   - There it helps: the gap from caption to radio group goes from 0 to 8px.
   - It also matches the org Actions "Cross-Repository Access" caption above `.field.tw-mt-4`. The margins do not collapse there, so the gap grew from 14px to 22px, which is off the Primer spacing scale.
   - Evidence: `probe/help-sheet.png` (last panel), plus a probe that removes the rule (22 → 14).
   - Visually harmless, but it is an unreported side effect. A possible fix: `.form .help:has(+ .field:not([class*="tw-mt-"]))`.
3. **INFO (not scored):** the state tool's `focus` action cannot focus `.ui.selection.dropdown` because the div has tabindex -1, so `select-focus` shows the rest state. The keyboard probe confirms the ring does work.

## Out of scope (FYI, other folders)
- navigation: at 390px the navbar avatar is still cut off at the right edge (the 17px horizontal scroll from r1), visible in `probe/proj-390.png`.
- `fontawesome-openid` on the login page and `gitea-npm` on packages are non-Octicon icons (icons folder).
