# Critique: foundation, wave 1, round 4

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30.

Build and deploy state:
- Lint: `node build/lint.mjs foundation` gives 0 errors, 0 warnings, 45 selectors.
- Build: `npm run build` reports foundation `ok` (10 files, 14907 bytes, 0/0 lint), revision 133b16acb2. All 14 folders are ok.
- Served files match `dist/` by SHA-256 for github-auto (bba535eb…), github-light (5c859dd1…) and github-dark (057d9caa…). I did not deploy.
- The theme is still unregistered, so every capture ran in PREVIEW mode.
- `templates/base/head_style.tmpl` lines 6–7 and `tools/shoot/lib/preview.mjs` line 22 still emit only the preload and `@import … layer(gitea)`. The inert link is still missing.

**Score: 7.9 / 10. FAIL.**
- The blocker (request #1) is still live on repo home and file views.
- Smoke is red (environment).
- This round's heading-margin change fixes 3 visible headings but introduces a new visible regression: on 6 seeded empty-state pages the heading now touches the 48px icon above it.

## Evidence

- Gitea captures: `shots/critic-foundation-r4/`. 22 routes x light/dark x 1440/390 = 88 captures, with `--states --measure`. Routes are in `shots/critic-foundation-r4-routes.json`. Log: `shots/critic-foundation-r4.log`.
- github.com reference (logged out, captured today, `--measure`): `shots/critic-foundation-r4-ref/` (login, cf-releases, explore-repos).
- Computed-style, geometry, Tab-focus, ::selection and CLS probe, 20 pages x 4 contexts:
  - `shots/critic-foundation-r4/probe/probe-{preview,fixed}.json`
  - Script: `shots/critic-foundation-r4-probe.mjs`
- Plain-heading probe (16 pages x 2 widths, fixed and built-in modes, with crops):
  - Results: `shots/critic-foundation-r4-h/{fixed,builtin}/headings-*.json`
  - Script: `shots/critic-foundation-r4-headings.mjs`
- Contact sheets I looked at, in `shots/critic-foundation-r4/crops/`:
  - `sheet-a.png`: home and repo-home, light and dark, 1440
  - `sheet-b.png`: user-settings dark, org light, explore dark, wiki light
  - `sheet-390.png`: login dark, 404 light, repo-home dark, milestone-new light
  - `states-all.png`: 26 hover and focus clips
- Heading crops, all opened (fixed vs built-in): grex-projects, grex-actions, webhook-new.
- Home CLS A/B, 2 runs per theme: `shots/critic-foundation-r4-home{gh,bi}{1,2}/`.
- Org-home CLS re-runs: `shots/critic-foundation-r4-orgcls{1,2,3}/`.
- Smoke: `shots/critic-foundation-r4-smoke.log`, with the failure screenshot in `shots/20260930-014825-smoke-github-auto/FAILED-switch-theme-back.png`.

## Builder claims, verified

| claim | verdict | evidence |
|---|---|---|
| Injected h1–h6 are 32/48, 24/36, 20/30, 16/24, 14/21, 12/18, weight 600, margin 0/8; a last heading gets 0/0 | TRUE | On commits at 1440, light and dark, the values are exact, and a last-child h3 is 0/0. |
| "Trigger On:", "GMail Settings:" and "Commit Changes" go from 0/14 to 0/8 | TRUE | Built-in gives 0/14 and next gap 14; fixed gives 0/8 and next gap 8. `webhook-new-light-h1.png` reads well. |
| "Only three plain headings are visible" | **FALSE (coverage gap)** | The builder's 14 routes used theme-playground, which has projects, workflows and packages, so no empty states were loaded. The `.empty-placeholder > svg + h2` pattern appears on 6 seeded pages that I checked, and on 2 more in the templates (see issue 2). |
| Repo home and user settings have no plain headings outside markdown | TRUE | The probe finds only `.ui.header` or `file-header` headings there. |
| Lint 0/0/45; every folder passes | TRUE | See build state above. |
| 52 captures: 0 problems, 0 failed requests, 0 unresolved vars, 4 expected 404s | TRUE on my 88 | I found 0 problems, 0 failed requests, 0 unresolved vars and 0 horizontal overflow. The only console errors are the 4 "404 (Not Found)" on not-found. |
| Off-palette colors only on repo home, from other folders | TRUE | cf-repo-home: rgb(0,0,0) fill on `svg#svg-mfi-*` (icons/code) and a yellow `<mark>` in `.markup` (markdown). cf-large-file: `svg.octicon-file` in the file tree (code). None comes from foundation. |
| Home CLS: ours 0.171 / 0.372, built-in 0.189 / 0.394 | TRUE | 2 runs each: ours 0.1711 / 0.3724 both runs; built-in 0.1888 at 1440 both runs, and 0.4068 and 0.3943 at 390. |
| Blocker unchanged | TRUE | See issue 1. |

## Issues, most important first

### 1. BLOCKER (integrator, not a foundation file). The inert-link fix is still not applied

The preview probe shows `idxLinks ["all"]` on repo-home and file-md only. On those two pages:
- Container is 80/1280 at 1440 and 8/374 at 390.
- Body line-height is 20.
- kbd is 11/11/2px 4px/4.
- Dark focus ring is rgb(68,147,248), not rgb(31,111,235).
- ::selection is solid: dark rgb(68,147,248) with white text.
- CLS is 0.500 (light) and 0.551 (dark) at 390, and 0.039 at 1440. file-md is 0.262 at 390.

Evidence: `crops/sheet-a.png` (repo home offset to 80), `crops/sheet-390.png` (repo home 8px gutter).

With the fix (fixed mode), both pages match the rest of the site:
- `["not all"]`
- Container 112/1216 at 1440 and 16/358 at 390
- Line-height 21
- kbd 11/10/4/6
- Dark focus ring rgb(31,111,235)
- Transparent selection
- file-md CLS 0
- repo-home CLS 0.274/0.276 at 390, single run

The diff in `docs/requests/foundation.md` #1 is still correct and complete.

### 2. MAJOR (foundation, new this round). Empty-state headings now touch their icon

**Selector:** `typography.css` rule `:where(h1..h6):where(:not(...))` sets `margin-top: 0`. In Gitea's blankslate (`.empty-placeholder`: a 48px svg followed by an h2), the heading's Fomantic top margin was the only space between the icon and the heading.

**Measured, light, 1440 and 390:**

| page | built-in gap icon→h2 | ours gap icon→h2 | built-in h2→p | ours h2→p |
|---|---|---|---|---|
| `/octo-org/grex/projects` "No projects yet." | 25 | **0** | 14 | 8 |
| `/alice-dev/-/packages` "There are no packages yet." | 25 | **0** | 14 | 8 |
| `/octo-org/grex/wiki` "Welcome to the Wiki." | 25 | **0** | 14 | 8 |
| `/org/octo-org/worktime` "No worktime data yet." | 25 | **0** | 14 | 8 |
| `/octo-org/grex/actions` "The workflow has no runs yet." | 25 | **0** | (last child) | — |

The screenshots show it:
- `shots/critic-foundation-r4-h/fixed/grex-projects-light-h0.png`: the icon sits on the cap height of "No projects yet.".
- `fixed/grex-actions-light-h0.png` shows the same problem.
- `builtin/grex-projects-light-h0.png` is the before image.

Scope and target:
- Octicon icons are not affected in any other way.
- The same template pattern is used by `org/home.tmpl` (empty org), `shared/search/code/search.tmpl`, `repo/actions/no_workflows.tmpl` and `package/shared/list.tmpl`.
- github.com Blankslate has an 8px gap between icon and heading and 4px below the heading (data-display request D-1 measured icon mb 8 on github.com).

Fix: pick one.
- (a) Add `.empty-placeholder *` to the heading-margin `:not()` list, as was done for `.ui.header`. Blankslate spacing then stays with data-display, which owns `.empty-placeholder` (ARCHITECTURE §5), and Gitea's 24.6/14 remains until data-display lands D-1 plus heading margins.
- (b) File a data-display request to set `.empty-placeholder > .svg { margin-bottom: var(--base-size-8) }` and heading `margin-bottom: var(--base-size-4)` before this rule ships.

Option (a) is the safe one for this round.

### 3. MINOR (CLS rule, ARCHITECTURE §10). Repo home at 390 with the fix is still above built-in

I did not re-run the 10-run A/B this round. Single-run fixed values are 0.274 (light) and 0.276 (dark), against r3's 10-run built-in mean of 0.215. The cause is unchanged: Gitea's DOM order puts the file list before the sidebar, which pages/repo owns (request #3).

### 4. NIT (foundation). `[class*="tw-m"]` is a substring match

The exclusion also matches `tw-mx-*`, `tw-max-*`, `tw-min-*` and `tw-mono`. Injected `h3.tw-max-w-full` and `h3.tw-mx-2` keep Fomantic 25.1/14 (or /0). None of the 1.27.3 templates put those classes on a plain heading (grep), so this is only a latent risk. A tighter list would be `[class*="tw-m-"], [class*="tw-mt-"], [class*="tw-mb-"], [class*="tw-my-"]`.

### 5. MINOR (other owners, carried over)

- Login card at 390 is x=34, w=322 against github.com's 16/358 (pages/auth). The card heading is `.ui.attached.header` 15/600/19.3 against github.com's 20/600/30 (data-display or pages/auth).
- The repo-home toolbar wraps at 390 once the fix lands (pages/repo, request #4).

### 6. Environment

- Smoke is red: 11 of 12 steps pass. `switch-theme-back` times out because `github-auto` is not in the appearance menu (the screenshot shows Auto/Dark/Light/Modern…).
- The admin theme remains `gitea-auto` and was not changed.
- One-off CLS flake: cf-org-home light 390 gave 0.2995 in the main run (`div.ui.eleven.wide` at t=66ms). In 6 re-runs (3 light, 3 dark) it was 0. Not attributed to foundation.

## What is right (verified)

- **Body text:** 14/400/21 in rgb(31,35,40) on white, and rgb(240,246,252) on rgb(13,17,23). That equals github.com login and releases `body-text` in both schemes and at both widths.
- **Containers:** on the 18 non-injected pages, 112/1216 at 1440 and 16/358 at 390. github.com releases reports the container as 1280 including 32px padding at 1440, and full width with a 16px gutter at 390.
- **Focus:** 2px solid at -2px on links and buttons. Light rgb(9,105,218), dark rgb(31,111,235). Inputs use -1px (controls). No ring on mouse focus. `states-all.png` shows clean rings and hover underlines on login, explore and repo-home links.
- **Headings:** h1 32/600/48 matches github.com releases `page-heading` (32/600/48).
- **Plain-heading margins:** outside the empty-state case they now match Primer 0 plus mb-2. The three form-section headings read correctly.
- **::selection:** transparent (UA highlight), the same as github.com, on non-injected pages.
- **Unresolved vars and overflow:** 0 unresolved vars, 0 off-palette colors from foundation, 0 horizontal overflow on 88 captures.

## Measurements (ours vs github.com)

| control | property | ours | github | ok |
|---|---|---|---|---|
| body | size / weight / line-height, light and dark, 1440 and 390 | 14 / 400 / 21 | 14 / 400 / 21 | yes |
| body | color light / dark | rgb(31,35,40) / rgb(240,246,252) | same | yes |
| body | line-height, repo home and file view (injected) | 20 | 21 | no |
| container @1440 | x / w (18 pages) | 112 / 1216 | 1280 box, 32px padding (= 112 / 1216) | yes |
| container @1440 | x / w, repo home and file view | 80 / 1280 | 112 / 1216 | no |
| container @390 | gutter | 16 (8 on repo home and file view) | 16 | partial |
| link focus-visible | dark | 2px rgb(31,111,235) at -2 (rgb(68,147,248) injected) | 2px rgb(31,111,235) at -2 | partial |
| link focus-visible | light | 2px rgb(9,105,218) at -2 | same | yes |
| link color | light / dark | rgb(9,105,218) / rgb(68,147,248) | same | yes |
| h1 | size / weight / line-height | 32 / 600 / 48 | 32 / 600 / 48 (releases) | yes |
| plain h3 / h4 / h5 | margin top / bottom | 0 / 8 | Primer 0 / 0 plus mb-2 (8) | yes |
| empty-state icon → h2 | gap | 0 | 8 (Blankslate) | no |
| kbd | size / lh / pad / radius | 11 / 10 / 4 / 6 (fixed); 11 / 11 / 2x4 / 4 injected | 11 / 10 / 4 / 6 | partial |
| ::selection | background | transparent; solid rgb(68,147,248) dark injected | transparent | partial |
| login card @390 | x / w | 34 / 322 | 16 / 358 | no (pages/auth) |
| home CLS | 1440 / 390 | 0.171 / 0.372 | built-in 0.189 / 0.394–0.407 | yes (no worse than built-in) |
| repo home CLS @390 | preview / fixed | 0.500–0.551 / 0.274–0.276 | built-in 0.215 (r3 10-run mean) | no |
