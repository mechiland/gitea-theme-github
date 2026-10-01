# Critique: controls, wave L2b, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.5 / 10. PASS** (≥ 8.5, console errors 0, literal colours 0, smoke green).
- All 7 ranked items from controls-wL2b-r1 are fixed and verified, and the falsified claim (search icon focus) is now true.
- What is left is the cost of the toolbar fix: whole groups now wrap, so the split-diff comment editor has a 2-row toolbar even at 1440. At split 768 the Files-changed reply toolbar needs 5 rows (148px).

## Verification
- **Lint:** `node build/lint.mjs controls` → 0 errors, 0 warnings, 344 selectors.
- **Build:** `npm run build` → `folders.controls` = `{status: ok, files: 12, bytes: 65160}`. The folder shrank from 71,895 B (the builder's number is confirmed).
- **Served vs dist:** the sha256 of `theme-github-auto.css` is identical (3570061…15d7). I did not deploy.
- **Gitea capture:** `shots/critic-controls-r2-wL2b` (routes `shots/critic-controls-wL2b-r2-routes.json`, the 11 routes from r1).
  - Coverage: light and dark, 1440 and 390, `--states --measure`.
  - Result: 44 pages, 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours, 0 non-Octicon icons, max CLS 0.049.
  - Unresolved var: `--gh-octicon-calendar` on 44/44 pages (CT-IC-1, integrator).
  - The diff style was restored to unified.
- **Probes** (editors opened, never typed into or submitted):
  - `shots/critic-controls-wL2b-r2-probe.mjs` covers the inline diff form: split right, split left and unified; 1440, 1280, 1100, 1012, 900, 768, 600 and 390; light and dark; 2x. It measures the footer, hit-tests each button after scrolling it into view, and checks the toolbar rows and overflow, the file bar and the empty Preview. Log: `shots/critic-controls-wL2b-r2-probe.log`.
  - `-probe2.mjs` covers search button keyboard focus (tags and the issue list), the Files-changed reply, the main composer, issue-new, wiki, release-new and the admin notice, at 1440, 768 and 390.
  - `-probe3.mjs` takes unobstructed cloud shots (`probe/p3-*.png`); the sticky file header covered the tabs in the probe1 clips.
  - After all runs the admin theme is `github-auto` and the diff style is `unified`.
- **github.com reference:** `shots/critic-controls-wL2b-r2-ref` (repo-issue, repo-pull-files and cr-tags; logged out; `--measure`).
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` → **green**, 13/13 steps, 0 console errors (`shots/critic-controls-wL2b-r2-smoke.log`).

## Builder claims checked
1. **Search icon keyboard focus: CONFIRMED.**
   - Setup: /octo-org/grex/tags; Tab from the input; `BUTTON.ui.small.icon.button` has `:focus-visible`.
   - svg colour: rgb(9,105,218) light, rgb(68,147,248) dark. Before Tab it is rgb(89,99,110) / rgb(145,152,161).
   - The input keeps its 2px accent ring at offset -2px.
   - The issue-list trailing button is excluded as claimed: its svg stays muted, with the button's own accent outline.
   - Visible difference between input focus and button focus: `cr-tags/states/light-1440-search-focus-clip.png` (grey icon) vs `…search-btn-focus-clip.png` (blue icon); also `probe/p2-search-btn-kbd-dark.png`.
2. **Start review no longer clipped: CONFIRMED.**
   - Every run has every footer button inside the cloud, and every hit-test after scroll-into-view returns the button: 48 runs × 3 buttons.
   - Split 768: Start review 637–725 (y 859), Add single comment 523–659 and Cancel 667–725 (y 895), cloud 505–734.
   - Split 900 wraps only Cancel (799–857, y 818).
   - Screenshot: `probe/p3-split-dark-768.png`.
3. **Toolbar tools reachable: CONFIRMED.**
   - Inline form: 0/17 tools outside the toolbar or cloud, and scrollWidth == clientWidth, in all 48 runs.
   - Reply form: the same result at 1440, 768 and 390, in split and unified.
   - Costs (see issue 1):
     - split 1440/1280/1100/1012: 2 rows, 64px;
     - split 768: 4 rows, 120px;
     - reply split 1440: 2 rows;
     - reply split 768: 5 rows, 148px.
   - The composer at 390 still scrolls (overflow-x auto, 11/17 visible). That rule is in pages/issues-prs (CT-L2b-4 is filed).
4. **File bar: CONFIRMED.** Height 39px, text-align left, at every width except split 768, where the text wraps to 2 lines (60px).
5. **Empty Preview: CONFIRMED.**
   - `::before` content is "Nothing to preview" in rgb(89,99,110) / rgb(145,152,161), in every inline run.
   - It also shows in the main composer (`repo-issue/states/dark-390-preview-tab-clip.png`) and in release-new at 390 dark.
6. **Size: CONFIRMED.** 65,160 B.
- **Main composer unchanged: CONFIRMED.** repo-issue 1440: toolbar absolute in the tab row, 1 row, 17/17 visible (`repo-issue/states/light-1440-toolbar-btn-focus-clip.png`).
- **Unified inline form: CONFIRMED.** At 1440, 1280 and 1100 it matches the CommentBox: tabs, toolbar right-aligned in the tab row 136px clear of Preview, textarea, file bar, then the action row (`probe/p3-unified-light-1440.png`).
- **Request files: CONFIRMED.** CT-L2b-3 is in `docs/requests/pages-repo.md:445` and CT-L2b-4 in `docs/requests/pages-issues-prs.md:475`; `controls.md` has DONE notes.

## Issues (ranked)
1. **MINOR: the split-diff inline editor gets a 2-row toolbar at every desktop width, and narrow clouds get very tall toolbars.**
   - The problem:
     - At split 1440 (cloud 882–1390, toolbar 490px wide), 15 tools fit on row 1 and only "Aa ⇄" sit orphaned on row 2 (`probe/p3-split-light-1440.png`). github.com keeps one row and puts the extra tools behind "…".
     - The Files-changed reply at split 768 (toolbar 178px) stacks 5 rows of 2–3 icons, 148px, which is taller than the 138px textarea (`probe/p2-reply-split-dark-768.png`).
   - Cheap fix for the common case: at 1440 one row needs 524px, of which 17 × 28 = 476px are buttons and 48px are group padding (`padding: 0 var(--base-size-4)`).
     - A `@container (max-width: 540px)` rule that drops the group padding to `var(--base-size-2)` (about 20px in total) would fit 496px. That is still 6px over 490.
     - Padding 0 with a `column-gap` of `var(--base-size-2)` between groups (476 + 10 = 486) fits.
   - Result: one row at split 1440 and 1280, and 2 rows instead of 4 at 768.
2. **NIT: in the narrow cloud (split 768), the wrapped footer leaves the primary button alone on the top row, above its secondary actions** (`probe/p3-split-dark-768.png`).
   - github.com's narrow form keeps Cancel and the secondary actions on the same line or stacks them full-width.
   - Here the primary button floats above them, which reads oddly but works.
3. **NIT: the inline diff file bar is still a separate dashed 39px box** (60px at split 768), not the composer's slim bar joined to the textarea. Known gap.
4. **NIT: small primary buttons (PR files) have 8px side padding** (Primer React small, condensed), where github.com logged-out measures 12px (`.btn-sm`, 84.9×28 vs ours 74.5×28). Defensible either way; known gap.
5. **NIT: `--gh-octicon-calendar` is still unresolved** (CT-IC-1, integrator), so date inputs show Chrome's own calendar glyph (`cr-milestone-new/states/dark-1440-validation.png`).
6. **NIT: "Nothing to preview" works only on English pages** (`:lang(en)`). Known gap.

## Measurements
| control | property | ours | github / Primer | ok |
|---|---|---|---|---|
| search button (tags), keyboard focus | svg colour | rgb(9,105,218) / rgb(68,147,248) | --fgColor-accent | yes |
| search input, button focused | border / outline | rgb(9,105,218) + 2px solid, offset -2px (dark rgb(31,111,235)) | --focus-outline | yes |
| inline diff footer (split 768) | buttons inside cloud / hit-test | 3/3 inside (cloud 505–734), 3/3 hit | all visible and clickable | yes |
| inline diff footer (all 48 runs) | buttons inside cloud | 144/144 | all | yes |
| inline diff toolbar (split 1440) | rows / height | 2 rows / 64px (490px wide) | 1 row + "…" overflow | no |
| inline diff toolbar (split 768) | rows / height | 4 / 120px | 1 row + overflow | no |
| reply toolbar (split 768) | rows / height | 5 / 148px | 1 row + overflow | no |
| inline diff toolbar (unified 1440) | placement | absolute in the tab row, 1 row, 136px clear of Preview | right of the tabs | yes |
| inline diff tools reachable | outside toolbar / sw vs cw | 0/17, sw == cw in all runs | all reachable | yes |
| inline diff file bar | height / text-align | 39px (60px at split 768) / left | slim bar | nit |
| empty Preview | text / colour | "Nothing to preview" / rgb(89,99,110) · rgb(145,152,161) | "Nothing to preview" / fgColor-muted | yes |
| inline diff Write tab | height / font / bg / border | 40px / 14px 400 / rgb(255,255,255) · rgb(13,17,23) / rgb(209,217,224) · rgb(61,68,77) | TabNav 40px, bgColor-default, borderColor-default | yes |
| button-primary (repo-issue) | h / pad-x / radius / font / bg / border | 32 / 12px / 6px / 14px 500 / rgb(31,136,61) / rgba(31,35,40,.15) | 32 / 12px / 6px / 14px 500 / rgb(31,136,61) / rgba(31,35,40,.15) | yes |
| button-primary dark (repo-issue) | bg / border | rgb(35,134,54) / rgba(255,255,255,.15) | rgb(35,134,54) / rgba(255,255,255,.15) | yes |
| button default | radius / font / bg / border (light, dark) | 6px / 500 / rgb(246,248,250) · rgb(33,40,48) / rgb(209,217,224) · rgb(61,68,77) | same | yes |
| button-primary small (PR files) | size / pad-x | 74.5×28 / 8px | 84.9×28 / 12px (.btn-sm) | nit |
| textarea (repo-issue) | padding / line-height / radius | 8px / 21px / 6px | 8px / 21px / 6px | yes |
| main composer toolbar (1440) | rows / visible | 1 / 17 of 17 | 1 row | yes |
