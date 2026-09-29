# Critique — pages/settings-admin, wave 3, round 1

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30 (04:40–04:55 CST). Served CSS changed several times during the review because other wave-3 builders were deploying. The `@layer gh.pages-settings-admin` block in the served file matched `dist/` byte-for-byte (11,599 B) at both checks, so I did not redeploy.

## Verdict

**Score 7.5 / 10: FAIL (pass needs 8.5 or more).**
- Console errors: 0.
- Literal colors: 0 (lint: 0 errors, 0 warnings, 65 selectors; build-report `pages/settings-admin` status "ok").
- Off-palette colors: 0 across 76 captures.
- Smoke test: green (12/12 steps, `shots/20260930-045323-smoke-github-auto/smoke.json`).

The components this folder styles are accurate to Primer: Subhead, 440px form controls, the Danger-zone Box, btn-danger states, DataTable header and cells. The settings pages still read as re-skinned Gitea, not github.com, for these reasons:
- There is no settings page header.
- Gitea-only structures are left untreated: inline label+input rows, a form inside the push-mirror table Box, description-only Boxes, the avatar block.
- All org settings pages are currently broken by a cross-folder selector collision (issue 1). The cause is not this folder, but the page ships broken.

## Evidence
- Run: `shots/critic-pages/settings-admin-r1/` (19 routes × light/dark × 1440/390 = 76 captures, plus 50 state PNGs).
- Routes file: `shots/critic-pages/settings-admin-routes.json`. It adds danger-button hover/focus/press/disabled, repo-name focus, primary hover, a `submitEmpty` validation on the repo settings form (rejected server-side, nothing saved), the delete-repo modal at 390, the Run button hover/focus/press, and the delete-account button hover.
- Crops: `shots/critic-pages/settings-admin-r1/crops/`.
- Reference: github.com settings pages need a login, so there is no logged-out reference. I measured Primer React FormControl on the Primer storybook (`components-formcontrol-features--with-caption`, `shots/critic-pages/primer-formcontrol-caption.png`):
  - label 14px / 600 / 21px line-height
  - 4px gap above the input
  - input 32px high
  - caption 12px / 18px line-height, 4px margin-top, `--fgColor-muted`
- Primer CSS 22.3.2 specs:
  - `$sidebar-narrow-width` is md 240px and lg 256px.
  - `.form-group .form-control` is 440px wide.
  - Subhead values come from the github.com Subhead spec (24px / 400, 8px bottom padding, 1px `--borderColor-muted` rule, 16px bottom margin).

## Issues (most important first)

1. **BLOCKER (owned by pages/people): org settings layout is broken on every org settings page.**
   - Cause: `src/pages/people/org.css:17`, `:115` and `:259` (`.organization > .flex-container`) are meant for the org header band. They also match the settings container, because `templates/org/settings/layout_head.tmpl:4` renders `.page-content.organization.settings > .ui.container.flex-container`.
   - Effect at 1440: the whole settings area gets a `--bgColor-muted` full-bleed band (y 184–1228). `align-items: center` pushes the nav column down to y=583 (it should be 88px under the tabs).
   - Effect at 390: `flex-direction: row` beats Gitea's column stacking. The main column is squeezed to about 70px, Danger-zone text breaks one letter per line, and the document is 434px wide on a 390px viewport (horizontal overflow true).
   - Screenshots: `org-settings/light-1440.png`, `org-settings/light-390.png`, `crops/org390s.png`.
   - The builder's own r1 capture (`shots/pages-settings-admin-r1/org-settings/light-390.json`: width 390, no overflow) predates the change to people/org.css, which was modified at 04:52.
   - Fix (people): scope to the header, e.g. `.organization > .flex-container:not(:has(> .flex-container-nav))` or `:first-child`.
   - Optional hardening here: reset `.page-content.organization.settings > .flex-container:has(> .flex-container-nav)`, setting background, box-shadow, clip-path, padding, align-items stretch, and flex-direction column below 768px.

2. **MAJOR: no github.com settings page header.** The 48px avatar, name, "Your personal account" and "Go to your personal profile" are missing from user settings. On github.com this is the most recognisable part of the settings page. It needs a template override, so it is a request, not CSS (SA-2 in integrator.md). Screenshot: `user-settings/light-1440.png`.

3. **MINOR: description-only text is boxed.** On applications ("Authorized OAuth2 Applications", "Manage OAuth2 Applications"), security ("Manage OpenID Addresses") and the access-token list (the description is the Box's first row), the description is wrapped in a bordered Box.
   - Cause: the exclusion `:has(> .flex-divided-list > .item:first-child > p:only-child)` does not match. In `user/settings/applications.tmpl:8` and `grants_oauth2.tmpl:6` the first `.item` holds bare text, not a `<p>`.
   - This is inconsistent with the keys page, where the description stays on the page. A Box holding one sentence is not a GitHub pattern; GitHub uses page text or a Blankslate.
   - Screenshots: `crops/apps.png`, `crops/security-openid.png`.

4. **MINOR: the sidebar width at 768–1011px is 220px.** Primer Layout `sidebar-narrow` at md is 240px (`$sidebar-narrow-width: (md: 240px, lg: 256px)`); 220px is `$sidebar-width` sm. Measured at 900px: nav w=220, main x=252. The gutter (16px) is correct.

5. **MINOR: repo settings still has Gitea-only form structures.**
   - The push-mirror add form sits inside the table Box, in a `<tfoot>`. The Git Remote URL input is 903px wide, not 440px, and the long "Mirror Interval…" inline label runs about 700px (`crops/rs-mirror.png`).
   - The Code Statistics Indexer row is misaligned. The label, the SHA code chip and the button have different vertical centres; the button is about 16px lower than the label (`crops/rs-admin.png`). At 390 there is a 55px gap before the button.
   - The "External Issue Tracker Number Format" radios wrap mid-phrase ("ABC-123 , DEFG-/234") (`crops/rs-adv.png`).

6. **MINOR: the admin definition-list rows are 29px high.** Padding is 4px 16px (dt/dd) plus 8px on the dl, not the "8px 16px Box rows" the builder claimed. Primer Box-row condensed is 8px 16px, so rows would be 37px (`site-admin/light-1440.measure.json` dl-dt / dl-dd).

7. **MINOR (the `.help` style belongs to controls; the layout here only sets display): caption rhythm.**
   - Measured `.help`: 12px, 15px line-height, 7.2px padding-bottom (Gitea's 0.6em), 4px margin-top.
   - Primer FormControl.Caption: 12px, 18px line-height, 4px margin-top, no bottom padding.

8. **NIT: the admin panel width is inconsistent with the settings pages.** The admin panel keeps Gitea's fluid container (nav x=32, main to x=1408 at 1440), while user/repo/org settings use x=112–1328. The builder gave a reason (12-column repos table), but github.com has one settings width. The 1280px container could still be used, with the table scrolling inside its Box as it already does.

9. **NIT: Danger-zone rows at 390 wrap descriptions to 6–8 lines.** github.com's `Box-row d-flex flex-items-center` behaves the same, so this is not a deviation. Recorded only because the builder asked.

10. **NIT: Gitea-only leftovers.**
    - Avatar sections: "Choose new avatar" is indented 14px under the radio.
    - Token "Delete" buttons carry a trash icon; GitHub uses a text-only `btn-danger btn-sm`.
    - Team rows use a 16px title (known gap).
    - `gitea-colorblind-*` non-Octicons in the theme dropdown: 16 per capture, belongs to the icons folder.

## Verified OK (measured, not just claimed)
- **Subhead, repo settings, light, 1440:**
  - 936×45, 24px / 400 / 36px line-height, padding-bottom 8px, margin-bottom 16px, later headings margin-top 32px.
  - Border: light rgba(209,217,224,0.7), dark rgba(61,68,77,0.7), i.e. `--borderColor-muted`.
- **Grid at 1440:** nav x=112 w=256; main x=392 w=936 (gutter 24px).
- **Form controls:** text input 440×32, radius 6px, 12px inline padding. Label 14px / 600, 4px to the input. 16px between fields.
- **Validation:** submitting an empty repo name gives the flash plus a red input border. The server rejects it; nothing was changed.
- **Danger zone:**
  - Box: 1px border (light #cf222e, dark #da3633) = `--borderColor-danger-emphasis`, radius 6px.
  - Rows: 16px padding, muted separator. Title 14px / 600, body 14px `--fgColor-default`.
- **btn-danger states (light):**
  - Rest: bg #f6f8fa, fg #d1242f, border #d1d9e0, 32px.
  - Hover: bg #cf222e, fg white.
  - Press: bg #a40e26.
  - Focus: 2px solid #0969da, offset -2px.
  - Disabled: faded.
  - Dark rest: bg #212830, fg #fa5e55.
- **Maintenance "Run" button (default):** rest bg #f6f8fa, fg #25292e, hover #eff2f5, press #e6eaef, focus 2px #0969da offset -2px, icon muted.
- **Admin DataTable:** th 12px / 600, `--fgColor-muted` on `--bgColor-muted`, 8px 16px padding. td 14px / 21px line-height, 8px 16px padding. Box radius 6px, border #d1d9e0.
- **Audit:** 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette across 76 captures. Max CLS 0.0027 on my second run (0.0106 on the first). Horizontal overflow only on org-settings at 390 (issue 1).
- **Overlays:** the add-key panel, theme dropdown and delete-repo modal (1440 and 390) render correctly; the dropdown and modal belong to overlays.

## What would reach 8.5
- Issue 1 fixed by pages/people, or guarded here.
- Issue 3: unbox description-only first rows. Matching `.item:first-child:not(:has(.item-main, .item-leading))` works for both markups.
- Issue 4: 240px at md.
- Issue 5: treat the push-mirror tfoot form and the indexer row.
- Issue 6: 8px 16px rows.
- Issue 2 goes through the integrator as a template request. Without it the ceiling is about 8.5, with everything else exact.
