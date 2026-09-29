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
`--no-audit` `--relogin`. Default out: `shots/<YYYYMMDD-HHMMSS>-gitea-<theme>/` for gitea,
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
Names carry a timestamp so reruns never collide. Prints `{theme, repo, ok, steps:[{step, ok, ms,
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
