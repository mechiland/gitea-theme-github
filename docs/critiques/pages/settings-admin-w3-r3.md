# Critique: pages/settings-admin, wave 3, round 3

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30.

## Verdict

**Score 8.2 / 10: FAIL (pass needs 8.5 or more).**

| Check | Result |
|---|---|
| Lint | 0 errors, 0 warnings, 111 selectors (`node build/lint.mjs pages/settings-admin`) |
| Build | `dist/build-report.json` pages/settings-admin status "ok", 11 files, 39,627 B |
| Served vs dist | the `@layer gh.pages-settings-admin` block is byte-identical (20,680 B) and the forms.important rule is served, so I did not redeploy |
| Console errors | 0 (96 captures) |
| Failed requests | 0 |
| Off-palette colours | 0 |
| Unresolved variables | 0 |
| Literal colours | 0 |
| Non-Octicon icons | 52, all owned by the icons folder (appearance colorblind icons, webhook-type icons) |
| Max CLS | 0.0138 on user-settings-applications dark-390. The shift source is `span.item-title` (see issue 2) |
| Smoke | green, 12/12 steps (`shots/20260930-053549-smoke-github-auto/smoke.json`) |

I re-measured all 8 of the builder's claims and they hold (details under "Verified"). The score stays below 8.5 for two reasons:
- The github.com settings page header is still absent. SA-4 has not been applied (`templates/` holds only `custom/footer.tmpl` and `base/head_style.tmpl`).
- Two new in-folder defects showed up this round: the token title wraps at 390, and the webhook "Add" button has a square focus ring.

## Evidence
- Run: `shots/critic-pages/settings-admin-r3/`
  - 24 routes × light/dark × 1440/390, with `--states --measure`.
  - Log: `shots/critic-pages/settings-admin-r3.log`.
- Routes: `shots/critic-pages/settings-admin-routes-r3.json`. This is the r2 routes plus new states:
  - hooks: add-hover, add-focus, add-press, add-open at 1440 and 390
  - deploy keys: add-hover, add-focus, add-open
  - admin config: test-hover, test-focus
- My delete-hover state on applications failed because my selector was wrong (the row container is `.flex-divided-list > .item`). That is a tooling mistake, not a theme issue, and it accounts for the 2 "pagesWithProblems".
- Probes (read-only):
  - `shots/critic-pages/sa-r3-eval.mjs`
  - `sa-r3-focus.mjs` (keyboard focus-visible)
  - `sa-r3-hover.mjs` (rest and hover computed colours)
- Crops in `shots/critic-pages/settings-admin-r3/crops/`:
  - repo settings 1440: `rs-l-0..4.png`, `rs-d-0..4.png`
  - push mirror at 390: `rs390-mirror-light.png`, `rs390-mirror-dark.png`
  - button states: `btn-states-sheet.png`
  - hooks focus and open menu: `hooks-focus-zoom.png`, `hooks-open.png`
  - access tokens: `apps-l.png`
  - page sheets: `sheet-{light,dark}-{0..3}.png`
  - 390 sheets: `m390-{light,dark}.png`
- Reference: github.com settings pages require a login, so there is no logged-out capture. The targets used are:
  - Primer CSS 22 SCSS: `buttons/button.scss` (focus via `focusOutline` 2px, offset -2px; btn-sm 28px; default rest/hover tokens) and `forms/form-group.scss` (440px control, caption 12px).
  - The r1 Primer storybook FormControl measurement (label 14/600, caption 12/18 with a 4px top margin).

## Issues (most important first)

1. **MAJOR (blocked on integrator): the github.com settings page header is still missing on the live pages.**
   - Where: user-settings, every scheme and width (`user-settings/light-1440.png`). `templates/user/settings/layout_head.tmpl` has not been overridden, so `header.css` matches nothing.
   - Missing on the page: the 48px avatar, name, "Your personal account" and the "Go to your personal profile" button. This is the most recognisable element of github.com /settings.
   - This is not something the folder can fix. It is still what separates "looks like GitHub" from "is GitHub", and it caps the score.

2. **MINOR (this folder, keys.css): the access-token title drops below its disclosure triangle at 390, and this row is where the CLS comes from.**
   - Where: user-settings-applications, light/dark, 390 (`crops/m390-dark.png`, 4th column).
   - Rows "omp-merge-202609221407" and "omp-ts-hello-202609221405" render the ▸ marker alone on line 1 and the name on line 2.
   - Measured:
     - The `summary` is 205px wide and 42px tall (21px for "theme-seed").
     - `.item-title` has x offset 0 and dy 21. It is `display: inline-flex` from Gitea's flex-list.css, so the atomic inline box can't share a line with the list-item marker once it is wider than the space left.
   - The first-render layout shift (0.0138, sources `div.item-body` and `span.item-title`) is this wrap. It is not the 12px info icon the builder suspected.
   - Expected, as on GitHub token lists: the name wraps next to the marker. `details > summary .item-title { display: inline }` within the folder's token-row selector would do it, or hide the marker and use an Octicon chevron.

3. **MINOR (this folder's Subhead action): the "Add Webhook" keyboard focus ring is square.**
   - Where: repo-settings-hooks, light/dark, 1440 (`states/light-1440-add-focus-clip.png`, `crops/hooks-focus-zoom.png`). The same shared template `repo/settings/webhook/base_list.tmpl` serves the org, user and admin hooks pages.
   - Tab focus lands on `.ui.jump.dropdown` (the div wrapper, `:focus-visible` true), not on the button.
   - Measured:
     - Outline 2px `rgb(9,105,218)`, offset -2px, **border-radius 0px** around a radius-6 button.
     - The deploy-key button and the admin Test button get a correct rounded ring (radius 6).
   - Expected: `border-radius: var(--borderRadius-medium)` on the settings Subhead `.ui.jump.dropdown`, so the ring follows the button (Primer `focusOutline`).

4. **NIT: the "Merge Styles" heading sits 19px above its first checkbox; every other legend sits 6–7px above.**
   - Where: repo-settings 1440 (`crops/rs-l-2.png`).
   - Cause: `<p>` "Merge Styles" (margin-bottom 4) is inside its own `.field` (margin-bottom 16), and the checkbox starts in the next field.
   - Measured: gap 19px. "Code", "Pull Requests" and "Signature Trust Model" are 7, 7 and 6px.

5. **NIT: Gitea-only leftovers.** None of these blocks a pass.
   - Native ▸ disclosure markers remain on the token names, "Generate New Token", "Create a new OAuth2 Application" and push-mirror "Authorization".
   - Empty states are plain text instead of a Primer Blankslate: SSH/GPG keys shows only descriptions, deploy keys shows "There are no deploy keys yet.", branch protection shows "There are no protected branches."
   - "Add to Reindex Queue" and admin repos' "Unadopted Repositories" are still green primary buttons for secondary actions.
   - The ✓/✗ flags on admin users are glyphs rather than Primer Labels.
   - "Username  *" shows a wider asterisk gap than "User visibility *" on user-settings.

## Verified (re-measured this round)

1. **Feature toggles.** Every checkbox starts at x=0 from the column edge at 1440 and at 390: Template, Code, Wiki, Issues, Projects, Releases, Packages, Pull Requests and all 6 merge styles. Label-to-control gap is 7px. Screenshots: `rs-l-1.png`, `rs-l-2.png`.
2. **Nested sub-options.** Indented 24px: "Enable Time Tracking" and the other 3 tracker options at x=24, the wiki branch field, the Projects Mode select, and user "Choose new avatar" (`user-settings/light-1440.png`).
3. **Push mirror at 390.**
   - `thead` is absolute and 1px (visually hidden).
   - Rows: `tr` padding 4px 0, `td` padding 4px 16px. The "No push mirrors configured" row is 37px.
   - The grey header rows are gone in light and dark (`rs390-mirror-*.png`).
4. **Captions.** 12px/18px with a 4px top margin on repo settings (every `.help`) and on org settings (was 20px).
5. **Token info icon.** 12×12 against a 12px/19.5px line. Its centre is within 1.25px of the line centre.
6. **Secondary buttons.**
   - "Add Webhook", "Add Deploy Key" and the config "Test" are 28px, 12/500, padding 0 8px, radius 6.
   - Light: bg #f6f8fa, fg #25292e, border #d1d9e0, hover #eff2f5.
   - Dark: bg #212830, fg #f0f6fc, border #3d444d, hover #262c36.
   - The user "Add Key" (SSH) correctly stays green, matching GitHub's "New SSH key".
7. **Test Cache row.** The button clears the Box's bottom border (`btn-states-sheet.png`).
8. **Org settings.** No header-band damage (`sheet-light-0.png`).

**Unchanged and still correct**
- Grid: nav 256 / main 936 at 1440.
- Subhead: 936×45, 24/400/36, 1px `rgba(209,217,224,.7)` bottom border, 16px margin.
- Inputs: 440×32, radius 6, padding 0 12px.
- Labels: 14/600/20 with a 4px margin.
- Danger box: 1px #cf222e (dark #da3633), radius 6.
- Danger button: 32px, 14/500, fg #d1242f on #f6f8fa. Focus ring 2px #0969da, offset -2px, radius 6.
- Admin definition-list rows: 37px, 8px 16px.
- DataTable: th 12/600 on #f6f8fa, td 14/21 at 8px 16px.
- Validation state and modals render as in r2.

## What would reach 8.5
- SA-4 applied by the integrator (the main gap).
- Issues 2 and 3 fixed in this folder. Both are one-rule fixes.
