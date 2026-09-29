# Critique: pages/repo, wave 3, round 2

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision afc09691e5. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css`
have the same SHA-256 (7a90fe5e…), so I did not deploy.

## Verdict

**Score: 8.0 / 10. FAIL** (a pass needs 8.5 or more; every other gate is green).

- Lint `node build/lint.mjs pages/repo`: 0 errors, 0 warnings, 314 selectors. Build report `folders["pages/repo"]`:
  status ok, 11 files, 66,806 B (was 53,269 B in r1). No literal colours in src/pages/repo (the only hex is inside a
  comment, branches.css:130). No `!important` outside `repo.important.css`, which has 23 declarations and no display/visibility.
- Note (not this folder's fault alone): `npm run build` prints OVER BUDGET for all three theme files (auto 424.5 KB).
- Audit of 72 captures (18 routes × light/dark × 1440/390, `--states --measure`, `shots/critic-pages/repo-r2/`):
  0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  Max CLS is 0.0225 (wiki-page-playground 390; 0.0172 at 1440), the same as round 1.
- Smoke: **green**, 12/12 steps, `no-console-errors` ok (`shots/critic-pages/repo-r2-smoke.log`). I ran it after the capture this time, so it did not interfere.
- The 6 "problem" pages are all state-selector timeouts: branches links at 390 are hidden (as on github.com), the commit SHA is hidden at 390, and my own directory-tree selector matched a hidden input first. I re-shot that one with `.repo-file-search-container input` and it is fine (`shots/critic-pages/repo-r2-dir/…/light-1440-goto-file-focus-clip.png`: 32px field with a 2px accent ring).

## The builder's claims, verified

| claim | verified | evidence |
|---|---|---|
| release-detail CLS 0 | **yes**: 0.0000 on 6/6 loads at 1440 and 4/4 at 390; playground /releases 0 on 3/3 | `repo-cls.mjs` |
| release card 913 at x=365, left column 162 | yes: card 365/913, meta 163/162 (github.com 365/912) | repo-pos |
| asset rows 45px | yes: 1180×45, pad 8 16 | repo-pos |
| asset names wrap at 390 | yes: full names over 2 lines, size + date right-aligned below | `repo-r2-crops/reldetail-390.png` |
| containers | yes: commits/branches x=80 w=1280; tags/releases header 163/1115; detail 112/1216 | repo-pos |
| tag rows pad 16, 92px | yes: 1115×92, pad 16, title 16/600/24 | repo-pos |
| branch row hover | yes: light rgb(246,248,250), dark rgb(21,27,35) = `--bgColor-muted` | state clips (pixel sampled) |
| branch copy 32×32 muted | yes: 32×32, rgb(89,99,110) | repo-pos, `copy-hover`/`copy-focus` clips |
| headings above full Boxes, 32px search | yes: "Default Branch"/"Branches" 14/600; search 32h | repo-pos |
| commits author 12/400, lh 18, SHA sans 12/500 #25292e | yes | repo-pos |
| Go to file on directory view | yes: 220×32, pad 0 32, search icon + T hint | repo-pos, focus clip |
| commit-detail default buttons | yes in colour (bgColor-muted, border default); **size is 28px/12px, not github.com's 32px/14px** | repo-pos |
| ref-link label 14/500 | yes: 14/500 muted, count 14/600 default | repo-pos |
| draft release with no assets hides Downloads | yes | `repo-r2-crops/playground-rel.png` |
| /repo/create intro left, 14 muted | yes: 14/400 rgb(89,99,110), x=352 | repo-pos |
| wiki meta wraps at 390 | yes | `repo-r2-crops/m-misc.png` |

All of the round 1 majors are really fixed.

## Measurements (light, 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| release card (list) | x / width | 365 / 913 | 365 / 912 | yes |
| releases header → first card | segment bottom → card top | 33 (230→263) | 73 (238→311) | no |
| release cards | vertical gap | 24 | 32 | nit |
| asset row | height / pad | 45 / 8 16 | 45 (1440) / 8 16 | yes |
| asset name 390 | wrap | 2 lines, 14/600 | 2 lines, 14/600 | yes |
| release-detail CLS | total, 10 loads | 0 | – | yes |
| tags header | x / width | 163 / 1115 | 163 / 1114 | yes |
| tag row | height / pad | 92 / 16 | 90–91 / 16 | yes |
| tags search | height / font | 28 / 12px, in Box, joined icon button | – (none on github.com) | nit (inconsistent with branches/commits) |
| branches container | x / width | 80 / 1280 | 80 / 1280 | yes |
| branch copy button | box / colour | 32×32 / fgColor-muted | 32×32 / fgColor-muted | yes |
| branch row hover | bg | #f6f8fa / #151b23 | bgColor-muted | yes |
| branch search | height / icon | 32 / trailing joined button | 32 / leading icon inside | nit |
| branch row | height | 75 | 49 | no (template) |
| commits meta | author font | 12/400/18 muted | 12/400/18 | yes |
| commit SHA | font / colour | sans 12/500, #25292e, 10 chars | sans 12/500, #25292e, 7 chars | nit |
| commit title | font | 16/500/24 | 16/500/24 | yes |
| commit-detail Browse | box / font / pad | 104×28, 12/500, 0 8 | 130×32, 14/500, 0 12 | no |
| Go to file (dir view) | box | 220×32, search icon | 32, search icon | yes |
| ref link | label / count | 14/500 muted, 14/600 | 14/500, 14/600 | yes |
| topic tag | box / font | 24h, 12/500, pad 0 12 | ~26h, 12/600 | no (data-display, PR-DD-1) |
| New Release button | box / font | 92×28, 12/500 | not capturable logged out (Primer medium = 32) | nit |
| directory-tree 390 | document width | 421 (31px overflow) | 390 | no (code folder) |

## Issues, most important first

1. **minor: the releases list header sits 40px too close to the first card** (`repo-r2-crops/releases-1440.png`).
   From the bottom of the Releases/Tags segment to the first card top: ours 33px, github.com 73px. From the rule to the card: ours 17px, github.com 59px.
   Cards are 24px apart; github.com uses 32px. The column geometry is right, but the vertical rhythm makes the page look cramped next to github.com.
2. **minor: commit-detail header buttons are small.** "Browse Source" and "Operations" are 28px, 12/500, pad 0 8 (`.commit-header-buttons > .ui.tiny.button`).
   github.com's "Browse files" is a medium Button: 130×32, 14/500, pad 0 12. The colours are right now.
3. **minor (390): release headers break badly on phones** (`repo-r2-crops/m-misc.png`, releases-playground light-390).
   - The tag name in the meta line breaks mid-token ("v1.1.0-" / "rc.1").
   - On a long title ("v1.0.0 — Public preview") the edit pencil drops to its own line under the title, and the status × and Stable label float right.
   - "New Release" wraps below the Releases/Tags segment and RSS Feed (also on release-detail 390, `reldetail-390.png`).
4. **minor: search fields are inconsistent across the four list pages.**
   - Tags: 28px, 12px text, inside the Box with a joined square icon button (`tags-1440.png`).
   - Branches and commits: 32px, outside the Box, but still with a trailing joined icon button.
   - github.com (branches) uses one 32px TextInput with the search octicon as a leading visual inside the field.
5. **minor (cross-folder, on this folder's route): directory-tree at 390 scrolls horizontally by 31px.** The document is 421px wide at a 390px viewport. The overflowing element is `A.m-commit-count` at x=393–421 (history icon), which hangs outside the file Box (`repo-r2-crops/m-misc.png`, first column).
   - The gitea-auto baseline is 390 wide. The rules are in `src/code/file-list.css:254-259` (code folder), not pages/repo. It shows on the directory view because the latest-commit author string is long ("Joel Natividad and Peter M. Stahl").
   - It was already present in my r1 capture (missed then). It should go to the code folder.
6. **nit: release-detail chrome differs from github.com.** Compare (32px) and the tag / SHA line sit above the card, outside it. github.com has Compare (28px small) inside the card at the top right and the tag / SHA inline in the byline. This is partly template-bound, but Compare could be positioned into the card corner.
7. **nit: tags at 390.** The wrapped meta lines are 34px apart; github.com's are 22px (`m-commits-tags.png`). The tags SHA is still monospace, while commits now use the sans 12/500 SHA as github.com does.
8. **nit: the New Release button is 28px / 12px.** Primer's "Draft a new release" is a medium 32px Button. I could not capture it logged out, so this is low confidence.
9. **nit: Source code rows are 45px on release-detail.** github.com's "Source code (zip)" rows are about 34px.
10. **nit: the single-release layout only applies in English** (`html[lang^="en"] … :not([aria-label="Releases"])`). The fallback is stable (no CLS), but other locales get the narrower list layout. I found no language-independent marker in `release/list.tmpl` or `head_opengraph.tmpl`; an integrator template hook (a class on `.page-content` when `.PageIsSingleTag` / single release) would fix it.

## Known gaps (template-bound, accepted, but they cap the score)

- Commits: no h1, no per-day "Commits on …" groups or timeline rail; SHA is 10 characters; the browse icon is file-code rather than code.
- Branches: no Overview/Active/Stale/All tabs, no column-header row; two-line 75px rows with five action icons; at 390 the commit line wraps after the SHA.
- Releases: no Release-list nav or "Find a release" search; Gitea's tag/SHA/Compare column instead.
- Wiki: no "Pages N" box or clone box.
- Topic tags 24/500 against 26/600 (data-display, PR-DD-1).

These keep commits and branches recognisably Gitea in structure. That is the main reason the score is 8.0 and not 8.5 or higher.

## What is good

- Both round 1 majors are really fixed. Release-detail CLS is 0 across 10 loads, and asset names wrap like github.com's at 390.
- The column geometry on releases, tags, commits and branches now matches github.com to within 1px (container x and width).
- Branch rows now match github.com's hover and copy-button behaviour, and the Behind/Ahead bars are readable. Commit meta typography matches exactly.
- Dark mode is clean on every page (`repo-r2-crops/dark-0.png`, `dark-1.png`), and so are all state clips (`states-a.png`, `states-b.png`): focus rings, row hovers, Browse hover and press, the Operations menu, and topic hover (accent-emphasis, as in Primer's topic-tag-link).

## Evidence

- Ours: `shots/critic-pages/repo-r2/`, captured with routes file `shots/critic-pages/repo-routes-r2.json` (r1 routes plus branches copy-hover and copy-focus, commit-detail browse-hover, browse-press and operations-open, directory goto-file-focus, and tags row-hover; generator `repo-mkroutes-r2.mjs`). There is also a re-shoot in `shots/critic-pages/repo-r2-dir/`.
- Reference: `docs/reference/{release-detail,releases,tags,branches,repo-commits}` and `shots/critic-pages/repo-r1-ref/`, plus live github.com probes (repo-pos.mjs: releases list, release-detail 390, commit page, branches).
- Crops: `shots/critic-pages/repo-r2-crops/`.
- Probes: `shots/critic-pages/repo-pos.mjs`, `repo-cls.mjs`, `repo-overflow.mjs`, `repo-anc.mjs`.
