# Critique: pages/issues-prs, wave L1, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

## Verdict
**Score: 8.5 / 10. PASS** (the bar is 8.5 or more, 0 console errors, 0 literal colours and a green smoke test).
- Console errors: 0.
- Literal colours: 0. Lint reports 0 errors, 0 warnings and 355 selectors. The audit found 0 off-palette colours in 68 captures.
- Smoke test: **green**. All 12 steps passed with 0 console errors (shots/20260930-130654-smoke-github-auto).

All the round-1 regressions I flagged are fixed, and I verified each one myself:
- The 390 sideways scroll on PR pages is gone.
- FG-108 is reverted.
- Review-thread bodies line up with the author name.
- The issue detail page now uses github.com's newer layout: no avatar column, the avatar sits inside the comment header, and the line runs through the event badges.

The issues/PRs list, the PR commits tab and the PR conversation now match github.com with only small differences. What keeps this at the bar and not above it:
- The Labels and Milestones pages still use a different layout. The template was rejected, so this is a known cap.
- The list-header Open/Closed text has no counter pill.
- The 390 filter header takes three rows.
- A few small geometry differences in the new issue-view header.

## Verification done
- `node build/lint.mjs pages/issues-prs`: 0 errors, 0 warnings, 355 selectors.
- `npm run build`: folder status "ok" (17 files, 80,016 B).
  - The whole build is **OVER BUDGET**: auto 336 KB, light 330.7 KB, dark 331.9 KB, against a 300 KB limit. This is not specific to this folder.
- The served `/assets/css/theme-github-auto.css` sha256 equals `dist/` (7cd289e0…), so I did not deploy.
- Capture run `shots/critic-pages/issues-prs-r2`:
  - Scope: 17 routes (`shots/critic-pages-issues-prs-r2-routes.json`), light and dark, 1440 and 390, with `--states` and `--measure`. That gives 68 pages and 218 fresh state PNGs.
  - Results: 0 page problems, 0 console errors, 0 failed requests, max CLS 0.0066, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 FAILED states.
  - The r2 routes file drops `labels-btn-hover` and limits `select-all` to 1440, as the builder's tooling change request asks.
  - The folder also holds stale files from an older 05:27 run (for example `pr-compare-form-playground/`, `*labels-btn-hover*`, `*close-icon*`). I ignored everything older than 12:40.
- Horizontal overflow at 390 only appears on the three theme-playground routes (issue-new, pulls/16, pulls/16/files), all at 407px.
  - The probe shows the culprit is `.gh-app-header-avatar` at right=407. That belongs to navigation and is already filed. It is not this folder.
  - pulls/348, pulls/42, pulls/358, issues/35 and /issues all measure 390.
- github.com references refreshed with `--measure`: repo-issue, labels, milestones. I also probed github.com issues/35 directly for comment-header geometry.
- Extra captures:
  - `ip-r2-pulls-1000.png` (1000px, NavList fade, no overflow)
  - `ip-r2-issue164-{light,dark}-1440.png` and `ip-r2-issue164-dark-800.png` (issue view with a local-user avatar and a label event)
- Smoke test: `node tools/shoot/smoke.mjs --theme github-auto` exited with 0. All steps ok, 0 console errors.

## Round-1 items re-checked
| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | 390 sideways scroll, PR pages | **fixed** | scrollWidth is 390 on pulls/348, 42 and 358. The head branch token truncates with an ellipsis (`ip-r2-pr348-390top.png`). |
| 2 | FG-108 title weight | **fixed** | `#issue-list` title measures 16px / 600 / 24px, the same as github.com. |
| 3 | Review-thread body offset | **fixed** | Author x equals body x: 58/58 at 390 and 226/226 at 1440 (`ip-r2-thread-light-390.png`, `ip-r2-thread-dark-1440.png`). |
| 4 | Labels/Milestones layout | open (template cap) | `ip-r2-cmp-milestones.png` |
| 5 | Issue view layout | **mostly fixed** | See issue 2 below. |
| 6 | 390 filter header, 3 rows | open | `ip-r2-issues-390top.png` compared with `ip-r2-ghissues-390top.png` |
| 7 | NavList cut off below 1012 | **improved** | A 32px fade shows at 390 and 1000 (`ip-r2-pulls-1000.png`). |
| 8 | Milestone row text | open (no locale key) | |
| 9 | Open/Closed counter pill | open (template) | `ip-r2-cmp-pulls-dark.png` |

## Issues (most important first)

1. **MEDIUM (structural, template cap): Labels and Milestones pages are not in the NavList layout.**
   - github.com renders /milestones and /labels with the left NavList (Milestones or Labels selected) and a 20px/600 "Milestones" title.
   - Ours shows a centred container with a Labels | Milestones SegmentedControl. Going from /issues to Milestones makes the layout jump.
   - Evidence: `shots/critic-pages/ip-r2-cmp-milestones.png`, with ours on top and github.com below.

2. **MINOR: issue-view comment header geometry.** Checked on the new issue view, light 1440, issues/164 and issues/35 (`ip-r2-hdr-cmp.png`, github.com on top).

   | Property | Ours | github.com |
   |---|---|---|
   | Header avatar | 20px | 24px |
   | Header padding | 4px 16px | 4px 4px 4px 8px |
   | Avatar x | 121 (box edge + 17) | 113 (box edge + 9) |
   | Author x | 149 | 145 |
   | Header height | 38px | 37px |
   | Timeline line centre | x=121 (box + 17) | x=125 (box + 21) |

   - Our header also always shows the reaction smiley. github.com's new issue header shows only Owner/Author labels and the kebab.
   - Suggested fix: `.inline-timeline-avatar img` 24px (`--base-size-24`), header `padding-left: var(--base-size-8)`, gap 8, line `left: calc(var(--base-size-20))`.
   - The body x (121) and the Box edge (104) already match.

3. **MINOR: list header Open/Closed has no counter pill (#9).**
   - Ours shows an issue-opened icon, then "12 Open", then a check icon and "280 Closed".
   - github.com shows "Open" with a Counter showing 9, and "Closed" with a Counter showing 51, with no icons.
   - This shows on every list page (`ip-r2-cmp-pulls-dark.png`). It needs template markup.

4. **MINOR: at 390 the list Box header takes 3 rows (#6).**
   - Ours: Open/Closed, then Label/Milestone/Project, then Author/Assignee/Type/Sort (`ip-r2-issues-390top.png`).
   - github.com: Open/Closed, then Author/Labels/Projects and a kebab (`ip-r2-ghissues-390top.png`).
   - Also, the NavList row at 390 is an extra 44px band above the title. github.com uses a sidebar-toggle icon button beside "All issues".

5. **MINOR: milestone row (#8).** Ours shows "0%" with no "complete · 2 open · 0 closed" under the bar. Edit/Close/Delete sit inline. github.com also shows those actions to maintainers, so keeping them is acceptable.

6. **NIT: the NavList fade also fades the row's bottom border.**
   - At 1000, the border pixel at y=160 is rgb(223,228,233) up to x=960, then rgb(241,243,245) at 985 and rgb(251,251,252) at 995.
   - The separator line under the horizontal NavList fades out along with the items.
   - Fix: put the mask on an inner scroller, or draw the border on the parent.

7. **NIT: PR tab icons.** "Files Changed" uses the plus-minus icon, while github.com uses `file-diff`. There is no Checks tab (Gitea data). See `ip-r2-cmp-pr-commits-tab.png`. The commits-tab date grouping and card otherwise match closely.

8. **NIT (tooling, not the theme):**
   - `repo-issue:toolbar-btn-focus` records focusVisible=false because the markdown-toolbar buttons use roving tabindex.
   - The `checks-hover`, `merge-style-open` and `update-branch-open` clips on pulls/16 don't frame the target.
   - These are routes.json issues for integrator-tools.

## Measurements (ours vs github.com, light 1440 unless noted)
| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| List row title | font | 16px/24px 600 | 16px/24px 600 | yes |
| NavList item | box / padding | x16 w223 h32, 6px 8px | x16 w223 h32, 6px 8px | yes |
| NavList selected | background | rgba(129,139,152,0.15) | rgba(129,139,152,0.15) | yes |
| Page title (list) | font | 20px/32.5px 600 | 20px/32.5px 600 | yes |
| Primary button | height / radius / padding | 32 / 6 / 0 12 | 32 / 6 / 0 12 | yes |
| Label | height / radius / font | 20 / pill / 12px 500 | 20 / pill / 12px 500 | yes |
| Counter | bg / font | rgba(129,139,152,0.12) 12px 500 | same | yes |
| Underline nav item | height / font | 30 / 14px 400 (active 600) | 30 / 14px 400 (active 600) | yes |
| Issue comment Box | left x | 104 | 104 | yes |
| Issue comment body | text x | 121 | 121 | yes |
| Issue comment header | height | 38 | 37 | yes (±1) |
| Issue header avatar | size | 20 | 24 | no |
| Issue header | padding-left | 16 | 8 | no |
| Issue timeline line | centre x | 121 | 125 | no (4px) |
| Issue comment header | bg | rgb(246,248,250) | rgb(246,248,250) | yes |
| PR 348 at 390 | document width | 390 | 390 | yes |
| Review thread (390) | author x vs body x | 58 / 58 | aligned | yes |
