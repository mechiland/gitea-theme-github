# Critique: pages/repo, wave 3b, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision c3fb51f4c5. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the
same SHA-256 (398ab14a…), so I did not deploy.

## Verdict

**Score: 8.5 / 10. PASS** (at the threshold). Every gate is green: 0 console errors, 0 literal colours, smoke green.

Every open item from r0 that this folder could fix is fixed, and I checked each one myself. The Compare menu is now
correct at every width I probed, from 360 to 1440. That was the r0 blocker. The 390 list title, the commit header at
390, the branches columns and the repo-home sidebar order all match what I asked for.

What is left falls into two groups:
- **Template-bound structural gaps:** commits day groups, the branches h1/tabs/table header, the release-list nav, and
  the wiki Pages and clone boxes. The integrator has ruled these final.
- **A handful of nits,** listed below.

The folder has no room left: the layer is 30,577 B, about 140 B under the 30 KiB budget.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings, 343 selectors.
- **Build report:** `folders["pages/repo"]` is status ok, 13 files, 75,627 B of source.
  - The minified `@layer gh.pages-repo{…}` block in the auto theme is **30,577 B**, which confirms the builder's number.
  - Auto theme total is 278.3 KB.
- **Literal colours:** none. The only `#` hits are in comments (`branches.css:79`, `:93`).
- **`!important`:** only in `repo.important.css`, and none of it sets display or visibility.
- **Audit:** 72 captures (18 routes × light/dark × 1440/390, `--states --measure`) in `shots/critic-pages/repo-w3b-r1/`.
  - 0 console errors, 0 failed requests.
  - 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - Max CLS is 0.0225 (wiki-page-playground 390; 0.0172 at 1440), unchanged. Every other page is at most 0.0018.
  - 6 "problem" pages. All are the known state-selector timeouts on hidden elements:
    - repo-home 390: branches-link hover and focus;
    - repo-commits 390: sha-hover;
    - directory-tree 1440: goto-file-focus.
  - Horizontal overflow only on directory-tree 390 (421 px). That belongs to the code folder (C-5).
- **Smoke:** **green**. 13/13 steps ok, including `no-console-errors`. Log: `shots/critic-pages/repo-w3b-r1-smoke.log`.

## Verification of the builder's claims

- **#1 and #2, Compare menu.** Verified. My own probe (`shots/critic-pages/repo-w3b-r1-menu.mjs`) clicks every Compare
  button on the releases list, release-detail and the playground releases page. It covered widths 360, 390, 600, 767,
  768, 900, 1024, 1280 and 1440.
  - Below 768 the menu opens at x=33–353, left-aligned to the button.
  - On the lists at 768 and above it is left-aligned (1440: 230–550).
  - On the single release at 768 and above it is right-aligned to the button (1440: 992–1312, where the button's right
    edge is 1312).
  - `scrollWidth` equals the viewport and `scrollX` is 0 in all 27 cases.
  - Screenshots: `releases/states/light-390-compare-open.png` and `release-detail/states/dark-1440-compare-open.png`.
    The menu uses `--overlay-bgColor` (#010409 in dark), which is correct.
- **#4, list title at 390.** Verified: 26/600/39 (284×39). The single-release h1 at 1440 stays 32/600/48.
- **#5, commit header at 390.** Verified: the title is full width and Browse Source / Operations sit on one row below it.
  The Operations menu opens inside the viewport (`commit-detail/states/light-390-operations-open.png`).
- **#6, branches.** Mostly verified. Rows are 48/49 px (github.com 49). The Updated column starts at avatar x=653 and
  time x=685 on every non-default row at 1440. Long names show in full. There are no "Bu…" stubs and no dangling "·" at
  390. Row hover tints the whole row at 390 (`branches/states/dark-390-row-hover-clip.png`).
  - The default-branch row does **not** line up. Its time starts at x=638, which is 15 px left of the avatar column and
    47 px left of the time column. So the builder's "same x on every row, including the default-branch row" holds only
    for the avatar, and only on rows that have one. See issue 3.
- **#7, sidebar.** Verified. "Description" heads the sidebar on the toolbar row, and the code search sits under the
  About metadata (`rh-side.png`).
- **#8.** Verified:
  - The byline author is 600.
  - The Label is at the right end of the title row at 390 (x 262–317, and the title row ends at 317).
  - Tags show "zip" and "tar.gz" in lower case.
  - The release SHA is sans.
- **Compare page.** Verified. The container is 1216 px at x=112 (github.com: 112, 1216 wide) and the h2 is 24/400/36.
  But the range editor does not match (issue 2).

## Measurements (light, 1440 unless noted; github.com probed live, logged out)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| Compare menu, lists, 390 | menu x / right edge / scrollX | 33 / 353 / 0 | 33 / 353 | yes |
| Compare menu, release-detail | right edge vs button right edge / scrollX | 1312 = 1312 / 0 | right-aligned, no scroll | yes |
| release list title, 390 | font / box | 26/600/39, 284×39 | 26/600/39 | yes |
| Compare button, 390 | box / pad / font | 94×28, 0 8, 12/500 | 90×28, 0 8, 12/500 | yes (4 px nit) |
| state Label, 390 | box / font | 55×24, 12/500 | 54×24, 12/500 | yes |
| branches row | height | 48 (default) / 49 | 49 | yes |
| branch name pill | box / pad / radius / font | 42×24, 2 6, 6, mono 12 | 42×24, 2 6, 6, mono 12 | yes |
| branches Updated time | x on the default row vs other rows | 638 vs 685 | one column (749) | no |
| branches Updated time | colour | --fgColor-muted | --fgColor-default | nit |
| branches Updated avatar | size | 16×16 image (link box 16×20) | 16×16 | yes |
| branches PR StateLabel | box / font / radius | 70×24, 12/500, full | small StateLabel 24 px | yes |
| tags Box header | h / pad / font / bg | 55, 16, 14/600, --bgColor-muted | 55, 16, 14/600, same | yes |
| repo-home Code button | box / pad / font | 108.9×32, 0 12, 14/500/20 | 108.9×32, 0 12, 14/500/21 | yes |
| compare page container | x / width | 112 / 1216 | 112 / 1216 | yes |
| compare heading | font | 24/400/36 + muted rule | 24/400/36 | yes |
| compare range editor | height / padding / background | 62, 16, --bgColor-default | 46, 4 16, --bgColor-muted | no |

## Issues, most important first

1. **major (structural, template-bound, ruled final by the integrator): these still cap the score.**
   - Commits: no "Commits on …" day groups and timeline.
   - Branches: no "Branches" h1, no Overview/Active/Stale/All tabs, no table header row. The summary bar "445 Commits ·
     14 Branches · 16 Tags" sits in the h1 slot.
   - Releases: no Release-list nav at 1440. The tag and SHA sit in a left meta column instead.
   - Release detail: Gitea's Releases/Tags/RSS/New Release header shows where github.com has a "Releases / v1.4.6"
     breadcrumb.
   - Wiki: no Pages box and no clone box.
   - Commit page: no "Commit <sha>" h1, and the message is not in its own Box.
   - Evidence: `shots/critic-pages/repo-w3b-r1-crops/{branches,commits-dark,releases,reldetail,wiki-page-dark}-*-1440.png`.
2. **minor (this folder now owns the non-PR /compare frame): the range editor box doesn't match.**
   - Ours: `.ui.segment.choose.branch` is 62 px tall, 16 px padding, white background.
   - github.com's `.range-editor`: 46 px tall, 4 px 16 px padding, `--bgColor-muted`.
   - Ours also wraps the "compare:" button onto a second row at 390 (`compare-dark-390.png`).
   - This is a small declaration, but the folder has about 140 B left, so it needs a trim elsewhere first.
3. **minor (this folder, branches.css): the default-branch row's Updated time is not in the column.**
   - At 1440 the time starts at x=638. Other rows put the avatar at 653 and the time at 685.
   - At 390 the time is indented 8 px from the card edge (`branches-light-390.png`). This looks like the 8 px flex
     `gap` applied to the zero-size anonymous text items that `font-size: 0` leaves behind.
   - Cause: `main` has no pusher, so there is no avatar.
   - Suggested fix: give `p.info.tw-flex > relative-time` a start margin equal to avatar + gap when it is the first
     visible item, or `justify-content` it against a fixed avatar slot.
   - Also, github.com draws the Updated time in `--fgColor-default`; ours is muted.
4. **nit (this folder): the release byline at 390 starts its second line with a dangling "·".**
   - It reads "· 3 commits to main since this release" (`releases-light-390.png`, left column). github.com has no
     separator at the start of a line.
5. **nit (this folder): the single-release edit pencil floats 12 px left of Compare, disconnected from the title row**
   (`reldetail-light-1440.png`). github.com has only Compare at the top right.
6. **nit, carried over:**
   - The Compare button is 94 px wide against github.com's 90.
   - The visual order and the DOM order differ in the 390 release card (a11y).
   - The heading reads "445 Commits" (github.com: "Commits") and the sidebar heading reads "Description" (github.com:
     "About"). Both are template strings.
   - The hidden "· · Updated" text nodes (font-size 0) are still in the accessibility tree, so a screen reader reads
     "dot dot Updated" before the avatar and time.
7. **risk: the budget is exhausted.** The layer is 30,577 B, about 140 B under 30 KiB. Any further fix (issues 2 and 3)
   needs a trim first.
8. **cross-folder, recorded only:** directory-tree is 421 px wide at 390 (code folder, C-5).

## What is good

- Compare works correctly at every width, on all three routes, in both schemes. The two r0 majors are gone.
- The phone layout of releases now matches github.com closely:
  - 26/600 title with the Label at the right;
  - Compare under the title;
  - the menu left-aligned to the button;
  - 358 px card at x=16.
- Branches read like a table at 1440:
  - one-line 48/49 px rows;
  - pills that match github.com exactly (42×24, 2/6 padding, 6 px radius, mono 12);
  - one Updated column;
  - compact Behind|Ahead and PR columns;
  - full-row hover.
- The repo-home toolbar and sidebar order now match github.com: "Description" heads the sidebar on the toolbar row and
  the code search moved under the metadata. CLS is still ~0.
- The commit header at 390 no longer squeezes the title.
- Dark mode is clean everywhere I looked, for example `commits-dark-1440.png`, `wiki-page-dark-1440.png`,
  `repo-home-dark-390.png`, `compare-dark-390.png` and the dark-390 branches row hover.

## Why 8.5

r0 was 8.1 and said that fixing #1, #2 and #4 would give about 8.4, and that #5 or #6 on top would likely pass. All of
them are fixed, and so are #7 and most of #8. I verified each one by probe and screenshot, not from the builder's
report.

What remains is template-bound structure, which a GitHub reviewer still notices, plus the nits above: the compare range
editor, the default-branch Updated alignment and the byline "·". So this matches with nits, not better. It is not 9,
because the structural gaps are visible on four of the seven page types.

## Evidence

- **Ours:** `shots/critic-pages/repo-w3b-r1/` (72 captures, states, measure).
  - Routes file: `shots/critic-pages/repo-routes-w3b-r1.json` (r0 routes plus commit-detail 390 states and branches
    measures).
  - I used `repo-w3b-r1` as the folder name so this round's files don't mix with the old wave-3 `repo-r1` folder.
- **Reference:** `docs/reference/<route>/`, plus live github.com probes (logged out, no form submissions) made with
  `shots/critic-pages/repo-pos.mjs`.
- **Compare menu probe:** `shots/critic-pages/repo-w3b-r1-menu.mjs` (27 route × width cases).
- **Crops:** `shots/critic-pages/repo-w3b-r1-crops/`.
- **Smoke:** `shots/critic-pages/repo-w3b-r1-smoke.log` (13/13 ok).
