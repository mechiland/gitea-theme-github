# Critique: controls, wave 1, round 1

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30. Mode: PREVIEW (github-auto deployed, not yet registered, so shoot runs in PREVIEW mode).

## Verdict
- **Score: 8.2 / 10.** With the cascade working, the controls are close to github.com. Heights, radii, colours and
  the hover, press and focus colours match to the RGB value in both schemes. The folder is held back by one
  keyboard-focus bug on the most visible control (the Watch/Star/Fork focus ring), a SegmentedControl size
  mismatch, trailing-caret padding, and press-state shadows.
- **Not a pass.** Pass needs a score of at least 8.5 and a green smoke test. Smoke is red for a reason outside
  controls (see below).
- Lint: `node build/lint.mjs controls` gives 0 errors and 0 warnings (329 selectors).
  `dist/build-report.json` shows controls `status: ok`, 45,890 B.
- Served `theme-github-auto.css` has the same SHA-256 as dist (2efea749…), so the deploy is current.
- Console errors: 0 (60 captures, `shots/critic-controls-r1/summary.json`). Failed requests: 0. Unresolved vars: 0.
- Literal colours in src/controls: 0. Every off-palette colour found belongs to another owner:
  - `svg#svg-mfi-*` file icons (black fill)
  - Gitea dropzone chunk border `rgba(0,0,0,.8)`
  - markdown `<mark>` yellow
- Lint-evading literal sizes (nit): `box-shadow: inset 0 0 0 3px` (buttons.css:193), `outline-offset: 3px`
  (checkbox.css:185), and the radial-gradient `3px/4px` stops (checkbox.css:148-150). The lint does not flag
  them because a `var()` appears in the same declaration.

## BLOCKER for the theme (not the controls folder): Gitea CSS re-injected unlayered on pages with Mermaid
- **Evidence:** `shots/critic-controls-r1/repo-home-mermaid/*.png` shows `/octo-org/theme-playground`, whose
  README contains a mermaid block.
- **Cause:** Vite's `preload-helper` (called from `mermaid.core.*.js` `loader`) appends
  `<link rel="stylesheet" href="/assets/css/index.DleUJaOD.css">`. It does this because the only existing link
  for that file is `rel="preload"` plus an `@import … layer(gitea)`, and the helper only looks for
  `link[rel=stylesheet]`.
- **Effect:** Gitea's entire CSS becomes unlayered again and beats every `gh.*` layer.
  - Code button renders blue `rgb(9,105,218)`, 33.75px tall, radius 4px, weight 400.
  - Watch/Star/Fork lose their border.
  - Traced with `shots/critic-controls-probe2.mjs`: the appendChild stack comes from `mermaid.core.COTrLbdM.js`.
- **Also causes the layout shift:** CLS on repo-home at 390 is 0.553, and 0.2615 on repo-file for the
  playground README. On mermaid-free pages (`/octo-org/.profile`) CLS is 0.038.
- **Scope:** the same pattern exists in `templates/base/head_style.tmpl`, so production is affected too, not
  only PREVIEW mode.
- **Proposed fix (integrator):** add a non-applying stylesheet link that satisfies the helper's lookup. In
  head_style.tmpl, next to the preload, add
  `<link rel="stylesheet" href="{{.}}" media="not all" data-gh-layered>`
  and mirror the same change in `tools/shoot/lib/preview.mjs`. Then re-verify that
  `document.styleSheets` holds no second `index.*.css` after mermaid renders.
- For grading, repo-home and repo-file were therefore measured on mermaid-free pages:
  `/octo-org/.profile` and `/octo-org/theme-playground/src/branch/main/docs/guide/getting-started.md`.

## Issues in controls (ranked)
1. **Major: Watch/Star/Fork focus ring covers only the inner link and cuts into the label.**
   - Selector: `.ui.labeled.button > .button:focus-visible` gets a 2px accent outline at offset -2px, but the
     inner `.button` has `padding-right: 0`. The ring stops at the "k" of "Fork" and the counter sits outside it.
   - github.com rings the whole 28px button, counter included (`#fork-button`: outline 2px `#0969da`, offset -2px).
   - Evidence: `shots/critic-controls-r1/probe1/fork-focus-{light,dark}.png` against `gh-fork-focus-*.png`, and
     `crops/probe1-sheet.png`.
   - Fix: draw the ring on the wrapper with `.ui.labeled.button:has(> .button:focus-visible)` and give the inner
     link `outline: none`.
   - Note (Gitea markup, not controls): the Watch and Star `<a role=button>` have no href or tabindex, so they
     cannot be focused at all.
2. **Minor: SegmentedControl height ignores the item size.**
   - The file-view source/rendered toggle is `.ui.compact.icon.buttons` containing `.ui.mini.basic.button`
     items. The track rule `.ui.buttons:has(> .active.button)` makes it 32px, and the item padding becomes 12px.
   - It sits next to the Raw/Permalink/Blame/History group, which is correctly 28px (42.1×28, the same as
     github.com Raw).
   - github.com's file-header SegmentedControl is 28px (measured 210.7×28).
   - Evidence: `crops/fh-zoom.png`, `crops/gh-file-header-light.png`, and `repo-file/light-1440.measure.json`
     (`segmented` 82×32 vs 210.7×28).
   - Fix: add `:has(> .mini.button, > .tiny.button, > .small.button)` → `--control-small-size` and item
     `min-width: 28px`.
3. **Minor: buttons with a trailing caret use padding-right 8px; github.com uses 12px.**

   | Button | Ours (padding-right, width) | github.com (padding-right, width) |
   |---|---|---|
   | Code | 8px, 102.9px | 12px, 108.9px |
   | Branch | 8px, 100.7px | 12px, 105.8px |

   Both are Primer React Buttons with `trailingAction`, measured in `probe1/results.json`.
   Rule: `.ui.button.dropdown, .ui.button:has(> .dropdown.icon:last-child) { padding-right: condensed }`.
4. **Minor: press state keeps shadows that github.com drops.**
   - Primary `:active` gives `box-shadow: inset 0 1px 0 rgba(0,45,17,.3)` (`--button-primary-shadow-selected`).
     github.com's pressed Code button shows `none`.
   - Default and danger `:active` keep the resting shadow. github.com's pressed branch button shows `none`.
   - The pressed background colours match exactly: default `#e6eaef`, primary `#197935`, dark `#2a313c`/`#2e9a40`.
   - A `:focus` rule leaves `outline: 1px solid transparent` in the pressed state. It is harmless.
5. **Minor: `min-height` instead of `height` lets buttons stretch in flex rows.**
   - PR title "Edit" (`.issue-title-buttons .ui.small.basic.button`) renders 40.5×35 with 12px text. github.com
     uses a 28px small button.
   - Primer sets `height`. Consider `height: var(--control-*-size)` together with `min-height`, or
     `align-self: center`.
   - Evidence: `crops/pr.png`.
6. **Minor (brief requirement, needs a template): no inline validation caption.**
   - The brief asks for a 12px semibold danger caption with the alert-fill octicon.
   - A real POST (not PREVIEW-limited; my `shots/critic-controls-validation.mjs` rewrites POST responses too)
     shows the error field border `#cf222e` / `#da3633` and the focus ring in danger colour. The flash banner
     carries the message and no caption appears.
   - Evidence: `validation/login-{light,dark}-{1440,390}.png`, `crops/validation.png`.
   - The builder should file a template request (e.g. `.field.error` + `Err_*` → a `<p class="help error">`),
     or accept it as a documented exception.
7. **Nit: default buttons carry `--button-default-shadow-resting`; github.com repo-header `.btn-sm` shows `none`.**
   The builder acknowledged this. The branch button on github.com does carry the resting shadow, so the shadow
   is right for medium buttons.
8. **Nit: the owner selection dropdown on /repo/create is 33.8px tall; other selects are 32px.**
   The cause is the avatar in `.text`. Evidence: `probe2/repo-new-selects-*.png`.
9. **Nit: some field titles are `<p>` rather than `<label>` and stay 400 weight.**
   Examples in repo settings: "Projects Mode…", "Merge Styles", "Default merge style"
   (`div.field > div.field > p`). `form.css` only covers `.inline.field > p`. In Primer FormControl these would be
   semibold labels.
10. **Nit, shared: `.ui.small` inputs and buttons (28px) sit next to 32px controls in the same row.**
    - Examples: "Go to file" (28px, 12px font) next to "Add File" and Code (32px) on repo-home; the issue-list
      search input and buttons are 28px.
    - github.com uses 32px for all of these (goto 204×32, 14px).
    - The mapping is correct per Primer. The builder already raised this with the page folders in
      requests/controls.md #3.

## What matches (measured, both schemes, ours vs github.com)
- **Primary Code button**
  - Size and type: 32px high, radius 6px, 14px/500, gap 8px.
  - Rest: bg `#1f883d`, dark `#238636`; border `rgba(31,35,40,.15)`.
  - Hover: `#1c8139`, dark `#29903b`.
  - Pressed: `#197935`, dark `#2e9a40`.
  - Focus: 2px `#0969da` outline, dark `#1f6feb`, offset -2px, plus the 3px white inset.
  - All identical to github.com.
- **Default button**
  - Rest `#f6f8fa` / `#d1d9e0`; dark `#212830` / `#3d444d`.
  - Hover `#eff2f5`, dark `#262c36`. Pressed `#e6eaef`, dark `#2a313c`.
  - Focus ring identical to github.com.
- **Button with counter (Watch/Star/Fork)**
  - 28px high. The counter is 20px high, padding 0 6px, 12px/500, line-height 18px, bg `rgba(129,139,152,.12)`,
    full radius. All identical to github.com.
- **Text input focus**
  - Border `#0969da` plus a 2px outline at offset -1px, the same as github.com's TextInput (goto input).
  - The login input is 32px; github.com's login input is 40px (page-level choice).
- **Checkbox and radio:** 16px, 3px radius, checked `#0969da` / dark `#1f6feb`, 4px radio ring, focus offset 2px,
  disabled `#818b98`. All match the Primer React spec.
- **ToggleSwitch**
  - Track `#e6eaef`, dark `#010409`. Knob `#fff`, dark `#262c36`. Checked `#0969da`.
  - Primer tokens are used correctly. Checked by setting `checked` with JS.
- **SegmentedControl:** track `#e6eaef`, selected knob white with border, 4px hover pill, accent focus ring. All
  match github.com apart from the size (issue 2).
- **Danger button**
  - Rest: red text on the default surface.
  - Hover: `#cf222e` bg, white text; dark `#b62324`.
  - Pressed: `#a40e26`, dark `#da3633`.
- **Selection dropdown and native select:** 32px, Primer up/down arrow glyph, focus ring the same as inputs.
  The open state's bottom radius of 0 stays (the menu is attached; overlays owns the menu).

## Smoke
`node tools/shoot/smoke.mjs --theme github-auto` gives **red** (exit 1). `shots/critic-controls-r1-smoke.log`
lists the step results:

| Steps | Result |
|---|---|
| apply-theme, create-issue, comment, add-label, edit-file-new-branch, open-pr, merge-pr, change-repo-setting, switch-theme-alt | ok |
| switch-theme-back | FAIL: `.menu .item[data-value="github-auto"]` is not in the theme list |
| screenshot-final, no-console-errors | ok |

The failure happens because github-auto is not registered yet (a Gitea restart is needed). It is not a controls
defect. The admin theme is left at gitea-auto, the PREVIEW base, as before.

## Artifacts
- Routes: `shots/critic-controls-routes.json`
- Ours: `shots/critic-controls-r1/`
- github.com reference: `shots/critic-controls-r1-ref/`
- Probes: `shots/critic-controls-state.mjs` → `shots/critic-controls-r1/probe1`, `probe2`;
  `shots/critic-controls-validation.mjs` → `shots/critic-controls-r1/validation`;
  `shots/critic-controls-probe2.mjs` (mermaid trace)
- Crops: `shots/critic-controls-r1/crops/`
