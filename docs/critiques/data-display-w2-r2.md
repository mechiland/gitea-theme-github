# Critique: data-display, wave 2, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.4 / 10. Not a pass, but close.** The pass line is 8.5. The other gates all pass: 0 console errors, 0 literal colours, smoke green.

Round 2 fixed all nine ranked round-1 issues that belong to this folder, and I verified each one by measurement. Two things keep the score under 8.5:

- Every non-migrated comment-header author is muted. I missed this in round 1, and it appears on every comment.
- Black issue labels are now invisible in dark mode. This is a regression from this round's border change; its fix is waiting on the dark folder.

## What I verified

- **Lint:** `node build/lint.mjs data-display` gives 0 errors and 0 warnings (272 selectors).
- **Build:** `npm run build` gives `folders["data-display"] = {status:"ok", lintErrors:0, lintWarnings:0, files:15, bytes:42202}`.
- **Served CSS:** current. `dist/theme-github-auto.css` has SHA-256 `b97263d2…4f6a`, the same as http://localhost:3000/assets/css/theme-github-auto.css. I did not redeploy.
- **Our screenshots:** `shots/critic-data-display-r2/`, from routes file `shots/critic-dd-routes.json`.
  - 35 routes × light/dark × 1440/390, with `--states --measure`, gives 140 pages.
  - 0 console errors, 0 failed requests, 0 pages with problems, 0 unresolved vars, 0 pages with unlayered Gitea CSS.
- **Off-palette colours:** only `rgba(0,0,0,0.8)` on `form#comment-form .ui.dropzone`. That is the dropzone library's unlayered CSS, not this folder.
- **Non-Octicon icons:** only `gitea-double-chevron-left` in the PR-list branch chips. That is the icons folder's P-2 decision.
- **Reference:** github.com logged out, from `shots/critic-data-display-r1-ref/` (captured earlier today, same routes, with measure).
  - I made live probes on github.com with `shots/critic-dd-probe.mjs` (read-only) for pull/42, pull/348 and issues.
  - I diffed the measure files with `shots/critic-dd-r2-cmp.mjs`.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` is **green**. All 12 steps passed with 0 console errors (`shots/20260930-032532-smoke-github-auto/`, log `shots/critic-data-display-r2-smoke.log`).

## Round-1 fixes, checked (light, 1440 unless noted)

| # | Item | Ours now | github.com | Verdict |
|---|---|---|---|---|
| 1 | Plain "reviewed" badge (pulls/16) | icon `rgb(89,99,110)` on `rgb(246,248,250)`; dark `rgb(145,152,161)` on `rgb(21,27,35)` | muted on muted | fixed (`crop-pg16-review-{light,dark}.png`) |
| 1b | Approved badge | white on `rgb(31,136,61)` | same | ✓ |
| 2 | Event actor `a.tw-font-semibold`, `<b>` milestone | `rgb(31,35,40)` / 600; hover `rgb(9,105,218)` | `rgb(31,35,40)` / 600 | fixed |
| 3 | Milestone-list ProgressBar | 200×5, 3px radius, track `rgb(209,217,224)` | 5px, 3px, `#d1d9e0` | fixed; milestone page big bar 8px/6px |
| 4 | Tab counter line-height (ND-1) | 18px | 18px | fixed |
| 5 | Issue row | 64px (8 / 24 / 4 / 18 / 10) + 1px separator | 64px | fixed |
| 6 | Mobile meta line | flows inline with " · " and the dot stays at line end (#122 at 390) | same | fixed (`crop-issues-390.png`) |
| 7 | IssueLabel border | transparent; white "wontfix" `rgb(209,217,224)` | label colour at alpha 0; white is outlined | fixed in light, **regressed in dark** (issue 2 below) |
| 8 | Reaction pill | 26px, 0 4px, pill, `rgb(209,217,224)` | 26px, 0 4px, 100px radius | fixed; the inner gap is 2px wider (nit) |
| 9 | StateLabel "Merged" | 95.2×32, 8px 12px, inset 1px `rgb(130,80,223)`, 14/600/16 | 95.7×32, identical | fixed |

## Issues, most important first

1. **Major: comment-header author names are muted, not `--fgColor-default`.**
   - `timeline.css` has `.comment-header .comment-text-line a:not(.author) { color: var(--fgColor-muted) }`, with specificity 0,3,1.
   - Gitea 1.27.3 renders the header author through `shared/user/authorlink.tmpl` as `<a class="tw-font-semibold">`, with no `.author` class. The muted rule matches it and beats `.comment-text-line a.tw-font-semibold` (0,2,1).
   - The review-conversation header (`.muted-links a.tw-font-semibold`) is muted the same way.
   - Measured on `/octo-org/theme-playground/pulls/16`:
     - Light: "alice-dev commented", "bob-dev left a comment" and "dave-qa left a comment" are `rgb(89,99,110)` / 600.
     - Dark: `rgb(145,152,161)`.
   - github.com `.timeline-comment-header .author` is `rgb(31,35,40)` / 600 (pull/348 probe).
   - Only migrated comments look right, because they use `tw-text-text`.
   - Evidence:
     - `shots/critic-data-display-r2/crop-pg16-review-light.png`
     - `shots/critic-data-display-r2/crop-pg16-top-light.png` ("bob-dev left a comment")
     - `crop-hdr-gh.png` (github.com)
   - Fix: exclude the author from the muted rule: `.comment-header .comment-text-line a:not(.author, .tw-font-semibold)`. Also treat `.comment-header-left .muted-links a.tw-font-semibold` as the author.
2. **Minor (regression, dark only): black issue labels are invisible on the dark page.**
   - The label border is now transparent in both schemes. `github_actions` and `rust` (`#000000`, white text) then sit on `rgb(13,17,23)` with no ring, and the pill shape disappears.
   - Round 1's 15% ring kept them visible.
   - Evidence: `shots/critic-data-display-r2/repo-pulls/dark-1440.png` (rows #355, #354, #353…) and `crop-labels-dark.png` (github_actions row).
   - github.com dark IssueLabels always show a coloured border.
   - The builder filed `docs/requests/dark.md` DD-D1, which is correct routing under the ownership rules. Until it lands, dark mode is worse than it was in round 1.
3. **Nit: the gap between title and labels is 8px, not 4px.**
   - Ours: the title ends at x=568.7 and the label starts at x=577. That gap is the `.labels-list` 4px margin plus a collapsed space.
   - github.com: the title ends at 702.7 and the label starts at 707 (4.3px). Probe on repo-issues row #147.
4. **Nit: the reaction pill's inner spacing is wider.**
   - Ours: the emoji box is 20px wide and the count sits 8px after it, so the pill is 43.6px.
   - github.com: the emoji is 16px and the count starts about 6px later, so the pill is 41.6px (pull/42).
5. **Nit: on mobile, a wrapped label sits about 4px right of the title's left edge.**
   - repo-issues/light-390: the "enhancement" chip on #147 is at x≈95 CSS px; the title is at 91.5.
   - github.com wraps it flush with the title (`crop-ref-issues-390.png`).
6. **Unverified:** the D-5 `unverified` mask. It is in the served CSS, but no seeded signed-but-unverified commit exists to render it.
7. **Page-scoped, recorded and not scored against this folder:**
   - The issue toolbar is not the Box-header (DD-1).
   - The milestone and org-members lists are unboxed (DD-2).
   - Label rows on the labels page sit in an inset segment.
   - The issue sidebar is a bordered `.ui.segment`.
   - `/explore/repos?q=zzzzzzz` has no blankslate markup.
   - Dark issue labels stay solid (inline `!important`).
8. **CLS, unattributed:**
   - home/390: 0.3745 in light, 0.3832 in dark.
   - repo-home/390: 0.35 in light, 0.32 in dark.
   - org-home dark/390: 0.31.
   - These values match round 1. I did not attribute them to this folder.

## What is good

- The issue/PR ListView at 1440 now matches github.com almost exactly: 64px rows, 16/600/24 titles, the 12/18 muted meta line with " · ", 20px IssueLabels, hover, and the focus ring.
- StateLabel, the timeline badges (32px, −15px offset, 2px ring), the event rows with the dark actor and bold targets, and the 5px milestone ProgressBar are all correct.
- DataTable (admin users), Box (SSH/GPG keys), release assets and the "Stable" Label look right in both schemes.
