# Critique: controls, wave 3, round 0

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.
Mode: the theme is registered (`appearance.available` lists github-auto/light/dark; `htmlTheme = github-auto`), so these are real captures, not PREVIEW.

## Verdict
- **Score: 8.4 / 10. Not a pass.**
- Buttons, inputs, selects, checkboxes, radios, the ToggleSwitch, the SegmentedControl and the focus rings are at or near github.com quality. On repo home I compared five button states in both schemes against github.com and the sampled pixels are identical (table below).
- Two things block the pass:
  1. **The attachment dropzone in every issue and PR comment form** renders as a 150px box with an off-palette `rgba(0,0,0,.8)` 1px border, a 5px radius and 20px padding. The dropzone library's lazy, unlayered CSS beats both Gitea's rule and ours.
     - It sits in `form.ui.form > .field` (ownership: controls, `.ui.form .field*`). The markdown critic (markdown-w2-r2) also attributed it to controls.
     - This makes literalColors = 1: one off-palette colour on a controls surface, found on 16 of the 104 captured pages.
  2. **The input-group height mismatch is still unfixed** (builder's known-open item).
- If the integrator decides the dropzone belongs to another folder, controls would be about 8.7 with these nits, and it would still need #2.

## Hygiene (my own runs)
| Check | Result |
|---|---|
| `node build/lint.mjs controls` | 0 errors, 0 warnings, 355 selectors |
| `npm run build` → `dist/build-report.json` | `folders.controls = {status: ok, lintErrors: 0, lintWarnings: 0, files: 10, bytes: 55039}` |
| Served file | `theme-github-auto.css` SHA-256 `49dcbd0f…387e` is the same in dist and on :3000, so I did not redeploy |
| grep src/controls | No hex, rgb() or hsl(). No `!important` outside `*.important.css`. OC-1 `select.important.css` is present and token-only |
| Shoot: 26 routes × light/dark × 1440/390, `--states --measure` → `shots/critic-controls-r0/` (routes: `shots/critic-controls-w3r0-routes.json`) | 104 pages. 0 console errors, 0 failed requests, 0 unresolved vars, 0 pages with unlayered Gitea CSS. maxCLS 0.355 (repo-home at 390, Gitea's file list; not controls) |
| Off-palette | (a) `rgba(0,0,0,.8)` border on `.ui.dropzone` in comment, new-issue, PR and release forms: 16 pages, **controls, see #1**. (b) `#rel-container > svg` fill `#000` on the graph (code). |
| Non-Octicon icons | `fontawesome-openid` (login/signup) and `gitea-colorblind-*` (appearance). Both belong to the icons folder |
| Reference: github.com logged out → `shots/critic-controls-r0-ref/` | login, repo-home, repo-issues (grex), milestones, releases, issue-view with states and measure: 24 pages, 0 errors. Nothing was submitted |
| Smoke: `node tools/shoot/smoke.mjs --theme github-auto` | **Green**, 12 of 12 steps, including `switch-theme-back`. 0 console errors. Log: `shots/critic-controls-r0-smoke.log`; final screenshot: `shots/20260930-043518-smoke-github-auto/final.png` |

### Tooling notes (not theme defects)
- **repo-home watch/star focus states failed.** When signed in, Gitea renders Watch and Star as `<a role="button">` with no `href`, so they are not keyboard-focusable and shoot falls back to Tab. The clip therefore shows the README. The counter link is focusable, and its ring is correct (see below).
- **milestones `search-btn-hover` timed out** in shoot, because `.first()` matched a hidden element. I measured it with my probe instead.

## Ours vs github.com (pixel samples from the state clips, 1440)
| State | light: ours = github.com | dark: ours = github.com |
|---|---|---|
| Code hover | bg (28,129,57), border (28,114,54): identical | (41,144,59) / (72,160,88): identical |
| Code pressed | (25,121,53) / (26,108,51): identical | (46,154,64) / (77,169,92): identical |
| Branch hover | (239,242,245) / (209,217,224): identical | (38,44,54) / (61,68,77): identical |
| Code focus-visible | ring (9,105,218) plus white inset: identical | ring (31,111,235): identical |
| Branch focus-visible | ring (9,105,218): identical | ring (31,111,235): identical |

Sheets: `shots/critic-controls-r0/sheets/rh-cmp-{light,dark}.png` and `login-cmp.png`.

## Issues (ranked)

### 1. MAJOR: comment-form dropzone is a black-bordered 150px box (off-palette)
- **Where:** `/octo-org/theme-playground/issues/1`, `…/pulls/*`, `…/issues/new` and `…/releases/new`, in both schemes at 1440 and 390.
- **Selector:** `form#comment-form > div.field > div.ui.dropzone.dz-clickable`.
- **Measured:** 810×150, border `1px rgba(0,0,0,.8)`, radius 5px, padding 20px.
  - Light: a near-black frame.
  - Dark: a black frame on `#0d1117`.
- **Expected:** the attach area is a quiet part of the comment box. GitHub has no free-standing 150px box, and Gitea's own intent is `2px dashed var(--color-secondary)` with padding 0 and min-height 0 (`web_src/css/features/dropzone.css`).
- **Cause:** `@deltablot/dropzone/dist/dropzone.css` is a lazy chunk (`web_src/js/features/dropzone.ts:21`) and unlayered, so it beats every layer.
- **Evidence:**
  - `shots/critic-controls-r0/probe1/dropzone-{light,dark}.png`
  - `shots/20260930-043518-smoke-github-auto/final.png`
  - `summary.json` offPalette
- **Fix:** add a `dropzone.important.css` in controls, token-only, for example:
  `.ui .field .dropzone { border: var(--borderWidth-thin) dashed var(--borderColor-default) !important; border-radius: var(--borderRadius-medium) !important; padding: 0 !important; min-height: 0 !important; background: transparent !important }`
  plus `.dz-message` in `--fgColor-muted` at 12px. If the integrator gives the dropzone to pages/issues-prs, the same CSS applies there.

### 2. MINOR (known open, still unfixed): the input-group search button is taller than its 28px input
- **Measured at 1440, light and dark:**
  - `/octo-org/theme-playground/projects`: input **28**, button **28×40**. The button hangs 12px below the input, with a square corner under the input's rounded one. It is also visible at 390.
  - `/octo-org/grex/milestones`: input **28**, button **28×30** (r4 measured 35.4).
  - `/octo-org/grex/issues`: 28 / 28, correct.
  - Repo home: input 32, button 28×32, so the button is not square (github.com IconButton in a group is 32×32).
- **Cause:** `inputs.css` `.ui.action.input { align-items: stretch }` and `> .button { align-self: stretch; height: auto }`. The wrapper is stretched by the flex row (Sort dropdown / Labels-Milestones menu), and the input keeps its fixed height.
- **Evidence:**
  - `probe1/{proj,ms,home}-ig-{light,dark}-right.png`
  - `sheets/ig-zoom.png`
  - `sheets/m390.png`
- **Fix:** `.ui.action.input { align-self: center }`, or give the children one height (`> .ui.button { height: var(--control-small-size) }` inside `.ui.small.action.input`, medium otherwise). Square the icon button with `width = height`.

### 3. NIT: Fomantic's trailing `margin-right: 0.25em` (3.5px) is kept on `.ui.button`
- **Why it matters:** Primer buttons have no margin. The leftover margin misaligns right edges:
  - Login/signup "Sign in with OpenID" is 422.5px wide in a 426px column, 3.5px short of the primary button above it (`signup/states/dark-390-submit-empty.png`).
  - Every repo-settings Danger Zone button ("Make Private", "Transfer Ownership"…) and the user-settings / admin "Run" buttons carry `margin: 0 3.5px 0 0`.
  - The sidebar fluid "Unsubscribe" carries 3px.
- **Scan:** `shots/critic-controls-r0-margin.mjs`.
- **Fix:** `.ui.button { margin: 0 }` in buttons.css. Rows already use gap.

### 4. NIT (known open): settings/branches select squeezed at 320
- `.ui.selection.dropdown.tw-flex-1` is **64.9px** wide (r4: 68.9) next to "Update Default Branch". "main" fits; a longer name would truncate.
- **Evidence:** `probe1/sb-320-{light,dark}.png`.

### 5. NIT (known open): date input text sits low
- The issue-sidebar `input[type=date]` is 32px. Measured at 2x: the glyph box centre is about 1.5 CSS px below the inner centre.
- **Evidence:** `probe1/due-{light,dark}.png`.

### 6. NIT: SegmentedControl icons are 15px
- The file-view Code/Preview toggle icons are 15×15 (the Gitea template passes 15). github.com uses 16.
- The track and knob tokens are correct: `--controlTrack-bgColor-rest` `#e6eaef` / `#010409`.
- **Owner:** controls (`.ui.buttons .button > .svg` size) or icons.

### Resolved since wave 1 (verified)
- **Smoke:** now green, 12 of 12.
- **Watch/Star counter link focus ring:** 2px `#0969da` / `#1f6feb` around the whole labeled button (`probe1/starcnt-focus-*.png`).
- **OC-1:** the open Select keeps its 6px corners, with the list detached 4px below (`sheets/rs-select-open-zoom.png`).
- **OV-1:** no duplicate open-menu rule remains in `select.css`.
- **Text-only `.ui.icon.button`:** none found on 19 scanned pages at 1440. The "Resolve conversation" case from r4 was not reachable in the seed (the selector was not visible), so I could not re-verify it.

### Seen, not scored against controls
- **Horizontal scroll on repo settings at 390 / 320 (100 / 170px):** it comes from the push-mirror `table.ui.table`, which is 474px wide. Removing `gh.controls`, `gh.data-display`, `gh.foundation` and `gh.navigation` through the CSSOM still leaves 471px, so it is Gitea's layout (pages/settings-admin) (`shots/critic-controls-r0-nolayer.mjs`).
- **Page sizing:** the issues filter bar uses Gitea `.small` controls. The search is 28px and New Issue is 77×28 at 12px. On github.com the filter input is 32px and "New issue" is 93×32 at 14px. Controls maps `.small` to Primer small correctly, so upsizing is a pages/issues-prs decision.
- **Login:** github.com's login uses a 40px input and button at a 16px font, against our 32px / 14px. That is page sizing (pages/auth).
- **Signed-in Watch/Star:** `<a role=button>` without `href` cannot be reached with the keyboard (Gitea markup).

## Measurements (1440; ours vs github.com unless noted)
| Control | Property | Ours | github.com / Primer | OK |
|---|---|---|---|---|
| Code (primary) | box | 108.9×32, padding 0 12, r 6, 14/500 | 108.9×32, padding 0 12, r 6, 14/500 | yes |
| Code (primary) | bg / border light | `#1f883d` / rgba(31,35,40,.15) | same | yes |
| Code (primary) | shadow | 0 1px 1px rgba(31,35,40,.04), 0 1px 2px rgba(31,35,40,.03) | same | yes |
| Code (primary) | line-height | 20px | 21px | nit |
| Watch/Star small button | height, font | 28, 12/500 | 28, 12/500 | yes |
| Counter | box, font, bg | 20 high, padding 0 6, 12/500/18, rgba(129,139,152,.12) | same (radius 24 vs 9999: renders the same) | yes |
| Hover/press/focus (5 states × 2 schemes) | pixel samples | identical | identical | yes |
| Text input (login, focused) | border / outline | 1px `#0969da` + 2px outline offset -1 | 1px `#0969da` + 1px inset ring (Primer CSS); Primer React = 2px outline offset -1 | yes |
| Text input | height / padding / font | 32 / 0 12 / 14/20 | Primer medium 32 / 12 / 14/20 | yes |
| Select (user visibility) | box | 196×32, padding 5 32 5 12, r 6, border `#d1d9e0` / `#3d444d`, inset shadow | Primer Select 32, r 6, control border | yes |
| Textarea | padding / font / r | 8 12 / 14/20 / 6 | Primer 8 12 / 14/20 / 6 | yes |
| Checkbox | size / r / border | 16 / 3px / `#818b98` | Primer 16 / borderRadius-small 3 / control-borderColor-emphasis | yes |
| Radio checked | border | 4px `#0969da` / `#1f6feb`, centre `#fff` | Primer 4px checked ring | yes |
| ToggleSwitch | track | 48×24, r 6 | Primer small 48×24 | yes |
| SegmentedControl (file view) | box / icon | 56×28, track `#e6eaef` / `#010409`, icon 15 | track token matches, icon 16 | nit |
| Input group (projects) | input vs button height | 28 vs 40 | equal | **no** |
| Input group (milestones) | input vs button height | 28 vs 30 | equal | **no** |
| Input group (repo home) | button size | 28×32 next to 32 input | 32×32 | nit |
| Danger Zone button | margin-right | 3.5px | 0 | nit |
| Validation border | colour | `#cf222e` / `#da3633` + danger focus ring | `--borderColor-danger-emphasis` | yes |
| Dropzone | border | 1px rgba(0,0,0,.8), r 5, padding 20, 150 high | tokens; dashed, quiet | **no** |

## Artifacts
- **Routes:** `shots/critic-controls-w3r0-routes.json`.
- **Runs:** `shots/critic-controls-r0/` and `shots/critic-controls-r0-ref/`, with logs `shots/critic-controls-r0{,-ref,-smoke}.log`.
- **Probes and scans:**
  - `shots/critic-controls-r0-probe.mjs` (tasks `-tasks{1,2,3}.json`, writes to `probe1..3/`)
  - `-scan.mjs` (geometry scan at 1440/390/320)
  - `-margin.mjs`
  - `-wide.mjs`, `-tbl*.mjs` and `-nolayer.mjs` (overflow attribution)
  - `-m.mjs` (measure diff)
  - `-grid.py` (sheets in `sheets/`)
