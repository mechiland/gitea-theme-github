# Critique: pages/repo, wave L1 (final gate #1 loop 1), round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score: 8.7 / 10. PASS.** The gates are green:
- 0 console errors;
- 0 literal colours;
- smoke green (12 of 12 steps).

This round closed two of the five structural gaps that capped r1 of wave 3b: the commit day-group Timeline and the wiki Pages Box. Both now match github.com to the pixel on the key geometry, in both schemes and at both widths. Three things keep the score from going higher:
- the template-bound gaps that were ruled final: the branches h1, tabs and table header; the release-list nav and breadcrumb; the commit-page "Commit <sha>" h1;
- a handful of FG-018 and FG-036 leftovers in this folder;
- a size budget that has no headroom at all.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` reports 0 errors, 0 warnings, 368 selectors. The only `!important` / `#` hits outside `repo.important.css` are in comments.
- **Build:** `dist/build-report.json` shows `folders["pages/repo"]` as status ok, 13 files, 80,478 B of source.
  - All three theme files are OVER BUDGET: auto 333.4 KB, light 328.1, dark 329.4. The whole theme is over, not this folder alone.
- **Folder size:** the minified `@layer gh.pages-repo{…}` block, measured two ways:
  - **31,742 B** in the build from 12:56, which is the one served now (SHA-256 aee99a91…, the same for dist and served);
  - **31,827 B** in my own build at 12:46, from the same pages/repo sources. The build renames variables across the whole theme, so this folder's byte count moves when other folders change.
  - The cap is 31,744 B if "31 KB" means KiB, or 31,000 B if it means 1000-byte KB (the brief's "30.6" for 30,577 B reads like KB = 1000).
- **Deploy:** I did not deploy. The served file matched dist both times I checked.
- **Audit:** 68 captures (17 routes × light/dark × 1440/390, `--states --measure`) in `shots/critic-pages/repo-r1/`, using my routes file `shots/critic-pages/repo-wL1-r1-routes.json`.
  - That routes file uses the corrected `tr:not(.gh-commit-day)` row-hover selector, drops the broken tooltip state and adds 7 wiki states.
  - Results: 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - Problems: only my own `pages-item-hover` state. The folderify wiki has only the selected page, so there was nothing to hover. That is not the theme's fault.
- **CLS:**
  - Every page is at or below 0.0036, except wiki-page-playground at 390.
  - wiki-page-playground at 390 measured 0.0961 once (light, an early shift at t=82 ms from `details.gh-wiki-pages`). Two reruns (`repo-r1-cls1`, `repo-r1-cls2`) gave a steady 0.0286 (light) / 0.0292 (dark).
  - The gitea-auto baseline (w2) is 0.031, and the final-gate run was 0.0225.
- **Smoke:** **green**. `node tools/shoot/smoke.mjs --theme github-auto` passed 12 of 12 steps, with no console errors (`shots/critic-pages/repo-wL1-r1-smoke.log`).

## Verification of the builder's claims

Measured live (light, 1440 unless noted) with `shots/critic-pages/repo-wL1-r1-probe.mjs` against github.com, logged out and read only.

- **FG-019 Timeline: verified.** The /commits geometry is equal to github.com:
  - day title x=121, h=29, 14/21/400, `--fgColor-muted`;
  - badge 32×32 at x=81 (the octicon sits at x=89 on both);
  - Box x=121, width 1239 (github.com 1237 plus its 1 px borders);
  - rows 64 px;
  - 8 px from the title to the Box, and 8 px from the Box to the next title;
  - radius 6 on the first and last row of each day.
  - Row hover: `--bgColor-muted` in light (246,248,250) and dark (21,27,35), equal to github.com in both.
  - At 390 the Boxes are full width and the badge and date are indented, as on github.com.
  - DD-PR-1 is fixed: the day row is styled on `/compare/main...feature/kbd-hints`.
  - The date shows as "Jan 14, 2026" in the render (the light-DOM fallback is ISO). As the builder said, there is no "Commits on" prefix.
- **FG-022 Pages Box: verified.**
  - Box: 296 wide, 6 radius, `--shadow-resting-small`, `--borderColor-default`.
  - Header: 37 tall vs github.com 38; padding 4/8; `--bgColor-muted`.
  - Caret: 28×28 at x=1041 on both.
  - "Pages": 14/600 at x=1069 on both.
  - Counter: 20×20, 12/500, `--fgColor-onEmphasis` on `--counter-bgColor-emphasis`, in light and dark.
  - Item: 14/600 accent at x=1069 (github.com 1071).
  - Collapse works and the caret rotates. The summary has a 2 px accent inset focus ring (`states/*pages-collapse.png`, `pages-item-focus.png`).
  - At 390 the layout is one column: content, then Pages, then clone. That matches github.com's order.
- **FG-018:**
  - Verified on /commits, compare and PR Commits: 12 px mono, 28 px invisible button, the visible text cut to 7 characters (`99cc347`).
  - Verified on the commit page: "parent fa3e8ed · commit 99cc347" in 12 px mono muted.
  - **Not done** on tags or releases: both still show 10 characters (issue 3).
- **FG-036:** compare titles are 14/20/600 with the author 600 `--fgColor-default`, as github.com's classic list. /commits and PR Commits are 16/24/500, as github.com.
  - Correction: the builder described PR Commits as using the classic list. I measured the PR Commits tab at 16/500, which is what github.com's PR Commits tab uses (16/24/500, measured). The outcome is right.
- **FG-037:** verified. The 390 release card has no leading "·" before "3 commits to main since this release" (`releases/light-390.png`).
- **FG-040:** verified at 1440: rows 54 px, link 400, date in a second column.
  - At 390 the date sits 4 px left of the link (issue 7).
- **FG-113:** verified. The range bar background is `--bgColor-muted`, but its size is still wrong (issue 5).
- **Commit page buttons:** verified. Browse Source and Operations are default Buttons, and hover, press, focus and the open menu all render (`commit-detail/states/*`).
- **Branches summary-bar regression:** verified fixed (`branches/light-1440.png`).

## Measurements

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| commits day title | x / h / font / colour | 121 / 29 / 14/21/400 / --fgColor-muted | 121 / 29 / 14/21/400 / same | yes |
| commits day badge | box / octicon x | 32×32 at 81 / 89 | 16px octicon at 89 | yes |
| commits day Box | x / width / row h | 121 / 1239 / 64 | 122 / 1237 (+1px borders) / 64 | yes |
| commits title | font | 16/24/500 | 16/24/500 | yes |
| commits SHA | box / font | 67.9×28, mono 12/500, 7 chars | 69.9×28, Mona Sans 12/500, 7 chars | nit (font) |
| commits row hover | bg light / dark | 246,248,250 / 21,27,35 | same | yes |
| compare row | height / title font | 64 / 14/20/600 | 58.5 / 14/17.5/600 | no (5.5 px) |
| compare SHA | style | invisible button | bordered BtnGroup (copy + SHA, 28px) + `<>` button | no |
| PR commits title | font | 16/24/500 | 16/24/500 | yes |
| compare range editor | height / padding / bg | 62 / 16 / --bgColor-muted | 46 / 4 16 / --bgColor-muted | partial |
| wiki Pages Box | w / radius / shadow | 296 / 6 / resting-small | 296 / 6 / resting-small | yes |
| wiki Pages header | h / pad / bg | 37 / 4 8 / --bgColor-muted | 38 / 4 8 / same | yes |
| wiki caret | box / x | 28×28 / 1041 | 28×28 / 1041 | yes |
| wiki counter | box / font / bg | 20×20 / 12/500 / --counter-bgColor-emphasis | same | yes |
| wiki page item | x / font / row h | 1069 / 14/600 accent / 45 | 1071 / 14/600 accent / 42.5 | nit |
| wiki clone input | h / font / bg | 28 / mono 12 muted / --bgColor-muted | 28 / mono 12 muted / --bgColor-default | no (bg) |
| wiki clone button | w / left border | 32 / 1px | 33 / 0 | nit |
| wiki caret hover | bg | none | --control-transparent-bgColor-hover | nit |
| wiki page list 390 | date x vs link x | 4 px left of the link | aligned | nit |
| commit page parent/commit | font | mono 12 muted, 7 chars | mono 12 muted, 7 chars | yes |

## Issues, most important first

1. **major (template-bound, ruled final): these still cap the score.**
   - Branches: no "Branches" h1, tabs or table header.
   - Releases: no Release-list nav, and no "Releases / v1.4.6" breadcrumb.
   - Commit page: no "Commit <sha>" h1, and the message is not in its own Box.
   - Compare: a standalone "74 Commits" header where github.com has "Commits 74 / Files changed 25" tabs.
   - Text: "445 Commits" / "Compare commits" and no "Commits on" prefix.
   - Evidence: `repo-r1/{branches,release-detail,commit-detail,compare-two-tags}/light-1440.png`.
2. **major (process): the folder budget has no headroom and the count moves.**
   - The layer measured 31,742 B in the build served now and 31,827 B in my 12:46 build of the same sources, which was 83 B over the 31 KiB cap.
   - If the cap is 31,000 B, the folder is 742 B over either way.
   - The orchestrator should decide which cap applies. Either way, FG-086 and FG-095 cannot land without a trim.
3. **minor (this folder, FG-018): tag and release SHAs are still 10 characters.**
   - Tags: `db9275ace1` in mono (`tags/dark-1440.png`).
   - Releases: `db9275ace1` in sans in the left meta column (`release-detail/light-1440.png`, `releases/light-390.png`).
   - The FG-018 fix text names tag rows explicitly.
4. **minor (this folder, FG-018 and FG-036 on compare): the compare commit list keeps /commits' invisible SHA button.**
   - github.com's classic compare list uses a bordered BtnGroup (copy + SHA) plus a bordered `<>` button (`docs/reference/compare-two-tags/light-1440.png`).
   - Compare rows are 64 px against github.com's 58.5.
5. **minor (this folder): the compare range editor is still 62 px tall with 16 px padding.**
   - github.com's `.range-editor` is 46 px tall with 4 px 16 px padding. Only the colour part of FG-113 was done.
6. **minor (this folder): the commit page title still draws inline code as a grey chip.**
   - `Command::cargo_bin` in `.commit-header` (`commit-detail/light-1440.png`).
   - github.com's message Box shows it as plain mono. FG-036 says "inline code in commit titles: plain mono without background".
7. **nit (this folder): wiki details.**
   - The clone input is `--bgColor-muted`; github.com's is `--bgColor-default`, in both schemes.
   - The copy button has a 1 px left border (github.com: joined, no left border).
   - The caret has no hover background.
   - The page-item focus ring includes the 28 px left padding.
   - The page list at 390 puts the date 4 px left of the link.
   - The page links are about 4 px right of github.com at 1440.
8. **nit (this folder, FG-086 and FG-095): the masks now exist but are not used.**
   - The browse icon is still the file-code octicon, and the tags Box header has no tag octicon.
   - `--gh-octicon-code` and `--gh-octicon-tag` are in `src/icons/octicon-masks.css` (PR-IC-1 DONE).
9. **nit (carried over from 3b r1):**
   - The branches default-branch row's Updated time is not in the column (x=638 against 685).
   - FG-098 (the mobile branches table) is not done.
   - The `.wiki-content-toc` "Table of Contents" box and the custom `_Sidebar` show bullets and underlines (the TOC is unstyled here; the sidebar belongs to the markdown folder).
10. **risk: CLS is intermittent.** wiki-page-playground at 390 measured 0.0961 once. It is steady at 0.029, which is equal to the gitea-auto baseline.

## What is good

- The /commits Timeline is practically indistinguishable from github.com, in light, dark, 1440 and 390 (`rc-d390`, `rc-d1440` pairs). The line, badge, date, Box, 64 px rows, 7-character SHA and hover all match.
- The wiki Pages Box matches github.com's Box--condensed to within 1–2 px on every measured property, and it collapses correctly with a visible focus ring.
- The compare and PR day groups work, including the one on the new-PR compare page (DD-PR-1).
