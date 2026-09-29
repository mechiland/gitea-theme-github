# Critique: foundation, wave 1, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30.

Build and deploy state:
- Lint: `node build/lint.mjs foundation` gives 0 errors, 0 warnings, 44 selectors.
- Build: `npm run build` reports foundation `ok` (10 files, 13172 bytes), revision fa77ade593.
- Served `theme-github-auto.css` has the same SHA-256 as `dist/` (e69157f8…), so I did not deploy.
- The theme is still unregistered, so every capture ran in PREVIEW mode.

**Score: 8.0 / 10. FAIL.** Smoke is red (environment), and the blocker is still live on repo pages.

## Evidence

- Gitea captures: `shots/critic-foundation-r2/`. 22 routes x light/dark x 1440/390 = 88 captures, with `--states --measure`. Routes are in `shots/critic-foundation-r2-routes.json`.
- Built-in baseline (`gitea-auto`, light): `shots/critic-foundation-r2-builtin/`.
- github.com reference (logged out, captured today in r1): `shots/critic-foundation-r1-ref/` and `shots/critic-foundation-r1/probe-github.json`.
- Computed-style, geometry, Tab-focus, ::selection and CLS probe on 22 pages, 3 modes (`preview` = today, `fixed` = proposed inert link, `builtin`):
  - `shots/critic-foundation-r2/probe-{preview,fixed,builtin}.json`
  - Script: `shots/critic-foundation-r2-probe.mjs`
- Fixed-vs-preview screenshots: `shots/critic-foundation-r2/fixed/*.png` (script `shots/critic-foundation-r2-fixedshot.mjs`).
- Crops I looked at, all in `shots/critic-foundation-r2/crops/`:
  - login-light-pair, login-dark-390
  - releases-pair, tags-stars-org, org-compare, compare-ours-builtin
  - keys-ours-builtin, reposettings-ours-builtin, repocreate-ours-builtin
  - states-sheet, dark-390-sheet
  - repo-home-preview-fixed-gh, repo-home-390-preview-fixed
- Smoke: `shots/critic-foundation-r2/smoke.log`.

## Builder claims, verified

| claim | verdict | evidence |
|---|---|---|
| Grid override removed, no horizontal scroll | TRUE | `document.horizontalOverflow` is false on all 88 captures. scrollWidth is 1440/390 on login and signup in both schemes. |
| Release titles 28/400, tag titles 18/400, card names 18/400 | TRUE | Probe values are identical to built-in (releases, tags, stars). |
| Div box header 14/600, h4 box header 15/600 | TRUE | commits "18 Commits" 14/600. org "Teams 3" 14/600. Settings, keys and package h4 are 15/600. |
| Subhead h2 24/400 with muted rule | TRUE | stars and milestone-new are 24/400/36. |
| Nav-to-content gap 24 at 1440 and 390 | TRUE on non-injected pages | stars: nav bottom 139, heading at 163 (1440); 174 to 198 (390). Built-in gap is 14. |
| ::selection falls back to the UA highlight | TRUE on non-injected pages | Computed `::selection` is transparent, as on github.com. On repo-home and file views it is still Gitea's solid rgb(68,147,248) with white text, because of the injection. |
| p bottom margin 10px | TRUE | user-settings intro p mb 10 (built-in 14). No regression on keys, repo-settings, repo-create or org. |
| Lint clean | TRUE | 0/0/44 |
| 4 console errors, all expected 404 | TRUE | 4 on not-found only. 0 failed requests. |
| offPalette 0 from foundation | TRUE | Aggregate `offPalette`: rgb(0,0,0) fills on `svg#svg-mfi-*` file icons (code/icons) and `<mark>` yellow in `.markup` (markdown). Nothing from foundation. 0 unresolved vars. |
| CLS | TRUE, with one exception | Home is 0.059/0.385 vs built-in 0.189/0.394, and commits@390 is 0.056 vs 0.128. repo-home@390 is 0.553 vs 0.252 while the injection is live; with the fix it is 0.274. |

## Issues, most important first

### 1. BLOCKER (integrator, not a foundation file). The inert-link fix is not applied yet

`templates/base/head_style.tmpl` still emits only `rel=preload` plus `@import … layer(gitea)`. On `/octo-org/theme-playground` and on file views such as README.md, `idxLinks` is `["all"]`: Vite's preload helper appends an unlayered index.css, and Gitea's CSS then beats every gh layer.

What users get today on those pages:
- Container 80/1280 at 1440 and x=8 at 390.
- Body line-height 20.
- Gitea kbd (11/11, 2px 4px, 4px radius).
- Dark focus ring rgb(68,147,248); github.com uses rgb(31,111,235).
- Solid ::selection.
- CLS 0.553 at 390 and 0.040 at 1440 (built-in: 0.252 and 0).

The visual difference is large: the Code button is blue, the counts are split, the gutter is 8px (`crops/repo-home-390-preview-fixed.png`, panels 1 and 3).

With the inert `<link rel=stylesheet media="not all">` the problem goes away:
- `idxLinks` is `["not all"]`.
- Container 112/1216, and x=16 at 390.
- Line-height 21.
- Primer kbd 11/10/4/6.
- Focus ring rgb(31,111,235).
- CLS 0.000 at 1440 and 0.274 at 390.

The screenshots confirm it (panels 2 and 4). The diff in `docs/requests/foundation.md` is correct. It has to land before foundation can pass.

### 2. MINOR (foundation `layout.css` together with Gitea's page grid). Sign-in and sign-up card is narrower at 390

`--page-margin-x` changed from 8 to 16px. Together with the very-relaxed page grid, the login card is now at x=50, w=290 at 390. Built-in is x=42, w=306; github.com's form spans 16 to 374 (`crops/login-dark-390.png`). Most of this belongs to pages/auth, but foundation made it 16px narrower. At 1440 the card is unchanged (492/456).

### 3. MINOR (CLS, repo home @390, even with the fix)

With the fix, CLS is 0.274 against 0.252 built-in. ARCHITECTURE §10 says CLS must not exceed built-in. In r1, the same A/B with the foundation layer removed gave 0.21–0.25. The remaining 0.02 is small and may come from other folders, but it is not proven to be zero for foundation.

### 4. NIT. h3 line-height

The h3 rule uses `--text-title-lineHeight-medium` (1.625), so a 20px h3 is 32.5px tall. github.com h3s ("Contributors", "Release list" h2.f3) measure 20/600/30 (1.5, inherited). h1 (32/48), h2 (24/36) and h4 (16/24) match.

### 5. NIT. hr margin

Foundation uses 16px. Primer `base.scss` uses 15px (`margin: 15px 0`). This is invisible in practice.

### 6. NIT, ownership. `.help` is styled by two folders

Foundation `helpers.css .help` (12px, lh 1.5, mt 4) overlaps controls `form.css .ui.form .help, .form .help` (lh 1.25, so 15px), and controls wins inside forms. Different selectors, so lint passes, but form captions are defined twice. Keep `.help` in one folder.

### 7. Environment

- Smoke is red. 11 of 12 steps pass, and `switch-theme-back` times out because `github-auto` is not in the appearance menu until the integrator registers the theme and restarts. The admin theme stays gitea-auto.
- In preview mode, `submitEmpty`/POST states such as login validation-error render the built-in theme, because preview only rewrites GET documents (`login/states/dark-390-validation-error.png` shows the blue Gitea button). Those states say nothing about our theme until the theme is registered.
- The admin's `diff_view_style` is currently `split`, while the recorded baseline is unified. I did not change it (I never visited `?style=`). It needs restoring by whoever owns that.

## What is right (verified)

- Focus: `:focus-visible` is 2px solid `--focus-outlineColor`, offset -2px (inputs -1px). Light rgb(9,105,218) and dark rgb(31,111,235) are identical to github.com Tab focus on non-injected pages. The state clips show a clean ring on links (`crops/states-sheet.png`).
- Body: 14/21, color and background rgb(31,35,40) on white and rgb(240,246,252) on rgb(13,17,23), `color-scheme: dark` in dark. letter-spacing normal.
- Containers: 112/1216 at 1440 and 16/358 at 390 on 20 of 22 pages (all but the two injected ones), the same as github.com container-xl.
- Headings: plain h1 32/600/48 (package), h2 24/600/36 (compare), Subhead 24/400/36 with a muted rule. Component headings are no longer clobbered.
- Code outside markdown: 11.9px in 14px (85%, mono stack). Dividers use `--borderColor-muted`.
- Paragraphs: no visual regression on keys, repo settings, repo create, org home or user settings compared with built-in.

## Measurements (ours vs github.com)

| control | property | ours | github | ok |
|---|---|---|---|---|
| body | font-size / line-height (non-injected) | 14 / 21 | 14 / 21 | yes |
| body | line-height, repo home (injected today) | 20 | 21 | no |
| container @1440 | x / w (20 of 22 pages) | 112 / 1216 | 112 / 1216 | yes |
| container @1440 | x / w, repo home and file view today | 80 / 1280 | 112 / 1216 | no |
| container @390 | x | 16 (8 on repo home and file view) | 16 | partial |
| nav → content gap | px, stars @1440 / @390 | 24 / 24 | 24 | yes |
| link focus-visible | outline, dark | 2px solid rgb(31,111,235), -2px (rgb(68,147,248) on repo home) | 2px solid rgb(31,111,235), -2px | partial |
| link focus-visible | outline, light | 2px solid rgb(9,105,218), -2px | same | yes |
| ::selection | computed bg | transparent (UA); solid rgb(68,147,248) on repo home | transparent (UA) | partial |
| kbd | font / lh / pad / radius | 11/10/4/6 with fix; 11/11/2x4/4 today on repo home | Primer 11/10/4/6 | partial |
| h2 Subhead | size / weight / lh | 24 / 400 / 36 | 24 / 400 / 36 | yes |
| h3 | line-height at 20px | 32.5 | 30 | no |
| div box header | size / weight | 14 / 600 | 14 / 600 | yes |
| code outside markdown | size in 14px text | 11.9 | 12 | yes |
| login page | document width @1440 / @390 | 1440 / 390 | 1440 / 390 | yes |
| login card @390 | x / w | 50 / 290 | 16 / 358 | no |
| repo home @390 | CLS | 0.553 today, 0.274 with fix | built-in 0.252 | no |
