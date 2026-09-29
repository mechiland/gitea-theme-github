# Critique: pages/settings-admin, wave 3, round 2

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30, 05:10–05:25 CST.

## Verdict

**Score 8.0 / 10: FAIL (pass needs 8.5 or more).**

| Check | Result |
|---|---|
| Console errors | 0 |
| Failed requests | 0 |
| Literal colours | 0 (lint: 0 errors, 0 warnings, 103 selectors; `dist/build-report.json` pages/settings-admin status "ok", 34,234 B) |
| Off-palette colours | 0 across 96 captures |
| Unresolved variables | 0 |
| Horizontal overflow | none |
| Max CLS | 0.0027 |
| Smoke test | green, 12/12 steps (`shots/20260930-051901-smoke-github-auto/smoke.json`) |

The served `@layer gh.pages-settings-admin` block matches `dist/` byte for byte (18,457 B), so I did not redeploy. The rest of the served file differs from dist because other folders are deploying.

Every r1 CSS issue I re-measured is fixed:
- **Org settings blocker:** the settings grid has a transparent background, no box-shadow, align-items stretch and row direction. At 390 the page is 390 px wide.
- **Description rows:** description text is no longer boxed.
- **Sidebar width:** 240 px at 900 and 256 px at 1440.
- **Admin rows:** 37 px, padding 8px 16px.
- **Admin width:** the admin panel uses the same width as the other settings pages.
- **Forms:**
  - Push-mirror and tracker inputs are 440 px.
  - The indexer row sits on one centre line (label, SHA chip and button all at cy = 3886).
  - The tracker-format radios are stacked.
  - The `<br>` gap is gone.
- **Delete buttons:** text only.
- **Danger-zone wrapping:** the rows wrap correctly at 390.

The score is below 8.5 because the most recognisable part of a github.com settings page, the account header, is still not on the live pages (issue 1). The remaining issues are small.

## Evidence
- Run: `shots/critic-pages/settings-admin-r2/`
  - 24 routes × light/dark × 1440/390 = 96 captures, plus state PNGs.
  - States: danger hover/focus/press/disabled, repo-name focus, primary hover, `submitEmpty` validation (the server rejects an empty repo name; nothing is saved), transfer and delete modals at 1440 and 390, Run button hover/focus/press, delete-account hover, theme dropdown, add-key panel.
- Routes: `shots/critic-pages/settings-admin-routes-r2.json`. It is r1's file plus org-settings-labels, org-settings-hooks, user-settings-orgs, repo-settings-deploykeys and admin config/settings.
- Probe scripts (read-only): `shots/critic-pages/sa-r2-probe.mjs` (grid at any width) and `shots/critic-pages/sa-r2-eval.mjs`.
- Crops: `shots/critic-pages/settings-admin-r2/crops/`:
  - repo settings 1440 light/dark: `rs-l-*.png`, `rs-d-*.png`
  - repo settings 390: `rs390-*.png`
  - push-mirror table at 390: `rs390-mirror.png`
  - secondary routes: `sheet-light.png`, `sheet-dark.png`
- Reference: github.com settings pages need a login, so there is no logged-out capture. The targets are:
  - Primer CSS 22 SCSS: `forms/form-group.scss` (`.form-control` 440 px, `.note` 12 px with a 4 px top margin) and `$sidebar-narrow-width` (md 240, lg 256).
  - The r1 Primer storybook FormControl measurement (`shots/critic-pages/primer-formcontrol-caption.png`): label 14/600/21, caption 12/18 with a 4 px top margin.

## Issues (most important first)

1. **MAJOR: the github.com settings page header is still missing on the live pages.**
   - Route: user-settings, all schemes and widths. `document.querySelector('.gh-settings-header')` returns null on /user/settings.
   - `header.css` is shipped but matches nothing until the integrator applies SA-4 (`docs/requests/integrator.md`).
   - I checked the SA-4 template against the Gitea 1.27.3 source. `ctx.CurrentWebTheme.InternalName`, `StringUtils.HasPrefix`, `.HomeLink`, `ctx.AvatarUtils.Avatar . 48` and the locale keys `your_settings` / `your_profile` all exist, so the override should work as written.
   - The builder's injected screenshot (`shots/pages-settings-admin-r2/header-injected/light-1440.png`) matches the github.com layout: 48 px round avatar, 20 px semibold name, muted subtitle, default button on the right, 24 px below.
   - Remaining difference: the copy reads "Settings" / "Profile" instead of "Your personal account" / "Go to your personal profile", because Gitea has no locale keys for those strings.
   - This is not the builder's fault, but the shipped page does not have it.

2. **MINOR: the push-mirror table at 390 is Fomantic's stacked mobile table.**
   - Route: repo-settings, light/dark, 390. PNG: `crops/rs390-mirror.png`.
   - The three `<th>` render as three separate grey 37 px rows ("Pushed repository", "Direction", "Last update"), followed by an empty 17 px `th` row.
   - Each `tr` is `display: block` with Gitea's `14px 0` padding, so "No push mirrors configured" sits in a 65 px row. There is also a 14 px white strip above the header rows.
   - GitHub DataTable does not stack header cells. Expected: hide the `thead` in this settings table below 768 px (or keep the table and let it scroll), and use 8px 16px cell rows.
   - Measured in DOM: `thead tr` padding 14px 0, `th` display block, h = 37/37/37/17.

3. **MINOR (belongs to controls, SA-C1): caption line-height.**
   - `.help` in repo settings: 12 px / 15 px line-height, 4 px top margin, 0 bottom padding. The bottom padding is fixed.
   - In org settings a `.help` measures 12 px / 20 px, so captions are also inconsistent between pages.
   - Primer FormControl.Caption: 12 px / 18 px.

4. **MINOR: repo "Advanced Settings" feature toggles are a ragged inline column.**
   - Route: repo-settings, 1440 and 390. PNGs: `crops/rs-l-1.png`, `rs-l-2.png`, `rs390-1.png`.
   - "Code", "Wiki", "Issues", "Projects", "Releases", "Packages" and "Pull Requests" are inline semibold legends, each followed by a checkbox. Each checkbox starts at a different x (about 60/53/67/80/92/97/123 px from the column edge), so the checkboxes never form a column.
   - At 390, "Code" wraps its checkbox onto a new line while "Wiki" stays inline.
   - github.com's repo "Features" section is a vertical list of checkboxes with bold labels and muted captions, all aligned. Expected: stack the legend above the checkbox, the same treatment already given to the inline text fields.
   - The same pattern appears in "Template ☐ Make repository a template" and "Repository Size 2.3 MiB" in Basic Settings.

5. **NIT: the token-row info icon is 16 px next to 12 px text.**
   - Route: user-settings-applications, 1440. Measured: `.item-body svg` 16×16 against a 12 px / 19.5 px line.
   - Cause: `keys.css` sizes `.item-body .svg` only on rows whose leading icon is `.octicon-key`, and access-token rows do not match that selector. The icon visibly overhangs the text line.

6. **NIT: Gitea-only leftovers (known gaps, confirmed).**
   - "Choose new avatar" stays inline beside the file button and is indented 14 px under the radio on user settings. Repo and org settings show it inline too.
   - The "Add Webhook" and "Add Deploy Key" Subhead actions are green primary buttons. github.com uses a default btn-sm for "Add webhook" and "Add deploy key" (primary green is only for "New SSH key"). The class comes from Gitea's template, so the colour is controls' decision, but the page reads greener than github.com.
   - The "Test Cache" button in the admin config definition list is a small green primary button.
   - There are 28 `gitea-colorblind-*` non-Octicons in the theme dropdown (appearance, 4 captures) and 12 `gitea-gitea/feishu/matrix` webhook-type icons per hooks page. Both belong to the icons folder.

7. **NIT: people's org header-band descendant rules can still reach the org settings column.**
   - Examples: `.organization:not(.profile) > .flex-container img.ui.avatar` (24 px, radius-small) and `.flex-relaxed-list > :not(.ui.header) { display: none }`. SA-P1 in `docs/requests/pages-people.md` is not applied yet.
   - I found no visible damage: no org settings page in the seed renders avatars or a `.flex-relaxed-list` in the column, and blocked users is empty. SA-P1 should still land.

## Verified OK (measured)

**Grid**
- At 1440, on repo, user, org and admin settings: nav x=112 w=256, main x=392 w=936, 24 px gutter.
- At 900: nav 240, main x=272, gap 16.
- At 390: stacked, nav 358, main 358, document 390.

**Org settings (r1 blocker)**
- Grid background transparent, box-shadow none, align-items stretch.
- Nav at y=184, directly under the tabs.
- Subheads have box-shadow none and align-items center.
- Screenshots: `org-settings/light-1440.png`, `org-settings/dark-390.png`.

**Subhead**
- 936×45, 24 px / 400 / 36 px line-height, padding-bottom 8, margin-bottom 16, later Subheads margin-top 32.
- Border: light rgba(209,217,224,0.7), dark rgba(61,68,77,0.7).

**Form controls**
- Inputs are 440×32, radius 6, 12 px inline padding: repo_name, website, push_mirror_address, push_mirror_interval, external_tracker_url.
- Label 14/600 with 4 px below it.

**Danger zone**
- Box border: light #cf222e, dark #da3633. Radius 6. Rows padded 16. Title 14/600/21.
- Button: 32 px, 14/500. Light: fg #d1242f on #f6f8fa. Dark: fg #fa5e55 on #212830.
- Hover fills red (`states/dark-1440-danger-hover-clip.png`). Focus draws a 2 px accent ring (`states/light-1440-danger-focus-clip.png`).
- At 390 each button sits under its description.

**Token rows**
- Description on the page, rows boxed.
- First row has top radius 6 and border #d1d9e0; rows padded 16.
- 32 px key icon (green when recently used).
- Title 14/600; body 12 px muted.
- Delete is text only: 28 px, 12/500, padding 0 8.

**Admin**
- Definition-list rows: 37 px, 8px 16px, key 14/600, and a full-width group rule.
- DataTable: th 12/600 muted on #f6f8fa with 8/16 padding; td 14/21 with 8/16 padding. Admin repos scrolls inside its Box.
- Maintenance "Run" buttons are default buttons.

**Validation**
- An empty repo name gives a flash error plus a red input border (`states/light-1440-validation.png`).

## What would reach 8.5
- SA-4 applied by the integrator. This is the main gap.
- Issue 2 (push-mirror table at 390) and issue 4 (feature toggles as an aligned vertical list) fixed in this folder.
- SA-C1 (18 px caption line-height) landed in controls.
