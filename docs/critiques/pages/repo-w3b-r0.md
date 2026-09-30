# Critique: pages/repo, wave 3b, round 0

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision 56d1bf8f9d. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the
same SHA-256 (ee1c594a…), so I did not deploy.

## Verdict

**Score: 8.1 / 10. FAIL.** A pass needs 8.5 or more. Every other gate is green: 0 console errors, 0 literal colours,
smoke green.

The trim holds up. The folder is 29.1 KB minified, lint is clean, and I saw no visual change from r4 on any page I
compared. But the trim also means none of the round-4 open items was fixed:

- **The round-4 regression is still there.** At 390 the Compare dropdown opens off-screen on the releases list, on
  release-detail and on the playground releases page.
- **New finding: the same control is also broken at desktop widths on the single-release page.** It sits at the card's
  right edge, but its menu still opens to the right. The menu overflows the viewport, and opening it scrolls the whole
  page sideways (by 90 px at 1440, 170 px at 1280 and 1024). r4 missed this.

So Compare, the one interactive control that is special to these pages, is now broken on phones everywhere and on
desktop on the detail page. That is why the score drops below r4.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings, 334 selectors.
- **Build report:** `folders["pages/repo"]` is status ok, 13 files, 72,187 B of source. The `@layer gh.pages-repo`
  block in the minified auto theme is **29,755 B (29.06 KB)**, so the 29.1 KB claim is correct. The gh-important part
  from `repo.important.css` comes on top of that.
- **Theme totals:** auto 276.2 KB, and no theme is over budget.
- **Literal colours:** none. The only `#` hits are in comments (`branches.css:69`, `:83`).
- **`!important`:** only in `repo.important.css`.
- **Audit:** 72 captures (18 routes × light/dark × 1440/390), with `--states --measure`, in `shots/critic-pages/repo-r0/`.
  - 0 console errors and 0 failed requests.
  - 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - Max CLS is 0.0225 (wiki-page-playground at 390; 0.0172 at 1440), unchanged.
  - 6 "problem" pages. All are the known state-selector timeouts on hidden elements: repo-home 390 branches-link
    hover/focus, repo-commits 390 sha-hover, and directory-tree 1440 goto-file-focus.
- **Smoke:** **green**. 13/13 steps are ok, including `no-console-errors` (`shots/critic-pages/repo-w3b-r0-smoke.log`).

## Measurements (light unless noted; ours = octo-org/grex, github.com = pemistahl/grex, logged out, probed live today)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| Compare menu, releases list 390 | menu x / right edge | **-193 / 127** (60 % off-screen) | 33 / 353 (left-aligned to the button) | no |
| Compare menu, release-detail 1440 | menu right edge / doc scrollWidth / scrollX after open | **1448 / 1538 / 90** | stays in the viewport | no |
| Compare menu, release-detail 1280 and 1024 | doc width / scrollX | 1458 / 170, 1202 / 170 | no overflow | no |
| Compare menu, releases list 1440 and 768 | menu x | 230, 114 (in the viewport) | – | yes |
| Compare button 390 | box / pad / font | 94×28, 0 8, 12/500 | 90×28, 0 8, 12/500 | yes (4 px nit) |
| release title (list) 390 | font | 32/600/48 | 26/600/39 | no |
| release card 390 | x / w | 16 / 358 | 16 / 358 | yes |
| state Label 390 | box / font / position | 55×24, 12/500, inline after the title | 54×24, 12/500, right edge of the title row | nit |
| byline author 390 | weight | 400 | 600 | nit |
| repo home branch picker 1440 | box / font / pad | 106×32, 14/500, 0 12 | 106×32, 14/500, 0 12 | yes |
| repo home "N Branches" / "N Tags" 1440 | box / font / pad | 116×32 and 85×32, 14/500, pad 0 4, muted | 113×32 and 85×32, 14/500, pad 0 4, muted | yes |
| repo home "Code" button 1440 | box / font | 109×32, 14/500/20 | 109×32, 14/500/21 | yes |
| repo home toolbar row | y | 198 | 206 | yes (global header height) |
| commits h1 1440 | font / h | 24/400/36, 45 | 24/400/36, 44 | yes |
| branches page heading 1440 | font | none (the heading slot is the 14/600 "Default Branch" section title) | 24/400/36 "Branches" h1 | no (template) |
| branches search 1440 | h / pad-left | 32 / 36 | 30 inner field (32 wrapper) / – | yes |
| tags Box header 1440 | h / pad / font / bg | 55, 16, 14/600, #f6f8fa token | 55, 16, 14/600, same | yes |
| commit detail title 390 | width / font | 194 px column next to the buttons, 20/600; the inline code (17px mono) breaks "cargo_bi\|n" | full-width "Commit 99cc347" h1; the message sits in a Box below | no |
| directory-tree 390 | document width | 421 | 390 | no (code folder, C-5) |

## Issues, most important first

1. **major (this folder, still open from r4): at 390 the Compare dropdown opens 193 px off the left edge.**
   - Where: releases list, release-detail and the theme-playground releases page, light and dark.
   - Evidence: `shots/critic-pages/repo-r0/releases/states/light-390-compare-open.png`, where the "Find tag" field and
     every tag name are cut off. The probe (`shots/critic-pages/repo-menu4.mjs`) reports menu x=-193, w=320,
     `left: -225.6px; right: 0`. For the playground, x=-193 and right=127.
   - github.com at 390 opens the overlay at x=33, left-aligned to the button: `shots/critic-pages/repo-w3b-gh-compare-390.png`.
   - Cause: Gitea `web_src/css/repo/release-tag.css:52-55` sets `right: 0; left: auto` on
     `#release-list .branch-selector-dropdown .menu` at < 768 px. Compare now sits at the card's left edge.
   - Fix: inside the existing `@media (max-width: 767.98px)` block in `tags-releases.css`, add:

     ```css
     #release-list .branch-selector-dropdown .menu { left: 0; right: auto; }
     ```

2. **major (this folder, new finding, desktop): on the single-release page the Compare menu overflows the right edge
   and scrolls the page sideways.**
   - Evidence: `shots/critic-pages/repo-r0/release-detail/states/dark-1440-compare-open.png`. The whole page has shifted
     left: the navbar reads "ues", the breadcrumb reads "o-org", and the menu is cut at the right edge.
   - Probe results after opening the menu:
     - 1440: menu x=1128 to 1448, `document.scrollWidth` 1538, `scrollX` 90.
     - 1280: scrollWidth 1458, scrollX 170.
     - 1024: scrollWidth 1202, scrollX 170.
   - Cause: the ≥768 `@scope` block puts Compare at the card's top right (`justify-self: end`), but Gitea's menu is
     left-anchored (`left: 0`), so a 320 px menu starting at the button runs about 225 px past it. github.com
     right-aligns this overlay.
   - Fix: inside the `@scope (…) { @media (min-width: 768px) { … } }` block, add:

     ```css
     #release-list .release-branch-tag-selector .menu { left: auto; right: 0; }
     ```

3. **major (structural, template-bound, final per the integrator): still caps the score.**
   - Commits: no "Commits on …" day groups.
   - Branches: no "Branches" h1, no Overview/Active/Stale/All tabs and no table header row. Instead, the summary bar
     "445 Commits · 14 Branches · 16 Tags" sits where the h1 should be (`repo-w3b-r0-crops/branches-light-1440.png`).
   - Releases: no Release-list nav.
   - Wiki: no Pages box and no clone box.

   I judge these as final, as instructed, but a GitHub reviewer still sees them at a glance.
4. **minor (this folder, open from r4): the release title on the list is 32/600/48 at 390; github.com is 26/600/39.**
   - Live probe: github.com's title link is 26/600/39, 116×30 (`repo-w3b-r0-crops/sheet390-b-dark.png`, columns 1 and 2).
   - The single-release h1 stays 32/600 on github.com. Only the list title should change.
   - The comment in `tags-releases.css:299` ("github.com keeps the release title at 32px / 600 on phones") is wrong
     for the list.
5. **minor (this folder: commits.css owns `.commit-header-buttons`): the commit-detail header at 390.**
   - "Browse Source" and "Operations" stay beside the title. That squeezes the h3 into a 194 px column, and the 17px
     inline `code` breaks mid-identifier ("Command::cargo_bi / n (#349)").
   - Evidence: `repo-w3b-r0-crops/sheet390-c-light.png`, fifth column.
   - Suggested fix: at < 768, make the header flex container wrap so the buttons go on their own row, or give
     `.commit-header h3` `flex-basis: 100%`.
   - github.com puts a full-width "Commit 99cc347" heading on top and the message in a Box below.
6. **minor (this folder): the branch rows are not a table, so the columns don't align.**
   - At 1440 the "Updated … by <avatar>" block, the ahead/behind bars (x 634 to 645) and the PR number all start at a
     different x on each row, because they follow the variable-width name + SHA + message
     (`branches-light-1440.png`).
   - Long names truncate the message to "Bu…" (r4 #5, unchanged).
   - At 390 the SHA line ends in a dangling "·" before the message wraps ("22955d1bb4 ·").
   - A grid with fixed Updated / behind-ahead / PR columns would get much closer to github.com's table without a
     template change.
7. **minor (this folder): the repo-home sidebar starts with Gitea's "Search code…" field, not "About".**
   - github.com puts the About heading on the toolbar row. Here the search field sits at y=198 and "Description" at
     about y=245. The heading also reads "Description" instead of "About" (that one is template text).
8. **nit (this folder, open from r4):**
   - The byline author is 14/400 (github.com 14/600).
   - The state Label is inline after the title instead of at the right of the title row (390).
   - The tags meta row says "ZIP" / "TAR.GZ" in upper case (github.com: "zip" / "tar.gz"; CSS `text-transform` could
     match it).
   - The commits heading says "445 Commits" (github.com: "Commits").
   - The visual order and the DOM order differ in the 390 release card (a11y).
9. **cross-folder, recorded only:** directory-tree at 390 is still 421 px wide (code folder, C-5).

## What is good

- The repo-home toolbar is an exact match: the branch picker is 106×32 on both, the Branches/Tags invisible buttons are
  116/85×32 against 113/85×32 with the same 14/500 muted text and 4 px padding, and Code is 109×32. The two-column
  layout, 904/272 split and README widths also match (markdown-h2/p widths 840 vs 838).
- The commits page header (24/400/36 h1 with a muted rule) matches, and so does its toolbar.
- The releases list at 1440 reads very close to github.com: 32/600 title, Label, byline, Box-footer assets.
- The tags Box header (55 px, 16 px padding, 14/600, muted bg) is exact.
- Dark mode is clean on every page I looked at. Examples: `repo-home-dark-1440.png`, `tags-dark-1440.png`,
  `sheet390-b-dark.png`.
- The trim to 29.1 KB is real, and I saw no visual change from r4.

## Why 8.1

r4 was 8.3 with one broken dropdown (390). Re-scored from scratch, the same control is broken at 390 on three routes
and, as I found this round, on desktop on the detail page too. Opening it there scrolls the whole page sideways. The
32 px list title at 390 and the squeezed commit header at 390 are visible phone-width misses. The structural gaps are
unchanged.

Issues 1 and 2 are two declarations, and issue 4 is one rule. With those fixed I would expect about 8.4. Issue 6 (a
branches grid) or issue 5 would likely be enough to pass.

## Evidence

- **Ours:** `shots/critic-pages/repo-r0/`. The routes file is `shots/critic-pages/repo-routes-w3b-r0.json`: r4 plus
  compare-open on the playground releases page and a tags 390 row hover.
- **Reference:** `docs/reference/<route>/`, plus live github.com probes (logged out, no form submissions) through
  `shots/critic-pages/repo-pos.mjs` and `shots/critic-pages/repo-ghmenu-w3b.mjs`. The latter opens the Compare overlay
  only and writes `shots/critic-pages/repo-w3b-gh-compare-390.png`.
- **Crops:** `shots/critic-pages/repo-w3b-r0-crops/`:
  - `*-light-1440.png` and `*-dark-1440.png` (ours | github.com) for 12 routes;
  - `sheet390-a-light.png`, `sheet390-b-dark.png`, `sheet390-c-light.png`;
  - `states-1440-{0,1,2}.png`;
  - `reldetail-1440-compare-open-probe.png`.
- **Measure diff:** `shots/critic-pages/repo-w3b-mdiff.mjs`.
- **Smoke:** `shots/critic-pages/repo-w3b-r0-smoke.log` (13/13 ok).
