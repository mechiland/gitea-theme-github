# Critique: overlays, wave 2, round 2

Critic: independent design-systems review. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score 8.5 / 10. PASS**, with one structural gap that still needs the integrator (OV-4).

Gates:

- **Lint.** 0 errors (2 warnings: the literal `max-width` values for tooltip and toast).
- **Console.** 0 errors across 36 audited pages, 104 probe captures and the smoke run.
- **Colours.** 0 literal or off-palette colours from overlays.
- **Smoke test.** Green, 12/12 steps.

Since r1, the two functional/visual majors are fixed and measured:

- The branch picker's keyboard row is correct.
- The Code popover is now practically the same as github.com's: 400px, 4px gap, header at +16, SegmentedControl at +49 and URL field at +89, the same input and row metrics, in both schemes.

Minors 4, 5, 7 and 8 are fixed. Item 6 is only partly fixed: the text inset is right but the check glyph is still too large (see issue 2).

What still separates it from github.com:

1. There is no SelectPanel title row or Dialog close button. This needs a template change and is filed as OV-4/OV-5.
2. A handful of nits, below.

## How I verified

- **Lint.** `node build/lint.mjs overlays`: 0 errors, 2 warnings, 283 selectors. All 14 folders have 0 errors.
- **Build.** `npm run build`: `folders.overlays = {status: ok, files: 9, bytes: 50102}`.
- **Deploy check.** Served == dist, sha256 prefixes: auto 830197bee11a, light cf6606bf88ec, dark 143c893c034b. I did not deploy.
- **shoot.mjs** with `--states --measure`. Routes file `shots/critic-overlays-r2-routes.json`, output `shots/critic-overlays-r2/`. Routes: home, repo-home, repo-issues, repo-issue, repo-settings, labels, login, user-settings-appearance and wiki-page, × light/dark × 1440/390.
  - 36 pages, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 unlayered Gitea CSS.
  - Off-palette: only `.ui.dropzone` border rgba(0,0,0,.8) on repo-issue. That is the markdown editor, not overlays.
  - Non-Octicon icons: the colorblind theme icons and fontawesome-openid. Those are Gitea markup, not overlays.
  - CLS up to 0.38 on home at 390. That is page layout, not overlays.
- **Probe.** `shots/critic-overlays-r2-probe.mjs`: the builder's r2 probe plus 11 of my own scenarios (branch-kbd-hover, branch-nomatch, branch-tags, issue-ref-kbd, label-kbd, clone-ssh, clone-kbd, clone-wiki, mention, hovercard, modal-delete-mob). Output: `shots/critic-overlays-r2/probe/` with `probe.json`, 106 captures, 104 ok and 0 console errors.
  - The hovercard scenario failed because that page has no `a.ref-issue`, so the issue hover card is still unverified.
  - Keyboard moves in the issue ref picker never POST (only a click does, per repo-issue-sidebar.ts), so no data changed.
- **github.com reference, logged out, read-only.** Script `shots/critic-overlays-r2-gh.mjs`, output `shots/critic-overlays-r2/gh/` with `gh.json`, 20 captures ok:
  - branch, code, tooltip, issues-sort, issues-labels and the shortcuts dialog;
  - code-detail (full child geometry), branch-kbd, and branch-390 / code-390.
- **Smoke test.** `node tools/shoot/smoke.mjs --theme github-auto`: ok, 12/12 steps, 0 console errors (`shots/20260930-035520-smoke-github-auto/smoke.json`).

## r1 items re-checked

| r1 item | status | evidence |
|---|---|---|
| 1 Branch keyboard row | **Fixed** (Vue picker) | `probe/branch-kbd-light-1440-clip.png`: only `main` has a ✓, the arrowed row has the hover fill `rgba(129,139,152,.1)` |
| 2 Code popover gap/chrome | **Fixed** | gap 4px (anchor bottom 305 → box 309), 400 wide, header +16, tabs +49 (32px), input +89 (332×32, `#f6f8fa`, 1px `#d1d9e0`, 12px mono), copy 32×32 at +4, rows 32px 6/8 `rgb(37,41,46)`. GitHub: 400, +16, +49, +89, 332×32 `#f6f8fa`, 32×32, 32px rows 6/8 `rgb(37,41,46)`. Dark matches too (`probe/clone-ssh-dark-1440-clip.png` vs `gh/code-detail-dark-clip.png`) |
| 3 SelectPanel/Dialog headers | **Open** (template, OV-4/OV-5) | see issue 1 |
| 4 Two highlighted rows | **Fixed** for pointer use | `probe/issues-label-light-1440-clip.png`: only hovered "bug" is filled |
| 5 Check colour | **Fixed** | `::after` bg `rgb(89,99,110)` light / `rgb(145,152,161)` dark = GitHub ActionMenu check colours |
| 6 Branch row geometry | **Partly** | text 32px from the overlay edge = GitHub. Long names wrap mid-word, as GitHub does. The check glyph is still oversized (issue 2) |
| 7 Mobile lists | **Fixed** | 390: scrolling list 288px (9×32). GitHub at 390 (logged out) is **also an anchored 320px overlay**, not a sheet (`gh/branch-390-light.png`), so ours (`probe/branch-light-390.png`, 320 wide) is structurally equal |
| 8 Filter icon / literal 6px | **Fixed** | search mask on the filter input. The offset is expressed as `--base-size-6` |

## Issues (most important first)

### 1. MAJOR (structural, known, integrator-blocked): no SelectPanel title row, no Dialog close button

- **Branch picker.** `probe/branch-light-1440-clip.png` against `gh/branch-kbd-light-clip.png`. GitHub has a "Switch branches/tags" H2 (14px/600) plus a 32px × IconButton above the filter. At 390 GitHub's overlay is 320×518 against our 320×442; the difference is mostly the title row.
- **Label filter.** `probe/issues-label-light-1440-clip.png` against `gh/issues-labels-light-clip.png` ("Filter by label").
- **Dialogs.** `probe/modal-confirm-light-1440-clip.png` and `probe/modal-delete-dark-1440-clip.png` have no ×.
- **The CSS is ready and verified with the simulation.** `probe/sim-close-delete-light-1440-clip.png` and `-dark-390`: close button 32×32, 8px from the top and right edges, hover `rgba(129,139,152,.1)` (dark `rgba(101,108,118,.2)`), `--fgColor-muted`, header padding-right 48px. That matches GitHub's Dialog.
- **Ask.** The integrator should land OV-4 (footer script adding `.close.inside`) this wave. This is the largest remaining visible difference on the most-used overlays.

### 2. MINOR: branch picker check glyph is larger than GitHub's and touches the name

- **Evidence.** `shots/critic-overlays-r2/check-compare.png` shows ours (top) against GitHub (bottom) at 4×.
  - GitHub: `svg.octicon-check` in a 16px box with `padding-right: 4px`, so the glyph renders at 12px (~9px of ink). It is bottom-aligned, and there is a gap before "main".
  - Ours: a 16px `::after` box with a 12px-wide mask. The ink is 12px wide and ends where the text starts.
- **Cause.** The builder's 12px override is dead code, because it loses on specificity:
  - `.branch-selector-dropdown .scrolling.menu > .item::after` (4 classes) sets `width: 12px; mask-size: 9px`;
  - it is beaten by `.branch-selector-dropdown:not(.select-branch) .scrolling.menu > .item.selected::after` (6 classes) in the same file, which sets width 16px and a 12px mask.
  - Measured in `probe.json` (`branch-light-1440.check.after`): `w 16px, mask 12px`.
- **Colour.** GitHub's ref picker check is `--fgColor-default` (`rgb(31,35,40)`). Only ActionMenu's `SingleSelectCheckmark` (Sort) is muted. We use muted for both.
- **Fix.** Raise the specificity of the branch-picker sizing rule, e.g. repeat the `.item.selected` / `.item.active` compound. Consider `--fgColor-default` for the ref picker only.

### 3. MINOR: Fomantic ref picker (issue sidebar) keyboard moves the check, not a highlight

- **Evidence.** `probe/issue-ref-kbd-light-1440-clip.png` (issue with no ref, ArrowDown ×2). "GhostCoder6969/…" gets a ✓ and no fill. The row is `item active selected` with background `rgba(255,255,255,0)`. Dark: `probe/issue-ref-dark-1440-clip.png`.
- **Cause.** Fomantic's `selectOnKeydown` marks the arrowed row `.active.selected`.
  - The `.select-branch` branch of the check rule treats `.active` as "current".
  - `.ui.dropdown .menu .active.item { background: rest }` comes after the `.selected` hover rule at equal specificity, so the fill is lost.
- **Label filter.** The same Fomantic behaviour gives "bug" a ✓ plus the fill after ArrowDown (`probe/label-kbd-dark-1440-clip.png`). That is acceptable, because the value really changes there.
- **Suggestion.** For `.select-branch`, let `.item.selected` (keyboard) keep the hover fill even when also `.active`. Low priority: Gitea itself plans to remove this picker.

### 4. NIT: keyboard row plus pointer row both filled in the Vue branch picker

`probe/branch-kbd-hover-dark-1440-clip.png`: after ArrowDown ×2 and then hovering another row, two rows are grey. The Vue component does not move `activeItemIndex` on hover, so this is expected Gitea behaviour. CSS could hide the `.active` fill while the list is hovered, the same way item 4 was handled for Fomantic.

### 5. NIT: 3px anchor gap on navbar +, Add File and the theme select (target 4px)

Measured with `probe.json` gaps:

- nav-create: bottom 48 → top 51;
- addfile: 305 → 308;
- theme-select: 250 → 253.

Every other overlay is at 4px (nav-user, branch, clone, label filter, comment menu, issue ref, review popover, tooltips).

### 6. NIT / known (Gitea markup)

- **Code popover.** No "Clone using the web URL." help line and no (?) link. HTTP/SSH/Tea CLI instead of HTTPS/GitHub CLI.
- **Delete-label confirm.** The confirm uses a green primary "Confirm". GitHub's destructive confirmations use a danger button (Gitea template or controls).
- **Sidebar Labels multi-select.** It uses a ✓ where GitHub's SelectPanel multi-select uses checkboxes, and has no descriptions layout parity (`probe/issue-labels-dark-390.png`).
- **Tooltips.** They follow Gitea's `top-start`. The Copy URL tooltip happens to align like GitHub's there.

### Not verified this round

- The issue hover card (my probe found no `a.ref-issue` on the page).
- The stopwatch popup (would need to start a timer, which mutates data).
- The footer language menu.

## What is right (checked, not assumed)

- **Tooltip.** 27.5px tall, 4/8 padding, 12px/19.5px, `rgb(37,41,46)` (dark `rgb(61,68,77)`), 6px radius, no arrow, 4px from the anchor. Identical to GitHub's TooltipV2 numbers.
- **Overlay chrome.** 12px radius and the same `--shadow-floating-small` string as GitHub's branch overlay (`rgba(209,217,224,.25) 0 0 0 1px, rgba(37,41,46,.04) 0 6px 12px -3px, …`).
- **Branch picker.** 320px wide, 32px rows, and the 32px text inset matches.
- **Dialog.** 49px header, 16px body, 12px radius, 480/320/640 widths, and 326px at 390. The mobile header padding is correct (`probe/modal-delete-mob-light-390.png`).
- **@mention suggester.** Overlay chrome with 32px rows. The selected row uses `--bgColor-accent-emphasis` with onEmphasis text, which matches Primer CSS `autocomplete/suggester.scss` (`probe/mention-light-1440-clip.png`, `-dark-390.png`).
- **Error toast (real trigger).** Primer Toast: danger icon block, `--bgColor-default` body (`probe/toast-error-real-dark-1440-clip.png`).
- **Wiki page Code popover.** It ends cleanly on the URL field, with 16px bottom spacing and no stray border (`probe/clone-wiki-*`).
- **Create-branch row.** On a filter miss it is the single filled row (`probe/branch-nomatch-light-1440-clip.png`).
