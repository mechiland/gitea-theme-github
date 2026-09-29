# Critique: pages/repo, wave 3, round 4

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision ed460f8046. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the
same SHA-256 (e6871a2b…), so I did not deploy.

## Verdict

**Score: 8.3 / 10. FAIL.** A pass needs 8.5 or more. Every gate except the score is green.

This round has real progress: 390 release cards, Compare padding, the byline "·", the commits heading and 49px branch rows. It also has one new functional regression: the Compare dropdown opens off-screen on phones. That cancels the gain.

- **Lint:** `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings, 376 selectors. Build report `folders["pages/repo"]`: status ok, 12 files, 83,634 B.
- **Literal colours:** none in src/pages/repo. The two `#` hits are in comments (branches.css:130, :146).
- **`!important`:** only in `repo.important.css`. Everywhere else the word appears only inside comments.
- **Build budget:** `npm run build` still prints OVER BUDGET for all three theme files (auto 435.3 KB, up from 433.1). This is global, but this folder grew by about 6 KB this round.
- **Audit:** 72 captures (18 routes × light/dark × 1440/390, `--states --measure`, `shots/critic-pages/repo-r4/`).
  - 0 console errors, 0 failed requests.
  - 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - Max CLS is 0.0225 (wiki-page-playground at 390; 0.0172 at 1440), the same as in every round. Every other page is at most 0.0001.
  - The 6 "problem" pages are the same known state-selector timeouts on hidden elements: repo-home 390 branches link, repo-commits 390 sha, directory-tree 1440 goto-file.
  - My new `compare-hover` and `compare-open` states ran at 1440 and 390 on releases and release-detail.
- **Smoke:** **green**. 13/13 steps are ok, including `no-console-errors` (`shots/critic-pages/repo-r4-smoke.log`).

## The builder's claims, verified

| # | claim | verified | evidence |
|---|---|---|---|
| 2 | 390 release cards x=16, w=358; header and tags Box stay 31/328 | **yes**. Cards are at 16/358 (github.com: 16/358). The header is at 31/328 | repo-pos; `repo-r4-crops/releases-390.png` |
| 3 | titles 32/600 on the list and the detail page at 390 | **yes, as implemented**. But my r3 claim that the list uses 32px at 390 was wrong: github.com's list title is **26/600/39** at 390. Only the detail h1 is 32/600 at 390, and the list is 32 at 1440. See issue 2 | repo-pos, both targets |
| 5 | Compare pad 0 8, 94×28, 12/500 | **yes**. It is 94×28, pad 0 8, 12/500. github.com's is 90×28, pad 0 8, 12/500 | repo-pos 390 |
| 6 | 390 order in the card: title+Label → Compare (8 below) → byline (16) → tag/commit → notes | **yes**, visually. On the list: title y372, Compare y427, byline y471, tag/commit y550, notes y587. github.com: Compare card+75 → byline +44 → notes, and ours is card+72 → +44. **But the Compare menu is now broken at 390** (issue 1) | `releases-390.png`, `reldetail-390.png` |
| 8 | "|" hidden, "·" leads the wrapped part | **yes**. The third byline line starts "· 3 commits …", as on github.com's detail page | `reldetail-390.png` |
| 1a | commits h1 24/400/36, 8px padding, muted rule, 16 below; picker + graph on one row, ref links right; duplicated commits link hidden | **yes**. h1 at 80,198, 1280×45, 24/400/36, pad-bottom 8, 1px rgba(209,217,224,.7). github.com's h1 is 24/400/36, pad-bottom 8, h44. The picker is 106×32 on both targets. Branches/Tags sit on the right at 1440 and on their own row at 390 | `commits-1440.png`, `commits-390-dark.png` |
| 1b | branches rows are one line at ≥768, 48/49px | **yes**. Rows measure 48, 48, 49 (github.com 49). But with a long branch name the commit message shrinks to "Bu…" or "alig…" (issue 5) | `branches-1440.png` |

## Measurements (light, 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| release card (list) 390 | x / w | 16 / 358 | 16 / 358 | yes |
| release title (list) 390 | font | 32/600/48 | 26/600/39 | no |
| release h1 (detail) 390 | font | 32/600/48 | 32/600/48 | yes |
| release title (list) 1440 | font | 32/600/48 | 32/600/48 | yes |
| Compare | box / pad / font | 94×28, 0 8, 12/500 | 90×28, 0 8, 12/500 | nit |
| Compare 390 | y offset in card | 72 | 75 | yes |
| Compare → byline 390 | gap | 44 | 44 | yes |
| **Compare menu 390** | **x / w** | **-193 / 320 (60% off-screen)** | on-screen | **no** |
| Compare menu 1440 | x / w | 230 / 320 (left-aligned to button) | – | yes |
| byline author 390 | weight | 14/400 | 14/600 | nit |
| release commit link 390 | font | mono 12, 10-char SHA | sans 14, 7-char SHA | nit (SHA length: template) |
| state Label | box | 55×24, 12/500, pad 0 8, r full | 54×24, 12/500, pad 0 8 | yes |
| state Label 390 | position | inline after title | right edge of title row (x295) | nit |
| commits h1 | font / pad / h | 24/400/36, pb 8, 45 | 24/400/36, pb 8, 44 | yes |
| commits branch picker | box | 106×32, 14/500, pad 0 12 | 106×32, 14/500, pad 0 12 | yes |
| commit row | h / pad | 64 / 8 16 | 64 / – | yes |
| commit day groups | – | none | "Commits on …" 14/400 muted, 29px | no (template) |
| branch row | h | 48–49 | 49 | yes |
| branches h1 / tabs / th | – | none | 24/400 h1, Overview/Active/Stale/All, th 12/600 38px | no (template) |
| branch name pill | font / pad | mono 12, pad 2 6, accent-muted | mono 12, accent-muted | yes |
| list search field | h / inset | 32 / 36 | 32 / 33 | yes |
| directory-tree 390 | doc width | 421 | 390 | no (code folder) |

## Issues, most important first

1. **major (new regression, this folder): at 390 the Compare dropdown opens 193px off the left edge of the screen.**
   - Where: releases list and release-detail, light and dark.
   - Evidence: `repo-r4/releases/states/light-390-compare-open.png` and `repo-r4/release-detail/states/dark-390-compare-open.png`. Probe `repo-menu4.mjs`: menu rect x=-193, w=320, y=459; `left: -225.6px; right: 0`.
   - Effect: only the right 127px of the menu is visible. The "Find tag" field is cut off and every tag name is invisible, so on phones you cannot use Compare.
   - Cause: Gitea's `web_src/css/repo/release-tag.css:52-55` has, under `@media (max-width: 767.98px)`, `#release-list .branch-selector-dropdown .menu { right: 0; left: auto }` ("open menu to left"). That was correct while Compare sat at the right end of the meta row. Round 4 moved Compare to the left edge of the card (x=33) and did not reset this rule.
   - Fix: inside the existing `@media (max-width: 767.98px)` block in `tags-releases.css`, add:

     ```css
     #release-list .branch-selector-dropdown .menu { left: 0; right: auto; }
     ```

     At 1440 the menu already opens at x=230 (left-aligned) and is fine.
2. **minor (this folder; it comes from my wrong r3 advice): the release title on the list is 32px at 390, where github.com uses 26/600/39.**
   - Only the single-release h1 stays 32/600 at 390; the list's title link is `f1`-responsive.
   - Effect: long titles wrap to two lines where github.com's fit on one. Example: "v1.0.0 — Public preview" in `repo-r4-crops/playground-390.png`.
   - Fix: in the <768 block, set `#release-list .release-list-title` to 26px / 600 / 1.5 on the list only (not inside the single-release `@scope`). Primer has no type token for 26px (`--text-title-size-large` is 32 and `--text-title-size-medium` is 20), so the builder needs a composed value or a token request.
   - I apologise for the r3 guidance. I measured the detail h1 and wrongly assumed the list was the same.
3. **major (structural, template-bound; this still caps the score).**
   - Commits has no "Commits on …" day groups and no timeline.
   - Branches has no h1, no Overview/Active/Stale/All tabs and no column headers. The Updated/author column is not aligned between rows because the name block floats.
   - Releases has no Release-list nav; Gitea's tag/SHA/Compare column fills that slot at 1440.
   - Wiki has no Pages box and no clone box.
   - The builder's template hooks are filed in `docs/requests/integrator.md`. I agree that commits day groups give the best return, and the branches table header comes next.
4. **minor (cross-folder): directory-tree at 390 still scrolls horizontally by 31px** (document 421 wide). It belongs to the code folder (C-5).
5. **nit (this folder): the branches rows at 1440 squeeze the commit message.** With long branch names it shrinks to 2-3 characters ("e043b76996 · Bu…", "f5741fa862 · docs: alig…"), so the "message stays visible" claim holds only for short names.
   github.com does not show the SHA or message in this table at all. Hiding `.commit-summary` (or the whole SHA+message span) at ≥768 would read closer to github.com than a truncated stub.
6. **nit: the release byline at 390.**
   - The author is 14/400; github.com's is 14/600.
   - The commit link is mono 12px; github.com uses sans 14px.
   - The byline breaks after "released this", as the builder noted.
   - The state Label sits inline after the title; github.com pushes it to the right edge of the title row at 390.
7. **nit (a11y): at 390 the visual order and the DOM order differ.** Compare and the tag/commit links come before the card's title in the DOM (`.meta` is `display: contents`, placed on subgrid rows 2 and 4). Keyboard focus therefore visits Compare before the title link that sits visually above it. The effect is small, but a GitHub reviewer would flag it.
8. **nit (unchanged and known):**
   - The commits heading says "445 Commits" and is 24px at 390 (github.com: "Commits", 22px).
   - Compare is 94 wide, not 90.
   - The search-icon tooltip is template-bound.
   - The topic tag is 24/500, not 26/600 (data-display).
   - The repo-home sidebar heading is "Description", not "About".
   - The wiki-page-playground CLS is 0.0225.

## What is good

- The 390 release cards now match github.com in geometry (16/358) and in rhythm: Compare +72 against +75 from the card top, and byline +44 against +44 after Compare. Removing the rule under the byline also matches.
- The subgrid + `display: contents` technique is clean. It handles drafts with no Compare and no commit (row 2 simply collapses) without CLS.
- The commits page now has a proper PageHeader: 24/400/36, 8px padding, muted rule, and the branch picker at exactly github.com's 106×32. The page reads much more like GitHub.
- The branch rows went from 75px to 48/49px (github.com 49) at 1440.
- Dark mode is clean on every page I viewed (`commits-branches-dark.png`, `reldetail-1440-dark.png`, `wiki-1440-dark.png`, the playground dark crop).
- Compare hover and New Release focus are correct in both schemes (`compare-states.png`).

## Why 8.3 and not 8.5

The in-folder fixes would have moved this to about 8.4-8.5. But issue 1 breaks a working control on phones, a regression from r3, and issue 2 is a small visual regression at 390. The structural gaps (issue 3) still keep commits and branches from reading as github.com.
Fixing issue 1 is one declaration, and fixing issue 2 is one rule. With both done, and the commits day-group template hook landed, I expect a pass.

## Evidence

- **Ours:** `shots/critic-pages/repo-r4/`. Routes are in `shots/critic-pages/repo-routes-r4.json`, made by the generator `repo-mkroutes-r4.mjs`. It adds `compare-hover` and `compare-open` at 1440 and 390 on releases and release-detail, on top of the r3 states.
- **Reference:** `docs/reference/{releases,release-detail,repo-commits,branches,repo-home,wiki-page}`. I also ran live github.com probes (logged out) through `repo-pos.mjs` on these pages:
  - pemistahl/grex commits/main at 1440;
  - branches at 1440;
  - releases at 390 and 1440;
  - releases/tag/v1.4.6 at 390 and 1440.
- **Crops:** `shots/critic-pages/repo-r4-crops/`: `releases-390.png`, `releases-1440.png`, `reldetail-390.png`, `reldetail-1440-dark.png`, `commits-1440.png`, `commits-390-dark.png`, `branches-1440.png`, `branches-390.png`, `commits-branches-dark.png`, `home-1440.png`, `wiki-1440-dark.png`, `playground-390.png`, `compare-states.png`. They were made with `repo-sbs4.py`.
- **Probe:** `shots/critic-pages/repo-menu4.mjs` measures the Compare menu position after a click.
- **Smoke:** `shots/critic-pages/repo-r4-smoke.log`.
