# Critique: data-display, wave 2, round 3

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.5 / 10. Pass, with nits.** The other gates also pass: 0 console errors, 0 literal colours, smoke green (13/13 steps).

Round 3 fixed ranked issues #1, #3, #4 and #5, and I re-measured each one. #2 (the dark ring on black labels) is still open, but this folder cannot fix it (see DD-D1 / DD-I1). Three things remain in this folder:

- The Files-changed tab still shows the review-comment author muted. It is the same defect as #1, on a template the fix did not reach.
- The PR-timeline commit rows use the wrong typography.
- Two small spacing values are written as raw px.

## What I verified

- **Lint:** `node build/lint.mjs data-display` gives 0 errors and 0 warnings (274 selectors).
- **Build:** `npm run build` gives `folders["data-display"] = {status:"ok", lintErrors:0, lintWarnings:0, files:15, bytes:43309}`.
- **Served CSS:** current, so I did not redeploy. `dist/theme-github-auto.css` has SHA-256 `ebc21a71…187e`, the same as `http://localhost:3000/assets/css/theme-github-auto.css`.
- **Our screenshots:** `shots/critic-data-display-r3/`, from routes file `shots/critic-dd-routes.json`.
  - 35 routes × light/dark × 1440/390, with `--states --measure`, gives 140 pages and 36 state shots.
  - 0 console errors, 0 failed requests, 0 pages with problems, 0 unresolved vars, 0 pages with unlayered Gitea CSS.
  - This covers the routes the builder did not re-shoot: repo-commits, explore, profile, org, admin and settings tables. I looked at repo-commits/light-1440, milestones/light-1440 and site-admin-users/dark-1440 and found no regressions.
- **Off-palette colours:** only `rgba(0,0,0,0.8)` on `form#comment-form .ui.dropzone`. That is dropzone's unlayered CSS, not this folder.
- **Non-Octicon icons:** 48, all `gitea-double-chevron-left` in the PR-list branch chips. That is the icons folder's P-2 decision.
- **CLS:** unchanged from round 2 and not attributed to this folder.
  - home/390: 0.3832.
  - home/1440: 0.1675.
  - repo-home/390: 0.353 in light, 0.355 in dark.
  - project-board dark/1440: 0.121.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` is green, exit 0. All 13 steps are ok with 0 console errors (`shots/critic-data-display-r3-smoke.log`, `shots/20260930-033832-smoke-github-auto/`).
- **Live read-only probes:** github.com pemistahl/grex pull/42 (reactions, timeline commit rows) and pull/348 (comment header).
  - Scripts: `shots/critic-dd-probe.mjs` and `shots/critic-dd-r3-crop.mjs` (element crops at 2x).
  - Scratch script: the gap probe.

## Round-2 issues, checked

| # | Item | Ours now (measured) | github.com | Verdict |
|---|---|---|---|---|
| 1 | Comment-header author, pulls/16 | alice-dev, bob-dev and carol-ops are `rgb(31,35,40)`/600 in light and `rgb(240,246,252)`/600 in dark; hover `rgb(9,105,218)`; timestamp link `rgb(89,99,110)`/400 in light, `rgb(145,152,161)` in dark | `.timeline-comment-header a.author` is `rgb(31,35,40)`/600 (pull/348) | **Fixed** in the conversation view (`crop-pg16-first-light.png`, `crop-pg16-review-dark.png`). The Files tab is still wrong: see issue 1 below |
| 2 | Dark black-label ring | `github_actions` and `rust` still have no ring on `rgb(13,17,23)` | coloured ring | **Open**, but outside this folder's rules (DD-D1 → DD-I1) (`repo-pulls/dark-1440.png`, `crop-labels-dark.png`) |
| 3 | Title → label gap (#147, 1440) | title ends at 568.7, label at 572.5, so the gap is **3.8px** | 4.3px | Fixed (0.5px left, which is the width of a collapsed space) |
| 4 | Reaction pill | 41.6×26 for "1" (43.3 for "2"); padding 0 4px; radius full; emoji box 16×16 at x+5; count margin-left 2px, padding 0 4px, so the text starts 6px after the emoji; border `rgb(209,217,224)` in light, `rgb(61,68,77)` in dark | 41.6×26, 0 4px, emoji 16×16 at x+5, count margin 2px + 0 4px, same borders | **Fixed, identical** (`crop-reactions-light.png` vs `crop-reactions-gh-light.png`) |
| 5 | Mobile wrapped label | chip x=91, title x=91 (#147, #122, #119 at 390) | flush | Fixed (`crop-issues-390-light.png`) |

## Issues, most important first

1. **Minor: the review-comment author on the Files-changed tab is still muted and regular weight.**
   - Page: `/octo-org/theme-playground/pulls/16/files`, light, 1440.
   - The "carol-ops commented 3 hours ago" author is `rgb(89,99,110)` / 400.
   - The same author in the conversation view is `rgb(31,35,40)` / 600.
   - Cause: `templates/repo/diff/comments.tmpl` renders the author through `shared/user/namelink.tmpl`, which is a plain `<a>` with no class, inside `span.tw-text-text-light.muted-links`. So neither `.author` nor `a.tw-font-semibold` matches it.
   - Evidence: `shots/critic-data-display-r3/crop-files16-reviewcomment-light.png`.
   - Suggested fix, in `timeline.css`:
     `.comment-header .muted-links > a:first-child:not([href^="#"]) { color: var(--fgColor-default); font-weight: var(--base-text-weight-semibold); }`
   - The `:not([href^="#"])` part keeps the migrated-author case working. In that case the span contains only the `commented_at` permalink, which must stay muted. grex is a migrated repo, so this case is real.
2. **Minor: the typography of the PR-timeline commit rows does not match github.com.**
   - Page: pulls/16, light, 1440.
   - Our commit subject (`.commits-list .tw-font-mono`) is 13.3px, `rgb(31,35,40)`.
   - The SHA is a bordered `.ui.label.commit-id-short`: 88×24, radius 6px, 10 characters.
   - github.com (pull/42) uses `code > a.Link--secondary`: 12px mono, `rgb(89,99,110)`. The SHA there is plain 12px mono, `rgb(89,99,110)`, 7 characters, with no border.
   - Evidence: `crop-commits-ours-light.png` vs `crop-commits-gh-light.png`.
   - Suggested fix: `.comment-list .commits-list .tw-font-mono { font-size: var(--text-body-size-small); color: var(--fgColor-muted) }`. The link inside it should be muted too, with an accent hover. Style the row SHA label as plain muted mono text with no border or background.
   - Gitea prints 10 characters, and that count cannot be changed from CSS.
3. **Minor (not this folder's to fix): black labels have no ring in dark mode.** This is unchanged from round 2 and still waits on DD-D1 / DD-I1.
4. **Nit: spacing values written as raw px.** `labels.css` has `.reaction-count { margin-left: 2px }` and `min-height: calc(var(--base-size-24) + 2px)`. `var(--base-size-2)` exists and is already used in this folder. The lint does not flag either value.
5. **Nit: CounterLabel text colour.**
   - Ours: tab counter `rgb(31,35,40)` (`--fgColor-default`).
   - github.com: repo-nav counter `rgb(37,41,46)` (`--control-fgColor-rest`) (repo-issues measure).
   - The difference is barely visible.
6. **Unverified:** the D-5 `unverified` commit mask. No seeded signed-but-unverified commit exists.
7. **Page-scoped, recorded and not scored against this folder:**
   - The issue toolbar is not a Box-header.
   - The milestone and org-members lists are unboxed.
   - Label rows on the labels page sit in an inset segment (visible in `crop-labels-dark.png`).
   - `/explore/repos?q=zzzzzzz` has no blankslate markup.
   - CLS on home and repo-home at 390.

## What is good

- **Comment shell:** the Box with a 38px header on `--bgColor-muted`, 6px radius, caret, author at 600 default and muted secondary text now matches github.com in both schemes.
- **Reactions:** pixel-identical in size to github.com's `.social-reaction-summary-item`.
- **Issue/PR ListView:** 64px rows, 16/600 titles, 20px IssueLabels with a 3.8px gap, flush wrapping on mobile, a 2px accent focus ring (`repo-issues/states/dark-1440-title-focus-clip.png`).
- **Other components:** StateLabel, the timeline badges, the ProgressBar, DataTable (admin users, dark) and the commit table all look right, with no regressions on routes this round did not touch.
