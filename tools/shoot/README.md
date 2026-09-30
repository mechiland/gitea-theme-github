# tools/shoot — screenshots, audits, reference captures, smoke test

Node ESM + Playwright (headless chromium). Nothing here modifies Gitea except the
admin user's **theme / language preference** (via the real settings form) and, in
`smoke.mjs`, content inside the seeded repo `octo-org/theme-playground`.

> Browser: `playwright@1.63.0` expects chromium revision 1243, which is not in
> `~/Library/Caches/ms-playwright`. `lib/browser.mjs` automatically falls back to the
> newest installed `chromium_headless_shell-*` (currently 1234 → Chrome 151). Override with
> `SHOOT_CHROMIUM=/path/to/chrome`. Running `npx playwright install chromium` removes the warning.

## Files

| file | purpose |
|---|---|
| `shoot.mjs` | capture + audit runner (`--target gitea` = ours, `--target github` = reference) |
| `routes.json` | route list: `id`, `gitea` path, `github` URL or `null`, `auth`, `expectStatus`, `states`, `measure` |
| `routes-from-manifest.mjs` | fills `{{...}}` placeholders in routes.json from `docs/seed-manifest.json` (idempotent) |
| `compare.mjs` | contact sheet (`compare.html`) and blind A/B pair generator |
| `smoke.mjs` | functional smoke test with the theme applied |
| `lib/` | browser launcher, Gitea login/appearance, Primer palette, in-page audit, measure set |
| `budget-compare.mjs` | per-page CLS / DCL / load diff of two runs (`--ours <run> --base <run> [--json out]`), flags regressions beyond noise (CLS +0.02, DCL max(150 ms, 25 %)) |
| `themes-offered.mjs` | read-only: prints the themes offered on /user/settings/appearance (pre/post restart check) |
| `coverage.mjs` | CSS rule coverage of the theme over every route × scheme × viewport × state → `shots/coverage/` |
| `pixeldiff.mjs` (+ `lib/pixeldiff.py`) | PNG-by-PNG diff of two shoot runs (Pillow), volatile-region masks, known-noisy list `pixeldiff-noisy.json` |

## shoot.mjs

```sh
# ours (logs in as admin/11111111 once, caches .cache/gitea-admin-storage.json,
# sets UI language en-US and the admin theme only if they differ)
node tools/shoot/shoot.mjs --target gitea --theme github-auto                  # all routes, light+dark, 1440+390
node tools/shoot/shoot.mjs --target gitea --theme gitea-auto --out shots/baseline   # baseline for comparisons
node tools/shoot/shoot.mjs --target gitea --only repo-home,login --schemes dark --viewports 390 --states
node tools/shoot/shoot.mjs --target gitea --only repo-home --measure-only

# reference (github.com, logged out) -> docs/reference/<routeId>/<scheme>-<vw>.png + .json
node tools/shoot/shoot.mjs --target github --only explore-repos,repo-home --measure
```

Options: `--routes <file>` `--only a,b` `--schemes light,dark` `--viewports 1440,390`
`--states` `--measure` `--measure-only` `--theme <name>` `--out <dir>` `--concurrency n`
`--no-audit` `--relogin` `--stable` `--stable-time <iso>` `--theme-css <file>`. Default out: `shots/<YYYYMMDD-HHMMSS>-gitea-<theme>/` for gitea,
`docs/reference/` for github. Partial runs (`--only`) into an existing dir merge `summary.json`.

Viewports: 1440×900 @1x, 390×844 @2x. `colorScheme` is forced per context
(`prefers-color-scheme`), so `*-auto` themes and github.com (logged out) follow it.
Logged-out routes (`"auth": false`) get the theme through Gitea's `gitea_theme` cookie
(what Gitea uses for anonymous visitors) and `lang=en-US`.

Capture pipeline per route × scheme × viewport: new context → goto (`load`) → wait until no
non-streaming request is in flight for 500 ms (Playwright's `networkidle` never fires on
signed-in Gitea pages because of the notification EventSource) → `document.fonts.ready` →
inject a capture-only style that zeroes animations/transitions, finish/cancel running
animations, 2×rAF + 250 ms → full-page PNG → audit.

Capture fixes (final gate #1, 2026-09-30):
- **Diff style (FG-033).** Every diff route in routes.json carries an explicit `?style=unified|split`; `pinDiffStyle()`
  adds `style=unified` to any other commit / compare / PR-files URL. Visiting `?style=` as admin saves that preference, so
  the run reads `diff_view_style` from `/api/v1/user/settings` first and PATCHes it back at the end
  (`summary.json → diffViewStyle {before, afterRun, restored}`).
- **Lazy images (FG-056).** Before the full-page shot: `img/iframe[loading=lazy]` → eager, one walk down the page, wait ≤ 8 s
  for images; the resulting layout shifts are removed from `cls` and logged as `lazyImages.cls` (plus forcedEager / images /
  notLoaded).
- **Tall pages (FG-118).** Pages taller than 15,000 device px (Chromium leaves everything below ~16,384 px blank) are
  captured in clipped segments and stitched with Pillow (`tiledCapture: {segments, cssHeight, dpr}` in the page JSON).

### Output per page: `<out>/<routeId>/<scheme>-<vw>.png` + `.json`

- `mainStatus`, `finalUrl`, `problems[]` (wrong status, redirected to login, no avatar in navbar,
  `html[data-theme]` ≠ requested theme, failed states), `env` (prefersDark, body bg/color/font)
- `consoleErrors[]`, `consoleWarnings[]`, `failedRequests[]` (status ≥ 400 or requestfailed;
  gravatar/avatars.githubusercontent/github telemetry → `ignoredRequests`; the expected 404 of a
  `expectStatus: 404` route → `expectedFailures`)
- `cssVars.unresolved[]`: `var(--x)` referenced (without fallback) in any readable stylesheet or
  inline style, never defined anywhere (custom-property declarations, `@property`), empty on
  `:root` and on up to 3 elements matching each referencing rule. `matchedElements > 0` means it
  hits live DOM (console shows `vars=live/total`). Vars used only inside another var's fallback
  are ignored; all-fallback refs go to `unresolvedWithFallback`.
- `colors`: every visible element's `color` (elements with own text, controls, svg), `background-color`,
  border colors (only sides with width > 0 and a style), `outline-color` (if drawn), svg `fill`/`stroke`,
  `box-shadow` colors → normalized `rgba(r,g,b,a)` → compared (±1 channel, ±0.02 alpha) with the
  allowed palette = every color the browser resolves from `@primer/primitives`
  `dist/css/functional/themes/{light,dark}.css` + `dist/internalCss/{light,dark}.css` (base scales),
  including alpha and shadow colors (cached in `.cache/primer-palette-<ver>.json`). The palette of
  the page's scheme is used; `otherSchemeOnly` lists colors that are valid only in the other scheme.
  `offPalette[]` = {color, count, props, samples(≤5 selectors)}. `exempt[]` (not failures), by reason:
  `label` (`.ui.label[style]`…), `syntax` (chroma/code), `language-color`, `avatar/image`,
  `markdown-inline`, `emoji`, `inline-style` (explicit inline color on the element/ancestor), `heatmap`,
  `currentColor` (border/fill/outline equal to the element's own text color). Transparent is skipped.
- `icons.nonOcticon[]`: `svg.svg` without an `octicon-*` class (e.g. `gitea-*`, `material-*`), name + count + samples.
- `cls` (total + first shifts with sources), `timing` (DCL, load, CSS resource count/bytes),
  `cssBytes` (encoded body bytes of all stylesheets), `document` (size, horizontal overflow).

`<out>/summary.json`: run meta (target, theme, Gitea version, browser, appearance changes),
totals, per-page rows, and cross-page aggregates of off-palette colors, unresolved vars,
non-Octicon icons, console errors and failed requests.

### Interaction states (`--states`)

Defined per route in `routes.json`:

```json
{ "name": "primary-hover", "action": "hover",
  "selectors": { "gitea": "form button.ui.primary.button", "github": "input[type=submit][name=commit]" },
  "clips": { "gitea": "...", "github": "..." }, "clip": "fallback clip selector",
  "pad": 8, "wait": 350, "viewports": [1440] }
```

Actions: `hover`, `focus` (keyboard modality, then focus; falls back to Shift+Tab/Tab; result
records `focusVisible`), `press` (mouse down, never released — page is discarded), `disable`
(sets `disabled` + `aria-disabled`), `click` (open dropdown / modal / panel), `submitEmpty`
(clears text inputs, sets `novalidate` unless `"native": true`, submits → server-side validation
error; **gitea only — never submitted on github.com**). Each state runs in a fresh page and saves
`<routeId>/states/<scheme>-<vw>-<name>.png` (viewport) and `-clip.png` (clip element + pad);
failures save `-FAILED.png` and are listed in `problems`.

### Measure (`--measure` / `--measure-only`)

Writes `<routeId>/<scheme>-<vw>.measure.json`: for each logical control (default set in
`lib/measure.mjs`, e.g. `button`, `button-primary`, `input-text`, `underline-nav-item`, `label`,
`counter`, `box`, `box-row`, `header`, `markdown-h1/h2/p/code/pre/table`) the selector per target
and up to 3 visible samples with box size, padding, margins, radius, border width/color, font
family/size/weight, line-height, letter-spacing, color, background, box-shadow, outline, gap.
Same logical names on both targets → `compare.mjs` renders a diff table. Extend per route with
`"measure": {"gitea": [{"name": "x", "selector": "..."}], "github": [...]}`.

### Deterministic captures for pixel diffs (`--stable`, `--theme-css`)

- `--stable`: the page clock is fixed (`context.clock.setFixedTime`, default `2027-01-01T00:00:00Z`, `--stable-time`), so
  `<relative-time>` text ("4 months ago") never drifts between runs, and every non-Gitea request is aborted (external
  README badges on octo-org/grex etc. render as consistently broken images; they cause ~20 expected console errors
  on repo-home). Recorded in `summary.json` → `stable`. Use it only for pixel comparisons, not for design review.
- `--theme-css <file>`: serves a local file in place of `/assets/css/theme-<theme>.css` (recorded in `summary.json` →
  `themeCss` with sha256). Lets you test a trimmed build **without deploying** and makes a baseline independent of
  concurrent deploys.
- Every page JSON / state entry records `volatile[]` (CSS px rects in the PNG's coordinates: footer server-timing line
  "Page: NNms Template: NNms" across the footer width, `<relative-time>` lines across their block) and states record
  `clipRect`; `pixeldiff.mjs` masks them.

Trim workflow (baseline frozen 2026-09-30 in `shots/trim-before`, CSS copy in `shots/trim-before-css/`):

```sh
node tools/shoot/shoot.mjs --target gitea --theme github-auto --states --no-audit --stable \
  --theme-css dist/theme-github-auto.css --out shots/trim-after            # after `npm run build`, no deploy needed
node tools/shoot/pixeldiff.mjs --a shots/trim-before --b shots/trim-after --out shots/trim-after/pixeldiff
```

Content written to Gitea between the two runs (smoke.mjs issues/PRs/commits in octo-org/theme-playground, the
dashboard feed) is real pixel change: those pages are flagged `knownNoisy` via `pixeldiff-noisy.json`. For a
drift-free comparison capture a fresh baseline right before the after-run with
`--theme-css shots/trim-before-css/theme-github-auto.css` (same flags) and diff those two.

## pixeldiff.mjs

```sh
node tools/shoot/pixeldiff.mjs --a <runA> --b <runB> [--out dir] [--tolerance n] [--minor px] [--only id,id]
     [--mask-bottom cssPx] [--no-volatile] [--noisy file] [--workers n]
```

Pairs every PNG with the same relative path (`*-FAILED.png`, `diff/`, `blind/`, `coverage/` skipped). A pixel differs
when any RGBA channel differs by more than `--tolerance` (default 0 = exact; `--tolerance 1` absorbs the ±1
anti-aliasing noise seen on dark-scheme avatar edges in hover states). `--minor N`: pairs with 1..N differing pixels
are counted as `differentMinor` instead of `different` (the determinism check showed ≤ 49 px of rasterization noise on
the navbar avatar/logo edges in some hover/menu state shots; recommended for trim checks: `--tolerance 4 --minor 50`,
then still look at every `differentMinor` diff PNG). Different sizes: the non-overlapping area counts
as different. Masks = union of both runs' `volatile[]` rects (×DPR; clip shots shifted by `clipRect`); full-page shots
from a run without `volatile` data get the bottom 100 CSS px masked (footer timing line: 60 px from the bottom at 1440,
83 px at 390); `--mask-bottom N` forces a bottom mask. Output `<out>/pixeldiff.json`
(`totals`, `results[]: {path, diffPixels, bbox, sizeA/sizeB, maskedPixels, masks, diffPng, knownNoisy}`, sorted by
diffPixels; `totals.different` excludes knownNoisy and minor pairs) and `<out>/diff/<path>.png` = [A | B | B dimmed with differing pixels red], cropped to the bbox + 40 px.
Exit 0 = all non-noisy pairs identical and no missing files, 1 = differences, 2 = usage/Pillow error.

## coverage.mjs

```sh
node tools/shoot/coverage.mjs [--theme github-auto] [--only a,b] [--schemes light,dark] [--viewports 1440,390]
     [--no-states] [--concurrency 3] [--out shots/coverage]
```

Each page load (route × scheme × viewport, plus one per defined state, same actions as `shoot.mjs --states`) gets
`dist/theme-<theme>.src.css` (unminified, real var names, one `@layer` per folder) served in place of the deployed
theme link, with Chrome `CSS.startRuleUsageTracking` from before navigation to after the state action. Rules are
parsed from the same text with postcss, mapped to their folder (layer block; `gh-important` by the build's
`/* <folder>/<file> */` comments) and, by verbatim selector search, to `src/<folder>/<file>:<line>`. Every page also
tests each selector-list member (pseudo-classes/elements stripped) with `querySelector` and every `@media` condition
with `matchMedia`.

Output `shots/coverage/report.json` (totals, per-folder numbers, every never-used rule, dead selectors inside used
rules, low-use rules with the pages that used them, per-job status) and `shots/coverage/<folder>.md` (sorted by bytes):
- **never used (verifiable)** — no page/state/scheme/viewport matched it;
- **unverifiable: state** — selector needs a state (`:hover :focus* :active :checked :has() …`) or a conditional
  pseudo-element (`::selection`, scrollbars, `::placeholder`): coverage marks a rule used only if it matched during
  tracking, so these can be falsely unused. Split into *base element absent everywhere* (probably dead) and *base
  element present* (state never triggered; likely needed);
- **unverifiable: media** — inside an `@media` no tested config matched (`pointer: coarse`, `hover: none`,
  `forced-colors`, widths other than 390/1440 are not tested);
- **dead selectors inside used rules**.
`minBytesSaved` is exact: the minified size (build's var renaming + lightningcss) of the stylesheet with those rules
(and emptied at-rules) deleted, subtracted from the full one. Pages or states missing from routes.json (content not in
the seed) show up as unused — check before deleting.

## routes.json / routes-from-manifest.mjs

Routes with `"github": null` are skipped for `--target github`; routes whose `gitea` still
contains `{{...}}` are skipped until filled:

```sh
node tools/shoot/routes-from-manifest.mjs            # reads docs/seed-manifest.json, rewrites routes.json
node tools/shoot/routes-from-manifest.mjs --dry      # print what would be filled
```

Placeholders: `{{repo.<name>}}`, `{{branch.<repo>}}`, `{{issue.<repo>}}`, `{{pull.<repo>}}`,
`{{org.<name>}}`, `{{user.<name>}}`, `{{route.<key>}}`, `{{json:a.b.c}}`. The template is kept in
`giteaTemplate`, so it can be re-run. Entries of `manifest.routes` not yet in routes.json are appended.

## compare.mjs

```sh
node tools/shoot/compare.mjs --run shots/<run> [--ref docs/reference]   # -> shots/<run>/compare.html
node tools/shoot/compare.mjs --run shots/<run> --blind                  # -> shots/<run>/blind/ + blind-key.json
```

`compare.html`: ours next to reference per route/scheme/viewport with audit badges, the
off-palette list and the measured-metrics diff. `--blind`: copies each pair that has a
reference into `blind/pair-NNN-{A,B}.png` with random A/B assignment and random pair order
(crypto RNG), plus `blind/index.html`. The key lives outside that folder in
`shots/<run>/blind-key.json` — give judges only `blind/`.

## smoke.mjs

```sh
node tools/shoot/smoke.mjs --theme github-auto [--alt-theme gitea-auto] [--repo octo-org/theme-playground] [--scheme dark]
```

Steps (each asserts URL + DOM, screenshot `FAILED-<step>.png` on failure, later steps are
skipped after a failure): `apply-theme` → `create-issue` → `comment` → `add-label` (creates a
`smoke-test` label through the API if the repo has none) → `edit-file-new-branch` (web editor,
CodeMirror in 1.27, "create a new branch and start a pull request") → `open-pr` → `merge-pr` →
`change-repo-setting` (description, restored afterwards) → `switch-theme-alt` →
`switch-theme-back` → `screenshot-final` → `no-console-errors`.
The branch (`patch-<ts>`) and issue title carry a timestamp so reruns never collide; the commit
and the PR are titled `Update <file>` (neutral like github.com, since PR/commit titles become Actions
run titles; FG-015). Prints `{theme, repo, ok, steps:[{step, ok, ms,
error, url, screenshot}], consoleErrors}` and writes it to `shots/<run>/smoke.json`.
Exit 0 = pass, 1 = a step failed, 2 = refused (protected repo). If the seeded repo does not exist
it prints `SKIPPED: seed missing` and exits 0 (`--strict-seed` → exit 3). It refuses to run
against `admin/jiri`, `ai/jiri` or anything in `docs/baseline-pre-seed.json`.

## Known limitations

- github.com is captured **logged out**: marketing header (black `HeaderMktg`, Sign in/Sign up)
  instead of the signed-in `AppHeader`; no dashboard/settings/notifications/admin references
  (those routes have `github: null`). Logged-out GitHub also shows sign-in nags on some pages.
  Its marketing header uses Primer Brand colors, so the reference itself is not 100 % on-palette.
- GitHub content differs from ours (real repo vs seeded repo), so comparisons are about styling,
  not pixels; the blind pairs can still be told apart by content (e.g. Gitea footer).
- Cross-origin stylesheets that are not CORS-readable are listed in `cssVars.unreadableSheets`
  and not scanned (none so far on either target).
- `press` state holds the mouse button; if the theme reacts to `:active` only after a delay, raise `wait`.
- Off-palette matching uses exact resolved colors; a correct token rendered through `opacity`
  or blended by `color-mix()` at runtime shows up as off-palette (check `samples`).
