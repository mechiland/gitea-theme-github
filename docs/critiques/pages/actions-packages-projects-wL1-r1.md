# Critique: pages/actions-packages-projects, final gate loop 1 (wL1), round 1

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.0 / 10: FAIL** (bar 8.5). Console errors 0, literal colours 0 (lint 0/0), off-palette 0, smoke green (all 12 steps ok, 0 console errors).
The pages look close to github.com; one CSS rule makes the whole run/job view invisible in a reachable Gitea state (finding 1). That alone blocks the pass.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` → 0 errors, 0 warnings, 308 selectors.
- **Build:** `npm run build` → `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 7, bytes: 62164}`. The theme is still over budget (auto 333.3 KB after minify, 341,318 B on disk).
- **Served CSS:** sha1 of `http://localhost:3000/assets/css/theme-github-auto.css` = dist (`8553ff20…`). No deploy was needed.
- **Screenshots:** shots/critic-pages/actions-packages-projects-wL1-r1, from routes file shots/critic-pages/actions-packages-projects-wL1-r1-routes.json.
  - 13 routes × light/dark × 1440/390 with `--states --measure`: 52 pages. 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colours.
  - Two problems were my own: the projects-list `search-focus` state selector timed out.
  - I also shot actions-list, action-run and project-board at mid widths (900 and 800).
- **Reference:** docs/reference/apx1-* (github.com logged out, captured today).
  - actions-list: pemistahl/grex/actions. Its states failed because github's DOM changed.
  - action-run: grex runs/22496470232.
  - projects-list: orgs/github/projects.
  - project-board: orgs/github/projects/4247.
  - packages: orgs/github/packages and github/combobox-nav.
- **CLS:**
  - action-run: 0.0036 at 1440, 0 at 390.
  - action-job and action-job-ok: 0 at both widths.
  - actions-list: at most 0.0003.
  - The builder's numbers are confirmed.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` exited 0. All steps ok, 0 console errors (shots/critic-pages/actions-packages-projects-wL1-r1-smoke.log). The admin theme is github-auto afterwards.

## Findings (most important first)

### 1. BLOCKER: FG-085 hides the whole run/job body forever when a loaded run has no back link
- **Rule:** action-run.css:180, which is `#repo-action-view:not(:has(.action-view-back)) .action-view-body { visibility: hidden }`.
- **Why it breaks:** the rule treats `.action-view-back` as the "run loaded" signal. But `RepoActionView.vue` renders that link only when `backLink` is non-null, which needs `run.pullRequest || run.workflowLink`.
- **When `workflowLink` is missing:** `routers/web/repo/actions/view.go:613` sets it **only when `isLatestAttempt`**. After any "Re-run", Gitea's attempt dropdown (`run.attempts.length > 1`) links to the older attempts.
- **Result:** for a push, schedule or dispatch run (no PR), every non-latest attempt renders with an invisible job list, summary, graph and log. Only the header and the Re-run button show.
- **Reproduced** with shots/critic-pages/apx-wL1-nolink.mjs, which replays the real POST response with `workflowLink` emptied and `pullRequest` null (what Gitea sends for an old attempt):
  - run 19: `back:false`, 8 jobs loaded, `.action-view-body` visibility `hidden`. PNG: shots/critic-pages/apx-wL1-nolink-run.png shows a blank page under the title.
  - job 89: same result.
  - With an aborted POST (network or permission error) the body also stays hidden, where Gitea would at least show the page chrome.
- **Fix:** key on something every loaded run renders, e.g. the status icon: `#repo-action-view:not(:has(.action-info-summary-title > .svg))`. Add a fail-safe reveal as well, e.g. `animation: gh-reveal 0s var(--…) forwards` with keyframes to `visibility: visible` after about 1–2s, so an error can never blank the page.

### 2. MINOR: the "footer hidden until loaded" rule is dead, so the claim is only half true
- The rule is `body:has(#repo-action-view:not(:has(.action-view-back))) .page-footer` (action-run.css:181).
- `:has()` may not be nested inside `:has()`, so Chrome drops this selector. It is emitted as its own rule in the minified CSS, so it fails alone.
- Measured: `.page-footer` visibility is `visible` before load.
- CLS is still 0 at 390 because the body is hidden and `#repo-action-view` has `min-height: 100vh` below 768px. Remove the rule, or rewrite it without the nested `:has`.

### 3. MINOR: graph zoom controls are close to github, but the disabled state and tab order differ
- Glyphs, size and placement now match: the icons owner shipped plus/dash/screen-full, so the "falls back to magnifiers" known gap is closed. Both are 28×28, radius 6, screen-full then an 8px gap then the joined dash|plus pair, at the Box's bottom-right. PNG: shots/critic-pages/apx-wL1-graphctl.png.
- **Differences:**
  - **Disabled icon colour:**
    - The disabled "+" keeps `--fgColor-muted`: light rgb(89,99,110) vs github rgb(129,139,152), dark rgb(145,152,161) vs github rgb(101,108,118).
    - Cause: `.graph-controls > .button { color: var(--fgColor-muted) }` overrides the controls folder's disabled colour. Add `:disabled { color: var(--fgColor-disabled) }`.
  - **Enabled background:** enabled buttons are `--button-default-bgColor-rest` (#f6f8fa) with the #d1d9e0 border. github renders them as Button--secondary; they were all disabled at 100% in the reference, so only the disabled look could be compared.
  - **Tab order:** the visual order comes from CSS `order` (DOM: zoom-in, reset, zoom-out), so keyboard focus goes + → ⛶ → −. This is WCAG 2.4.3, nit level.

### 4. MINOR: the Actions pane divider runs the full page height
- Pane measured 336×2592 at 1440 vs github 336×718. github's PageLayout pane is sticky, and its divider stops at the fold (docs/reference/apx1-actions-list/light-1440.png, divider ends at y≈900).
- Ours runs down to the footer (shots/critic-pages/actions-packages-projects-wL1-r1/apx1-actions-list/light-1440.png). This is noticeable on the long runs page.

### 5. NIT: run rows are 80px vs github's 79px
Measured at light 1440. The title, meta, branch and kebab boxes match: kebab 24×34, branch x≈888 vs github ≈900, runs Box 1056 at x=360 with a 66px header. PNG: shots/critic-pages/apx-wL1-al-top.png.

### 6. NIT: the projects list Box header shows "2 Open" and "0 Closed" with leading icons
- github shows "Open [16]" and "Closed [0]" with a Counter after the label, and no icon (shots/critic-pages/apx-wL1-pl-1440.png, apx-wL1-pl-390d.png). The count-first text comes from Gitea's template.
- The header is 66 vs 65px, and our padding-left is 8px vs github's 16px (the toggle items carry their own 8px padding, so the text lands in the same place).
- The row meta line-height is 19.5px vs 18px: not a Primer text token, where 12px uses `--text-body-lineHeight-small` = 20px or the caption size 18px.
- The row icon is octicon-project vs github's octicon-table (icons).

### 7. NIT: board filters at 390 are still indented by the invisible-button padding
Label, Assignee and Milestone text sits at x=28 while the h2 is at x=16 (shots/critic-pages/apx-wL1-pb-390.png). This was carried over from w3-r2. The 390 toolbar now wraps into five 32px buttons on two rows. All are visible, so FG-055 is fixed; github collapses them into icon buttons plus an overflow menu instead.

### 8. NIT: packages
- FG-061 is fixed: install lines are single-line and scroll with a lane before the copy button (states/light-390-copy-hover-clip.png shows no overlap), and "View all" sits on the "Versions (1)" baseline.
- The "Installation" Box header row remains (github has one headerless bordered block plus a "Recent Versions" Box).
- The org projects search uses a leading-icon input while the repo projects search has a trailing search button (Gitea templates differ). They are inconsistent on our side.

### 9. NIT: at 900px the run summary stats wrap unevenly
"Status / Failure" stays on the first row and "Total duration" and "Artifacts" drop under the trigger (shots/critic-pages/apx-wL1-mid.png).

### 10. INFO (not this folder)
- **Horizontal overflow at 390** on every repo-scoped page (document 407px): `.gh-app-header-avatar` ends at x=407 (navigation folder, AppHeader). It appears on this folder's routes too (projects-list, action-run, board, packages-repo, actions-list).
- **Non-Octicon icons:** `gitea-running` shows in the runs **list rows** (`.item-leading svg.gitea-running`, for a running run) as well as in the status menu (icons, FG-091). `gitea-npm` is a brand exemption.

## Builder claims checked
| claim | verdict |
|---|---|
| FG-027 full-bleed PageLayout, Box 1056 at x=360 | **confirmed** (runs-box 1056, pane 336, header 66). The divider length differs (finding 4). |
| FG-035 projects grid, 32px New Project, Box header with toggles and Sort, muted Delete/danger hover | **confirmed** (new-btn 32px, 14/500; Delete danger on hover in light and dark). |
| FG-038 controls bottom-right 28px, node --card-bgColor, edge to edge <768, NavList moved below | **confirmed**; the glyphs are now real Octicons. The disabled colour and tab order are off (finding 3). |
| FG-055 board bleed, wrapped 32px toolbar at 390 | **confirmed**. |
| FG-061 install lines and View all baseline | **confirmed**. |
| FG-072 kebab invisible hover, 32px re-run split, gear checkmarks only, 16px gutter | **confirmed** (rerun 32px, gear menu shows only ✓ on the selected item). |
| FG-085 "body and footer hidden until loaded", CLS 0 at 390 | CLS **confirmed**. The footer part is **false** (dead selector). The body rule **breaks old attempts** (finding 1). |
| "graph controls fall back to magnifiers" (known gap) | **outdated**: plus/dash/screen-full masks now exist in dist. |

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| actions pane | width | 336 | 336 | yes |
| actions pane | height | 2592 (full page) | 718 (fold) | no |
| runs Box | width / x | 1056 / 360 | 1054–1056 / 360 | yes |
| runs Box header | height / padding / bg | 66 / 16 / #f6f8fa | 66 / 16 / #f6f8fa | yes |
| run row | height | 80 | 79 | nit |
| run kebab | box | 24×34 | 24×34 | yes |
| run title | box h / font | 24 / 16/600 | 24 / 16/600 | yes |
| run page h1 | font | 20/600 | 20/600/30 | yes |
| run header re-run | height | 32 | 32 | yes |
| run NavList item | box | 272×32 | 272×32 | yes |
| graph control | size / radius | 28×28 / 6 | 28×28 / 6 | yes |
| graph control disabled | icon colour (light) | rgb(89,99,110) | rgb(129,139,152) | no |
| graph control disabled | icon colour (dark) | rgb(145,152,161) | rgb(101,108,118) | no |
| graph control | gap reset→group | 8 | 8 | yes |
| graph box bg (dark) | pixel | rgb(1,4,9) | rgb(1,4,9) | yes |
| graph node bg (dark) | pixel | rgb(21,27,35) | rgb(21,27,35) | yes |
| projects Box header | height | 66 | 65 | nit |
| projects row | height | 112.5 | 116 | yes |
| projects row meta | line-height | 19.5 | 18 | nit |
| New Project button | height / font | 32 / 14/500 | 32 (Primer medium) | yes |
| projects search input | height / font | 32 / 14 | 32 / 14 | yes |
| CLS action-run | 390 / 1440 | 0 / 0.0036 | — | yes |
