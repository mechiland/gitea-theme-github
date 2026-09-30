# Critique: pages/issues-prs, wave L1, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

## Verdict
**Score: 8.0 / 10. FAIL** (a pass needs 8.5 or more). Console errors: 0. Literal colours: 0 (lint shows 0 errors and 0 warnings; the audit found 0 off-palette colours on 68 captures). Smoke test: **green** (12/12 steps, shots/20260930-124639-smoke-github-auto/smoke.json).

The issues/PRs list with the new NavList is close to github.com. NavList geometry and colours match what I measured on github.com. The PR commits tab and the PR conversation header also match closely. The score is held back by these problems:
- FG-108 went the wrong way: list titles are lighter than on github.com.
- PR pages scroll sideways at 390px. The cause is in this folder.
- Review-thread bodies are misaligned.
- There are structural gaps on the labels, milestones and issue-detail pages. Some of these are outside the builder's control, but I still count them against the look.

## Verification done
- `node build/lint.mjs pages/issues-prs`: 0 errors, 0 warnings, 346 selectors.
- `npm run build`: folder status is ok (16 files, 77,235 B). **Note: the build reports all three theme files OVER BUDGET (auto 333.3 KB, light 328 KB, dark 329.3 KB; the limit is 300 KB).** This affects the whole build, and this folder is 75.4 KB of source.
- The served `/assets/css/theme-github-auto.css` sha256 equals `dist/` (840c58c2…), so I did not deploy.
- `shots/critic-pages/issues-prs-r1`: 17 routes, light and dark, 1440 and 390, with states and measure. 0 console errors, 0 failed requests, max CLS 0.0066, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS. 4 state failures:
  - `repo-issues` `labels-btn-hover` at 1440: the button is now hidden by design.
  - `repo-issues` `select-all` at 390: the checkbox is hidden below 768px by design (FG-074).
  - These routes.json states need a change request to update or remove them.
- github.com reference refreshed with --measure: ip-issues-nav, ip-milestones-seg, repo-issue, pr-commits-tab. I also measured github.com and ours directly with `shots/critic-pages/ip-probe.mjs`.
- I also took extra screenshots at 1000px and 800px (`shots/critic-pages/ip-pulls-1000.png` and `ip-pulls-800.png`). Neither has horizontal overflow.

## Issues (most important first)

1. **MAJOR: horizontal page scroll at 390 on PR pages (this folder).** On `/octo-org/grex/pulls/348` (pr-conversation-closed-unmerged) at 390, light and dark, the document is 410px wide. The white strip on the right is visible in `shots/critic-pages/ip-348-top-390.png`.
   - The culprit is `.issue-title-meta > div.tw-ml-2.tw-flex-1.tw-break-anywhere`: it is 394px wide inside a 358px grid.
   - Cause: header.css in the <768 block sets `.issue-title-meta { display:grid; grid-template-columns:minmax(0,1fr); justify-items:start }`. The item is sized to fit its content, and `.pull-desc code { max-width:40% }` does not limit that content size.
   - Suggested fix: `justify-items: stretch`, or `min-width:0; max-width:100%` on the child.
   - issue-new-playground and pulls/16 are 407px wide too, but that overflow comes from `.gh-app-header-avatar` (navigation), not from this folder.

2. **MAJOR: FG-108 made titles lighter than github.com.** github.com issue and PR list titles measure 16px / **600** / 24px. The computed font is "Mona Sans VF", but no web font is loaded (`document.fonts` has none loaded), so github.com draws the system font at 600. Ours measures 16px / **500** / 24px (`#issue-list .list-item-large-title`).
   - The rows side by side (`shots/critic-pages/ip-title-weight.png`, ours on top) show clearly lighter titles.
   - Fix: revert to `--base-text-weight-semibold`. The FG-108 idea that 500 matches Mona Sans visually does not hold, because github.com does not render Mona Sans here.

3. **MEDIUM: review-thread comment body is misaligned.** On pr-conversation-playground-large-diff-reviews (1440 and 390) and in files-changed threads, the body text starts 28px to the right of the author name.
   - At 390: author name at x≈66, `.render-content.markup` at x=94. The cause is `.comment-content` padding-left 44px plus a 6px top margin.
   - At 1440 the body is at about x=112 in a 798-wide cloud, with the author at about 84.
   - On github.com the body lines up with the author name (or with the box padding). See `shots/critic-pages/ip-conv16-1440.png` and `ip-conv16-390.png`.

4. **MEDIUM (structural, template cap): Labels and Milestones pages are not in the NavList layout.** github.com now renders /labels and /milestones inside the same sidebar layout, with "Milestones" or "Labels" selected and a 20px/600 page title (`docs/reference/ip-milestones-seg/light-1440.png`, `docs/reference/labels/dark-1440.png`).
   - Ours still has a centred container with a Labels | Milestones SegmentedControl. Moving from the issues list to Milestones makes the whole layout jump.
   - The integrator rejected this template (§7 cap), so it cannot be fixed in CSS. It is still the biggest remaining tell on these pages.

5. **MEDIUM: the issue detail page uses the classic layout.** repo-issue at 1440 has 40px avatars outside the comment boxes, with a timeline gutter.
   - github.com's issue view now puts a 20px avatar inside the comment header and drops the outside avatar column (`docs/reference/repo-issue/light-1440.png`). The PR conversation keeps the classic layout, and ours matches it there.
   - This is not in this round's brief, but it is the most visible difference left on issue pages.

6. **MINOR: the 390 list Box header wraps to three rows.** The rows are Open/Closed, then Label/Milestone/Project, then Author/Assignee/Type/Sort (`shots/critic-pages/issues-prs-r1/repo-issues/light-390.png`). github.com shows one row: Author/Labels/Projects plus a kebab.

7. **MINOR: the NavList below 1012px is a horizontal scroll row.**
   - At 390 and 1000 (`ip-pulls-1000.png`) the row is cut off mid-word ("Created by yo", "Milesto…"), with no fade or overflow hint.
   - github.com shows a sidebar-toggle icon button to the left of the title (`docs/reference/repo-issues/light-390.png`).
   - This is acceptable without JS, but adding a fade at the right edge would help.

8. **MINOR: milestone row.** The row shows "0%" without "complete" or "N open · N closed", and Edit/Close/Delete sit inline in the meta line. github.com shows "0% complete 2 open 0 closed" under the bar, with no action links. There is no locale key for this (known gap).

9. **MINOR: list header Open/Closed style.** Ours shows an icon, then "8 Open", then an icon and "51 Closed". github.com shows "Open" with a counter pill 8 and "Closed" with a counter pill 51, without icons.

10. **NIT: out of scope, for data-display.** In light mode, label pills in lists use Gitea's inline solid colours (for example `dependencies` is solid #0366d6 and `github_actions` is solid black). github.com uses muted tints, and our dark mode already looks like github.com.

11. **NIT: tooling.** The routes.json states `repo-issues:labels-btn-hover` and `repo-issues:select-all` (390) now always fail. The builder should file a change request.

## Measurements (ours vs github.com, light 1440 unless noted)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| NavList item | box / padding | x16 w223 h32, 6px 8px | x16 w223 h32, 6px 8px | yes |
| NavList item | font | 14px/20px 400 | 14px/20px 400 | yes |
| NavList selected | background | rgba(129,139,152,0.15) | rgba(129,139,152,0.15) | yes |
| NavList selected | label weight | 600 | 600 | yes |
| NavList selected | accent bar | 4×24, left -8, rgb(9,105,218), r6 | 4×24, left -8, rgb(9,105,218), r6 | yes |
| NavList item | hover bg | rgba(129,139,152,0.1) | rgba(129,139,152,0.1) | yes |
| NavList icon | size / colour | 16px rgb(89,99,110) | 16px muted | yes |
| Page title | font | 20px/32.5px 600 | 20px/32.5px 600 | yes |
| Page title | offset below tabs | 24px | 24px | yes |
| Title → query bar | gap | 16px | 16px | yes |
| List Box header | height | 48px | 48px | yes |
| List row | height | 64 + 1 border | 65 | yes |
| List row title | font | 16px/24px **500** | 16px/24px **600** | no |
| List row meta | font / colour | 12px/18px rgb(89,99,110) | 12px/18px rgb(89,99,110) | yes |
| New Label (org settings) | height | 32px | 32px (Primer medium) | yes |
| PR 348 at 390 | document width | 410px | 390px | no |
| Review thread body | x vs author name (390) | +28px | aligned | no |
