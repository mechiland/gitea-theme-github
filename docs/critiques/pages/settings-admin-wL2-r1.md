# Critique: pages/settings-admin, wave L2, round 1

Critic: independent GitHub design-systems reviewer (no theme code written). Date: 2026-09-30. Scored from scratch.

## Verdict

**Score 8.5 / 10: PASS, only just** (≥ 8.5, 0 console errors, 0 literal colours, smoke green).

The FG2 work is real and visible in my own captures:
- **FG2-032:** Blankslates now have a 24px muted Octicon, 8px gap and 32px padding. That matches the bordered Blankslates on github.com's /security page and the Hello-World empty-releases page.
- **FG2-040:** Subheads stack at 390, toggles stay on their row, and the admin NavList follows the content.
- **FG2-042:** the TOTP section is a Box row, the org avatar form is a right-hand column, and the ▸ markers are gone.

Visually this is the best settings round so far. It does not score higher because this round introduced one real regression and left two issues from the previous critique open:
- **Regression:** the admin pages at 390 now have a layout shift of about 0.24 on load, because the NavList moved below the content.
- **Carried over:** the deploy-keys Blankslate still loses its Box while the add form is open, and the demoted buttons still have no disabled state.

The CLS regression should be fixed next round. If it is still there in round 2, I will score below 8.5.

| Check | Result |
|---|---|
| Lint `node build/lint.mjs pages/settings-admin` | 0 errors, 0 warnings, 183 selectors |
| Build | `dist/build-report.json` → pages/settings-admin: status "ok", 15 files, 66,505 B src. All three themes are over budget (auto 321.2 KB, light 316.2 KB, dark 317.2 KB). That is for the integrator |
| Served vs dist | `theme-github-auto.css`: served and dist are byte-identical (328,906 B) after a concurrent deploy. No redeploy by me |
| Captures | 100 pages (25 routes × light/dark × 1440/390), all with `--states --measure`, 0 problems |
| Console errors / failed requests | 0 / 0 |
| Off-palette | 0 |
| Unresolved vars | `--gh-octicon-calendar` is live (matchedElements 3) on admin-dashboard-config-settings: the datetime-local inputs of the maintenance and banner forms. The rule is in `src/controls/inputs.css:381`, so it belongs to **controls**, not this folder. Recorded, not counted |
| Non-Octicon icons | 24: `gitea-gitea/feishu/…` in the webhook type menu (icons folder) |
| Horizontal overflow | none |
| Max CLS | **0.2482** (admin-repos dark-390); also 0.2355 light-390, and 0.0612 on site-admin-users 390. See issue 1 |
| Smoke | **green**, 13/13 steps, 0 console errors (`shots/critic-pages/settings-admin-wL2-r1-smoke.log`, `shots/20260930-170214-smoke-github-auto/`) |

## Evidence

- **Ours:** `shots/critic-pages/settings-admin-wL2-r1/` (log `shots/critic-pages/settings-admin-wL2-r1.log`). The routes file is `shots/critic-pages/settings-admin-routes-wL2-r1.json`: the wL1-r1 critic routes with every state, plus the builder's states, plus these new ones:
  - security: `enroll-hover` and `enroll-focus`
  - org-settings: `file-focus` and `update-hover`
  - config settings: `toggle-hover` and `datetime-focus`
  - site-admin-config: `test-hover`
  - new routes: user-settings-appearance and admin-user-edit
- **Output path:** the brief named `shots/critic-pages/settings-admin-r1`, but that folder already holds wave-3 critic evidence. I wrote to `settings-admin-wL2-r1` so this round's states are not mixed with stale ones. My first run, killed after a few seconds, overwrote `site-admin-config/light-*` and `site-admin-users/light-1440` in the old w3 folder.
- **Probes:**
  - `shots/critic-pages/settings-admin-wL2-r1-probe.mjs` → `-probe.json`. It records the Blankslate `::before` icon metrics, demoted-button rest/hover/active/disabled colours, security row geometry, org-row alignment, the org avatar column, the collab Remove buttons and the config Test row.
  - `shots/critic-pages/settings-admin-wL2-r1-cls.mjs` records layout-shift sources.
- **github.com reference (logged out, `--measure`, light and dark, 1440 and 390):** `docs/reference/critic-sa-l2-{blankslate,security,projects}/`, routes in `shots/critic-pages/settings-admin-gh-ref-wL2-r1.json`:
  - Hello-World releases: Blankslate with a 24px icon.
  - pemistahl/grex /security: two bordered Blankslate Boxes, one with a heading and description, one with a one-line heading.
  - Hello-World projects: Blankslate with a 32px icon and a 20px heading.
- **Primer spec:** primer/react `Blankslate.module.css` via WebFetch. Medium size: padding 32, heading `--text-title-shorthand-medium` (20px), description body-large (16px). Small size: 24px visual, heading title-small (16px), description body-medium (14px). All sizes: visual margin-block-end 8px; the border variant is 1px `--borderColor-default` with radius medium.
- **Screenshots reviewed:**
  - repo-settings-deploykeys: `light-1440`, `states/light-1440-add-panel`
  - repo-settings-hooks: `dark-1440`, `states/*-add-focus/press-clip`
  - repo-settings-branches: `light-1440`
  - user-settings-keys: `light-1440`
  - user-settings-applications: `light-1440`, `states/{light,dark}-1440-token-open-clip`
  - user-settings-security: `light-1440`, `dark-390` (crop), `states/light-1440-enroll-focus-clip`, `dark-1440-enroll-hover-clip`
  - org-settings: `light-1440`, `states/light-1440-file-focus-clip`, `dark-1440-update-hover-clip`
  - user-settings-orgs: `light-1440`
  - repo-settings-collab: `light-1440`
  - site-admin-users: `light-390` (crop)
  - admin-repos: `light-390` (crop), `states/dark-1440-unadopted-hover-clip`
  - admin-dashboard-config-settings: `light-1440`, `dark-390` (crop), `states/light-1440-toggle-hover-clip`, `dark-1440-toggle-focus-clip`, `{light,dark}-1440-openwith-open-clip`
  - site-admin-config: `states/light-1440-test-hover-clip`
  - repo-settings: `light-390` (crop)
  - user-settings: `dark-390` (crop)
  - site-admin: `light-390` (crop)
  - Reference: `critic-sa-l2-blankslate/light-1440`, `critic-sa-l2-security/light-1440`

## Verified fixes

- **FG2-032 Blankslates (probe, light and dark):**
  - deploy keys, webhooks (repo and org), branch protection, SSH, GPG, OAuth2 grants and OAuth2 apps all render a Box: 936px wide, padding 32px, 1px border #d1d9e0 / #3d444d, radius 6px, centred text.
  - The `::before` icon is 24×24 with margin-bottom 8px, filled `--fgColor-muted` (#59636e / #9198a1).
  - One-liners use the heading style 16/600/24 in `--fgColor-default` ("There are no deploy keys yet.", "There are no protected branches.").
  - Descriptions are 14/400/21 muted.
  - This matches the github.com /security reference: a bordered Box, a centred 24px muted Octicon, and a one-line semibold heading.
- **Collaborators:** the add row is a muted Box footer (`--bgColor-muted` #151b23 dark) under the Teams list. With no collaborators it becomes the Box header: 16px padding, left-aligned (`repo-settings-collab/light-1440`).
- **FG2-040 at 390:**
  - The Subheads stack. On site-admin-users the heading is 121px tall ("User Account / Management (Total: 5)", balanced), with the button 80px down, left-aligned at 0.
  - admin-repos fits "Repository Management (Total: 11)" on one line.
  - The config toggles stay on their label's row (`cfg dark-390`), and the maintenance datetime fields stack 16px apart.
  - The admin NavList follows the content (`order: 1`, with a muted rule above it), and `docW` is 390, so there is no horizontal overflow.
- **FG2-042:**
  - **Security, TOTP:** the section is a grid Box row with 16px padding. The enroll button (32px) is vertically centred on the row (probe: button mid − row mid = 0). The status line is 12px #59636e. WebAuthn is a Box.
  - **Org settings:** from 1012px the avatar form sits in a right-hand column at x=1032 (296px wide) beside the 608px settings form.
  - **Config Test button:** 4 / 28 / 5 px inside a 37px dd, so it is centred.
- **Disclosure chevrons:** the token rows and the "Open with" help text show a 16px muted chevron-right that rotates down when open. Checked in light and dark (`token-open-clip`, `openwith-open-clip`).
- **Demoted buttons (probe, "Add Webhook", "Add Security Key", "Update Avatar"):**
  - Light: rest #f6f8fa, hover #eff2f5, active #e6eaef, border #d1d9e0, text #25292e, shadow `0 1px 0 rgba(31,35,40,.04)`.
  - Dark: #212830, #262c36 and #2a313c, border #3d444d.
  - All are Primer default-button values. The focus ring is a 2px accent outline (`add-focus-clip`, `enroll-focus-clip`).

## Issues (most important first)

1. **MAJOR (this folder, a regression from FG2-040): the admin pages at 390 now jump on load.**
   - **Measured CLS:** admin-repos 0.2482 (dark-390) and 0.2355 (light-390); site-admin-users 0.0612.
   - **Before this change:** admin-repos 390 was 0.0031 in the wL1-r1 run (`shots/critic-pages/settings-admin-wL1-r1/admin-repos/dark-390.json`).
   - **Shift source** (`-cls.mjs`, PerformanceObserver): the whole `div.flex-container-nav` first paints at y≈389 and moves to y≈744 at t≈75 ms. The content above it grows after first paint, so the NavList, now placed below the content by `.admin .flex-container-nav { order: 1 }` in `layout.css`, is visible and then pushed down 355px.
   - **Navigation reported the same:** see "FYI from navigation" in the request file.
   - **Fix options:**
     - Give the moved NavList `content-visibility: auto` with `contain-intrinsic-size`, so it does not paint in the first viewport.
     - Keep nav-first and collapse it instead, which needs markup (the builder's known gap).
     - Find what grows in `.flex-container-main` in the first 75 ms and reserve its height.
   - Re-measure with `--only admin-repos,site-admin-users --viewports 390`. The target is CLS < 0.05.
2. **MINOR (this folder, carried over from wL1-r1 #2 and not addressed): the deploy-keys Blankslate still reverts to bare, left-aligned text once "Add Deploy Key" opens the panel.**
   - Evidence: `repo-settings-deploykeys/states/light-1440-add-panel.png`; probe `dk-open`: border 0px, padding 0px, `::before` none.
   - The cause is the selector `:has(> #add-deploy-key-panel.tw-hidden:last-child)` in `blankslate.css`.
   - This is a one-condition fix. Wrap the text node's container instead, or drop `.tw-hidden` and exclude only the panel.
3. **MINOR (this folder): the collaborators section with nobody added is a Box header with no body.**
   - `repo-settings-collab/light-1440`: a lone muted 66px bar with a search field and "Add Collaborator". It has no empty-state row under it.
   - On github.com, "Manage access" shows a Blankslate ("You haven't invited any collaborators yet") under the header.
   - The text needs a template. Until then, a 1px-bordered empty Box-body with the people Octicon (the `people` mask the FG2 brief named) would read as a Blankslate rather than a stray toolbar.
4. **MINOR (this folder): the Blankslate type scale mixes the Primer sizes and sits below github.com.**
   - Ours: medium padding (32) with small-size text: 16px heading, 14px description.
   - Primer medium: 20px heading, 16px description.
   - github.com references: releases heading 24/600/36 (`critic-sa-l2-blankslate` measure); projects heading 20/600; the /security bordered Box uses a ~20px heading.
   - The one-liners at 16/600 match the second /security Box, so this is close. A description-only Blankslate (webhooks, SSH/GPG, OAuth2) has no heading, so it reads as a boxed paragraph.
   - The OAuth2 grants text ("You have granted access to … these third-party applications. Please revoke access for applications you no longer need.") reads wrong as an empty state. That is template copy, recorded only.
5. **MINOR (report accuracy): the "single rule instead of three" claim for demoted buttons does not match the source.**
   - `src/pages/settings-admin/buttons.css` was last modified at 12:23, before this wave. It still has separate rest, `:hover` and `:active` rules with direct `--button-default-*` values.
   - No `--button-primary-*` remapping exists anywhere in the folder (`grep button-primary src/pages/settings-admin` → none).
   - The computed colours are right (see verified fixes), but the request-file note (line 167) describes a change that was not shipped.
   - Same area, still open from wL1-r1 #7: `#register-webauthn[disabled]` keeps its rest colours (probe `webauthnDisabled`: #f6f8fa / #25292e / #d1d9e0). The token remap the builder describes would have fixed this.
6. **NIT (this folder): the org avatar column has no "Profile picture" heading or image.** Only a bold "Choose new avatar" label, a 296px file input and two buttons. The column sits 200px right of the 440px inputs, and the form's divider spans 608px, wider than its inputs (`org-settings/light-1440`). The image needs a template (a builder gap).
7. **NIT (this folder, partly fixed): the description-less org row "ai" sits 2px high.** Probe: titleMid 253 vs avatar 255, improved from 3.5px. Row descriptions are `--fgColor-default`; github.com uses muted text for these.
8. **NIT (still open from w3b-r0): row-action padding.** "Leave" and "Delete" are 0 8px. github.com `.btn-sm` is 3px 12px (earlier reference `critic-sa-l1-btn`).
9. **NIT (still open): header title** is 20/600/30. Primer `.h3.lh-condensed` is 18px below 768 with line-height 1.25.
10. **Recorded, not counted:**
    - **Other folders:** `--gh-octicon-calendar` is unresolved on the datetime inputs (controls). Admin tables at 390 cut columns with no visible scroll edge (data-display). Webhook type-menu icons (icons). The ToggleSwitch is 56×24 (controls).
    - **Template:** the org webhooks Subhead reads "Settings". C046 / C076. The TOTP Label.

## What would reach 9+

- Remove the 390 admin CLS (1).
- Keep the deploy-keys Box while the form is open (2).
- Give the empty collaborators section a body (3).
- Use Primer medium Blankslate text, or add a heading where Gitea only has a description (4).
- Actually ship the demoted-button token remap so disabled works (5).
