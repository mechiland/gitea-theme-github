# Critique: controls, wave 1, round 4

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30. Mode: PREVIEW (github-auto is deployed but not registered, so shoot runs in PREVIEW mode).

## Verdict
- **Score: 8.7 / 10.** The controls folder matches github.com, with nits and one minor issue.
- **Formally not a pass:** smoke is red, 11 of 12 steps. The only failing step is `switch-theme-back`, which fails
  because github-auto is not registered in app.ini (integrator, request #7). All the other pass criteria are met:
  0 console errors and 0 literal colours.
- I checked all four r4 claims myself, in light and dark, and each holds.
- I found one new **minor** issue that the builder's layout diff also recorded without flagging it: the input
  group on milestones and projects has a search button that is taller than its input. I also found four nits.

## Hygiene (my own runs)
- **Lint:** `node build/lint.mjs controls` gives 0 errors and 0 warnings on 354 selectors.
- **Build:** `npm run build` reports `folders.controls = {status: ok, lintErrors: 0, lintWarnings: 0, files: 9, bytes: 54617}`.
- **Served file:** `theme-github-auto.css` has SHA-256 `a20ea4d8…4fa6`, the same as dist. I did not redeploy.
- **src/controls grep:** no hex, rgb() or hsl() colours. Colour words appear only in class names such as
  `.ui.green.button` and in comments. There is no `!important` outside `*.important.css`; the one hit is inside a
  comment.
- **Full shoot** (`shots/critic-controls-r4/`, routes in `shots/critic-controls-r4-routes.json`): 23 routes × light/dark
  × 1440/390, with `--states --measure`, 92 pages in total. That is my r3 set plus releases, grex-releases,
  org-members, graph, issue-view, releases-new and a star-counter-focus state.
  - 0 console errors, 0 failed requests, 0 unresolved vars.
  - 4 "problems": all four are my `issue-view comment-hover` state. The button is disabled while the textarea is
    empty, so the hover timed out. This is a problem in my route file, not a defect in the theme.
  - Off-palette colours: none on a controls surface.
    - `svg#svg-mfi-*` / `.git-entry-icon` fill `#000` (code/icons)
    - `#rel-container > svg` fill `#000` on the graph (code)
    - dropzone border `rgba(0,0,0,.8)` (lazy chunk, pages)
  - Non-Octicon icons: gitea-eclipse, gitea-whitespace/split, fontawesome-openid/save, material-invert-colors/palette on
    the graph, gitea-double-chevron, gitea-colorblind-*. All of these belong to the icons folder.
  - maxCLS 0.381: repo-home at 390. This is the same as r3, and the source is Gitea's own `repo-home-filelist`.
- **Reference captures:** `shots/critic-controls-r4-ref/` (releases, repo-home with star-counter-focus) plus
  `shots/critic-controls-r3-ref/`. Captured logged out. Nothing was submitted.
- **Tooling note:** shoot's `submit-empty` state renders with gitea-auto, because `tools/shoot/lib/preview.mjs`
  rewrites only GET documents and the signup POST response is left alone. This is true for r3 as well.
  - I re-checked the state with `shots/critic-controls-r4-validation.mjs`, which also rewrites POST responses:
    `validation/signup-empty-{light,dark}-{1440,390}.png`.
  - The field error border is `#cf222e` light / `#da3633` dark. The input keeps its default bg.
  - The flash is danger-muted: `#ffebe9` / `rgba(248,81,73,.1)`.
  - This is correct.

## r4 claims re-verified
| # | Claim | My evidence | Result |
|---|---|---|---|
| 1 | 320px rows wrap | Clip scan at 320 on 113 pages (`clip/github-320.log`). theme-playground/releases scrolls sideways by **0px**; org members by **0px** ("Manage teams and members" is 216.5×32 on its own line); grex/releases by **20px** (gitea-auto: 12px; the extra comes from the attachment list, not a control). The releases/new footer wraps and "Publish Release" goes to line 2 (`probe/relnew-320-*.png`). Issue comment form: 390 → Close Issue 125.5 + Comment side by side, right-aligned; 320 PR → "Close Pull Request" 173.1, with "Comment" on line 2, right-aligned, 8px row gap (`probe3/cf-pr-320-light.png`, `cf-issue-320-dark.png`, `cf-pr-390-dark.png`). The remaining overflow at 320 matches the builder's list exactly (user/settings 19, grex/pulls 21, branches 35, org settings 6, repo settings 5, _edit 75, unified diff 354, project 163). | fixed |
| 2 | settings/branches menu width | Menu **201.25px** at 320 and 390, **336px** at 1440. Every item is 40px high and none overflows (`probe/menu-{320,390,1440}-{light,dark}.png`). | fixed |
| 3 | Counter focus ring | Tabbing to the Star counter rings the whole control: 2px `#0969da` / `#1f6feb` at offset -2px. github.com `.btn-sm` Star is the same: 2px `#0969da` / `#1f6feb` at offset -2px. Screenshots: `probe/star-cnt-focus-*.png` and `probe/gh-star-focus-*.png`. | fixed |
| 4 | Icon-button gutters | Icon-only buttons stay square: 32×32 (issue sidebar), 28×28 (explore, file-view toggle, diff toggles, editor find). Graph Mono/Color is 63.7×28 with the icon 6px from the edge (was 1px). Previous 77.9, Next 54.8. Graph SegmentedControl: track `#e6eaef`, selected knob white with a 1px border and weight 600, unselected 400 (`crops/graph-1440-{light,dark}.png`). | fixed |

Other checks, light and dark, with no regressions against r3:
- login: input focus, primary press, checkbox focus
- repo-file: SegmentedControl focus and hover
- admin: ToggleSwitch focus
- danger button: hover and focus
- disabled input
- new-issue: title focus
- issues: search focus

Contact sheet: `crops/states-sheet.png`.

## Issues (ranked)

### 1. MINOR (controls, pre-existing, missed in r1–r3): input-group button taller than its input
- **Where:** `/octo-org/grex/milestones` and `/octo-org/theme-playground/milestones`, 1440, light and dark.
  - The input group is `.ui.small.search.fluid.action.input`.
  - The input is **28px** high. The attached `.ui.small.icon.button` (search) is **28×35.4**, so it hangs 7.4px below
    the input. Its square bottom-left corner sits under the input's rounded corner.
  - On `/octo-org/theme-playground/projects` (`shared/search/combo.tmpl`, `.ui.small.fluid.action.input`), the input is
    28px and the button is **28×40**.
- **Cause:** the `.ui.action.input` wrapper is stretched by its flex-row parent. On milestones the neighbour is the
  35.4px Labels/Milestones menu; on projects it is the 40px Sort dropdown. The button then stretches to the wrapper's
  height, while the input keeps its fixed height.
  - The builder's own layout data records it (`shots/controls-w1r4/layout-before-1440.json`:
    `BUTTON.ui small icon button||1187,163,28,35` and `…1225,212,28,40`).
  - The issue-list input group (`/issues`) is fine at 28/28, and at 390 milestones is 28/28.
- **Evidence:**
  - Screenshots: `probe4/ms-search-{light,dark}.png`, `probe4/proj-search-{light,dark}.png`,
    `probe5/ms-row-light.png`, `probe5/proj-row-dark.png`.
  - Zoom: `crops/ms-join-zoom.png`, and `crops/issues-join-zoom.png` for the correct case.
- **Expected:** a Primer input group gives the input and the button one height, with a flush join.
- **Suggested fix:** in inputs.css, `.ui.action.input { align-self: center; }`, or give the input the same stretch
  (`.ui.action.input > input { height: auto; align-self: stretch }`). A size token on both children would also work.

### 2. NIT (controls, side effect of r4 #4): text-only "icon" buttons get 5px padding
- **Where:** `.ui.icon.tiny.basic.button.resolve-conversation` ("Resolve conversation") in PR review threads is
  134.7×28 with padding 0 5px and **no svg**.
- **Evidence:** `probe6/conv-btns-{light,dark}.png`.
- **Expected:** Primer small text buttons use 8–12px of padding.
- **Suggested fix:** this case is detectable in CSS. `.ui.icon.button:not(:has(> svg, > .svg, > .icon))` could get
  the normal text-button padding. The icon-plus-text case (Mono/Color, Previous/Next) remains a documented trade-off.

### 3. NIT (controls): the settings/branches select is 69px wide at 320
- **Where:** at 320, "Update Default Branch" does not shrink and the row does not wrap, because it contains a select
  and not only buttons. The select is squeezed to **68.9px**. "main" still fits, but a longer default-branch name
  would truncate.
- **Evidence:** `probe/menu-320-light.png`. The open menu is correct at 201px.
- **Suggested fix (optional):** extend the <768px wrap rule to rows made of a `.ui.selection.dropdown.tw-flex-1` plus
  buttons.

### 4. NIT (controls): date input text sits about 2px low
- **Where:** the issue sidebar due-date `input[type=date]` is 32px high with padding 0 12px. The "yyyy/mm/dd" text sits
  about 2px below centre, in both schemes.
- **Evidence:** `probe7/due-light.png`, `probe7/due-390-dark.png`.
- **Why:** the Chrome date field ignores line-height centring. Primer text inputs use padding-block.

### 5. NIT (ownership): the menu width rule styles an overlay
- **Where:** `select.css` styles `.ui.selection.dropdown.tw-flex-1 > .menu`. The ownership table gives
  `.ui.dropdown .menu` to overlays, and controls owns "the closed control only".
- **Assessment:** harmless for now. The r3 critique suggested it, and overlays arrives in wave 2.
- **Suggested fix:** move the rule to overlays, or record it in the overlays brief so the two do not conflict.

### Also noted (not scored against controls)
- **Repo home search input group:** the button is 28×32 next to a 32px input, so it is not square. GitHub's
  IconButton in an input group is 32×32. This is part of #1 in a milder form, since the heights match.
- **Integrator #6:** the unlayered index.css on the theme-playground (Mermaid) page still breaks the commit
  `ellipsis-button`, which is 23×12 with its text spilling 2px below.
- **Graph header at 390:** the Select branches dropdown (min-width 250px, set by Gitea) pushes Mono/Color into the
  card's horizontal scroll. gitea-auto does the same.
- **releases at 320:** the Releases/Tags switcher (navigation) is 34.5px high, next to the 28px RSS Feed button.
- **Carried over:** compare picker bold ref (#8), Go-to-file 150×28 against github.com's 204×32 (pages/repo), login
  input 32 against 40 (pages/auth), button line-height 20 against 21 (the box sizes are identical).

## Measurements (ours vs github.com, 1440, light / dark)
| Item | Ours | github.com | Match |
|---|---|---|---|
| Code button | 108.9×32, padding 12, radius 6px, 14px/500, bg `#1f883d` / `#238636`, border `rgba(31,35,40,.15)` / `rgba(255,255,255,.15)` | Same | Yes |
| Branch button | 105.8×32, bg `#f6f8fa` / `#212830`, border `#d1d9e0` / `#3d444d`, icon 16px in `#59636e` / `#9198a1` | Same | Yes |
| Watch/Star/Fork height | 28, 12px/500 | 28, 12px/500 | Yes |
| Star button padding | 12 | 12 | Yes |
| Counter | 20px high, padding 0 6px, 12px/500/18px, bg `rgba(129,139,152,.12)` / `#2f3742` | Same | Yes |
| Counter radius | 9999px | 24px | Renders the same |
| Star focus ring | 2px at offset -2px, `#0969da` / `#1f6feb`, on the whole control | Same | Yes |
| Line-height | 20 | 21 | Nit |
| Icon-only small button | 28×28, radius 6px | IconButton small 28×28 | Yes (standalone) |
| Input group on milestones | Input 28, button 35.4 | Equal heights | **No** |
| Validation border | `#cf222e` / `#da3633` | `--borderColor-danger-emphasis` | Yes |

## Smoke
- Command: `node tools/shoot/smoke.mjs --theme github-auto` (log: `shots/critic-controls-r4-smoke.log`). Result: **red**,
  exit 1, 11 of 12 steps pass.
- Passing steps: apply-theme, create-issue, comment, add-label, edit-file-new-branch, open-pr, merge-pr,
  change-repo-setting, switch-theme-alt, screenshot-final, no-console-errors.
- Failing step: `switch-theme-back`. It times out waiting for `.menu .item[data-value="github-auto"]`, because the theme
  is not registered (#7).
- 0 console errors.

## Artifacts
- **Routes:** `shots/critic-controls-r4-routes.json`.
- **Full run:** `shots/critic-controls-r4/` and `shots/critic-controls-r4.log`.
- **Reference:** `shots/critic-controls-r4-ref/`.
- **Probes:** `shots/critic-controls-r4-probe.mjs` with tasks `-tasks{1..7}.json`, writing to `probe/` and
  `probe2/` through `probe7/`.
- **Menu metrics:** `shots/critic-controls-r4-menu.mjs`.
- **Icon-button scan:** `shots/critic-controls-r4-iconbtn.mjs`, which writes `iconbtn-{1440,390}.log`.
- **Clip scan:** `shots/critic-controls-r4-clip.mjs`, which writes `clip/`.
- **Element finder:** `shots/critic-controls-r4-find.mjs`.
- **Validation with POST rewrite:** `shots/critic-controls-r4-validation.mjs`, which writes `validation/`.
- **Crops:** `shots/critic-controls-r4/crops/`.
