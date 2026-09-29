# Critique: controls, wave 1, round 2

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30. Mode: PREVIEW (github-auto is deployed but not registered, so shoot runs in PREVIEW mode).

## Verdict
- **Score: 8.4 / 10. Not a pass.**
  - Every round-1 fix I re-measured holds, and on desktop the repo-header and file-header controls now match
    github.com closely.
  - The new fixed `height` + `white-space: nowrap` (r2 change #5) clips button labels at 390px on pages outside
    the builder's 11-route set. This is a visible regression (issue 1).
  - Smoke is red: one step always fails because the theme is not registered, and one step failed once in two runs
    (see Smoke).
- Lint: `node build/lint.mjs controls` gives 0 errors and 0 warnings (343 selectors). `npm run build` shows
  controls `status: ok`, 49,579 B.
- Deploy is current: the served `theme-github-auto.css` has the same SHA-256 as dist (f5905f47…). A rebuild gave the
  same hash, so I did not redeploy.
- Full shoot: `shots/critic-controls-r2/`, 16 routes × light/dark × 1440/390 with `--states --measure` (64 pages).
  - 0 console errors, 0 failed requests, 0 unresolved vars, no horizontal overflow on any page.
  - 4 "problems" come from my own route selectors (`goto-focus`, `default-*` on user-settings). The same ones failed
    in r1. They are not theme defects, and I probed those controls separately.
- Literal colours in src/controls: 0. The off-palette colours all belong to other owners:
  - `svg.git-entry-icon` fill `#000`: file icons (code/icons)
  - dropzone border `rgba(0,0,0,.8)`: lazy chunk
  - markdown `<mark>`
- Literal sizes: the r1 `3px`/`4px` literals are gone (tokens now). The only remaining literals are
  `outline-offset: 2px` on the checkbox and `1px` values, which the lint allows.

## Round-1 fixes: verified
Probes: `shots/critic-controls-r2-tasks.json` → `shots/critic-controls-r2/probe/` (results.json). Contact sheets:
`crops/buttons-{light,dark}.png` and `crops/fh-{light,dark}.png`.

| # | Claim | Measured (ours) | github.com | Verdict |
|---|---|---|---|---|
| 2 | Watch/Star/Fork focus ring on the wrapper | ring 2px `#0969da` / dark `#1f6feb`, offset -2px, around the whole 105.5×28 control | `#fork-button` 2px `#0969da`/`#1f6feb`, offset -2px, around 118.4×28 | fixed |
| 8 | No resting shadow on the labeled button | `none` | `none` | fixed |
| 3 | SegmentedControl uses the small size | 56×28, icon items 28×28, track `#e6eaef`/`#010409` | file-header SegmentedControl 210.7×28 (text items), same track colours | fixed |
| 4 | Trailing caret keeps 12px padding | Code 108.9×32, pr 12px; branch 106.7×32, pr 12px; caret 16px | Code 108.9×32, pr 12px; branch 105.8×32 | fixed (Code identical to 0.1px) |
| 5 | Pressed buttons drop their shadow | Code `#197935`/`#2e9a40` none; branch `#e6eaef`/`#2a313c` none; danger `#a40e26`/`#da3633` none | Code `#197935`/`#2e9a40` none; branch `#e6eaef`/`#2a313c` none | fixed |
| 6 | Fixed height | PR "Edit" 40.5×28 (was 35) | small button 28 | fixed, but see issue 1 |
| 9 | Owner select | 370×32, 20px avatar, focus ring 2px accent | Primer Select 32 | fixed (`probe/owner-select-*.png`) |
| 10 | `<p>` field titles | "Merge Styles" and "Default merge style" 14px/600/20px | FormControl label 14/600 | fixed (`crops/merge-light.png`, `crops/defmerge-dark.png`) |
| 7 | Validation caption CSS | injected `.help.error`: 12px/600, `#d1242f` / dark `#f85149`, 12px icon, gap 4px, mt 4px | Primer FormControl.Validation | CSS fixed; the template is still pending (request #5) |

- **Real-POST validation** (my `shots/critic-controls-r2-validation.mjs`, light and dark, 1440 and 390, 0 console errors):
  - The error field border is `#cf222e` light and `#da3633` dark.
  - Focusing the error field gives a 2px danger outline.
  - The caption appears only when injected (`validation/*-caption.png`). The real message is still shown only in the
    flash.

## Issues (ranked)

### 1. MAJOR (new in r2, controls): fixed height + nowrap clips button labels on narrow screens
- **Cause:**
  - Gitea's `modules/button.css` gives `.ui.button` `min-width: 0`, so buttons shrink inside flex rows.
  - Round 2 removed Gitea's mobile `white-space: normal` and fixed the height at 32px.
  - The label now overflows the button on **both** sides, because of `justify-content: center`.
  - The text is cut off, or spills over the button border.
- **Evidence:** `shots/critic-controls-r2/crops/clip.png`, with ours on the left and gitea-auto on the right; the
  sources are in `clip/`. Scan script: `shots/critic-controls-r2-clip.mjs` (17 extra pages at 390).

  | Page (390, light) | Button | Width vs content | Rendered |
  |---|---|---|---|
  | `/octo-org/theme-playground/settings/branches` | "Update Default Branch" | 117 wide, content 134 | "pdate Default Bran" |
  | `/octo-org/theme-playground/compare/main...feature/kbd-hints` | "View Pull Request" | 98 wide, content 108 | "iew Pull Reques" |
  | same compare page | "pull from: …" small button | 326 wide, content 339 | text crosses the left border |

  Gitea's own theme wraps these labels onto two lines, at 46px and 42px tall.
- **Why it matters:** github.com buttons never shrink below their label. A flex item keeps `min-width: auto`, and
  Primer truncates only inside `.prc-Button-Label`.
- **Fix (controls):**
  - Restore flex's content-based minimum with `.ui.button:not(.fluid) { min-width: auto }`, or give buttons
    `flex-shrink: 0`. Icon-only buttons keep their `min-width: var(--control-*-size)`.
  - For labels that really are too long, such as the "pull from" branch picker, truncate the text child as Primer
    does (`.ui.button > .text, .ui.button > span { min-width: 0; overflow: hidden; text-overflow: ellipsis }`)
    instead of letting it overflow.
  - Re-run `shots/critic-controls-r2-clip.mjs` on those pages.
- The builder listed this as a known risk but checked only its 11 routes. It shows up on 2 of the 17 extra pages I
  scanned.

### 2. MINOR (controls/shared): branch-picker button has a dark icon and a semibold label
- Crops: `crops/buttons-{light,dark}.png`, row 3 right and row 4, compared with the github.com crops.
- `.branch-dropdown-button` nests its icon as `span.flex-text-block > svg.octicon-git-branch`, so the rule
  `.ui.button > .svg { color: --fgColor-muted }` misses it.

  | Part | Ours | github.com |
  |---|---|---|
  | Leading icon | `#25292e` (default fg) | `#59636e` (muted) |
  | Label | `strong` at 600 | 500 |

- These are the most visible buttons on the repo home.
- Suggested fix: a generic leading-visual rule in controls, `.ui.button > span > .svg:first-child`. The `strong`
  weight belongs to pages/repo (`.branch-dropdown-button strong { font-weight: inherit }`) through a request.

### 3. NIT (controls): the counter inside Watch/Star/Fork sits a little far from the label and uses default fg
- Primer `.btn .Counter` uses `margin-left: 2px` plus the text space (about 5px in total) and `color: inherit`.
- Ours: margin-left 8px, and color `--fgColor-default` (`#1f2328`) instead of the button fg (`#25292e`).
- Evidence: `crops/buttons-light.png`, row 1 against row 2 left.

### 4. NIT (controls, form.css): inline field label and checkbox touch
- In repo settings, "Template ☐ Make repository a template": the checkbox's focus ring (offset 2px) touches the
  "Template" label.
- Primer would put 8px between them.
- Evidence: `repo-settings/states/light-1440-checkbox-focus-clip.png` (bottom-left of `crops/states.png`).

### 5. Carried over, not controls-owned (recorded, not scored against controls)
- **BLOCKER (integrator):** Vite still re-adds Gitea's `index.css` unlayered on Mermaid pages.
  - `repo-home-mermaid` shows a blue Code button and Watch/Star/Fork without their border (`crops/mermaid-top.png`).
  - CLS on repo-home-mermaid at 390 is 0.533 light and 0.554 dark; every other route is ≤ 0.05.
  - `head_style.tmpl` still has no `media="not all"` link (grep count 0).
- **Page folders (request #3):**
  - Login inputs and button are 32px; github.com's are 40px (352×40, padding 5px 16px).
  - The issue-list toolbar and the "Go to file" input are 28px small; github.com uses 32px.
- **Navigation/data-display:** the issue-list Open/Closed `.ui.compact.tiny.menu` looks like an inverted
  SegmentedControl at 390: the active item is grey and the inactive one is white (`crops/issues-390.png`). That is
  a `.menu`, not controls.
- **Pages/auth:** the "Sign in with OpenID" button on signup is not full-width like "Register Account"
  (`crops/signup-val-390.png`).

## What matches (measured, both schemes, ours vs github.com)
- **Primary button (Code)**
  - Rest `#1f883d` / `#238636`, hover `#1c8139` / `#29903b`, pressed `#197935` / `#2e9a40`.
  - Border `rgba(31,35,40,.15)` / `rgba(255,255,255,.15)`.
  - Shadow is identical to github.com.
  - Focus: 2px accent outline at offset -2px, plus a 3px white inset.
  - Size: 108.9×32, 14px/500.
- **Default button (branch)**
  - Rest `#f6f8fa` / `#212830`, pressed `#e6eaef` / `#2a313c`.
  - Border `#d1d9e0` / `#3d444d`.
  - Resting shadow `0 1px 0 rgba(31,35,40,.04)`, same as github.com.
- **Button with counter**
  - 28px, text 12px/500.
  - Counter 20px high, padding 0 6px, 12px/500/18px, background `rgba(129,139,152,.12)`, full radius.
  - Hover `#eff2f5` / `#262c36`.
  - Focus ring encloses the whole control.
- **Small ButtonGroup** (Raw/Permalink/Blame/History): 42.1×28, 12px/500, padding 8px, radius 6px on the first item.
  Identical to github.com Raw.
- **SegmentedControl:** 28px track, hover pill inset 4px, selected knob `#fff` / `#262c36` with border, focus 2px
  accent at offset -1px.
- **Danger button:** hover `#cf222e` / `#b62324` with white text; pressed `#a40e26` / `#da3633`, no shadow.
- **Text input focus:** border `#0969da` plus a 2px outline at offset -1px (github.com login input focus is the
  same).
- **Error input:** border `#cf222e` / `#da3633`, with a danger focus ring.
- **Checkbox and radio:** 16px, checked `#0969da` / `#1f6feb`.
- **ToggleSwitch:** small 48×24, focus ring (`crops/states.png`).

## Smoke
`node tools/shoot/smoke.mjs --theme github-auto` is **red** (exit 1) in both runs.

| Run | Log | Result |
|---|---|---|
| 1 | `shots/critic-controls-r2-smoke.log` | `edit-file-new-branch` FAILED: "page.check: Element is outside of the viewport" for `input[name=commit_choice][value=commit-to-new-branch]`. The next 5 steps were skipped. `switch-theme-back` FAILED. |
| 2 | `shots/critic-controls-r2-smoke2.log` | Every step ok except `switch-theme-back` (theme not registered, so it is not in the list, same as r1). |

- **Run 1 failure is not reproducible in isolation.** `shots/critic-controls-r2-radio.mjs` found:
  - The radio is 16×16 at (328, 1369) and `check()` succeeds, under both github-auto and gitea-auto.
  - `FAILED-edit-file-new-branch.png` shows the file tree placed low on the page, which suggests a layout shift
    while the page loaded.
- I record this as a flake (1 in 2 runs), not as a controls defect. I did not investigate it further.

## Artifacts
- Routes: `shots/critic-controls-r2-routes.json`; run: `shots/critic-controls-r2/` (+ `.log`).
- Probes: `shots/critic-controls-r2-tasks.json` → `probe/`.
- Inner-element measurement: `shots/critic-controls-r2-inner.{mjs,json}`.
- Validation: `shots/critic-controls-r2-validation.mjs` → `validation/`.
- Clipping: `shots/critic-controls-r2-clip.mjs`, `-clipshot.mjs`, `-minw.mjs` → `clip/`.
- Crops: `shots/critic-controls-r2/crops/`.
