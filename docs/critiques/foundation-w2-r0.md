# Critique: foundation, wave 2, round 0

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.

## Build and deploy state

- `node build/lint.mjs foundation`: 0 errors, 0 warnings, 45 selectors.
- `npm run build`: foundation `ok` (10 files, 15147 bytes, 0/0 lint), revision b565e3c2d5. All 14 folders are `ok`.
- Served files match `dist/` by SHA-256 for auto (78b7f1ce…), light (fe2a7fd1…) and dark (bd80ca77…). I did not deploy.
- The theme is registered and live. The appearance list includes github-auto/light/dark, `html[data-theme]` is `github-auto`, and this was a real-theme run, not PREVIEW.
- The live HTML contains the inert link. Line 37 of `/octo-org/theme-playground`: `<link rel="preload" …><link rel="stylesheet" href="/assets/css/index.DleUJaOD.css" media="not all">`.
- Probe: `idxLinks = ["not all"]` on all 26 pages x 4 contexts. The shoot audit reports `pagesWithUnlayeredGiteaCss: 0` on 92 captures.
- The admin theme is `github-auto`, checked after smoke through the API.

**Score: 8.8 / 10. PASS.**
- Lint clean, 0 literal colors, smoke green.
- 0 console errors attributable to the theme. The 4 recorded errors are the document 404 of the `expectStatus: 404` route; github.com logs the same error on its 404.

## Evidence

- **Gitea captures:** `shots/critic-foundation-r0/`. 23 routes x light/dark x 1440/390 = 92 captures, with `--states --measure`.
  - Routes: `shots/critic-foundation-w2r0-routes.json`. It holds the 8 brief routes (their official states plus link, kbd and focus states) and 15 extra foundation pages, including 4 empty-state pages.
  - Log: `shots/critic-foundation-r0.log`.
- **github.com reference** (logged out, today, `--measure`): `shots/critic-foundation-r0-ref/` (login, releases, explore-repos, repo-home, not-found).
- **Computed-style, geometry, Tab-focus, mouse-focus, ::selection and empty-state probe**, 26 Gitea pages x 4 contexts, live theme:
  - `shots/critic-foundation-r0-probe/probe-live.json`
  - github.com, 6 pages x 4: `probe-github.json`
  - Script: `shots/critic-foundation-w2r0-probe.mjs`
- **CLS A/B**, logged out, 390, 5 runs each, theme set by `gitea_theme` cookie only:
  - Log: `shots/critic-foundation-r0-cls.log`
  - Script: `shots/critic-foundation-w2r0-cls.mjs`
- **Org-home CLS re-runs:** `shots/critic-foundation-r0-orgcls{1,2,3}/`.
- **Smoke:** `shots/critic-foundation-r0-smoke.log`. All 12 steps OK, with no console errors.
- **Contact sheets I opened**, in `shots/critic-foundation-r0/crops/`:
  - `repo-home-1440.png`: light and dark
  - `repo-home-gh-vs-ours-light.png`
  - `m390.png`: repo home light and dark, login dark, 404 light, releases dark
  - `explore-settings-1440.png`
  - `states-sheet.png`: 18 focus, hover and kbd clips, light and dark
  - `empty-milestone.png`: grex projects, milestone-new dark, grex actions dark
  - `home-login.png`
- **Extra checks** (scripts in the scratchpad; values quoted below):
  - Container geometry at 1280/1100/1012/1011/800/544
  - Link hover underline on github.com vs ours
  - CDP matched-rule trace of the watch/star counter focus

## Builder and integrator claims, verified

| claim | verdict | evidence |
|---|---|---|
| Unlayered index.css blocker fixed live (inert link) | TRUE | Live HTML line 37. Probe: `["not all"]` on every page. Audit: 0 of 92 pages with unlayered Gitea CSS. Repo home and file view now match the rest of the site: container 112/1216 at 1440 and 16/358 at 390, body line-height 21, kbd 11/10/4/6, dark ring rgb(31,111,235), transparent selection. |
| Empty-placeholder heading regression fixed | TRUE | grex projects, grex actions and alice packages, light and dark, 1440 and 390: icon→h2 gap is 25, back to Gitea's value (it was 0 in w1r4). `crops/empty-milestone.png` shows the gap restored. |
| `tw-m*` exclusion narrowed | TRUE | `typography.css` now lists `[class*="tw-m-"], [class*="tw-mt-"], [class*="tw-mb-"], [class*="tw-my-"]`. |

## Issues, most important first

### 1. MINOR (data-display, not foundation). Blankslate spacing is still Gitea's

**Measured**, on `.empty-placeholder` (grex projects, grex actions and alice packages; light and dark; 1440 and 390):
- icon→heading gap: 25
- heading margin: 24.57 / 14 (0 bottom as last child)
- heading → paragraph: 14
- heading: 24/600

**GitHub Blankslate:**
- 8px gap below the icon
- about 4px below the heading
- heading 20/600

Now that foundation correctly excludes `.empty-placeholder *`, this belongs to data-display's D-1. I list it only because it is the most visible "Fomantic spacing" left on foundation-adjacent pages.

Evidence: `crops/empty-milestone.png`, rows 1 and 3.

### 2. NIT (foundation). Off-scale Fomantic top margins remain on non-first `.ui.header`

- `/octo-org/theme-playground/milestones/new`: `h2.ui.dividing.header` "New Milestone" has margin-top 24.57px. It follows the Labels/Milestones sub-nav and divider, which gives about 33px from the rule to the heading.
- `/octo-org/theme-playground/settings`: `h4.ui.header` "Code Statistics Indexer" is 16/600/24 with margin 25.71 / 14.
- Primer Subhead has no top margin; `Subhead--spacious` uses 40px.
- Foundation owns `.ui.header` and `.ui.dividing.header`. A scale value would remove the last `calc(2rem - .1428em)` artifacts, for example `.ui.dividing.header { margin-top: var(--base-size-24) }` with `margin-top: 0` when it follows a divider. Settings Subheads can stay with pages/settings-admin.

### 3. NIT (foundation or pages/repo). `h2.ui.header` "Comparing changes" is 24/600

On `/compare` the heading is 24/600. GitHub's "Comparing changes" is a Subhead-heading at 24/400. Foundation already sets `h2.ui.dividing.header` to 400. The compare heading is a plain `.ui.header` with a `.sub.header`, which is the same Subhead pattern. Either extend the 400 rule to `h2.ui.header:has(> .sub.header)`, or leave it to pages/repo.

### 4. MINOR (ARCHITECTURE §10 CLS, cause is pages/repo). Playground repo home at 390 is slightly above built-in

Logged out, 5 runs:

| page | scheme | github-auto | gitea-auto |
|---|---|---|---|
| grex | light | 0.252 | 0.285 |
| grex | dark | 0.273 | 0.288 |
| theme-playground | light | 0.224 | 0.216 |
| theme-playground | dark | 0.227 | 0.220 |

- grex is better than built-in. theme-playground is worse by +0.008 and +0.007.
- There is a single shift in both themes: `.repo-home-filelist` moves down by the sidebar-top height (y204→468 built-in, y250→555 ours).
- This is the known DOM-order cause (foundation request #3, forwarded to pages/repo). Foundation's GitHub-correct 21px line-height and 16px gutter only scale it.
- Home is unchanged from w1r4 (0.171 / 0.372; built-in 0.189 / 0.394).
- The `cf-org-home` dark 390 value of 0.2995 in the main run (`div.ui.eleven.wide`, t=77ms) is a flake under state-run concurrency. It was 0 in 6 of 6 re-runs (`shots/critic-foundation-r0-orgcls{1,2,3}`).

### 5. FYI (controls, not foundation). The watch/star/fork counter link has no visible focus ring on itself

On every repo page, Tab focus lands on `a.ui.basic.label` inside `.ui.labeled.button` (the watchers/stars/forks counters).

CDP trace:
- `gh.foundation` sets `outline: 2px solid var(--focus-outlineColor)`.
- `gh.controls` `.ui.labeled.button > .label:focus-visible { outline: none; box-shadow: none }` (`src/controls/button-groups.css:272-276`) overrides it.
- Computed value: `3px none`.

The comment there says the whole control is ringed instead. I did not capture that state, so controls' critic should verify it with a screenshot. This is not counted against foundation.

### 6. Other owners, carried over and not counted

- **Login card at 390** is x=34, w=322 (github.com 16/358). The card header is `.ui.attached.header` at 15/600/19.3 (github.com h1 20/600/30). Owners: pages/auth and data-display.
- **Repo title owner link** is fgColor-default (github.com accent, 20/30). Owner: navigation.
- **Release titles** are 28/400 (github.com h2 24/600/36). Owner: pages/repo.
- **Off-palette colors, none from foundation:**
  - `svg#svg-mfi-*` fill rgb(0,0,0): icons/code, 6 pages per scheme.
  - `.markup mark` rgb(255,255,0): markdown.
  - A markdown `kbd` in the playground README computes to padding 3px 5px on rgba(129,139,152,.12). That is markdown's rule, not foundation's.

## What is right (verified with numbers)

**Body.** 14/400/21. Light rgb(31,35,40) on rgb(255,255,255); dark rgb(240,246,252) on rgb(13,17,23). This holds on all 26 probed pages x 4 contexts and on every measured route. The measured `body-text` diff against github.com (login, releases, explore, repo-home, 404) is empty in all 4 contexts.

**Containers.**
- 112/1216 at 1440 and 16/358 at 390 on all probed pages, including repo home and file view, which were broken in w1.
- At 1100 and 1012: x=32. At 1011, 800 and 544: x=16.
- github.com container-xl: 1280 including a 32px pad (112/1216) at 1440, and a 16px pad at 390.
- No horizontal overflow on any capture or probe.

**Links.**
- Color is rgb(9,105,218) in light and rgb(68,147,248) in dark.
- Hover adds an underline with `text-underline-offset: auto` in the link color.
- These values are identical to github.com's "Forgot password?" link in both schemes.
- The hover clips look right (`states-sheet.png`).

**Focus.**
- Keyboard focus is 2px solid at -2px: rgb(9,105,218) in light, rgb(31,111,235) in dark.
- It applies to links, `.ui.button`, menu items and dropdowns. I probed 400 Tab stops and all were `:focus-visible`. 340 drew the ring. The other 60 were the controls-owned counter labels (issue 5).
- This equals github.com: repo-home, releases, profile and login links and buttons are 2px at -2px in the same colors.
- Mouse focus draws no ring.
- Inputs use -1px (controls).
- Clips show clean rings on explore titles, "Forgot password?", file-list links and sidebar links, in light and dark.

**::selection.** Transparent (UA highlight) on every page. github.com is also transparent.

**kbd.** 11/10, padding 4, radius 6, fgColor-default on bgColor-muted, borderColor-neutral-muted with an inset shadow. This is Primer `base/kbd.scss` exactly. github.com logged out only shows the marketing header's `/` key (4px 8px / 4px, brand colors), which is not a comparable surface.

**Headings.**
- Plain headings are Primer sizes at 600, for example h1 `tw-mb-0` at 32/600/48. github.com releases h1 is 32/600/48, and its h2 is 24/600/36.
- Subhead `h2.ui.dividing.header` is 24/400 with 8px padding-bottom, 16px margin-bottom and a muted rule.
- No regression on empty states.

**Paragraphs.** Line-height 21. Non-last paragraphs have margin-bottom 10 (Primer `p` margin).

**Scrollbars.** `scrollbar-color: auto` and `color-scheme` light/dark, the same as github.com.

**Audits.** 0 unresolved CSS vars, 0 failed requests and 0 problem pages on 92 captures. All 23 routes' states succeeded.

## Measurements (ours vs github.com)

| control | property | ours | github | ok |
|---|---|---|---|---|
| body | size / weight / line-height, 4 contexts | 14 / 400 / 21 | 14 / 400 / 21 | yes |
| body | color / bg light | rgb(31,35,40) / rgb(255,255,255) | same | yes |
| body | color / bg dark | rgb(240,246,252) / rgb(13,17,23) | same | yes |
| container @1440 | x / w, incl. repo home and file view | 112 / 1216 | 80 + 32 pad / 1280 → 112 / 1216 | yes |
| container @390 | gutter | 16 | 16 | yes |
| container @1100 / @1011 | x | 32 / 16 | 32 / 16 (≥1012 rule) | yes |
| link | color light / dark | rgb(9,105,218) / rgb(68,147,248) | same | yes |
| link hover | decoration / offset | underline / auto | underline / auto | yes |
| focus-visible light | outline / offset | 2px solid rgb(9,105,218) / -2px | same | yes |
| focus-visible dark | outline / offset | 2px solid rgb(31,111,235) / -2px | same | yes |
| mouse focus | ring | none | none | yes |
| ::selection | background | transparent | transparent | yes |
| kbd | font / lh / pad / radius | 11 / 10 / 4 / 6 | Primer kbd.scss 11 / 10 / 4 / 6 | yes |
| h1 | size / weight / lh | 32 / 600 / 48 | 32 / 600 / 48 | yes |
| h2 | size / weight / lh | 24 / 600 / 36 | 24 / 600 / 36 | yes |
| Subhead h2 | weight, compare page | 600 | 400 | no (nit) |
| dividing header | margin-top, non-first | 24.57 | 0 (Primer Subhead) | no (nit) |
| empty state | icon→heading gap | 25 | 8 (Blankslate) | no (data-display) |
| CLS @390 grex | light / dark | 0.252 / 0.273 | built-in 0.285 / 0.288 | yes |
| CLS @390 playground | light / dark | 0.224 / 0.227 | built-in 0.216 / 0.220 | no (+0.008, pages/repo) |
