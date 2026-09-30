# Critique: foundation, wave L2b, round 1 (regression fixes for the issue-list meta links and FG2-097 footer flow)

Reviewer: independent critic (GitHub design-systems). Date 2026-09-30.
Score: **8.0 / 10**. This is **not a pass** (a pass needs 8.5 or more).

## Verification

**Lint and build**
- `node build/lint.mjs foundation` reports 0 errors and 0 warnings across 55 selectors.
- `npm run build` gives `folders.foundation.status = "ok"`, with 11 files and 21,264 bytes.
- The bundle is still OVER BUDGET: auto 326.4 KB, light 321.4 KB, dark 322.5 KB. This comes from all folders, not only foundation.

**Deploy state**
- The served `/assets/css/theme-github-auto.css` has the same SHA1 as `dist/theme-github-auto.css` (d7bc885e…). I did not redeploy.

**Screenshots**
- Output is in `shots/critic-foundation-wL2b-r1`, from the routes file `shots/critic-foundation-wL2b-r1-routes.json`.
- It covers 19 routes in light and dark, at 1440 and 390, with `--states` and `--measure`.
- Results:
  - 76 pages
  - offPalette 0
  - failed requests 0
  - 0 pages with an unlayered Gitea CSS
  - maxCLS 0.0127
- Console errors: 4. All are the expected 404 document load on not-found.
- Unresolved variable: `--gh-octicon-calendar`, from the date input. It belongs to controls and matches 0 elements.
- Non-Octicon icon: `fontawesome-openid` on login. It belongs to icons.
- Problems: 2. These are the `repo-issues` author-hover state in light and dark at 1440. The grex authors are plain text, so there is no link to hover. This is a route definition issue, not CSS.

**Smoke test**
- `node tools/shoot/smoke.mjs --theme github-auto` is **green**: 13 of 13 steps pass, with 0 console errors (`shots/critic-foundation-wL2b-r1-smoke.log`).

**Probes** (in `shots/critic-foundation-wL2b-r1-probe/`)
- `links.mjs`: our link states.
- `gh-live.mjs`: github.com link states, captured live and logged out.
- `flow.mjs`: `.full.height` grow and the footer across 22 pages at 1440 and 390.
- `gh-foot.mjs`: github.com footer and application-main geometry.
- `gap.mjs`: the gap between the content and the footer, and the sidebar extent.

## Fixed and verified

### (a) Issue-list meta links

These now match github.com exactly in every state I measured, in light and dark (sheets: `ours-links-sheet.png` compared with `shots/critic-foundation-r1/probe/gh-hover-sheet.png`).

| link | state | ours | github.com |
|---|---|---|---|
| author / milestone | rest | `underline dotted`, offset 2px, rgb(89,99,110) light / rgb(145,152,161) dark | `IssueItem-module__authorCreatedLink` and `MilestoneMetadata-module__milestoneLink`: the same |
| author / milestone | hover | `text-decoration-line: none`, rgb(9,105,218) light / rgb(68,147,248) dark; the milestone octicon also turns accent | the same |
| author / milestone | focus-visible | 2px solid outline, offset −2px, rgb(9,105,218) light / rgb(31,111,235) dark, dotted underline kept | the same |
| PR list author | rest | plain | `PullsListItem filterLink`: plain |
| PR list author | hover | solid underline, accent | the same |

The milestone " · " separator carries no underline.

### (b) The issue family grows again

The measurements below are from `flow.mjs`. The pages that now grow are:
- milestones
- labels
- the issues list and the empty issue search
- the pulls list and the empty PR search
- the issue view

The footer lands at y=843 on 1440×900 and at y=761 on 390×844 whenever the content is short. This page set is deliberate and I agree with it.

These pages still follow their content:
- wiki `_pages` (footer at 306)
- settings/security (944)
- projects (489)
- dashboard milestones (967)
- single milestone (449)
- new issue (488)
- not-found (476)
- releases

Actions and explore keep growing.

The selector is valid. The served rule is:

```
.full.height:where(:not(:has(...)), :has(>.page-content>.ui.container>.pull.tabs)) { flex-grow: 0 }
```

It contains no nested `:has()`. There is no horizontal overflow on any probed page.

## Issues (most important first)

### 1. MAJOR: PR pages are excluded from growth, but on github.com they are full-height too

- The builder's comment in `layout.css` ("A PR conversation (.pull.tabs) is a Rails page there and follows its content") is wrong, and so is the claim that the PR commits page "follows the content, as before".
- On github.com, logged out, at 1440×900 (`gh-foot.mjs`):
  - `/pull/42/commits`: `.application-main` is 970px tall while the commit list ends at about 465. The footer box is at **1042** and the footer text at 1090, below the fold.
  - `/pull/358`: the same height, 970, with the footer at 1042.
  - At 390, `/pull/42/commits` has main at 911 (844 + header) with the footer at 975.
  - Both follow the same pattern as the React issue family: a content column of at least 100vh, and the footer below the fold.
- In `docs/reference/pr-commits-tab/light-1440.png`, the content ends at 465 and the footer text is at about 1100.
- Ours: `/octo-org/grex/pulls/42/commits` has flex-grow 0 and the footer at **407** at 1440 (490 at 390). The footer sits mid-screen with about 490px of empty page below it (`shots/critic-foundation-wL2b-r1/pr-commits-tab/light-1440.png`).
- PR files (838) and the PR conversation (1332) are long enough that the difference does not show on the seeded data.
- The brief asked for "issue/PR pages" to match github.com.
- **Fix:** drop the `:has(> .page-content > .ui.container > .pull.tabs)` branch, so that `.page-content.view.issue` grows for PRs as well. The `:not(.files, .commits)` guard should also go, because github.com's commits tab is full-height.

### 2. MAJOR (cross-folder, visible now): the sidebar border stops mid-page on the grown pages

- Now that the footer is pinned to the viewport bottom, the NavList's right border ends in mid-air:
  - milestones: nav bottom **393**, footer 843, at 1440 (`milestones/light-1440.png`)
  - empty issue search: nav bottom 442, footer 843 (`issues-empty-search/dark-1440.png`)
  - labels: nav bottom 1026, footer 1066 (`labels/dark-1440.png`)
- On github.com the sidebar divider runs into the footer (`docs/reference/milestones/light-1440.png`).
- Before this round the footer sat about 40px under the border, so the gap barely showed. Now there are 450px of floating whitespace to the right of a truncated rule.
- The builder has a correct change request in `docs/requests/pages-issues-prs.md`, which was tested by injection and brings the nav bottom to 827. Until pages/issues-prs lands it, the shipped state looks broken on the most visible issue-family pages.
- I count this against the combined result, not against foundation's CSS alone.

### 3. MINOR: the footer is pinned inside the viewport where github.com puts it below the fold

On github.com the footer is below the fold on short React pages. Ours always pins it inside the viewport:

| page | github.com footer box (1440×900) | ours |
|---|---|---|
| milestones | 908 | 843 |
| empty issue search | 1018 | 843 |

github.com's main is at least 100vh plus the header. Ours is 100vh minus the footer. At 390 on milestones, github.com has the footer at 844 and ours is at 761. The builder disclosed this. It is only noticeable because a user of the real site never sees a footer on a short issue list.

### 4. MINOR (carried over from critic #3 of wL2-r1, not addressed): the content-to-footer spacing is about 12px short on Rails pages

- On wiki `_pages`, the gap from the last content to the footer text is **36px** for us (content 290, footer text 326) at 1440, against github.com's **48px** (application-main ends at 321, footer text at 369).
- At 390 the numbers are ours 62 (311 to 373) against github.com 48 (331 to 379). Our phone footer wraps the Gitea line first, so the text measure differs there.
- The cause is foundation's `.full.height` 16px padding combined with the navigation footer's 16px padding-top plus a 1px border. github.com uses 48px of padding with no border on Rails pages.
- This still needs one agreed number between foundation and navigation.

### 5. NIT (new): the timeline "ago" link turns accent on hover

- github.com's `row-module__timelineAgoLink` keeps `--fgColor-muted` on hover, with the underline unchanged: rgb(89,99,110) light and rgb(145,152,161) dark (`gh-light-event-ago-hover.png`).
- Ours turns accent: rgb(9,105,218) and rgb(68,147,248) (`ours-light-event-hover.png`, `event-sheet.png`).
- **Fix** (`links.css`): add `.timeline-item.event .comment-text-line > a[href^="#"]:hover { color: var(--fgColor-muted) }`.

### 6. NIT (tooling)

- The route `repo-issues` in the builder's routes file, and any copy of it, defines an `author-hover` state. It can never pass on grex, whose migrated authors are plain text.
- Either point it at theme-playground or remove it, so that the problem count stays meaningful.

### 7. Unverified

The user dashboard `/issues` and `/pulls` (flex-grow 0, footer after the content) are React full-height on github.com. They can only be checked logged in, so I did not verify them against github.com.

## Score rationale

- (a) is now exact. I verified rest, hover and focus-visible in light and dark against live github.com, and the PR list author and in-text links are unaffected.
- (b) is right for the issue list, labels, milestones and issue view at both widths. It is wrong for the PR pages the brief explicitly named: the footer sits mid-screen on PR commits, against github.com's below-the-fold footer.
- The grown pages also show a truncated sidebar rule until pages/issues-prs applies its request.
- Lint 0, offPalette 0, smoke green, and only the expected 404 console errors.
- The result is **8.0**. It does not pass, because of issue 1 (foundation's own selector) and the gap in issue 4 that is still open.
