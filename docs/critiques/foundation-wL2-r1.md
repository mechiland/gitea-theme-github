# Critique: foundation, wave L2, round 1 (FG2-061 link underlines, FG2-097 footer flow)

Reviewer: independent critic (GitHub design-systems). Date 2026-09-30. Score **7.5 / 10**: **not a pass** (needs 8.5 or more).

## Verification
- `node build/lint.mjs foundation`: 0 errors, 0 warnings (53 selectors). `npm run build`: build-report `folders.foundation.status = "ok"`.
  The build is OVER BUDGET: auto 319.4 KB, light 314.4 KB, dark 315.4 KB. Several folders contribute to that.
- The served theme-github-auto.css differs from my local dist hash (other folders were building at the same time), but the served bytes contain every foundation rule (links.css, the `.full.height` grow and padding rules). I did not redeploy.
- Shots: `shots/critic-foundation-r1` (routes file `shots/critic-foundation-r1-routes.json`), 15 routes, light and dark, 1440 and 390, with `--states` and `--measure`.
  60 pages. offPalette 0. Failed requests 0. The 8 console errors are all the expected 404 document load on not-found and not-found-anon.
  The one unresolved var (`--gh-octicon-calendar`, issue sidebar date input) belongs to controls. The one non-Octicon icon (fontawesome-openid on login) belongs to icons.
- Smoke: `node tools/shoot/smoke.mjs --theme github-auto` is **green** (all steps ok, 0 console errors).
- Probes: `shots/critic-foundation-r1/probe/{link-probe,gh-links,gh-hover,scan-p-a,grow-test,footer-gap-critic}.mjs`.

## What is right
- Timeline event "ago" link: underline solid, offset 3.2px, `--fgColor-muted`. This is the same as github.com `row-module__timelineAgoLink` (3.2px, rgb(89,99,110) light and rgb(145,152,161) dark).
  Comment-header dates stay plain, as on github.com.
- In-text links: settings/security "WebAuthn Authenticator" is underlined, offset 3.2px, accent colour. A scan of every route in routes.json at light-1440 shows `p > a` / `.help > a` hits only in real sentences (settings keys and security, repo-create help). Nav, titles, labels and the pulls list are not affected.
- Pulls list author stays plain, as in github.com PullsListItem `filterLink` (none).
- Float on the milestone `::after`: the " · " keeps its position and is not underlined (crops `probe/pg-issues-meta-{light,dark}.png`).
- Rails-style short pages (wiki `_pages`, settings, 404) now put the footer after the content, as on github.com. Login keeps the bottom footer band through pages/auth, which matches `docs/reference/login`.

## Issues (most important first)
1. **MAJOR: the issue-list meta underline is solid, but github.com uses a dotted underline and removes it on hover.**
   On github.com /pemistahl/grex/issues, `IssueItem-module__authorCreatedLink` and `MilestoneMetadata-module__milestoneLink` are `text-decoration: underline dotted`, offset 2px, colour `--fgColor-muted`.
   On hover they turn `--fgColor-accent` with `text-decoration-line: none`, and the milestone octicon turns accent too. This holds in light and dark.
   Ours (`#issue-list … > a[href]:not([class])`, `a.milestone`) is `underline solid` at rest, and hover keeps the underline.
   Evidence: `probe/gh-hover-sheet.png` (github rest and hover, light and dark), `probe/ours-hover-sheet.png`, `pg-issues/states/*-author-hover-clip.png`, `*-milestone-hover-clip.png`.
   Fix (links.css): `text-decoration-style: dotted` on those two rules, plus `:hover { text-decoration-line: none }` on the same selectors.
2. **MAJOR: FG2-097 applies to the issue-family pages, but on github.com those use a full-height React PageLayout.**
   github.com milestones @1440×900: the footer box starts at 908 (below the fold), and the sidebar divider runs to the viewport bottom. The issues list and labels pages behave the same way (docs/reference/milestones, labels).
   Ours: milestones footer at 433, and the sidebar's right border stops at 393 in mid-page (`milestones/light-1440.png`).
   I checked this with `probe/grow-test.mjs`: restoring grow alone does not extend the sidebar (navBottom 393 either way), so the full fix needs pages/issues-prs too.
   Proposal: foundation adds `> .page-content.issue-list, > .page-content.repository.milestones, > .page-content.repository.labels` (or `:has(.gh-issues-layout)`) to the grow exceptions, and pages/issues-prs lets its layout fill the height (flex column / min-height).
   At the least, foundation should not claim github.com parity on these pages.
3. **MINOR: the gap between the content and the footer text is about 15px too tight on every page measured.**
   Measured from the last content to the first footer text:
   - wiki list: ours 37 / 34 (1440 / 390), github.com 52 / 49
   - tags: ours 53 / 50, github.com 68 / 65
   - settings/security: ours 37
   - releases: ours ≈60, github.com 68

   The 16px `padding-bottom` was sized for github.com's footer, which has 48px of top padding and no border. navigation's footer has only 16px of padding plus a border-top, so the combination comes out short.
   foundation owns the 16px and navigation owns the footer padding. They need one agreed number: either foundation uses about 48px, or navigation uses 48px padding with no border on Rails pages.
4. **MINOR: the builder's milestones claim did not reproduce.** The builder said the footer box sits 16px below the content. I measured 40px at 1440 (393 to 433) and 64px at 390 (486 to 550) on /octo-org/grex/milestones. On wiki `_pages` and settings/security it is 16px, as claimed.
5. **NIT (template limitation, not CSS):** most Gitea timeline events (labels, milestone, assign, pin) print the time without a link (`$createdStr` in comments.tmpl), so they stay plain. github.com underlines every event's ago link. Only closed, reopened and ref events can match.
   Wrapping `$createdStr` in `<a href="#{{.HashTag}}">` would need a template change request.
6. **NIT (pages/issues-prs):** at 390, a wrapped meta line can start with an orphan " · " (`probe/pg390-row2-light.png`, row #2).
7. **NIT:** the pinned-issue card author ("#1 opened … by alice-dev") is plain. The builder already disclosed this.

## Score rationale
FG2-061 is exact for in-text and timeline links. On the issue list, the most visible surface, the underline style and hover behaviour differ from github.com.
FG2-097 is correct for Rails pages. It regresses parity on the React issue-family pages, and the net gap is about 15px short everywhere.
Lint 0, off-palette 0, smoke green, and no unexpected console errors.
