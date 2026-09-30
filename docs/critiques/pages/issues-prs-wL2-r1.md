# Critique: pages/issues-prs, wave L2, round 1

Critic: independent GitHub design-systems reviewer (I write no theme code). Date: 2026-09-30.

## Verdict

**Score: 8.6 / 10. PASS** (bar: ≥ 8.5, 0 console errors, 0 literal colours, smoke green).

The Labels and Milestones pages now read as github.com's issues PageLayout. They have a 256px NavList, a 20px/600 title
with New at its right, and the Box below. The PR list is the centred 1232px column that github.com uses. The milestone
row follows the RepositoryMilestone layout. Most gaps left are template-bound, as the builder listed (Open/Closed
CounterLabels, "0 open issues/pull requests", no "Search all labels", no Active/Archived header).

I found one new CSS defect from this round's FG2-072 work. At 390px the branch copy button collapses to 6.9px wide, its
14px icon overflows, and the icon touches "into" on every PR header (issue 1). It is a one-line fix.

- Lint `node build/lint.mjs pages/issues-prs`: **0 errors, 0 warnings**, 431 selectors. `npm run build` →
  `folders["pages/issues-prs"]`: status **ok**, 19 files, 99,040 B. No `!important` appears outside `*.important.css`, and
  none of those files set display or visibility. Literal colours: 0.
- `dist/theme-github-auto.css` is byte-identical (`cmp`) to the served `/assets/css/theme-github-auto.css` (329,623 B), so I
  did not deploy. All three bundles are **OVER BUDGET** (auto 321.9 KB per the build).
- My shoot: 13 routes × light/dark × 1440/390 = 52 captures, plus states and measure → `shots/critic-pages/issues-prs-r1/`
  (routes: `shots/critic-issues-prs-routes.json`). Totals: console errors **0**, failed requests **0**, off-palette **0** on
  every page, non-Octicon icons **0**, unlayered Gitea CSS **0**, max CLS **0.0034**.
- The only unresolved var is `--gh-octicon-calendar`, with 0 matched elements. It comes from another folder's date-input
  rule, not this folder.
- The first run had 4 problems, all my own wrong `sort-open` selector on milestones. After fixing the selector and
  re-shooting, all 4 states rendered.
- Smoke `node tools/shoot/smoke.mjs --theme github-auto`: **green**. 13/13 steps ok, 0 console errors
  (`shots/20260930-170503-smoke-github-auto/smoke.json`).
- Reference: I re-captured github.com logged out for repo-pulls, milestones, labels, repo-issues and repo-pull with
  `--measure` (`docs/reference/<id>/`). I also took DOM measurements of github.com /milestones and /labels
  (`shots/critic-pages/issues-prs-r1/probe/gh.json`).

## Brief items, verified

| Item | Verdict | Evidence |
|---|---|---|
| FG2-027 PR list | ✓ The NavList is hidden. The container is x=104, w=1232 at 1440 (github.com 104/1232). Title is 24px under the tabs (gh ≈24), list Box 24px under the query bar (gh 25). Rows are 65px (gh 65–67). | repo-pulls/light-1440.png vs docs/reference/repo-pulls/light-1440.png |
| FG2-023 Labels/Milestones NavList | ✓ CSS-only version. Items are 32px, 6px 8px padding, 14/20. The selected item has rgba(129,139,152,.15), 600 weight and a 4×24 accent bar. Focus ring is 2px accent inset. Milestones comes first. | labels/light-1440.png, milestones/states/dark-1440-nav-focus-clip.png |
| FG2-031 phones | ✓ The NavList is 104px selected + 32×32 icon items on one row, with no clipping. Filters sit on one scrolling row. Menus open as fixed sheets (y=572, full width, 12px top radius, items 32px). ✗ There is no scrim and no sheet header (issue 2). | repo-issues/states/light-390-filter-open.png, repo-pulls/states/dark-390-filter-open.png |
| FG2-035 milestone row | ✓ "0% complete 2 Open 0 Closed" is one 14/20 row under the 320px bar, with the meta on the same row. The actions are 12px muted, and Delete turns danger only on hover. The milestone page Close is a default Button. | milestones/states/light-1440-delete-hover-clip.png, milestone-issues/light-1440.png |
| FG2-036 | ✓ The state icons are hidden. The "8 Open" order is template-bound. | |
| FG2-039 | ✓ The actions are 28×28 IconButtons, hidden until row hover or focus. Focus ring shown. | labels/states/light-1440-{row-hover,edit-focus}-clip.png |
| FG2-046 | ✓ mostly. The Box has a border and 6px radius, a 24px tag icon, and one action row (Select 320×32 + Use Label Set 117×32). ✗ There is no Blankslate heading, and the vertical padding is uneven (issue 6). | org-settings-labels/light-1440.png |
| FG2-059 | ✓ The compare form is 112–1328 (1216). | pr-compare-form-playground/light-1440.png |
| FG2-072 | ✓ at 1440 (copy button 14px after the head token, sidebar Delete danger). ✗ At 390 the copy button collapses (issue 1). | repo-pull/light-1440.png, probe/pr390-meta.png |
| FG2-073 / 074 / 083 / 093 | ✓ The SHA is plain muted mono 7ch. "1 Commits" is a heading line. The range editor has a muted background. Merge-style items are 32px. At 390, Edit / New Issue sit on the StateLabel row. | pr-draft-wip-playground/light-1440.png, pr-compare-new-playground/light-390.png, pr-conversation-playground-large-diff-reviews/states/light-1440-merge-style-open.png, pr-conversation-open/light-390.png |
| Leak fix | ✓ `/milestones` on the dashboard is not affected. | probe/dashboard-milestones-light-1440.png |

## Issues (most important first)

1. **MINOR (new, a regression from FG2-072): at 390 the PR header copy button shrinks to 6.9px, and its icon overlaps "into".**
   - Where: every PR, for example `/octo-org/grex/pulls/358`, light-390.
   - Measured: `.pull-desc code > button.btn.interact-fg` has width 6.875px with `flex: 0 1 auto` and min-width 0. The svg
     inside it is 14px wide. At 1440 the button is 14px wide.
   - Effect: the icon overflows its box by 7px, so "into" starts right against the icon with a 0px gap
     (`probe/pr390-meta.png`, `repo-pull` at 390 is similar).
   - Fix: `.pull-desc code > button { flex-shrink: 0; margin-left: var(--base-size-4) }`.

2. **MINOR: the phone filter bottom sheet has no scrim or header, and in dark mode it is barely separated from the page.**
   - Measured, dark: sheet background rgb(1,4,9) (`--overlay-bgColor`) on a body of rgb(13,17,23). The only separation is a 1px
     `--borderColor-default` ring.
   - Measured, light: white on white, separated by a 25%-alpha ring only.
   - The rows behind the sheet stay fully readable, and it is not clear which filter is open because there is no
     "Sort" title (`repo-pulls/states/dark-390-filter-open.png`, `milestones/states/dark-390-sort-open.png`).
   - Primer's bottom-sheet Overlay uses a backdrop (`--overlay-backdrop-bgColor`) and a header.
   - A scrim is reachable in CSS: `box-shadow: 0 0 0 100vmax var(--overlay-backdrop-bgColor), var(--shadow-floating-large)`
     on the open `.menu`. The header could be a `::before` with the parent item's text if it is available, otherwise skip it.

3. **MINOR: the Labels/Milestones switch on New/Edit Milestone is still the old tab text.**
   - `/octo-org/grex/milestones/new` (page class `repository new milestone`) shows "Labels Milestones" as plain text with no
     selected indicator beyond weight, while the list pages now use the NavList (`probe/milestone-new-light-1440.png`).
   - This is not a regression (the controls critic's 16:51 capture looks the same), but it is inconsistent now.
   - github.com's new-milestone form has no switch. Either hide `.new.milestone .issue-list-navbar` or give it the same
     underline treatment.

4. **NIT: milestone Box header and row offsets.**
   - The "1 Open" text is at x=305; github.com's "Open" is at x=297, because our item keeps 0 8px padding inside the 16px
     header padding.
   - The milestone title is at x=297; github.com's is at 305.
   - The counts read "2 Open" / "0 Closed" with the label capitalised and the number muted. github.com reads "**2** open",
     with the number 600 and default colour (Gitea's text node, so this is partly template-bound).

5. **NIT: label rows are 61px (github.com 57px).**
   - The 28px IconButtons plus 16px row padding set the height.
   - Fix: `margin-block: calc(var(--base-size-4) * -1)` on `.label-operation`, or 12px row padding when actions are present.

6. **NIT: org-settings Blankslate.**
   - There is no heading. Primer Blankslate is icon → heading 20px/600 → description → action. Here the description reads
     as the heading.
   - The vertical padding is uneven: 33px above the icon but 49px below the buttons, because the column has 16px of
     trailing space.

7. **NIT: the sidebar divider stops where the content ends.**
   - On milestones it ends at y=392; github.com's runs to the page bottom (y≈900) (`milestones/light-1440.png` vs the reference).
   - The NavList items are 223px wide; github.com's labels/milestones items are 208px (x16–224).

8. **NIT (known, template or JS-bound):**
   - Open/Closed CounterLabels are missing.
   - "0 open issues/pull requests" appears on zero rows.
   - No "Search all labels" field and no Active/Archived header.
   - Merge-style menu items have no checkmark or description (Vue chunk).
   - The 8px rail stub under "Commits on …" remains at 390 on compare (`pr-compare-new-playground/light-390.png`).

9. **Budget (shared, not scored):** auto 329,623 B, over the 300 KB budget. This folder is ≈39 KB of the minified file. The
   integrator should budget a trim pass. Candidates: the phone-only milestone and label reflow blocks, and the
   duplicated toolbar rules that controls now owns (see controls' CT-FG2-079 note in docs/requests/pages-issues-prs.md).

## Measurements (ours vs github.com, light 1440 unless noted)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| PR list container | x / width | 104 / 1232 | 104 / 1232 | yes |
| PR list title → query → Box | gaps | 24 / 24 | 24 / 25 | yes |
| PR list row | height | 65 | 65–67 | yes |
| NavList item (labels/milestones) | h / padding / font | 32 / 6px 8px / 14/20 | 32 / 6px 8px / 14/20 | yes |
| NavList item | width | 223 | 208 | no (15px) |
| NavList selected | bg / weight | rgba(129,139,152,.15) / 600 | rgba(129,139,152,.15) / 600 | yes |
| Page title | font | 20px/600 | 20px/600 | yes |
| Milestone Box header | height | 48 | 48 | yes |
| Milestone header "Open" | text x | 305 | 297 | no (8px) |
| Milestone title | font / x | 16px/24 500 / 297 | 16px/24 500 / 305 | partly |
| Milestone counts | font / colour | 14/20 muted, "0%" 600 default | 14/21 muted, numbers 600 | partly |
| Milestone meta | font | 12/20 muted | 12/18 muted | yes |
| Milestone progress bar | width | 320 | 320 | yes |
| Label row | height | 61 | 57 | no |
| Label description | font | 12/18 muted | 12/18 muted | yes |
| Label row IconButton | size / radius | 28×28 / 6 | kebab 28×28 / 6 | yes |
| Labels Box header | height / bg | 48 / rgb(246,248,250) | 48 / rgb(246,248,250) | yes |
| New button (labels) | h / padding / radius | 32 / 0 12 / 6 | 32 / 0 12 / 6 | yes |
| Phone sheet item | height / padding | 32 / 6 8 6 32 | 32 (ActionList) | yes |
| Phone sheet | backdrop | none | --overlay-backdrop-bgColor | no |
| PR head copy button (390) | width | 6.9 (icon 14) | 16 IconButton | no |
| PR head copy button (1440) | width | 14 | 16 | yes (±2) |
| Org Blankslate | select / button | 320×32 / 117×32 | Primer Select / Button 32 | yes |
| Merge-style menu item | height | 32 | 32 (ActionList) | yes |
