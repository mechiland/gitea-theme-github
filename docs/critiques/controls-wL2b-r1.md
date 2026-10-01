# Critique: controls, wave L2b, round 1 (regression fix for controls-wL2-r1)

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.0 / 10. FAIL** (pass needs ≥ 8.5).
- The regression is fixed: the tabs can be clicked again, the diff comment editor has one border, and the toolbar stays inside the Box.
- One builder claim is falsified (nit 5, search icon focus colour).
- In split diff at tablet widths, the primary "Start review" button is clipped out of the comment cloud.
- Console errors 0, literal colours 0, smoke green.

## Verification
- **Lint:** `node build/lint.mjs controls` → 0 errors, 0 warnings, 338 selectors.
- **Build:** `npm run build` → `folders.controls.status = "ok"`, 12 files, 71,895 B source.
  - The builder reported 72,035 B; the brief said to shrink, but the folder grew by about 1.2 KB against 70,662 B last round.
  - The theme is still over budget (auto 326.5 KB), but that is theme-wide.
- **Served vs dist:** the sha differs only because of `pages/repo` (new-repo.css and commits.css were edited after the 21:43 deploy). The rule-by-rule diff shows no controls rule differs. I did not deploy.
- **Gitea capture:** `shots/critic-controls-r1-wL2b` (routes `shots/critic-controls-wL2b-r1-routes.json`).
  - Routes: the 5 brief routes plus 6 editor/tags/admin routes from last round.
  - Coverage: light and dark, 1440 and 390, `--states --measure`.
  - Result: 44 pages, 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours, 0 non-Octicon icons.
  - Unresolved var: `--gh-octicon-calendar` on 44/44 pages, with 0 matched elements on these routes (blocked by CT-IC-1).
- **Probes** (editors opened and keys pressed, never submitted):
  - `shots/critic-controls-wL2b-r1-probe.mjs` covers the inline diff comment: split right, split left and unified, at 1440, 1280, 1100, 1012, 768 and 390, light and dark, 2x. Output: `probe/probe.json`, log `shots/critic-controls-wL2b-r1-probe.log`.
  - `-probe2.mjs` covers the review box, comment edit, wiki plus EasyMDE, Files-changed thread reply and code-comment edit, at 1440, 768 and 390.
  - `-probe3.mjs` covers keyboard focus on the toolbar, the disabled-checkbox cursor and EasyMDE fullscreen.
  - `-probe4.mjs` covers the search button keyboard focus.
  - CDP matched-rules check: scratch script.
  - The admin diff style was restored to `unified` (my probe3 had left it on split; now fixed). The theme is still github-auto.
- **github.com reference:** `shots/critic-controls-wL2b-r1-ref` (repo-issue, repo-pull-files, cr-tags; logged out; `--measure`).
  - Logged out, github.com shows no comment editor. The editor comparison therefore rests on the Primer CommentBox, TabNav and IconButton specs.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` → **green**, 13/13 steps, 0 console errors (`shots/critic-controls-wL2b-r1-smoke.log`).

## Builder claims checked
- **Tabs clickable, toolbar inside the Box (split diff): CONFIRMED.**
  - Hit-test at the tab centres returns the tab at every width, for split left, split right and unified, in light and dark.
  - Split 1440: toolbar x 891–1381, inside the editor (cloud 882–1390); position static.
  - Unified 1440 and 1280 (818px editor): absolute in the tab row, 136px clear of the Preview tab.
  - `probe/split-right-light-1440.png`, `probe/unified-x-light-1440.png`.
- **One border on the inline diff form: CONFIRMED.**
  - At 2x the left and top edges are exactly 2 device px of rgb(209,217,224) in light and rgb(61,68,77) in dark, then the `--bgColor-muted` strip.
  - Probe PNGs at 2x.
- **Action row 8px inset: CONFIRMED at ≥1012.** The last button's right edge is 8px inside the cloud's inner edge (1381 vs cloud 1390 incl. border). But see issue 2 below 1012.
- **Preview as tall as the writer: CONFIRMED.**
  - wiki 366=366 (390: 402=402), comment edit 404=404, review box 204=204, inline diff 238=238 / 202=202.
  - `cr-wiki-new/states/light-1440-preview-tab-clip.png`.
- **Container query instead of viewport: CONFIRMED.**
  - Review box at 768 (698px editor) and unified at 1012 (702px editor) fall back to the body row.
  - Wiki at 768 (736px) lifts the toolbar.
- **EasyMDE containment off: CONFIRMED.**
  - `container-type: normal` with EasyMDE on.
  - F11 fullscreen covers the viewport (0,50,1440×850), `probe/p3-easymde-fullscreen-dark.png`.
- **Toolbar keyboard focus: CONFIRMED.**
  - 2px solid rgb(9,105,218) / rgb(31,111,235) at offset -2px.
  - End scrolls the toolbar so the last button is visible (`probe/p3-tb-kbdfocus-light.png`).
- **Disabled checkbox cursor (nit 7): CONFIRMED.**
  - `cursor: not-allowed` on the label and the input.
  - Colour rgb(129,139,152) light, rgb(101,108,118) dark.
- **Search icon turns `--fgColor-accent` on keyboard focus (nit 5): FALSIFIED.** See issue 1.
- **Main composer unchanged: CONFIRMED** (`repo-issue/states/light-1440-toolbar-btn-focus-clip.png`).

## Issues (ranked)
1. **MINOR (falsified claim): the leading search icon stays `--fgColor-muted` while its button has keyboard focus.**
   - Where: `/octo-org/grex/tags`, light and dark, 1440.
   - Setup: Tab from the input; the `BUTTON.ui.small.icon.button` is focused and `:focus-visible` is true.
   - Measured: button `color` rgb(89,99,110) / rgb(145,152,161), and the svg is the same (`probe/p4-search-btn-kbd-*.png`, `cr-tags/states/*-search-btn-focus-clip.png`: icon pixels 89,99,110 in both the input-focus and button-focus shots).
   - CDP shows two causes:
     - (a) `src/controls/buttons.css:89` `.ui.button > .svg { color: var(--fgColor-muted) }` sets the colour on the svg itself, so the button's colour never reaches the icon;
     - (b) `gh.pages-repo` `& > .ui.icon.button:last-child { color: fgColor-muted }` beats the controls layer on the button.
   - Fix (a) in controls: use `... :focus-visible > .svg { color: var(--fgColor-accent) }`. For (b), ask pages/repo to drop the colour.
   - The focused button still looks the same as the focused input, so nit 5 is not resolved.
2. **MINOR: in split diff at viewports below about 1000px, the primary "Start review" button is clipped out of the inline comment cloud.**
   - Where: `/pulls/16/files?style=split` at 768, light and dark.
   - Cloud 505–734 (230px), but the buttons run 428–515, 523–659 and 667–725. "Start review" is 87px wide and 77px of it lies left of the cloud edge.
   - The hit-test at its centre does not return the button. The cause is `overflow: hidden` on the cloud (pages/issues-prs).
   - `probe/p2-ours-split-768-light-768.png`, `probe/split-right-dark-768.png`.
   - The footer row (`.field.footer > .flex-text-block`, justify-end, nowrap) is the row controls now lays out (8px inset). It should wrap (`flex-wrap: wrap`) so the primary action is never pushed off the left.
   - At ≥1012 it fits (1012: cloud 627, first button 656).
3. **MINOR: narrow editors hide up to 60% of the toolbar with no affordance.**
   - The toolbar scrolls sideways with `scrollbar-width: none` and there is no fade or overflow menu.
   - Measured scrollWidth / clientWidth:
     - split at 1440: 524/490 (the switch button is hidden);
     - split at 1100: 524/354;
     - split at 768: 524/212;
     - at 390: 524/320;
     - Files-changed reply at 768: 524/178.
   - H1–H3 and B remain, but lists, mention and reference are out of view for mouse users (keyboard End works).
   - github.com collapses the extra buttons into a "…" ActionMenu. If CSS cannot build that, Gitea's 2-row wrap would at least keep every tool reachable when the editor is below about 400px.
4. **NIT: the attachment field in the inline diff form is still Gitea's 55px dashed dropzone** (76px at 768 where the text wraps), not the slim "Paste, drop, or click to add files" bar the composer uses. Known gap.
5. **NIT: `--gh-octicon-calendar` is still unresolved on every page** (CT-IC-1, integrator). Known gap.
6. **NIT: an empty Preview is a blank box as tall as the writer** (`cr-release-new/states/dark-390-preview-tab-clip.png`). github.com says "Nothing to preview".
7. **NIT (budget):** the brief asked the builder not to grow the folder, but controls grew about 1.2 KB (70,662 → 71,895 B).

## Measurements
| control | property | ours | github / Primer | ok |
|---|---|---|---|---|
| inline diff editor | edge thickness | 1px (2 device px @2x) rgb(209,217,224) / rgb(61,68,77) | 1px --borderColor-default | yes |
| inline diff Write/Preview | hit-test at centre | tab at all 36 width×side×scheme runs | tab clickable | yes |
| inline diff toolbar (split 1440) | placement | static in the body, x 891–1381 inside cloud 882–1390 | inside the Box | yes |
| inline diff toolbar (unified 1440) | gap to Preview tab | 136px, absolute in the tab row | right-aligned in the tab row | yes |
| inline diff footer (split 768) | primary button visibility | "Start review" 428–515 vs cloud left 505 (77px clipped) | fully visible | no |
| toolbar overflow (split 768) | scrollWidth / clientWidth | 524 / 212 | every tool reachable (overflow menu) | no |
| editor Preview vs Write height | px | wiki 366/366, edit 404/404, review 204/204, diff 238/238 | equal | yes |
| toolbar button focus | ring | 2px rgb(9,105,218) / rgb(31,111,235), offset -2px | --focus-outline inset | yes |
| search button keyboard focus | icon colour | rgb(89,99,110) / rgb(145,152,161) | distinct from input focus (claimed --fgColor-accent rgb(9,105,218)) | no |
| disabled checkbox label | cursor / colour | not-allowed / rgb(129,139,152) · rgb(101,108,118) | not-allowed / --fgColor-disabled | yes |
| button (default, repo-issue) | h / padding-x / radius / font | 32 / 12 / 6px / 14px 500 | 32 (btn) / 12 / 6px / 14px 500 | yes |
| button-primary (repo-issue) | h / bg / border | 32 / rgb(31,136,61) / rgba(31,35,40,.15) | 32 / rgb(31,136,61) / rgba(31,35,40,.15) | yes |
| button-primary small (PR files) | h / padding-x / font | 28 / 8px / 12px 500 | .btn-sm 28 / 12px / 12px 500 | nit |
| textarea (repo-issue) | padding / line-height / radius | 8px / 21px / 6px | 8px / 21px (1.5) / 6px | yes |
