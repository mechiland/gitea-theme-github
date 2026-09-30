# Critique: data-display, wave L2 (final gate #2), round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.5 / 10. Pass, with minor issues.**

- Gates:
  - 0 console errors, 0 failed requests.
  - 0 literal colours (lint 0/0), 0 off-palette colours.
  - Smoke green: 13/13 steps, 0 console errors.
- FG2-075, FG2-081 and FG2-091 are fixed as specified. I checked each on screen and measured it.
- FG2-052 is fixed on the conversation pages, with two remaining 390px defects around the timestamp (issues 1 and 2 below).

## What I verified

- **Lint:** `node build/lint.mjs data-display` gives 0 errors and 0 warnings (298 selectors).
- **Build:** `npm run build` gives `folders["data-display"] = {status:"ok", lintErrors:0, lintWarnings:0, files:17, bytes:51203}`.
  - The build prints OVER BUDGET for the theme files: auto 319.4 KB, light 314.4 KB, dark 315.4 KB. That is the whole theme with several wave-L2 builders, not only this folder.
- **Served CSS vs dist:** the SHA differs (served `b962…`, dist `e7a0…`). The newest `src/data-display` file (16:35) is older than the deployed file.
  - Every data-display marker is present the same number of times in both files: `:has(>.emoji)` 1, `tw-max-w-48` 1, `comment-code-cloud` 14, `migrate` 1.
  - So the served data-display CSS is current, and I did not deploy.
- **Our screenshots:** `shots/critic-data-display-wL2-r1/`, from routes file `shots/critic-data-display-wL2-r1-routes.json`.
  - 13 routes: repo-issue, repo-pull, issue-detail-playground-reactions-alerts-tables, issue-playground-1, pr-conversation-open, pr-conversation-playground-large-diff-reviews, pr-files-changed-unified-playground-large-diff, admin-emails, explore-repos, org-teams, repo-issues, repo-pulls, labels.
  - Light and dark, 1440 and 390, with `--states --measure`: 52 pages.
  - Results: 0 problems, 0 failed states, 0 console errors, 0 failed requests, 0 off-palette colours, 0 non-Octicon icons, max CLS 0.0024.
- **One unresolved var:** `--gh-octicon-calendar`, from the date input. It is defined nowhere and matches 1 live element on issue-playground-1. It comes from `src/controls/inputs.css:381`, so it belongs to the controls folder, not this one.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` exits 0 with 13/13 ok and 0 console errors (`shots/critic-data-display-wL2-r1-smoke.log`).
- **github.com reference (logged out):**
  - `--target github --measure` for repo-issue, repo-issues, repo-pulls, pr-conversation-open and explore-repos, written to `docs/reference/…`.
  - Plus a header probe on pemistahl/grex/issues/35 at 390 and 1440: `crops/gh-i35-hdr-light-390.png`.
- **Own header probe:** `shots/critic-ddL2-hdr.mjs`. Crops are in `shots/critic-data-display-wL2-r1/crops/`.

## Gate items, checked

| Item | Ours (measured) | github.com / spec | Verdict |
|---|---|---|---|
| FG2-052 migrated headers 390 | issues/35 (10 headers), pulls/42, pulls/358: 52px each. Left 268px, right cluster 52px at +4px. `.migrate` 12px / 19.5px `rgb(89,99,110)` light, `rgb(145,152,161)` dark, on line 2. Author margin-right 0 | gh comment header 37px, padding 4px 4px 4px 8px, time `white-space:nowrap`, reads "pemistahl on Apr 1, 2021" | **Fixed.** The note no longer wraps mid-text (`crops/i35-light-390-*.png`, `crops/ri-l390-a.png`, `crops/ri-d390-a.png`) |
| FG2-052 native headers 390 | playground #1, #2, PR 16: 38px, one line | 37px | Fixed. But the time is cut at 9 or more characters of author name (issue 1) |
| FG2-052 inline review (Files) | `.comment-code-cloud` header 44px, left 161px wide | no split timestamp | **Regression of the gate's own defect:** "bob-dev commented 16 / hours ago" (issue 2) |
| FG2-075 | admin/emails 390: segment `background-image:none`, scrollWidth 547 / clientWidth 356, email td `max-width:none`, 176px, full text | Primer DataTable scrolls plain | **Fixed** (`crops/ae-l390.png`, `crops/ae-d390.png`, `crops/ae-d1440.png`). Sort icon is still `octicon-triangle-up`, disclosed and filed as DD-IC-1 |
| FG2-081 | folderify on explore at 390: `.item-body` display block, emoji at x 0 / y +2, text continues on the same line, 63px (3 lines) | inline emoji | **Fixed** (`crops/explore-emoji-{light,dark}-390.png`) |
| FG2-091 labels | /issues "enhancement" 96.5×20, 12px/500. /pulls "dependencies" 100.9×20, 12px/600. Padding 0 8px, radius full, 1px border | gh /issues 96.5×20 500; /pulls 100.9×20 600 | **Identical geometry and weight.** Dark label colours differ because they are inline `!important` (exempt) |
| FG2-091 AvatarStack | org-teams 1440: −8px overlap, 2px `--bgColor-default` ring, count column aligned | gate spec (no gh reference, needs login) | Fixed per spec. Nits in issue 3 (`crops/ot-stack-ld.png`) |

## Issues, most important first

1. **Minor: at 390 the timestamp is cut with an ellipsis for ordinary author names.**
   - Where: `.comment-header-left` (timeline.css ~236–247).
   - The left part is 268px wide.
   - Cut examples:
     - "carol-ops commented 16 hours a…" on playground issues #1 and #2 (dark 390)
     - "GhostCoder6969 commented 3 da…" on pulls/358
     - "saintphaenixos commented 5 years …" and "danie-dejager …" (×2) on issues/35
   - In total, 5 of 23 probed headers lose part of the time.
   - Evidence: `crops/hdrs-dark-390-sheet.png`, `crops/i35-light-390-2.png`.
   - github.com at 390 never cuts the time (`white-space:nowrap`). It drops the verb instead: "pemistahl on Apr 1, 2021".
   - Suggested fix, locale-agnostic because it hides whatever text node surrounds the link:
     - Inside the <768 query: `.comment-header-left .comment-text-line { font-size: 0 }`
     - `.comment-header-left .comment-text-line > a { font-size: var(--text-body-size-medium) }`
   - Alternative: let the author part shrink with the ellipsis and keep the `a > relative-time` as `flex: none`.
   - The gate spec asked for an ellipsis, but a time cut to "a…" is a poor outcome that github.com does not have.
2. **Minor: an inline review comment on the Files page still splits the timestamp.**
   - Where: pulls/16/files?style=unified at 390, light and dark: "bob-dev commented 16 / hours ago". The `relative-time` box is 157×38, spanning 2 lines.
   - This is the exact defect FG2-052 describes ("4 months / ago"). The builder says "the time is never cut". It is not cut, but it is broken in the middle.
   - Evidence: `crops/pf16-light-390-2.png`, `crops/pf16cc-dark-2.png`. carol-ops wraps correctly: `crops/pf16cc-light-1.png`.
   - Suggested fix: `.comment-code-cloud .comment-header-left relative-time { white-space: nowrap }`, or on its wrapping `a`.
3. **Nit: the AvatarStack on org teams.**
   - In light mode, white-background identicons lose their edge. The team rule replaces the 1px `--avatar-borderColor` outline with a 2px `--bgColor-default` ring, so adjacent identicons merge into one pattern (`crops/ot-stack-ld.png`, core and triage rows).
   - The z-order is reversed: later avatars sit on top. Primer React AvatarStack gives nth-child(1) z-index 5, (2) 4, and so on (disclosed).
   - Suggested fix: `box-shadow: 0 0 0 var(--borderWidth-thin) var(--avatar-borderColor), 0 0 0 calc(var(--borderWidth-thin) + var(--borderWidth-thick)) var(--bgColor-default)`, plus descending z-index on `.avatar-with-link:nth-child(n)`.
4. **Nit: the sort indicator is still a filled triangle** (`svg octicon-triangle-up`) on admin tables. Primer DataTable uses arrow-up/down. It is filed as DD-IC-1 and blocked on masks from the icons folder.
5. **Nit: the 1440 comment header differs slightly from github.com.**
   - Ours: 38px, padding 4px 16px, line-height 21px.
   - github.com's current React header: 37px, padding 4px 4px 4px 8px, line-height 19.25px.
   - It is within tolerance, and it matches the older Primer timeline-comment spec the folder cites.
6. **Nit: raw px spacing is still there.**
   - `timeline.css:243 padding-top: 2px` should be `var(--base-size-2)`. This was flagged last round and is not fixed.
   - Also `labels.css:249, 285, 318`.
7. **Project-level, not this folder's defect:** the auto theme is 319.4 KB against the 300 KB cap, after concurrent L2 deploys. The builder did not offset its ~+0.8 KB net.

## Out of scope, noted

- At 390, github.com shows a 32px avatar inside every comment header. Ours shows Gitea's MigrationIcon (octicon-mark-github) for migrated authors. That is the template/icons call.
- "left a comment" review headers on PR 16 have no timestamp. That is Gitea template text.
