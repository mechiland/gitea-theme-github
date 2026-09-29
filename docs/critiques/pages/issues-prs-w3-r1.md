# Critique: pages/issues-prs, wave 3, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code).
Date: 2026-09-30. Build revision 58fc358653. `dist/theme-github-auto.css` and the served
`/assets/css/theme-github-auto.css` have the same SHA-256 (2d369476…), so the served CSS was current and I did not deploy.

## Verdict

**Score: 8.0 / 10. FAIL (score is below 8.5).** Console errors 0, literal colours 0, smoke green.

The main pages are very close to classic github.com. The issue list, the PR header, the tab bar, the sidebar and the timeline measure within a pixel or two of github.com. It fails for three reasons:

- On this folder's merge box, the merge-style menu is hidden behind the comment composer, so two of its four options cannot be clicked.
- The new-PR compare form, a listed route, has none of the page styling.
- Several builder claims are wrong: the Close issue icon colour, the diffstat size, and "every page and state was screenshotted".

- Lint: `node build/lint.mjs pages/issues-prs` gives 0 errors, 0 warnings and 227 selectors. The build report shows `folders["pages/issues-prs"].status = "ok"` (12 files, 49,025 B), and every folder is ok. The three bundles are reported OVER BUDGET (399 KB for auto); that is a build-wide issue, not this folder's.
- Audit (`shots/critic-pages/issues-prs-r1`, 21 routes × light/dark × 1440/390, `--states --measure`, 88 pages): 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved variables, 0 non-Octicon icons (296 masked) and max CLS 0.0066.
- State failures: 3 of my own states had bad selectors. I fixed `search-focus` and re-shot it. `pr-compare-form-playground/title-focus` needs a click first, so I shot it with a script instead (`shots/critic-pages/ip-compare-form-{light,dark}.png`).
- Smoke: **green**. `node tools/shoot/smoke.mjs --theme github-auto` passed 12/12 steps with 0 console errors (`shots/20260930-050553-smoke-github-auto/smoke.json`).

## Evidence

- Ours: `shots/critic-pages/issues-prs-r1/`. The routes file `shots/critic-pages/issues-prs-routes.json` extends the builder's with 30 extra states: hover, press and focus on the list controls; toolbar, textarea, Close, disabled Comment, Preview, gear and Pin states in the composer and sidebar; the open reply form; the open merge-style menu; the open merge form; the open command-line instructions; the new-issue title focus. It also adds `pr-compare-form-playground` and `milestone-issues`.
- Reference: `shots/critic-pages/issues-prs-r1-ref/` (github.com logged out, `--measure`; 9 routes).
- Element probes: `shots/critic-pages/ip-m.mjs` with the specs `spec-pr-{gt,gh}.json` and `spec-list-{gt,gh}.json`. The merge-menu probe is `ip-click.mjs`, the keyboard focus probe `ip-kbd.mjs`, and the compare-form probe `ip-compare.mjs`.
- Crops: `ip-diffstat-cmp.png` (ours on top, github.com below), `ip-list-states.png`, `ip-composer-states.png`, `ip-sidebar-states.png`, `ip-390-prheader.png`, `ip-issue390.png`, `ip-toolbar-kbd-focus.png` and `ip-draft-top.png`.

## Measurements (PR #358 unless noted; ours vs github.com, light, 1440)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| main column / gap / sidebar | width | 872 / 24 / 320 (x 112, 1008) | 872 / 24 / 320 (x 112, 1008) | yes |
| title | font | 32 / 400 / 40, fgColor-default | 32 / 400 / 40 | yes |
| "#358" | font | 32 / **400** / 40, fgColor-muted | 32 / **300** / 40, muted | nit |
| title → state label | gap | 8px | 10px | nit |
| state label | box | 80×32, pill, 8px 12px, 14/600 | 80×32, pill, 8px 12px, 14/600 | yes |
| meta text | font | 14 / 400 / 21 muted, author 600 | 14 / 400 / 21 muted, author 600 | yes |
| branch token | box | 22px, 2px 6px, r6, mono 12/18, accent on accent-muted | same | yes |
| meta → tabs | gap | 16px | 16px | yes |
| tab bar / tab | height, padding | 40 / 40, 8px 12px, r 6 6 0 0 | 40 / 40, 8px 12px | yes |
| tab counter | box / weight | 20px tall, 500 (navigation) | 18px tall, 600 | nit (not this folder) |
| diffstat numbers | font | **13px** / 600 (Tailwind `tw-text-[13px]`) | 12px / 600 | no |
| diffstat blocks | shape | 5 × 8px square, 1px apart, proportional red sliver, no neutral | 5 × 8px, r2, whole blocks, grey neutral block | no |
| comment box | width / header | 816, header 38px, bgColor-muted | 816, header 38px | yes |
| timeline avatar | size | 40 | 40 | yes |
| sidebar heading | font | 12 / 600 / 18 muted, 8px below | 12 / 600 / 18 muted, 8px below | yes |
| sidebar separator | rule | 1px borderColor-muted, 16px each side | same | yes |
| sidebar empty value | colour | fgColor-muted | fgColor-default ("No reviews") | nit |
| participant avatar | size | 26 | 26 | yes |
| Edit button | box | 32px, 0 12px, 14/500 | (React header: no Edit button logged out) | n/a |
| issue list search input | box / text | 32px, r 6 0 0 6, **12px** text | 32px, **14px** text | no |
| issue list New button | box | 32px, 0 12px, 14/500, green | 32px (React "New issue") | yes |
| list Box header | box | 49px (incl. 1px top border), 8px 16px, bgColor-muted, r 6 6 0 0 | 48px, 8px, bgColor-muted, r 6 6 0 0 | yes |
| Open / Closed links | font | 30px tall, 0 8px, 600 default / 400 muted | 30px, 0 8px, 600 default / 400 muted | yes |
| filter trigger | box / colour | 32px, 0 12px, 14/400, **fgColor-muted** | 32px, 0 12px, 14/400, **#25292e (button-invisible fg)** | nit |
| list row | height | 64 (8px 16px 10px) | 64 | yes |
| composer strip | box | 48px, 8px 8px 0, bgColor-muted | classic CommentBox (no logged-out reference) | — |
| toolbar button | box | 28×28 r6, muted 16px icon, hover accent; focus ring 2px accent, offset −2 (keyboard) | classic: 16px muted, hover accent | yes |
| toolbar vs tabs | vertical centre | toolbar centre **10px above** tab-label centre | aligned | no |
| textarea / file bar | box | 132px, 8px pad, dashed bottom; bar 35px 12px muted | classic look | yes |
| merge icon | box | 40×40 r6, success-emphasis, 24px icon | classic merge box | yes |
| merge button | box | 32px, 0 12px, 14/500, primary | — | yes |

## Issues, most important first

1. **major (functional): the merge-style menu is painted under the comment composer, so its lower options cannot be clicked.**
   - Where: `pr-conversation-playground-large-diff-reviews`, light and dark, 1440 and 390, state `merge-style-open` (`states/light-1440-merge-style-open.png`).
   - Measured: the 4-item menu is 167px tall, but only about 75px of it shows. "Rebase, then fast-forward" is cut off, and "Rebase, then create merge commit" and "Create squash commit" are hidden completely. `document.elementFromPoint` at the menu's bottom returns `TEXTAREA.markdown-text-editor`.
   - Cause: `src/controls/button-groups.css:13` gives `.ui.buttons` `isolation: isolate`, which traps the menu's `z-index: 11` inside the button group. The composer timeline item comes later in `.comment-list`, which is also isolated (`src/data-display/timeline.css:17`), so it paints on top.
   - Verified fix: setting `isolation: auto` on `#pull-request-merge-form .merge-button` makes all 4 items reachable.
   - Second defect in the same state: the caret gets `.active`, so the controls rule `.ui.buttons:has(> .active.button)` (SegmentedControl) turns the green "Create merge commit" button grey. Its background is measured `rgba(0,0,0,0)` while the menu is open.
   - Fix: add a page-scoped rule in merge-box.css now (`.repository.view.issue #pull-request-merge-form .ui.buttons { isolation: auto; }`) and file a request to controls to exclude `.dropdown.button.active` from the SegmentedControl selector. The same pattern probably affects the "Update branch by merge" split button.
   - Neither the builder's claim nor its screenshots covered this state.
2. **major: the new-PR compare form has none of the page styling.**
   - Where: `/octo-org/theme-playground/compare/main...experiment/alt-renderer`, after clicking "New Pull Request" (`shots/critic-pages/ip-compare-form-light.png`). The page is `.page-content.repository.diff.compare.pull`, but layout.css, sidebar.css and composer.css only match `.repository.view.issue` and `.repository.new.issue`.
   - Result, sidebar: it is still a framed `.ui.segment` Box (1px border, 16px padding, 300px wide) with 14px default-colour headings. The same sidebar on the new-issue page is unframed, with 12px muted headings.
   - Result, editor: H¹ H² H³ are spaced differently (the `md-header::after` rule is out of scope). The file bar sits apart from the textarea with a white gap. The main column is 1060px instead of 872px.
   - The brief lists "new PR compare page" as a relevant route. The builder lists it as a known gap, but it only captured the "View Pull Request" state. A seeded branch without an open PR exists (`experiment/alt-renderer`).
3. **minor (claim wrong): the "Close issue" icon is not purple.**
   - composer.important.css colours `span.status-button-icon` `--fgColor-done` (computed rgb(130,80,223)). The svg inside keeps `color: rgb(89,99,110)`, because the controls rule `.ui.button:not(.primary, .green, .red, .danger) > span > .svg:first-child { color: var(--fgColor-muted) }` (buttons.css:118) sets the svg colour directly.
   - Visible in `repo-issue/states/*-1440-close-hover-clip.png` (grey icon, light and dark).
   - Fix: target `#status-button .status-button-icon > .svg` (this layer already wins, so no !important is needed).
4. **minor (claim wrong): the diffstat is 13px, not 12px, and the blocks differ.**
   - `.pull.tabular.menu > .flex-text-block` has Gitea's `tw-text-[13px]` (Tailwind, !important). header.css only sets the weight.
   - The blocks are square, with a proportional red sliver inside the last green block and no grey neutral block. github.com uses whole 8px squares with 2px radius, green/red/neutral-muted (`shots/critic-pages/ip-diffstat-cmp.png`). On #42 (+3 −3) ours shows 5 coloured blocks; github.com shows 2 green, 2 red and 1 grey.
5. **minor: 390px PR/issue header.**
   - Placement: the Edit / New Issue buttons sit between the title and the state label. github.com puts header actions above the title on narrow screens.
   - Meta line: it wraps in a narrow column to the right of the 80px state label, 104px tall on #358 (`ip-390-prheader.png`). github.com puts the label on its own row and the meta line below it at full width (49px).
   - Branch token: it breaks inside the name onto two lines ("…honor-no-color-/272", 40px tall). github.com truncates it with an ellipsis on one 22px line.
   - Title: 20px vs 26px on github.com. There is no 26px title token (the builder knows).
6. **minor: the markdown toolbar is not vertically centred in the composer header strip** (≥1012px). The toolbar is `top: 4px` (y 2210–2238, centre 2224), while the Write/Preview tab labels are centred at 2234, so the icons sit 10px high (`ip-composer-states.png`, `repo-issue/light-1440.png`).
7. **minor: the issue-list search input text is 12px** (inherited from Gitea's `.ui.input` in the list header). github.com's filter input is 14px, and the Primer medium TextInput is 14px. Visible as a small "Search…" placeholder in `repo-issues/states/light-1440-search-focus-clip.png`.
8. **minor: labels page rows are 77px vs 57px.**
   - Layout: ours stacks the description under the label token, with "N open issues/pull requests" as a text column. github.com has one line per row: token, description in a middle column, count with an octicon on the right, and 0 counts hidden (`labels/dark-1440.png` vs the reference).
   - Colours: label token colours are inline Gitea styles (exempt).
9. **minor (known gap, not verified by builder): the inline review reply form.**
   - Screenshotted open (`pr-conversation-playground-large-diff-reviews/states/dark-1440-reply-open-clip.png`).
   - Dropzone: it uses the generic 1px dashed, roughly 55px tall dropzone, not the composer's slim file bar.
   - Toolbar: it sits under the tabs.
   - Background: the form is on bgColor-default, although review.css sets `--bgColor-muted` for `form.comment-form`. It looks consistent but does not match the main composer.
10. **nit: PR-list branch chips.** Every open PR row carries two accent BranchName tokens (`repo-pulls/light-1440.png`). github.com's PR list shows none and uses the space for check status ("✓ 14/14"). This is a defensible owner's choice (P-2), but it is the most visible difference on that page.
11. **nit:**
    - "#N" suffix weight: 400 vs 300.
    - Filter trigger label colour: muted vs `--button-invisible-fgColor-rest`. The brief said muted; live github.com is dark.
    - Title-to-state gap: 8 vs 10px.
    - Press state of the filter triggers: visually identical to hover in the capture.
    - Empty sidebar values: muted vs default on github.com.
12. **Not verified (no seeded state):**
    - the merged/closed merge box with Delete branch;
    - pin/lock/delete actions;
    - server validation errors on the issue form (not submitted, per the brief);
    - the PR commits tab restyle (shared list, the builder's known gap).

## Claims checked

- 0 lint errors / 0 warnings / 227 selectors: **confirmed**.
- 0 console errors, 0 off-palette, 0 unresolved vars, 0 non-Octicon icons, max CLS 0.0066: **confirmed** on my own run.
- Main 872 / gap 24 / sidebar 320: **confirmed** (also on github.com).
- Title 32/40/400, muted "#N", 8px meta gap: **confirmed**.
- Box header 48px, muted, 8px 16px, rounded top; filter triggers 32px, 0 12px, 14px muted, 16px caret: **confirmed** (49px including the border).
- The migrated-comment header no longer breaks mid-word at 390: **confirmed** (`ip-issue390.png`).
- Sidebar unframed, 12/18 semibold muted headings, 26px participants, 28px controls, link-style Pin/Lock/Delete: **confirmed** on the issue/PR view and new issue. **Not** on the compare form.
- "Close issue icon uses the purple done colour": **not confirmed** (issue 3).
- "diffstat 12px": **not confirmed**, it renders 13px (issue 4).
- "Every page and state was screenshotted": the merge-style menu and the reply form were not, and the merge-style menu is broken (issue 1).
- No `display`/`visibility` in the `*.important.css` files: **confirmed** by reading them.

## Suggested fixes for round 2 (in the builder's own folder)

1. merge-box.css: `.repository.view.issue #pull-request-merge-form .ui.buttons { isolation: auto; }`. Also request that controls exclude `.dropdown.button.active` from the SegmentedControl `:has()` selector, or restore the primary look page-scoped.
2. Extend the scope `:is(.repository.view.issue, .repository.new.issue)` to include `.repository.compare.pull` in layout.css, sidebar.css and composer.css, and shoot the expanded form.
3. `#status-button .status-button-icon > .svg { color: var(--fgColor-done); }`.
4. Diffstat: add `font-size: var(--text-body-size-small)` in header.css.important (it has to beat Tailwind's !important). Change the blocks to 2px radius; whole blocks with a neutral remainder need either a mask-based design or acceptance as a known gap.
5. On phones, put the state label on its own row (`.issue-title-meta { flex-wrap: wrap }` and a full-width meta text). Give the branch tokens `max-width: 100%` with ellipsis.
6. Centre the toolbar: `top: calc(var(--base-size-8) + (var(--base-size-40) - var(--control-small-size)) / 2)`, or align it to the tab item.
7. Search input `font-size: var(--text-body-size-medium)`.
