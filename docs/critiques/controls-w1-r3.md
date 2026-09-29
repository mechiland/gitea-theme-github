# Critique: controls, wave 1, round 3

Critic: independent GitHub design-systems reviewer (no theme code written).
Date: 2026-09-30. Mode: PREVIEW (github-auto is deployed but not registered, so shoot runs in PREVIEW mode).

## Verdict
- **Score: 8.7 / 10.** The controls folder now matches github.com with nits.
- **Formally not a pass yet:** smoke is red. The one failing step (`switch-theme-back`) fails only because
  github-auto is not registered in app.ini (integrator, request #7). No step that exercises controls failed.
  Once the integrator registers the theme, controls meets every pass criterion.
- The r2 major is fixed, and so are the two minors and two nits. I verified each one myself, in light and dark.
  I found one new minor, which appears only at 320px, and two nits.

## Hygiene (my own runs)
- **Lint:** `node build/lint.mjs controls` gives 0 errors and 0 warnings on 350 selectors.
- **Build:** `npm run build` shows `folders.controls = {status: ok, lintErrors: 0, files: 9, bytes: 51856}`.
- **Deploy is current:** served `theme-github-auto.css` SHA-256 = dist = `307b9900…9f15`. I did not redeploy.
- **Literal colours in src/controls:** 0. The grep finds only `transparent` and comment text, which the lint allows.
  There is no `!important` outside `*.important.css`.
- **Full shoot** (`shots/critic-controls-r3/`, routes `shots/critic-controls-r3-routes.json`): 17 routes × light/dark
  × 1440/390, with `--states --measure`, 68 pages in total.
  - 0 console errors, 0 failed requests, 0 unresolved vars, no page flagged for horizontal overflow.
  - The 4 "problems" came from my own broken compare-picker selector. After I fixed it and re-ran the compare route,
    all 4 pages were ok. The stale `*-FAILED.png` files in `compare/states` come from the first run.
  - **Off-palette colours**, none of them on a controls surface:
    - `svg#svg-mfi-*` fill `#000`: file icons (code/icons)
    - dropzone border `rgba(0,0,0,.8)`: lazy chunk
  - **maxCLS 0.381** on repo-home (octo-org/grex) at 390. Gitea's own theme measures 0.324 there, from the same
    source (`div.repo-home-filelist`), so this does not come from controls.
- **github.com reference:** `shots/critic-controls-r3-ref/` (login, signup, repo-home, repo-file, repo-issues, and
  compare with the grex v1.4.5...v1.4.6 range). Captured logged out. Nothing was submitted.

## r2 findings: re-verified
| r2 # | Claim | My evidence | Result |
|---|---|---|---|
| 1 MAJOR | Clipped labels at 390 | My own text-range clip scan (`shots/critic-controls-r3-clip.mjs`) checks each text rect against the button box and its clipping ancestors. It covered 113 pages: all 68 routes, the builder's 25 extra pages, and 20 more of mine (admin forms, org/team settings, runners, secrets, wiki new, the editor and others). **0 clipped controls at 390.** "Update Default Branch" is 32px and shows its full label; "View Pull Request" is 143.9×32 and shows its full label; "pull from:" truncates with an ellipsis (`.text` 290 of 332px). `crops/branches-390.png`, `crops/viewpr-390.png`, `crops/compare-390.png` | fixed |
| 2 minor | Branch-picker icon and weight | Ours and github.com are identical, light and dark: 105.8×32; icon x 13–29, `#59636e` / `#9198a1`; label 500 at 37–68.8; caret at 76.8. The only difference is line-height, 20 against 21, with the same box height. `probe/branch-1440-*.png`, `probe/gh-branch-1440-*.png` | fixed |
| 3 nit | Counter gap and colour | Counter margin-left 5px; colour `#25292e` / `#f0f6fc`; background `rgba(129,139,152,.12)` / `#2f3742`, the same as github.com; 20px high, padding 0 6px, 12/500/18. `crops/head-cmp.png` | fixed |
| 4 nit | Inline label touching its checkbox | "Template" and the focus ring no longer touch. `repo-settings/states/light-1440-checkbox-focus-clip.png`. `/repo/create` keeps the 10px label gap on desktop, and at 390 the labels stack with a 4px gap. `crops/repo-new-1440.png`, `crops/repo-new-390d.png` | fixed |

States I looked at, light and dark (`crops/states-a.png`, `crops/states-b.png`):
- Code: hover, press and focus (2px accent ring plus inset).
- Branch: hover and focus.
- Fork: hover.
- Go to file: focus.
- SegmentedControl: hover and focus.
- ToggleSwitch: hover and focus.
- Checkbox: focus.
- Danger button: hover, focus and press.
- Login input: focus.
- Primary button: hover, press, focus and disabled.
- Settings input: disabled and focus.
- Signup: submit empty.

All of these match r2's verified values. I found no regressions.

## Issues (ranked)

### 1. MINOR (controls, new trade-off in r3): `min-width: auto` pushes pages sideways at 320px
- The builder named this risk. It does not happen at 390, where my scan found 0 clipped controls. At 320 (the iPhone SE
  width) it does, on 2 of 113 pages.
- I isolated the cause by injecting `.ui.button{min-width:0}` and re-measuring
  (`shots/critic-controls-r3-hs.mjs`, `clip/hs-320.log`):

  | Page @320 | Gitea theme | Ours | Ours with min-width 0 | Culprit |
  |---|---|---|---|---|
  | `/octo-org/grex/releases` | 12px | **41px** | 20px | `a.ui.small.primary.button` "New Release" ends at x=361 |
  | `/org/octo-org/members` | 0px | **4px** | 0px | `a.ui.primary.button` "Manage teams and members" ends at x=324 |

- **Evidence:** `crops/overflow-320.png`, ours next to gitea-auto. On the releases page the whole page scrolls
  sideways.
- **Why it matters:** github.com never lets a button push the page wider than the screen. Its rows wrap instead.
- **Suggested fix:** the rows themselves should wrap, through a request to pages-repo (releases header) and
  pages-people (org members header), for example `flex-wrap: wrap` on the header row. Alternatively, controls can
  add `max-width: 100%` together with label truncation on standalone text buttons.
- Other extra overflow at 320 is **not caused by controls** (min-width 0 does not change it):
  - `/user/settings` 19px (file input), `/octo-org/grex/pulls` 21px, `/octo-org/grex/branches` 35px,
    `/org/octo-org/settings` 6px, repo settings 5px.
  - `_edit/main/SMOKE.md`: 5px at 390 and 75px at 320. The cause is the `.ui.compact.small.menu.repo-editor` tab
    menu, which the navigation folder owns.

### 2. NIT (controls, side effect of r3): select menu narrower than its content on settings/branches at 390
- With `.ui.selection.dropdown.tw-flex-1 { min-width: 0 }`, the select is about 139px wide. Fomantic sizes the menu to
  the select, so the branch name "smoke-20260929173140" wraps onto two lines.
- **Evidence:** `settings-branches/states/light-390-select-open.png` (`crops/sb-open-390.png`).
- **Expected:** a Primer ActionMenu or SelectPanel overlay has a minimum width (about 192px) and does not wrap
  item text.
- **Suggested fix:** `.ui.selection.dropdown.tw-flex-1 > .menu { min-width: max(100%, var(--overlay-width-xsmall)) }`
  or similar, in controls or overlays.

### 3. NIT (controls, and Gitea markup): the counter has its own focus ring
- The Watch and Star buttons are `<a role="button">` with no href or tabindex, so they cannot take keyboard focus at
  all (this comes from the Gitea template).
- Tabbing therefore lands only on the counter link (`a.ui.basic.label`). It gets a round 2px ring at offset 1px around
  the counter alone.
- On github.com, the whole Star control carries the ring (123.7×28, offset -2px).
- **Evidence:** `crops/star-focus.png`.
- **Suggested fix (optional):** `.ui.labeled.button:has(> .label:focus-visible)` could ring the wrapper, since the
  counter sits inside the button visually. A separate ring on the counter is arguably correct, because it is a
  separate link.

### 4. Carried over, not controls-owned (recorded, not scored against controls)
- **Integrator:**
  - Smoke `switch-theme-back` fails because github-auto is not registered (request #7).
  - **BLOCKER #6:** Vite re-adds Gitea's `index.css` unlayered on Mermaid pages. On `/octo-org/theme-playground` the
    commit "…" `ellipsis-button` computes Gitea's `14px/8px`, `padding: 0 5px 8px` and a 1px border inside our 12px
    height, so its text spills 2px below the box.
  - The same control on `/octo-org/grex/commits` is correct: 19.9×12, 12px/6px, padding 0 4px 4px, no border, radius
    3px.
- **pages/repo:**
  - Request #8: the compare pickers show the ref in bold.
  - github.com also mutes the "base:" / "compare:" prefix (`crops/compare-1440.png`).
  - The Go-to-file input is 150×28 at 12px; github.com uses 204×32 at 14px.
- **pages/auth:** login input and button are 32px; github.com uses 40px, with 16px input text.

## Measurements (ours vs github.com, 1440)
- **Code button**, light and dark: 108.9×32, padding 12/12, radius 6px, 14px/500, bg `#1f883d` / `#238636`, border
  `rgba(31,35,40,.15)` / `rgba(255,255,255,.15)`, shadow identical. github.com matches except line-height, 21 against
  our 20.
- **Branch button:**
  - Box: 105.8×32, bg `#f6f8fa` / `#212830`, border `#d1d9e0` / `#3d444d`, shadow `0 1px 0 rgba(31,35,40,.04)`.
    Identical to github.com.
  - Inner layout: icon x13 w16 in `#59636e` / `#9198a1`, label x37 w31.8, caret x76.8. Identical to github.com.
- **Button with counter:**
  - Height 28; font 12/500.
  - Counter 20px high, bg `rgba(129,139,152,.12)` / `#2f3742`, colour `#25292e` / `#f0f6fc`. Identical to github.com.
  - Radius: ours 9999px, github.com 24px. This renders the same at 20px height.
- **Focus ring:** 2px `#0969da` / `#1f6feb` at offset -2px on buttons, the same as github.com's Star `.btn-sm`.
- **Compare picker:** ours is 28px high, 12px/500, padding 8px. github.com `.btn-sm` is 28px with 12px padding.

## Smoke
- Command: `node tools/shoot/smoke.mjs --theme github-auto` (log: `shots/critic-controls-r3-smoke.log`). Result: **red**,
  exit 1.
- 11 of 12 steps pass, including create-issue, comment, add-label, edit-file-new-branch, open-pr, merge-pr,
  change-repo-setting and switch-theme-alt.
- `switch-theme-back` times out waiting for `.menu .item[data-value="github-auto"]`, because the theme is not
  registered.
- 0 console errors.

## Artifacts
- **Routes:** `shots/critic-controls-r3-routes.json`.
- **Full run:** `shots/critic-controls-r3/` and `shots/critic-controls-r3.log`.
- **Reference:** `shots/critic-controls-r3-ref/`.
- **Clip scan:** `shots/critic-controls-r3-clip.mjs`, which writes `clip/{github,gitea}-{390,320}.{log,json}`.
- **Overflow isolation:** `shots/critic-controls-r3-hs.mjs`, which writes `clip/hs-320.log`.
- **Probes:** `shots/critic-controls-r3-probe.mjs` with tasks `-tasks{1..5}.json`, writing to
  `probe/`, `probe2/` and `probe3/`.
- **Crops:** `shots/critic-controls-r3/crops/`.
