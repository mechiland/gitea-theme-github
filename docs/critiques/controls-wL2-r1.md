# Critique: controls, wave L2, round 1 (FG2-076, FG2-079)

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 6.5 / 10. FAIL.**
- The generic editor Box collides with the toolbar in narrow editors. In the PR "Files changed" split view the toolbar covers the Write / Preview tabs, so neither tab can be clicked.
- Console errors 0, literal colours 0, smoke green.

## Verification
- **Lint:** `node build/lint.mjs controls` → 0 errors, 0 warnings, 332 selectors.
- **Build:** `npm run build` → `dist/build-report.json` `folders.controls.status = "ok"` (12 files, 70,662 B src).
  - The theme is over budget (auto 320.4 KB). That is theme-wide, not specific to this folder.
- **Served vs dist:** the sha1 of `theme-github-auto.css` is identical (94b7a16e…). No deploy was needed and I did not deploy.
- **Gitea capture:** `shots/critic-controls-r1-wL2`.
  - Routes file: `shots/critic-controls-wL2-r1-routes.json`, 10 routes, light and dark, 1440 and 390, `--states --measure`.
  - Result: 40 pages, 0 problems, 0 console errors, 0 failed requests, 0 off-palette colours, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - **Unresolved var: `--gh-octicon-calendar`.** It is referenced on every page and hits live DOM on the date-input pages (admin config, release new, milestone new, issue sidebar).
- **Probes** (open editors only, never submit):
  - Scripts: `shots/critic-controls-wL2-r1-probe.mjs`, `-probe2.mjs`, `-probe3.mjs`.
  - Logs: `shots/critic-controls-wL2-r1-probe.log`.
  - PNGs: `shots/critic-controls-r1-wL2/probe/`.
  - Viewports: 1440, 1280, 1279, 1012 and 390, light and dark.
- **github.com reference:** `shots/critic-controls-wL2-r1-ref/cr-tags` (logged out, `--measure`).
  - github.com logged out shows no markdown editor and no tag search field, so the comparison uses Primer CSS (`forms/form-control.scss`: textarea padding 8px, line-height 1.5) and the classic github.com CommentBox / tabnav spec.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` → **green**, 13/13 steps passed and 0 console errors (`shots/critic-controls-wL2-r1-smoke.log`).
  - Admin theme is still github-auto; diff style is still unified.

## Builder claims checked
- **FG2-079 Box on admin banner, release, milestone, wiki, project, comment edit and review box: CONFIRMED.**
  - Border: 1px rgb(209,217,224) light, rgb(61,68,77) dark. Radius 6px.
  - Header strip: `--bgColor-muted` (246,248,250 / 21,27,35).
  - Body: `--bgColor-default` with 8px padding.
  - Tabs 40px high; toolbar buttons 28x28 with 16px svgs.
  - Colours: rest `--fgColor-muted`; hover rgba(129,139,152,.1) with `--fgColor-accent`; pressed rgba(129,139,152,.15).
  - Keyboard focus ring: 2px `--focus-outline` at -2px (`probe/*-toolbar-kbdfocus.png`, `*-toolbar-press.png`).
- **Composer untouched: CONFIRMED.** `#comment-form` and `#new-issue` have a 0px border on `.combo-markdown-editor`, so there is no double border (`cr-issue-new/states/light-1440-tb-hover-clip.png`).
- **"1280px so the toolbar can't collide with the tabs in narrower columns": FALSIFIED.** The breakpoint is on the viewport, not the editor width. See issue 1.
- **Textarea whole lines: CONFIRMED.**
  - `rows=2` descriptions (repo, org and user settings) are 78px: 60px inner, exactly 3.00 lines.
  - Rowless textareas (banner, open-with apps, milestone) are 138px: exactly 6.00 lines. Both hold at 1440 and 390, in light and dark.
- **Search button focus: CONFIRMED** (`cr-tags/states/*-search-btn-focus-clip.png`). The ring covers the whole field, but see issue 5.
- **Disabled checkbox label muted: CONFIRMED.** "Disable Sign-In" is rgb(129,139,152) light and rgb(101,108,118) dark (`probe/dark-1440-disabled-checkbox.png`). The cursor is still `pointer` (nit).
- **Date icon: CONFIRMED as not done.** Chrome's own glyph shows, in `--fgColor-default` rather than muted (`cr-milestone-new/states/*-date-focus-clip.png`). It is blocked by CT-IC-1.

## Issues (ranked)
1. **MAJOR/BLOCKER: in the split diff view the inline comment toolbar covers the Write / Preview tabs and sticks out of the Box.**
   - Where: `/octo-org/theme-playground/pulls/16/files?style=split`, add a line comment on the right side, 1440 and 1280, light and dark.
   - The editor is 506px wide at 1440 and 442px at 1280.
   - The `@media (min-width:1280px)` rule makes `markdown-toolbar` absolute at right 8px. It is about 524px wide, so it starts 27px *left of the Box* (toolbar left 856 vs box left 883) and overlaps the tabs by 178px (242px at 1280).
   - Hit-test at the tab centres returns toolbar `svg`/`path` elements for both "Write" and "Preview", so the Preview tab cannot be clicked. H1 to H3 are drawn outside the Box.
   - Evidence: `probe/light-1440-diff-comment-split.png`, `probe/dark-1280-diff-comment-split.png`, `shots/critic-controls-wL2-r1-probe3.mjs` output.
   - Unified view (818px) and the review box (730px) are fine.
   - Fix: switch on the editor's own width, not the viewport. Put `container-type: inline-size` on the Box and use `@container (min-width: ~720px)` to lift the toolbar. Otherwise, exclude `.comment-code-cloud` and any editor narrower than tabs plus toolbar.
2. **MAJOR: double border on every inline diff comment editor.**
   - Where: PR files, unified and split, 1440 and 390, both schemes.
   - `.field.comment-code-cloud` already draws a 1px border with padding 0. The new Box sits flush inside it, so the top, left and right edges become a 2px line (4 device px of rgb(209,217,224) at 2x, x=30-33 and y=30-33 in `probe/light-1440-diff-comment-unified.png`). Also visible in `probe/dark-390-diff-comment-unified.png`.
   - The builder never checked this surface.
   - Fix: exclude `.comment-code-cloud` from the generic Box (it is the pages/issues-prs or code surface), or coordinate an inset with its owner.
3. **MINOR: unresolved `--gh-octicon-calendar` ships.**
   - The shoot audit lists it on all 40 pages (live on date pages).
   - The fallback works (Chrome's glyph), but the glyph is `--fgColor-default`, not the specified `--fgColor-muted` calendar Octicon.
   - Blocked by CT-IC-1. Until the icons folder adds the mask, it is shipped code that references a missing token.
4. **MINOR: the wiki Preview panel is shorter than its writer.**
   - `/wiki?action=_new` Write Box is 366px (300px textarea). Preview is about 204px, because the min-height is the generic 6-line editor.
   - The Box jumps by about 162px when switching tabs (`cr-wiki-new/states/*-1440-preview-tab-clip.png`).
   - The "as tall as the empty editor" claim holds only for 138px editors.
5. **NIT: the focused search button looks identical to the focused input** (`cr-tags/states/light-1440-search-btn-focus-clip.png` vs `-search-focus-clip.png`). A keyboard user cannot tell that typing will do nothing. On github.com the leading visual is not focusable at all (this needs a template change).
6. **NIT: the toolbar in the body below 1280, and at 390, pushes the last group (Aa / ⇄) to the far right.**
   - This leaves a gap of about 500px at 1279 (`probe/light-1279-admin-editor.png`). At 390 it wraps to 2 rows.
   - github.com keeps the toolbar compact and left-aligned (or collapses it on narrow screens).
7. **NIT:** the disabled checkbox label keeps `cursor: pointer`.
8. **NIT (other folders, FYI):** in Primer CSS, `.tabnav-tab` has 16px inline padding; ours is 12px (navigation). Primer textarea line-height is 1.5 (21px); ours is 20px. The 20px was chosen for whole-line maths and is acceptable.

## Measurements
| control | property | ours | github / Primer | ok |
|---|---|---|---|---|
| editor Box | border / radius | 1px rgb(209,217,224) · rgb(61,68,77) / 6px | CommentBox 1px --borderColor-default / 6px | yes |
| editor header strip | bg | rgb(246,248,250) · rgb(21,27,35) | --bgColor-muted | yes |
| Write/Preview tab | height / padding / font | 40px / 8px 12px / 14px 400 lh 23px | tabnav-tab 8px 16px / 14px lh 23px | no (padding, navigation) |
| toolbar button | size / radius | 28x28 / 6px | IconButton small 28 / 6px | yes |
| toolbar icon | size / colour | 16x16 rgb(89,99,110) · rgb(145,152,161) | 16 --fgColor-muted | yes |
| toolbar hover / pressed | bg | rgba(129,139,152,.10) / .15 | --control-transparent-bgColor-hover/active | yes |
| toolbar focus | ring | 2px rgb(9,105,218) · rgb(31,111,235), offset -2px | --focus-outline inset | yes |
| toolbar vs tabs (split diff 1440) | horizontal gap | -178px (overlap), toolbar 27px outside Box | ≥ 0, inside Box | no |
| inline diff editor | edge thickness | 2px (cloud + Box) | 1px | no |
| textarea rows=2 | height / lines | 78px / 3.00 | whole lines | yes |
| textarea rowless | height / lines | 138px / 6.00 | whole lines | yes |
| textarea | padding / line-height | 8px 12px / 20px | 8px 12px / 21px (1.5) | yes (nit) |
| wiki preview vs writer | height | ~204 vs 366px | equal | no |
| tags search input | height / radius / text start | 32 / 6px / 36px | 32 / 6px / 36px (TextInput leading visual) | yes |
| disabled checkbox label | colour | rgb(129,139,152) · rgb(101,108,118) | --fgColor-disabled | yes |
| date picker icon | glyph / colour | Chrome glyph / fgColor-default | calendar Octicon / --fgColor-muted | no (blocked CT-IC-1) |
