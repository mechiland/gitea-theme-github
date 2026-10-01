# Critique: foundation, wave L2b, round 2 (footer flow on issue and PR pages, content-to-footer gap)

Reviewer: independent critic (GitHub design-systems). Date 2026-09-30.
Score: **8.5 / 10**. Foundation's own scope matches github.com, with nits. Two visible defects remain in the shipped state, and both wait on other folders' change requests.

## Verification

**Lint and build**
- `node build/lint.mjs foundation` reports 0 errors and 0 warnings across 57 selectors.
- `npm run build` gives `folders.foundation.status = "ok"`, with 11 files and 22,026 bytes.
- The bundle is still OVER BUDGET: auto 326.5 KB, light 321.5 KB, dark 322.5 KB. This comes from all folders.

**Deploy state**
- The served `/assets/css/theme-github-auto.css` has the same SHA1 as `dist/` (348ba92a…). I did not redeploy.

**Screenshots**
- Output is in `shots/critic-foundation-wL2b-r2`, from the routes file `shots/critic-foundation-wL2b-r2-routes.json`.
- It covers 19 routes in light and dark, at 1440 and 390, with `--states` and `--measure`.
- In this routes file, `repo-issues` no longer has the author-hover state (critic #6), `pg-issue-1` has `event-ago-hover`, and `issues-empty-search` is paired with github.com.
- Results:
  - 76 pages, 0 pages with problems
  - offPalette 0
  - failed requests 0
  - 0 pages with an unlayered Gitea CSS
  - maxCLS 0.002
- Console errors: 4. All are the not-found route's own 404 document load (`expectStatus: 404`), which is independent of the theme. No other page logs an error.
- Unresolved variable: `--gh-octicon-calendar`, belonging to controls. It matches 0 elements.
- Non-Octicon icon: `fontawesome-openid` on login, belonging to icons.

**Reference**
- `node tools/shoot/shoot.mjs --target github --only issues-empty-search,pr-commits-tab,milestones,wiki-page-list --measure` captured the github.com reference (new: `docs/reference/issues-empty-search/*`).

**Smoke test**
- **Green**: 13 of 13 steps pass, with 0 console errors (`shots/critic-foundation-wL2b-r2-smoke.log`).

**Probes** (in `shots/critic-foundation-wL2b-r2-probe/`)
- `flow.mjs`: our pages, 22 of them at 1440 and 390.
- `gap.mjs`: our footer padding and sidebar extents.
- `gh-foot.mjs` and `gh-last.mjs`: github.com, live and logged out.
- `last.mjs`, `lab.mjs`, `rel.mjs`: our elements near the footer.

## Fixed and verified

### Footer below the fold on the issue and PR family

| page | viewport | ours (footer box top) | github.com | note |
|---|---|---|---|---|
| milestones | 1440×900 | 900 | 908 | header 64 vs 72 (8px) |
| milestones | 390×844 | 844 | 844 | exact |
| labels | 1440×900 | 1078 | 1082 | |
| empty issue search | 1440×900 | 976 | 1018 | below the fold on both |
| empty issue search | 390×844 | 920 | 951 | below the fold on both |
| PR commits (#42) | 1440×900 | 1000 (was 407) | 1042 | below the fold on both |
| PR commits (#42) | 390×844 | 944 (was 490) | 975 | below the fold on both |
| PR conversation (#358) | 1440 | 1344 (content) | 1042 | our seeded content is longer |

- `shots/critic-foundation-wL2b-r2/pr-commits-tab/light-1440.png` compared with `docs/reference/pr-commits-tab/light-1440.png`: the same flow, with the commit list at the top and an empty viewport below it. The footer is out of view on both.
- `milestones/light-390.png` compared with the reference at 390: the footer rule is at 844 on both.
- These pages still follow their content:
  - wiki `_pages`: 318
  - projects: 501
  - single milestone: 461
  - new issue: 500
  - not-found: 488
  - settings/security
  - releases
  - dashboard milestones
- Actions and explore still grow. Login still pins its footer to the bottom (`login/light-1440.png`). No page overflows sideways at 1440 or 390.

### The content-to-footer gap on Rails pages

- On wiki `_pages` at 1440 the content ends at 290 and the footer text is at 338, a 48px gap. github.com's main ends at 321 with the text at 369, also 48px.
- At 390 the probe's "first text" picks up "Powered by Gitea", which is second in visual order. In the screenshots, the card bottom to the first footer line is about 47px for ours and about 50px for github.com (`wiki-page-list/light-390.png` compared with the reference).

### The releases element below the footer (builder's open item)

- This is a false positive. It is `ul.attachment-list` inside the collapsed "Downloads" `<details>` of the last release (5802 to 6011). It is not rendered.
- `releases-light-bottom.png` shows the pagination, then the footer, with nothing overlapping.

## Issues (most important first)

### 1. MAJOR (cross-folder, visible in the shipped state): the NavList divider ends mid-page on the issue family

- Measurements at 1440 (`gap.mjs`):
  - milestones: nav bottom **393**, footer 900 (`milestones/light-1440.png`)
  - empty issue search: nav bottom **442**, footer 976 (`issues-empty-search/dark-1440.png`)
  - issues list: nav bottom **826**, footer 976
- On github.com the `ASIDE` ends at 900, the viewport bottom, on both milestones (footer 908) and the empty search (footer 1018). See `docs/reference/issues-empty-search/dark-1440.png`.
- The fix is pages/issues-prs' change request, which the builder re-tested by injection. It is not applied yet.
- Note for pages/issues-prs: the github.com aside is viewport-high (sticky) rather than footer-high. The request's result (nav bottom 948 against footer 976 on the empty search) is 48px longer than github.com's rule. That is acceptable, but it is not identical.

### 2. MINOR (foundation, new with the 28px padding): bottom spacing stacks on the React issue-family pages

- `.full.height { padding-bottom: 28px }` is global.
- pages/issues-prs already gives the issue-family container github.com's PageLayout padding (`.page-content > .ui.container` `padding-bottom: 24px` on labels, from `lab.mjs`). The two stack:

| page | viewport | ours: content box bottom → footer | github.com | ours: content → footer text | github.com |
|---|---|---|---|---|---|
| labels | 1440 | 1026 → 1078 = **52** | 1058 → 1082 = 24 | 72 | 41 |
| issues list | 390 | 1105 → 1149 = **44** | 1389 → 1405 = 16 | | |

- Fix: the React family already gets its footer placement from the min-heights, so drop the Rails padding there. Proposed:

```css
.full.height:has(> .page-content:is(.issue-list, .view.issue), > .page-content.repository:is(.milestones:not(.projects, .dashboard), .labels)) { padding-bottom: 0; }
```

- If needed, raise the container min-height so the below-the-fold footers do not move up. This change also makes pages/issues-prs' requested sidebar rule reach the footer, instead of stopping 28px short (builder's own known gap).
- The issue view (#35) is fine as it is: the last button is at 2394, the footer at 2431, a 37px gap, against github.com's roughly 32 to 38.

### 3. NIT (cross-folder, data-display): the timeline "ago" link still turns accent on hover

- `pg-issue-1/states/light-1440-event-ago-hover-clip.png` shows "yesterday" in accent blue with an underline. github.com keeps it `--fgColor-muted`.
- The request in `docs/requests/data-display.md` is correct: `shots/foundation-l2b-r2/ago-injected-dark.png` shows it staying muted. It is not applied yet.

### 4. NIT (navigation): the footer top rule differs by page family

- github.com has **no** footer border on `/issues/35`, `/pull/358`, `/pull/42/commits` and wiki `_pages` (`gh-last.mjs`: `0px none`).
- It has a 1px rule on the React list pages (labels, issues list, milestones).
- Ours draws a 1px rule on every page. That is right for lists and wrong for the issue view, PR pages and Rails pages. This belongs to the navigation folder.

### 5. NIT: footers below the fold sit about 42px higher than github.com's

- The measurements are 976 against 1018 and 1000 against 1042, which is 8px of header height plus the shorter repo header.
- On PR files, ours is at 1000 while github.com is at 927, because the files tab there follows its content (main 855).
- None of this is visible without scrolling.

### 6. Unverified

The user dashboard `/issues` and `/pulls` (flex-grow 0, footer at 1568 and 1586 at 1440 with long content) can only be compared with github.com logged in.

## Score rationale

- Both brief items are now right on foundation's side:
  - the issue-list meta links (verified last round, unchanged);
  - FG2-097: the Rails pages follow their content with a 48px text gap, the React issue and PR family keeps the footer at or below the fold, and PR commits has moved from 407 to 1000 against github.com's 1042.
- Side by side, milestones and PR commits read the same as github.com.
- Deductions:
  - the new stacked 28px + 24px bottom spacing on labels and the phone issues list (#2, foundation's own);
  - the truncated sidebar rule and the accent "ago" hover in the shipped build (#1 and #3, which wait on other folders).
- Lint 0, offPalette 0, smoke green, and no theme-attributable console errors (4 raw entries, all the expected 404 of the not-found route).
- The result is **8.5**, a pass on foundation's own scope. The combined result is not at 8.5 until pages/issues-prs and data-display apply their requests.
