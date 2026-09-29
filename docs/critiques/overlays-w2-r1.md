# Critique: overlays, wave 2, round 1

Critic: independent design-systems review. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score 8.0 / 10. FAIL** (the pass bar is 8.5).

The other gates pass: 0 lint errors (2 warnings), 0 console errors, 0 literal or off-palette colours from this folder, and the smoke test is green.

The numbers are very good. Measured against github.com (logged out) in light and dark, these match exactly:

- **Overlay chrome.** Radius 12px, the `--shadow-floating-small` string, background (#fff, and #010409 in dark) and 192px minimum width.
- **ActionList rows.** 32px tall, 8px inset, 6px radius, hover `rgba(129,139,152,.1)`.
- **Dividers.** `rgba(209,217,224,.7)` with a 7px top margin.
- **Branch picker.** 320px wide with 32px tabs.
- **TooltipV2.** 27.5px tall, 4px/8px padding, #25292e (dark: #3d444d), 12px/19.5px, 4px from the anchor.
- **Dialog.** 49px header, 14px/600 title, `0 1px 0 --borderColor-default` divider, 16px body and backdrop `rgba(200,209,218,.4)` (dark: `rgba(33,40,48,.4)`).

Three things keep it below 8.5:

1. **Keyboard bug in the branch/tag selector.** Arrow-key navigation draws a second check mark and no highlight.
2. **Code (clone) popover.** It floats 16px below the button (GitHub: 4px). Its content has no Primer padding.
3. **Missing SelectPanel/Dialog headers.** No title and no close button (known, but visible on the most-used overlays).

## How I verified

- **Lint.** `node build/lint.mjs overlays`: 0 errors, 2 warnings (`max-width: 250px` tooltip, `450px` toast), 246 selectors.
- **Build.** `npm run build`: `folders.overlays.status = "ok"`, 8 files, 40 181 B.
- **Deploy check.** Served == dist for all three theme files (sha256 prefixes: auto b97263d2, light f49337ba, dark ce99830c; other folders redeployed during my run, overlays sources unchanged, mtime 03:06). I did not deploy.
- **shoot.mjs.** Theme registered, not preview. Routes file: `shots/critic-overlays-routes.json` (a copy of the builder's file). Run: home, repo-home, repo-issues, repo-issue, repo-settings, labels, login, user-settings-appearance and explore-repos, × light/dark × 1440/390, with `--states --measure`, into `shots/critic-overlays-r1/`.
  - 36 pages, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 unlayered Gitea CSS.
  - Off-palette: only `.ui.dropzone` border rgba(0,0,0,.8) on repo-issue (controls/markdown editor, not overlays).
  - Non-Octicon icons: the colorblind theme icons in the appearance select (Gitea markup, icons folder).
- **Probe on Gitea.** My own script, `shots/critic-overlays-probe.mjs`, wrote to `shots/critic-overlays-r1/probe/` (72 captures + `probe.json`, 0 console errors). It covers 24 scenarios in light/dark, at 1440 and at 390 where relevant, with computed styles and anchor-gap measurements:
  - menus: navbar +, avatar, branch, branch keyboard, Add File, issue sort, label filter, sidebar labels/assignees, comment "…", danger item, reaction picker, theme select;
  - popovers and tooltips: Code popover, copy-URL tooltip, navbar tooltip;
  - dialogs: delete-repo, transfer, label edit, label delete confirm, and the release-notes mini modal (opened, never submitted);
  - toasts: a **real** error toast (release page "Generate release notes" with an empty tag, which is Gitea's own `showErrorToast`) and an injected info toast;
  - flash: a real login-error flash (wrong password for a non-existent user).
- **github.com reference, logged out, read-only.** Script `shots/critic-overlays-gh.mjs`, output `shots/critic-overlays-r1/gh/`: branch picker, Code popover, copy-URL TooltipV2, issues Sort ActionMenu, Labels SelectPanel, and the keyboard-shortcuts Dialog ("?"), in light and dark.
- **Smoke test.** `node tools/shoot/smoke.mjs --theme github-auto`: 12/12 steps ok, 0 console errors (`shots/20260930-032651-smoke-github-auto/smoke.json`).

## Issues (most important first)

### 1. MAJOR: branch/tag selector keyboard navigation shows a second check and no highlight

- **Where.** repo-home, branch picker. Open it, then press ArrowDown twice. Both schemes, 1440.
- **Evidence.** `probe/branch-kbd-light-1440-clip.png`. The highlighted row "Likio3000/…" gets a ✓ exactly like the current branch "main", and its background stays `rgba(255,255,255,0)`.
- **Cause.** The Vue `RepoBranchTagSelector` uses `.item.active` for the **keyboard-highlighted** row (`:class="{selected: item.selected, active: activeItemIndex === index}"`, RepoBranchTagSelector.vue:251), and `.item.selected` for the current ref. Two rules in `action-menu.css` treat `.active` as "current value" instead:
  - `.ui.dropdown .menu:not(.user-menu) > .item.active:not(.clear-selection)::after` draws the check;
  - `.ui.dropdown .menu .active.item { background: var(--control-transparent-bgColor-rest) }` removes the highlight.

  The same happens to the "Create branch X from 'main'" row when a filter has no match (it becomes `.active`).
- **Expected (GitHub).** The active-descendant row gets `--control-transparent-bgColor-hover` / `-selected` and no check. Only the current ref carries the ✓.
- **Fix.** Exclude `.branch-selector-dropdown .scrolling.menu > .item.active` from the check rule and from the "reserve check column" `:has()` rule. Give it the hover background.

### 2. MAJOR: Code (clone) popover is 16px from its trigger and its content has no Primer padding

- **Where.** repo-home, click Code. Light and dark, 1440 and 390.
- **Evidence.** `probe/clone-light-1440-clip.png`, `probe/clone-light-390.png`, and the reference `gh/code-light.png`.
- **Offset.** Button bottom y=305, `.tippy-box` top y=321, so **gap 16px**. github.com: button bottom ~238, overlay top 242, so **4px**. Gitea gives arrowed popovers `offset: [0, 10]` (tippy.ts:52) plus the arrow's room. `tippy.css` hides the arrow but compensates only the tooltip theme (the `translate` rules), not `data-theme="default"`.
- **Chrome.** The "Clone" heading sits ~10px from the top edge. "Download BUNDLE" is flush with the bottom radius (no 8px ActionList padding-block). GitHub uses 16px header padding and 8px list padding. The width is 260px against GitHub's 400px.
- **Ownership.** The content (`.clone-panel-*`) is unowned today. Either give the default popover Primer Overlay body padding, or file a request to pages/repo. The 16px offset is overlays' job.

### 3. MAJOR (structural, known): SelectPanels and most Dialogs have no title and no close button

- **Evidence.**
  - Branch picker: `probe/branch-light-1440-clip.png` against `gh/branch-light-clip.png` ("Switch branches/tags ×").
  - Label filter: `probe/issues-label-light-1440-clip.png` against `gh/issues-labels-light-clip.png` ("Filter by label").
  - Dialogs: `probe/modal-confirm-light-1440-clip.png` and `probe/modal-delete-dark-1440-clip.png` have no ×. Every Primer Dialog has one (`gh/shortcuts-dialog-light.png`: 32px close button in the header).
  - Mini modal: `probe/modal-mini-dark-1440-clip.png` (release notes) has neither a header nor a ×, because the Gitea template has none.
- **Why it matters.** The builder states this as a known gap. It is the single most visible difference on the two most-used overlays (branch picker, dialogs), so it weighs on "indistinguishable". CSS cannot add it. A header needs a template change, which should be raised with the integrator. At least `base/modal_actions_confirm`-based modals and the label/branch pickers are candidates.

### 4. MINOR: two rows highlighted at once in filter menus

- **Evidence.** `probe/issues-label-light-1440-clip.png` and `-dark-`. "All labels" (Fomantic's auto `.selected`, the Enter target) and the hovered "bug" are both grey.
- **Cause.** `.selected` is mapped to the hover background. GitHub shows one highlighted row at a time.
- **Suggestion.** When the menu is hovered, suppress the `.selected` background on rows other than the hovered one, e.g. `.menu:hover > .item.selected:not(:hover)`.

### 5. MINOR: the single-select check is the wrong colour and glyph

- **Measured.** The check `::after` background is `rgb(31,35,40)` (`--fgColor-default`), a 12px-wide mask of `--checkbox-mask-checked`.
- **github.com.** `svg.octicon-check.prc-ActionList-SingleSelectCheckmark`, 16×16, colour `rgb(89,99,110)` (`--fgColor-muted`), on both the issues Sort menu and the branch picker.
- **Fix.** Use `--fgColor-muted`, and ideally the real `--gh-octicon-check` mask at 16px.

### 6. MINOR: branch picker text is indented 9px further than GitHub's

- **Evidence.** Clips 1:1 (`probe/branch-light-1440-clip.png` against `gh/branch-light-clip.png`). Branch names start 41px from the overlay edge on ours and 32px on GitHub. The check sits at 24px on ours and 22px on GitHub.
- **Other difference.** GitHub wraps long ref names onto two lines. Ours truncates with an ellipsis.

### 7. MINOR (known): mobile (390) SelectPanels stay anchored dropdowns

- **Evidence.** `probe/branch-light-390.png` shows about 4 visible rows (Gitea's mobile `.scrolling.menu` max-height is 144px). `probe/issue-labels-dark-390.png` shows only 2 labels. GitHub opens these as full-screen sheets on narrow screens.
- **Cheap improvement.** Raise the scrolling max-height under 768px.

### 8. NIT

- **Tooltip placement** follows Gitea's `top-start`, where GitHub centres (known).
- **Filter input icon** is `octicon-filter` (Gitea markup). GitHub uses search.
- **Literal `6px`** in `tippy.css` (`translate: 0 calc(6px - var(--overlay-offset))`). Lint does not catch it, but it breaks the "spacing from tokens" rule. It could be expressed as a named custom property with a comment.
- **Not independently verified by me:** issue hover card, stopwatch popup, footer language menu, the `.ui.search` results and the @mention suggester.
- **Info toast.** I did not get it from a real trigger; I injected it. The error toast was real. Both match the Primer CSS Toast spec: 48px icon column, 16px body padding, 6px radius, inset ring plus floating shadow.

## What is right (checked, not assumed)

- **Dialog numbers are identical to github.com's Dialog.** Header 49px, title 14px/600/21px, 12px radius, shadow string, backdrop colour in both schemes, 16px body. The full-width danger button matches GitHub's delete-repo pattern (Gitea's `ModalButtonDangerText`, a single button). Width is 480 for small, 320 for mini and 326 at 390 (100vw−64).
- **ActionMenu rows** match GitHub's Sort menu exactly: 32px, 8px margin, `padding-left` 32px when a check column is reserved, and the same hover colour.
- **Danger items** ("Delete" in the comment menu) use danger fg and the `--control-danger-bgColor-hover` background on hover, in both schemes (`probe/danger-item-*-1440-clip.png`).
- **Flash** (real login error): padding 20px/16px, `--bgColor-danger-muted` / `--borderColor-danger-muted`, 6px radius and left-aligned text. Dark `rgba(248,81,73,.1)` on `.4` border.
- **Menu anchor gaps are 3–4px** (navbar + 3, avatar 4, branch 4, label filter 4, theme select 3). The navbar tooltip gap is 4px.
