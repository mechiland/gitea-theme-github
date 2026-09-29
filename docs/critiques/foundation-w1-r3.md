# Critique: foundation, wave 1, round 3

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30.

Build and deploy state:
- Lint: `node build/lint.mjs foundation` gives 0 errors, 0 warnings, 43 selectors.
- Build: `npm run build` reports foundation `ok` (10 files, 13635 bytes, 0/0 lint), revision a9593f329a. Every folder is ok.
- Served `theme-github-auto.css` has the same SHA-256 as `dist/` (ac88e7e7…), so I did not deploy.
- The theme is still unregistered (`THEMES =` empty, `DEFAULT_THEME = gitea-auto`, no restart yet), so every capture ran in PREVIEW mode.
- `templates/base/head_style.tmpl` line 6 and `tools/shoot/lib/preview.mjs` line 22 still emit only the preload and `@import … layer(gitea)`. The inert link is still missing.

**Score: 8.0 / 10. FAIL.** Smoke is red (environment), the blocker is still live on repo home and file views, and repo home CLS at 390 is above built-in even with the fix.

## Evidence

- Gitea captures: `shots/critic-foundation-r3/`. 22 routes x light/dark x 1440/390 = 88 captures, with `--states --measure`. Routes are in `shots/critic-foundation-r3-routes.json`. Log: `shots/critic-foundation-r3.log`.
- github.com reference (logged out, captured today): `shots/critic-foundation-r3-ref/` (login, cf-repo-home, cf-releases, explore-repos, cf-commits, with `--measure`).
- Computed-style, geometry, Tab-focus, ::selection and CLS probe, 20 pages x 4 = 80 contexts per mode:
  - `shots/critic-foundation-r3/probe-{preview,fixed,builtin,github}.json`
  - Script: `shots/critic-foundation-r3-probe.mjs`
- Injected-element check (plain h1–h6, hr, code, kbd, small, a.muted, .text.grey, bare .help, form .help, .ui.divider on commits, light and dark). Script: `shots/critic-foundation-r3-q.mjs`.
- CLS A/B, repo home, light 390, 10 runs per mode, using the builder's `shots/foundation-cls.mjs`: `shots/critic-foundation-r3/cls-{fixed,fixed-nofound,builtin}.log`.
- Fixed-vs-preview screenshots: `shots/critic-foundation-r3/fixed/*.png` (script `shots/critic-foundation-r3-fixedshot.mjs`).
- Crops I looked at, all in `shots/critic-foundation-r3/crops/`:
  - login-390 (ours light, ours dark, github.com dark, built-in light)
  - states-sheet, kbd-zoom
  - sheet-a (repo-home and explore, light and dark 1440), sheet-b (user-settings, 404, dashboard dark)
  - dark-390-sheet (releases, repo settings, org, repo home)
  - repo-home-preview-fixed-gh, repo-home-390-preview-fixed
- Smoke: `shots/critic-foundation-r3/smoke.log`, with the failure screenshot in `shots/20260930-012726-smoke-github-auto/FAILED-switch-theme-back.png`.

## Builder claims, verified

| claim | verdict | evidence |
|---|---|---|
| Login and sign-up card at 390 is x=34, w=322; 1440 unchanged | TRUE | The probe gives h4 header x=34 w=322 on login, sign_up, login/openid and forgot_password; the form is x=49 w=292. docW is 390 and 1440 on all four login captures. `crops/login-390.png` shows the card with an even gutter in both schemes. |
| `.ui.grid .ui.container` rule only hits phones and auth pages | TRUE | At 390 it matches only on /user/login and /user/sign_up (2 fluid containers each). It matches nothing on org, profile, compare, issue choose, package, migrate, forgot_password or teams. |
| h3 is 20/600/30 | TRUE | Injected h3 is 20px/600/30px in light and dark, the same as github.com releases h3 (20/600/30). |
| hr margin is 15px 0 | TRUE | Injected hr: margin 15/15, border-bottom 1px `--borderColor-muted` (light rgba(209,217,224,.7), dark rgba(61,68,77,.7)), the same as Primer base.scss. |
| .help is owned by controls only | TRUE | `form .help` is 12/400/15, mt 4, muted rgb(89,99,110) (light) and rgb(145,152,161) (dark). A bare `.help` outside a form is 14px in the default color. Harmless, because Gitea templates never use `.help` outside a form. |
| Lint clean, all folders green | TRUE | 0/0/43. The build report lists every folder as ok. |
| 4 console errors, all the expected 404 | TRUE | The 4 errors are the "Failed to load resource 404" on not-found (4 captures). There are 0 failed requests and 0 unresolved vars. |
| offPalette comes only from other folders | TRUE | rgb(0,0,0) fills on `svg#svg-mfi-*` and Vue file-tree `svg.octicon-file` (code/icons), on repo-home and file view. The yellow is `<mark>` in `.markup` (markdown). Nothing comes from foundation. |
| Repo home CLS 390: fixed 0.242, no-foundation 0.222, built-in 0.218 | ROUGHLY TRUE, but my gap is bigger | My 10-run means are fixed **0.257** (0.222–0.275), fixed without foundation **0.227** (0.210–0.258) and built-in **0.215** (0.204–0.252). Foundation adds about 0.03 (not 0.02), and the fix totals +0.042 over built-in. It is one Gitea shift: `.repo-home-filelist` moves 214→549 with our theme and 204→496 built-in. |
| Blocker unchanged | TRUE | Preview probe: `idxLinks ["all"]` on repo-home and file-md only. Container 80/1280 and 8/374, lh 20, kbd 11/11/2px 4px/4, dark focus rgb(68,147,248), solid selection (light rgb(9,105,218), dark rgb(68,147,248)). CLS is 0.553/0.535 at 390, 0.039 at 1440, and file-md 0.262 at 390 (built-in 0). |

## Issues, most important first

### 1. BLOCKER (integrator, not a foundation file). The inert-link fix is still not applied

The problem has not changed since r2, and it hits the two most-viewed page types, repo home and file view. Vite's preload helper appends an unlayered `index.css`, and Gitea then beats every gh layer. `crops/repo-home-preview-fixed-gh.png` (1440 light) shows the Gitea container at 80/1280 and the blue Code button. `crops/repo-home-390-preview-fixed.png` (dark 390) shows an 8px gutter and split counters.

With the fix (fixed mode), both pages match the rest of the site:
- `idxLinks ["not all"]`
- Container 112/1216 at 1440 and 16/358 at 390
- Body line-height 21
- kbd 11/10/4/6
- Focus ring rgb(31,111,235) in dark
- Transparent ::selection
- file-md CLS 0 at 390

The diff in `docs/requests/foundation.md` #1 is correct and complete. It has to land before foundation can pass.

### 2. MINOR (CLS rule, ARCHITECTURE §10). Repo home at 390 is still above built-in even with the fix

In 10-run means, fixed is 0.257 against 0.215 built-in, and without the foundation layer it is 0.227. Foundation's share is about 0.03: line-height 21 and the 16px gutter make the sidebar taller before the mobile grid reorders it. At 390 dark, the one-off probe gives 0.223 against 0.204. The root cause is Gitea's DOM order (the file list comes before the sidebar), so the real fix belongs to pages/repo, as request #3 says. Until then, the "no worse than built-in" rule is broken on this page.

### 3. MINOR (foundation). Heading margins are still Fomantic

Primer `base/typography-base.scss` sets h1–h6 margin 0/0. Injected plain headings still carry Gitea/Fomantic `calc(2rem - .1428em) 0 1rem`:

| heading | margin-top | margin-bottom |
|---|---|---|
| h2 | 24.57 | 14 |
| h3 | 25.14 | 14 |
| h4 | 25.71 | 14 |
| h6 | 27.96 | 27.96 |

Foundation only zeroes `.ui.header:first-child` margin-top. The brief asks for Fomantic artifacts in base typography to be removed. The practical impact is small, because most Gitea headings are components with their own margins.

### 4. MINOR (pages/repo, triggered by the github.com-correct 16px gutter). Repo home toolbar wraps at 390 with the fix

With the fix, "Go to file" and "Add File" fill the first row and "Code" drops to a second row (`fixed/repo-home-fixed-dark-390.png`). Built-in, with an 8px gutter, fits all of them on one row. This belongs to pages/repo. Foundation's gutter is correct.

### 5. MINOR (pages/auth). Login card at 390 is still inset

It is now x=34/w=322, against github.com's 16/358 (`crops/login-390.png`). The remaining 18px per side comes from Gitea's very-relaxed page-grid column padding, which pages/auth owns. Foundation's part is fixed.

### 6. Environment

- Smoke is red: 11 of 12 steps pass. `switch-theme-back` times out because `github-auto` is not in the appearance menu (the screenshot shows Auto/Dark/Light/Modern…). The theme has to be registered and Gitea restarted by the integrator.
- In preview mode, POST states such as login validation-error render the built-in theme, so they say nothing about foundation.
- The admin's `diff_view_style` is `split`, while the recorded baseline is unified. It was already like this in r2, and I did not change it. The admin theme is `gitea-auto`, and I did not change that either.

## What is right (verified)

- Focus: `:focus-visible` is 2px solid `--focus-outlineColor` at -2px, the same as github.com Tab focus on links and buttons: light rgb(9,105,218), dark rgb(31,111,235), on all non-injected pages. Inputs use -1px, set by controls. The state clips show clean rings and hover underlines on links (`crops/states-sheet.png`).
- Body text is 14/400/21 in rgb(31,35,40) on white and rgb(240,246,252) on rgb(13,17,23), with `color-scheme` light or dark. That is identical to github.com `body` in both schemes and at both widths.
- Container widths: on the 18 non-injected pages the container is 112/1216 at 1440 and 16/358 at 390. github.com's container-xl is 1280 including 32px padding, which gives 112/1216.
- Type: h1 32/600/48, h2 24/600/36, h3 20/600/30, h4 16/600/24, h5 14/600/21, h6 12/600/18. small is 90% (12.6). Code outside markdown is 11.9 (85%) in the mono stack. kbd is Primer 11/10/4/6 with the inset shadow.
- ::selection is transparent (UA highlight), the same as github.com.
- Off-palette colors attributable to foundation: 0. Unresolved vars: 0. Horizontal overflow: none on any of the 88 captures.

## Measurements (ours vs github.com)

| control | property | ours | github | ok |
|---|---|---|---|---|
| body | font-size / weight / line-height, light and dark | 14 / 400 / 21 | 14 / 400 / 21 | yes |
| body | color light / dark | rgb(31,35,40) / rgb(240,246,252) | same | yes |
| body | line-height, repo home and file view (injected) | 20 | 21 | no |
| container @1440 | content x / w (18 pages) | 112 / 1216 | 112 / 1216 | yes |
| container @1440 | x / w, repo home and file view today | 80 / 1280 | 112 / 1216 | no |
| container @390 | x | 16 (8 on repo home and file view) | 16 | partial |
| link focus-visible | light | 2px solid rgb(9,105,218), -2px | same | yes |
| link focus-visible | dark | 2px solid rgb(31,111,235), -2px (rgb(68,147,248) when injected) | 2px solid rgb(31,111,235), -2px | partial |
| mouse focus | outline on click | none (not :focus-visible) | none | yes |
| ::selection | computed bg | transparent; solid on injected pages | transparent | partial |
| h3 | size / weight / line-height | 20 / 600 / 30 | 20 / 600 / 30 | yes |
| h2 / h3 | margin-top / bottom | 24.6 / 14, 25.1 / 14 | Primer 0 / 0 | no |
| hr | margin / border | 15px 0, 1px borderColor-muted | 15px 0, 1px borderColor-muted (Primer) | yes |
| kbd | font / lh / pad / radius | 11 / 10 / 4 / 6 (fixed); 11 / 11 / 2x4 / 4 injected | Primer kbd.scss 11 / 10 / 4 / 6 | partial |
| code outside markdown | size in 14px text | 11.9 | 11.9 (85%) | yes |
| form .help | size / lh / color | 12 / 15 / fgColor-muted | caption 12, fgColor-muted | yes |
| login card @390 | x / w | 34 / 322 | 16 / 358 | no (pages/auth) |
| repo home @390 | CLS (10-run mean) | 0.257 fixed, 0.553 today | built-in 0.215 | no |
