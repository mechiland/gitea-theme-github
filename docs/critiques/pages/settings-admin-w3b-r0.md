# Critique: pages/settings-admin, wave 3b, round 0

Critic: independent GitHub design-systems reviewer (no theme code written). Date: 2026-09-30. Re-scored from scratch.

## Verdict

**Score 8.6 / 10: PASS** (≥ 8.5, 0 console errors, 0 literal colours, smoke green).

The github.com settings page header (SA-4) is now live on every `/user/settings/*` page I captured (8 routes × light/dark × 1440/390, `.gh-settings-header` matched = 1 on all 32). Its geometry and control specs match Primer. It is not a perfect copy: the header strings come from Gitea locale keys, and two settings pages that have no `pageClass` fall outside both the header and the folder's Subhead/Box styling. The r4 deploy-keys empty-state issue is still open. These keep it at "matches with nits", not higher.

| Check | Result |
|---|---|
| Lint `node build/lint.mjs pages/settings-admin` | 0 errors, 0 warnings, 114 selectors |
| Build | `dist/build-report.json` pages/settings-admin: status "ok", 11 files, 38,283 B src; the minified `@layer gh.pages-settings-admin{…}` block in `dist/theme-github-auto.css` is 14,814 B (plus small `gh-important` parts), under the 16 KB budget |
| Served vs dist | `theme-github-auto.css` served = dist, byte-identical (282,796 B). No redeploy |
| Template | `CUSTOM_PATH/templates/user/settings/layout_head.tmpl` is identical to the project copy. It is gated on `github-*` theme + pageClass containing "settings" |
| Captures | 96 pages (24 routes × 2 schemes × 2 widths), 0 problems, 0 failed states |
| Console errors / failed requests | 0 / 0 |
| Off-palette / unresolved vars | 0 / 0 |
| Non-Octicon icons | 52: `gitea-colorblind-*` on the appearance page, `gitea-gitea/feishu/matrix` webhook type icons. Icons folder, not this one |
| Max CLS | 0.0024 |
| Smoke | green, 12/12 steps, 0 console errors (`shots/20260930-100125-smoke-github-auto/smoke.json`) |

## Evidence
- Run: `shots/critic-pages/settings-admin-w3b-r0/` (`--states --measure`), log `shots/critic-pages/settings-admin-w3b-r0.log`. Routes: `shots/critic-pages/settings-admin-routes-w3b-r0.json` (r4 routes; header measures on all `/user/settings*` routes; new user-settings states `hdr-btn-hover/focus/press` and `hdr-link-hover`). Extra routes: `shots/critic-pages/settings-admin-routes-w3b-r0-extra.json` (`/user/settings/actions/general`, `/user/settings/hooks`, 1440 only).
- github.com reference (logged out), 1440 light/dark with states: `docs/reference/critic-sa-w3b-repo-btn/` (btn-sm Notifications, hover and focus) and `docs/reference/critic-sa-w3b-releases-blankslate/`. Routes: `shots/critic-pages/settings-admin-gh-ref-w3b-r0.json`. Logged-out github.com has no settings pages, so the header spec comes from Primer CSS (`utilities/typography.scss` `.h3`: 18px mobile / 20px md+, bold; `.lh-condensed` 1.25) and the btn spec.
- Screenshots reviewed: `user-settings/{light-1440,dark-390}.png`, `user-settings/states/*-hdr-*-clip.png` (light and dark), `user-settings-keys/{light-1440,dark-390}.png`, `repo-settings-deploykeys/light-1440.png`, `org-settings/dark-1440.png`, `user-settings-appearance/dark-1440.png`, `site-admin-users/{light-1440,dark-390}.png`, `site-admin/dark-1440.png`, `repo-settings/light-390.png` and states `danger-{hover,focus,press,disabled}`, `delete-modal-open`, `modal-open`; `admin-repos/light-390.png`, `admin-user-edit/light-1440.png`, `repo-settings-hooks/states/dark-1440-add-open.png`, `user-settings-actions-general/light-1440.png`, `user-settings-hooks/dark-1440.png`.

## Header (SA-4) verification: measured
- `.gh-settings-header`: 1216×51 at 1440 (358×51 at 390), gap 8/16, margin-bottom 24px (Primer `mb-4`). Nav and main columns start 24px below it.
- Avatar: 48×48, radius 9999px, ring `0 0 0 1px` rgba(31,35,40,.15) light / rgba(255,255,255,.15) dark (Primer `--avatar-borderColor`).
- Title: 20px / 600, colour #1f2328 / #f0f6fc. Link hover underlines (states `hdr-link-hover`, both schemes).
- Subtitle: 14px / 21px, #59636e / #9198a1 (fgColor-muted).
- Button: 32px high, padding 0 12px, radius 6px, 14px/500/20px, bg #f6f8fa / #212830, border #d1d9e0 / #3d444d, fg #25292e / #f0f6fc, resting shadow rgba(31,35,40,.04) 0 1px 0 in light. Hover, focus and press look the same as github.com's default btn (`g.png` crop: our Profile button next to github.com's Notifications btn-sm, hover and focus, both schemes). Focus is a 2px accent ring hugging the border, as on github.com.
- 390: avatar, name and button stay on one row, because "Profile" is short. No horizontal overflow (`document.horizontalOverflow` false on every 390 capture).

## Issues (most important first)

1. **MINOR (template/locale, integrator): header strings do not match github.com.** The subtitle reads "Settings" (`your_settings`) where github.com says "Your personal account", and the button reads "Profile" (`your_profile`) where it says "Go to your personal profile" (`user-settings/light-1440.png`). Gitea 1.27.3 `locale_en-US.json` has no closer key. The only fix is a literal English string in the github-only branch, which would not translate. That is a policy call for the integrator, so I record it here and do not count it against the folder.
2. **MINOR (this folder + template gate): the Actions › General settings pages get neither the settings header nor the folder's Subhead/Box styling.** Upstream `user/settings/actions_general.tmpl` and `org/settings/actions_general.tmpl` call `layout_head` with `(dict)`, so there is no pageClass. The SA-4 `StringUtils.Contains .pageClass "settings"` gate is false there, and every rule in `subhead.css` is scoped `:is(.settings, .admin) .flex-container-main …`. Result on `/user/settings/actions/general` (`user-settings-actions-general/light-1440.png`): no avatar header (every other user-settings page has one, e.g. `user-settings-hooks/dark-1440.png`), and the "Cross-Repository Access" / "Actions Token Permissions" sections render as grey-header Boxes instead of the Subhead pattern used on the sibling pages. The org variant shares the same shared template; I infer it from the source and did not screenshot it. Fix in the folder: add a scope that does not depend on pageClass, e.g. `.page-content:has(> .ui.container > .flex-container-nav)`, or at least `.page-content:has(.flex-container-nav)`, alongside `:is(.settings, .admin)`. Fix in the template (integrator): also test for the `user/settings` layout itself, e.g. drop the pageClass condition, since `user/settings/layout_head` is used only by user settings pages (plus the packages cleanup preview, pageClass "user packages admin", which also misses the header).
3. **MINOR (this folder, open since r4): deploy-keys empty state is bare text.** `repo-settings-deploykeys/light-1440.png` shows "There are no deploy keys yet." flush left under the Subhead, while branch protection uses a bordered Blankslate. Same suggested selector as r4: `.ui.attached.segment:has(> #add-deploy-key-panel.tw-hidden):not(:has(.flex-list))`. SSH/GPG keys still show descriptions only. Gitea emits no empty-state text there (`keys_ssh.tmpl`), so github.com's "There are no SSH keys associated with your account." cannot be reproduced without a template. Recorded, not counted.
4. **NIT: header title metrics.** Ours is 20px/600 with a 30px line height at every width. Primer `.h3.lh-condensed` (what github.com's settings header uses, per Primer utilities, not measured live) is 20px at md+ and 18px below 768px, with line-height 1.25 (25px). The header is 51px tall and would be about 48px (the avatar height) with the condensed line height.
5. **NIT (from r4, unchanged):** native ▸ disclosure markers on the applications page token rows; Subhead action buttons use Primer React condensed small padding (0 8px) where github.com's `.btn-sm` measures 3px 12px (`docs/reference/critic-sa-w3b-repo-btn/light-1440.measure.json`: 28px, 3px 12px, 12/500/20).
6. **NIT: admin tables at 390 scroll inside the Box without a scroll affordance.** `site-admin-users/dark-390.png`, `admin-repos/light-390.png`: columns are cut at the Box edge. github.com does the same, so this is noted only.

## Measurements (ours vs github.com / Primer)
| control | property | ours | github / Primer | ok |
|---|---|---|---|---|
| settings header | height / margin-bottom | 51px / 24px | Primer `mb-4` 24px; ~48px with lh-condensed | ok (nit) |
| header avatar | size / radius / ring | 48×48 / 50% / 1px rgba(31,35,40,.15) | 48 / circle / `--avatar-borderColor` | ok |
| header title | font | 20px/600/30px | `.h3.lh-condensed` 20px/600/25px (18px < 768) | nit |
| header subtitle | font / colour | 14px/21px #59636e / #9198a1 | 14px fgColor-muted #59636e / #9198a1 | ok |
| header button | height / pad / radius | 32 / 0 12 / 6 | Primer btn medium 32 / 0 12 / 6 | ok |
| header button | colours light | bg #f6f8fa, border #d1d9e0, fg #25292e | github btn #f6f8fa / #d1d9e0 / #25292e | ok |
| header button | colours dark | bg #212830, border #3d444d, fg #f0f6fc | github btn #212830 / #3d444d / #f0f6fc | ok |
| focus ring | width / colour | 2px #0969da / #1f6feb | 2px accent (github focus clip, visually equal) | ok |
| Subhead | size / border | 24/400/36, padding-bottom 8, mb 16 | Primer Subhead 24/400, borderColor-muted | ok |
| input | size | 440×32, radius 6, pad 0 12, border #d1d9e0 / #3d444d | form-control 32, radius 6 | ok |
| primary btn | colours | 32, 14/500, #1f883d / #238636 | btn-primary 32, 14/500, same | ok |
| NavList group header | font | 12/600/18, #59636e | ActionList group heading 12/600 muted | ok |
| btn-sm (Subhead actions) | padding | 0 8px | github `.btn-sm` 3px 12px | nit |
| Blankslate | padding | 32 16 | github 32 32 | nit |

## What would reach 9+
Scope the Subhead/Box rules so pages without a pageClass are covered (issue 2), box the deploy-keys empty state (issue 3), and use the condensed title metrics (issue 4). The header strings (issue 1) need an integrator decision.
