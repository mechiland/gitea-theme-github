# Critique: pages/actions-packages-projects, wave L2, round 1 (Final gate #2 items)

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.4 / 10: NOT A PASS** (bar 8.5). Console errors 0, literal colours 0 (lint 0/0), off-palette 0, smoke green (13/13 steps, exit 0).

Every Final gate #2 item the builder claimed is really there, and I checked each one with my own screenshots and measurements. That includes the two states the builder said it had not captured: the projects-list row actions revealed by keyboard focus, and the matrix tab accent on hover. The score stays below the bar because of one major defect the builder's routes never visited. When you pick a workflow (`?workflow=ci.yml`), the runs Box on the Actions page breaks into three pieces. Past that, the misses are small, mostly at 390.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` gave 0 errors, 0 warnings, 354 selectors.
- **Build:** `npm run build` gave `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 7, bytes: 78063}`. The served `theme-github-auto.css` has the same sha1 as dist (`462d1413…`), so I did not deploy. All three bundles print OVER BUDGET (auto 321.7 KiB = 329,397 B, light 316.7, dark 317.7). That is a whole-theme problem and informational only.
- **Shoot:** `shots/critic-pages/actions-packages-projects-wL2-r1` (routes `shots/critic-pages/actions-packages-projects-wL2-r1-routes.json`, 14 routes × light/dark × 1440/390, `--states --measure`, plus new states `type-hover/-focus/-open`, `row-hover`, `row-focus`, `edit-focus`, `matrix-hover` and a new route `awl2-actions-workflow`). Results over 56 pages:
  - 0 problems and 0 failed states.
  - 0 console errors and 0 failed requests.
  - 0 off-palette colours.
  - Max CLS 0.0053 (packages-org 390).
- **Unresolved var:** `--gh-octicon-calendar` appears on every page. It comes from the controls folder's date-input rule and has `matchedElements 0`, so it is not this folder's.
- **Non-Octicon icons:** `gitea-npm` ×12 on the packages pages. It is the npm brand logo (brand exemption), not this folder's.
- **Reference:** github.com logged-out, `docs/reference/awl2-*`, 9 routes with `--states --measure`. The github-side hover/focus states on actions-list failed on github's current DOM, so for those I compared against the screenshots only.
- **Extra probes:**
  - `shots/critic-pages/awl2-measure.mjs` measures pseudo-elements, geometry and the board at 1280×720 and 1920×1080. Output: `…-wL2-r1/awl2-measure.json`.
  - `awl2-lastmenu.mjs` opens the last board column's menu under the fade mask.
  - `awl2-touch.mjs` checks the projects-list row actions with hasTouch at 390.
  - `awl2-wf.mjs` checks the workflow-selected Box structure.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` exited 0 with 13/13 steps ok and 0 console errors (`shots/critic-pages/actions-packages-projects-wL2-r1-smoke.log`).

## Builder claims checked
| item | verdict | evidence |
|---|---|---|
| FG2-022 pane "Actions" h2 | **confirmed** | `.menu::before` "Actions" 20px/30px 600, margin 4/8. The text sits 35px below the pane top; github also 35 (217−182). Hidden below 768 (390: `content: none`). Rule: 1px `rgba(209,217,224,.7)` = --borderColor-muted, spanning −8/−8. Dark: `rgba(61,68,77,.7)`. al-top crops of `awl2-actions-list/{light,dark}-1440.png` |
| FG2-022 PageHeader | **confirmed** | "All workflows" 20px/400/32px; subtitle 14px/21px rgb(89,99,110) light / rgb(145,152,161) dark, 24px to the Box. Box top is 93px below the column top, github also 93 (275−182). Also shown at 390 and on `?status=6`. Not shown with a workflow selected (`awl2-actions-workflow/light-1440.png`). |
| FG2-071 SHA | **confirmed** | Link box 51.9×18, 12px ui-monospace, underline, --fgColor-muted. The DOM text "96c6cf717e" is clipped to 7 cells. |
| FG2-029 list icon, filter group | **confirmed** | Row `::before` is 16×16 with the package mask in --fgColor-default. Group is 640×32: Type 140 wide, left radius 6, bg rgb(246,248,250), 14px/500. Hover rgb(239,242,245) light / rgb(38,44,54) dark (sampled from `states/*-type-hover.png`). Input 470, search button 32. github Type button: 106.7×32, 14px/500, same colours. |
| FG2-029 title icon | **confirmed** | 32×32, --fgColor-muted, 12px gap (`awl2-package-detail-npm/light-1440.png`). |
| FG2-029 versions | **confirmed** | Crumb link rgb(9,105,218) / rgb(68,147,248), no underline. "Versions" 24px/36px 400, 44px above, 8px + 1px muted rule + 16px below. The heading sits 73px below the crumb; github also 73 (`awl2-package-versions/dark-1440.png` vs `docs/reference/awl2-package-versions/dark-1440.png`). |
| FG2-051 fade | **confirmed** | `#project-board` mask: linear-gradient over the last 32px (16px at 390). The last column's menu opened after scrolling to the end is not faded (`extra-board-lastmenu-1440.png`). |
| FG2-051 columns to footer | **confirmed** | 1440×900: columns h484, bottom 764, footer 780. 1280×720: bottom 700.7, footer 716.7. 1920×1080: bottom 944, footer 960. |
| FG2-051 390 header | **confirmed** | Title and 5 joined 32×32 buttons share one row, y186 (`states/light-390-toolbar-hover-390.png`). |
| FG2-051 list reveal | **confirmed** | Opacity is 0 at rest. The actions reveal on row hover, on title focus and on Edit keyboard focus (`awl2-projects-list/states/light-1440-row-hover-clip.png`, `-edit-focus-clip.png`, `dark-1440-row-focus-clip.png`). With hasTouch (hover:none) they are always visible (`extra-projects-list-390-touch-true.png`). |
| FG2-056 390 selector row | **confirmed** | The selected item gets order −1, 20px/600/30px, and a 24px icon at x16 like the title's icon (x16). Name at x48. "Summary" has no home icon. Content follows, then the rest of the list. |
| FG2-085 edges | **confirmed** | `g[mask]` mask none. Lint→Build path is 96×0, stroke 1.5px, rgb(129,139,152) light / rgb(101,108,118) dark, visible in both schemes. |
| FG2-095 matrix tab | **confirmed, with a size deviation** | Tab on the card's top edge. Hover gives an accent border on tab and card in both schemes (`states/*-1440-matrix-hover.png`). **Measured 24.5px tall, 12px/500 with a 19.5px line height, not the claimed 22px/18px** (github ≈20px). |
| FG2-095 log panel | **confirmed** | Border 0, radius 3px, bg rgb(1,4,9) = dark --bgColor-inset. Edge to edge (radius 0) at 390. |

## Findings (most important first)

### 1. MAJOR: the runs Box breaks apart when a workflow is selected (actions-workflow, both schemes, 1440 and 390)
Route: `/octo-org/theme-playground/actions?workflow=ci.yml`. PNG: `awl2-actions-workflow/light-1440.png` and `dark-1440.png`; zoomed crops show all three pieces.
Gitea renders this as one attached chain: Box header, then `.ui.blue.info.attached.message` (workflow_dispatch notice), then the hidden modal, then `.ui.attached.segment` with the runs.
- **What happens:** the Box header closes as its own box (y128, h66). The message is a free-standing callout 16px below it (y210, `margin: 16px 0`). The runs segment starts 16px lower (y296) with **border-top 0**, so the run list is an open box with no top edge.
- **github.com:** the workflow_dispatch flash sits above the Box, and the Box (header + rows) stays intact.
- **Cause:** overlays/flash.css `.ui.message { margin: 16px 0 }` has no zero-margin case for a mid-chain attached message. The runs segment drops its top border because it assumes the header directly precedes it.
- **Fix idea, in this folder's page scope:**
  - Glue the message: `.flex-container-main > .ui.attached.message { margin: 0 }`, with the Box borders (--borderColor-default sides, no radius).
  - Or match github: make `.flex-container-main` a flex column when it `:has(> .ui.attached.message)` and give the message `order: -1` plus a 16px bottom margin. The header then keeps its top radius and the segment follows it directly.
- Pre-existing or not, this page state was never in any routes file. Please add `?workflow=` to the builder's routes.

### 2. MINOR: at 390 "All Workflows" appears twice in a row (actions-list light/dark 390)
PNG: `awl2-actions-list/light-390.png`. The NavList (All Workflows / CI, 64px) sits directly above the new "All workflows" PageHeader.
github.com at 390 (`docs/reference/awl2-actions-list/light-390.png`) has no NavList: the heading itself is the "All workflows ▾" picker.
At minimum, when the heading shows below 768, the NavList's "All Workflows" row repeats it. Consider hiding the generated heading below md (keep the subtitle), or tightening the NavList into one row.

### 3. MINOR: the 390 board header buttons have no visible or tooltip label (project-board 390)
The 5 IconButtons measure 32×32 at x218–374. Their `aria-label`, `title` and `data-tooltip-content` are all null; the only name is the font-size-0 text.
Screen readers are fine. A sighted user sees Fullscreen / Edit / Close (circle-slash) / Delete / + with no way to tell Close from Delete.
Primer IconButtons always carry a tooltip. github.com's mobile project header uses a kebab overflow menu.
This is CSS-only, so no tooltip is possible. Note it as a trade-off, or keep the two destructive or ambiguous actions as text.

### 4. NIT: the matrix tab is taller than claimed and joins the card with a straight edge (action-run 1440/390)
Measured tab h24.5 (`line-height` 19.5px from --text-body-lineHeight-small); the claim was 22px/18px. github ≈20px.
github's tab meets the card top through a concave radius. Ours is a straight vertical step (zoomed comparison of `awl2-action-run/light-1440.png` vs `docs/reference/awl2-action-run/light-1440.png`).
github's card content is inset ~29px with "Show all jobs" under the icon. Ours is inset 20px with "Show all jobs" indented under the name (Gitea markup).

### 5. NIT: double rule below the graph at 390 (action-run 390)
With "Summary" moved up to the selector row, the NavList divider that followed it now opens the list below the graph. The result is the graph Box's bottom edge, then a second rule 50px lower above "All jobs" (`awl2-action-run/light-390.png`, y≈1865/1916 device px). Hide the first `.divider` when its previous item is the moved `.selected` one.

### 6. NIT: run title/status icon size and the 390 Re-run row
Title status icon measures 24px at both widths. github: 22px at 1440, 16px at 390, where the selector row icon is 16 too.
At 390 github folds Re-run into a kebab beside the title. Ours puts a full "Re-run failed jobs" button on its own row between the title and the selector row, so the selector sits 48px lower than on github. This predates L2 (Vue markup).

### 7. NIT: packages Type button content
It shows the Fomantic placeholder "Type" in --fgColor-muted (rgb(89,99,110)) with the double sort caret. github shows "Type: All" (label muted, value default) with triangle-down. The same applies to "Newest" on the versions page.

### 8. NIT: versions breadcrumb separator
"/" renders in --fgColor-default. github renders it in --fgColor-muted.

### 9. Known and accepted (template or locale, builder already listed)
- "All Workflows" capital W.
- No "Filter workflow runs" input.
- No heading for a selected workflow.
- "(1.0.0)" bold in the title; no Latest label.
- Projects "N Open" without a Counter.
- No job ▾ menu at 390.
- Graph wider than 390.

### 10. INFO (not this folder)
- Bundles OVER BUDGET: auto 329,397 B.
- `--gh-octicon-calendar` unresolved (controls).
- `gitea-npm` brand icon.
- The Primer-scale solid label colours in the 390 board shot come from the labels owner.

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| Actions pane h2 | font / offset from pane top | 20px/30px 600 / 35 | 20px 600 / 35 | yes |
| All workflows PageHeader | font / offset from column top | 20px/400/32px / 32 | 20px 400 / 34 | yes |
| subtitle | font / colour | 14px/21px / rgb(89,99,110) | 14px / muted | yes |
| runs Box | top offset from column top | 93 | 93 | yes |
| runs Box header | size / padding / radius / bg | 1056×66 / 16 / 6 / rgb(246,248,250) | 1056×66 / 16 / 6 / rgb(246,248,250) | yes |
| run row | height | 78 | 79 | yes |
| run title | font | 16px/24px 600 | 16px/24px 600 | yes |
| commit SHA | width / font / decoration | 51.9px (7ch) / 12px mono / underline | 7 chars / 12px mono / underline | yes |
| run kebab | size / padding | 24×34 / 9px 4px | 24×34 / 8px 4px | yes |
| NavList item | h / padding / radius | 32 / 6px 8px / 6 | 33 / 6px 8px / 6 | yes |
| workflow-selected Box | continuity | header, detached message (16px gaps), open segment | intact Box, flash above | no |
| packages Type button | h / padding-left / radius / font | 32 / 16 / 6px 0 0 6px / 14px 500 | 32 / 16 / 6 / 14px 500 | yes |
| packages Type button | bg rest / hover | rgb(246,248,250) / rgb(239,242,245) | rgb(246,248,250) / --button-default-bgColor-hover | yes |
| packages filter group | width | 640 | ≈645 (Type 107 + input 538) | yes |
| package row | height / padding | 74 / 16 | 75 / 16 | yes |
| package name | font | 16px/24px 600 | 16px/24px 600 | yes |
| package meta | font / colour | 12px/18px / rgb(89,99,110) | 12px/18px / rgb(89,99,110) | yes |
| package row icon | size / colour | 16 / rgb(31,35,40) | 16 / fg default | yes |
| versions heading | font / offset from crumb | 24px/36px 400 / 73 | 24px 400 / 73 | yes |
| run title | font | 20px/30px 600 | 20px/30px 600 | yes |
| run status icon | size | 24 | 22 | no (nit) |
| job NavList item | size / padding / radius | 272×32 / 6px 8px / 6 | 272×32 / 6px 8px / 6 | yes |
| Re-run button | h / radius / font | 32 / 6 / 14px 500 | 32 / 6 / 14px 500 | yes |
| matrix tab | height / font | 24.5 / 12px/19.5px 500 | ≈20 / 12px 500 | no (nit) |
| workflow edge | stroke | 1.5px rgb(129,139,152), visible | visible | yes |
| job log panel | border / radius / bg | 0 / 3px / --bgColor-inset | 0 / 3px / inset | yes |
| 390 selector row | font / icon / name x | 20px/30px 600 / 24px / 48 | 20px 600 / 16px / ≈41 | yes (icon nit) |
| board columns | bottom vs footer (1440×900) | 764 / 780 | to bottom of view | yes |
| board 390 header actions | size / label | 32×32 ×5 / no tooltip | IconButton + tooltip / kebab | no (minor) |
| CLS | max over 56 pages | 0.0053 | — | yes |
