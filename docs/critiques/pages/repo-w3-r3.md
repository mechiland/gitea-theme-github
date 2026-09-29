# Critique: pages/repo, wave 3, round 3

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.
Build revision 8135bb507a. `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the
same SHA-256 (55d2cf3c…), so I did not deploy.

## Verdict

**Score: 8.3 / 10. FAIL** (a pass needs 8.5 or more; every other gate is green).

- Lint `node build/lint.mjs pages/repo`: 0 errors, 0 warnings, 354 selectors. Build report `folders["pages/repo"]`: status ok, 12 files, 77,685 B.
- No literal colours in src/pages/repo. The only `#` hits are comments (branches.css:130, :146).
- `!important` appears only in `repo.important.css` (25 declarations, no display/visibility). Elsewhere the word only appears in comments.
- `npm run build` still prints OVER BUDGET for all three theme files (auto 433.1 KB). This is a global issue, not this folder's alone.
- Audit of 72 captures (18 routes × light/dark × 1440/390, `--states --measure`, `shots/critic-pages/repo-r3/`):
  0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
- Max CLS is 0.0225 (wiki-page-playground 390; 0.0172 at 1440), unchanged since round 1. Every other page is at most 0.0012.
- Release-detail CLS: 0.0000 on 4/4 loads at 1440 and 3/3 at 390. The releases list: 0 on 2/2.
- The 6 "problem" pages are all state-selector timeouts on hidden elements:
  - repo-home 390: the branches link.
  - repo-commits 390: the SHA.
  - directory-tree 1440: my goto-file selector matched a hidden input first. It was re-verified in r2 and is unchanged.
- Smoke: **green**, 13/13 steps ok, including `no-console-errors` (`shots/critic-pages/repo-r3-smoke.log`).

## The builder's claims, verified

| # | claim | verified | evidence |
|---|---|---|---|
| 1 | segment 230 → rule 254 → card 303, 32px between cards | **yes**: segment 198–230, divider y 254, card 303, next card 1150 (1118 + 32) | repo-pos; `repo-r3-crops/releases-1440.png` |
| 2 | Browse Source / Operations 32px, 14/500, pad 0 12 | **yes**: 125×32 and 117×32. github.com's "Browse files" is 130×32, 14/500, pad 0 12 | repo-pos, repo-text |
| 3 | release headers at 390 | **yes**: tag names don't break, and the pencil stays top-right on the long title. RSS is a 32×32 icon button. New Release fills a full-width second row on the list (31→359) and fits on row 1 on the detail page | `releases-390.png`, `reldetail-390.png` |
| 4 | one 32px search field with a leading icon | **yes**: tags, branches and commits are all 32h, 14px, pad 0 8 0 36, icon at x+12. Focus is a 1px accent border plus a 2px accent outline at -1, which matches Primer TextInput `:focus-within` | `search-states.png`, repo-focus3 |
| 6 | Compare inside the card corner (detail) | **yes at 1440**: 1210,316, which is 16 from the card top and right edges (github.com: 90×28 at 16/16). At 390 it stays above the card | `reldetail-1440.png`, `reldetail-390.png` |
| 7 | tags meta at 390 is 4px apart | **yes**: wrapped lines are ~20px centre-to-centre (github.com ~19) | `tags-390.png` |
| 8 | New Release / RSS 32px 14/500 | **yes**: 111×32 and 109×32 | repo-pos |
| 9 | Source code rows 36px | **yes**: 1180×36, pad 8 16 | repo-text |
| 10 | single-release layout in any language | **yes, in real locales**: an anonymous `lang` cookie with de-DE, zh-CN, ko-KR, fr-FR and ja-JP gives a list at 1115 flex row and a detail at 1216 grid in every locale | `repo-locale.mjs` |

Every claim holds.

## Measurements (light, 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| releases segment → first card | px | 73 (230→303) | 73 | yes |
| release cards | gap | 32 | 32 | yes |
| release card (list) | x / w | 365 / 913 | 365 / 912 | yes |
| release card (list) 390 | x / w | 31 / 328 | 16 / 358 | no |
| release title 390 | font | 20/600 | 32/600 | no |
| Compare (list + detail) | box / pad | 102×28, 12/500, pad 0 12 | 90×28, 12/500, pad 0 8 | nit |
| Compare (detail) | inset in card | 16 / 16 | 16 / 16 | yes |
| Compare (list) | position | left meta column | inside card top-right | no (template-bound; github's left column is the Release list nav) |
| commit-detail Browse | box / font / pad | 125×32, 14/500, 0 12 | 130×32, 14/500, 0 12 | yes |
| New Release | box / font | 111×32, 14/500 | Primer medium, 32 | yes |
| list search field | h / font / text inset | 32 / 14 / 36 | 32 / 14 / 33 | yes |
| search focus | border / outline | 1px accent, 2px accent offset -1 | same (Primer TextInput) | yes |
| search placeholder | colour | #59636e | #59636e | yes |
| Source code rows | h | 36 | ~35 | yes |
| asset rows | h / pad | 45 / 8 16 | ~44 / 8 16 | yes |
| tags box 390 | x / w | 31 / 328 | 31 / 328 | yes |
| tags meta 390 | line spacing | ~20 | ~19 | yes |
| release-detail card 390 | x / w | 16 / 358 | 16 / 358 | yes |
| release-detail CLS | 7 loads | 0 | – | yes |
| directory-tree 390 | doc width | 421 | 390 | no (code folder) |

## Issues, most important first

1. **major (structural, template-bound; this is what caps the score).** Commits has no h1 and no "Commits on …" day groups.
   Branches has no Overview/Yours/Active/Stale/All tabs, no column headers, and uses 75px two-line rows with five icon actions (github.com's rows are 49px).
   Releases has no Release-list nav, so Gitea's tag/SHA/Compare column takes that slot. Wiki has no Pages box and no clone box.
   Commits and branches still read as Gitea in structure (`commits-branches.png`). The CSS is close to the limit here; closing this gap needs integrator template hooks.
2. **minor (390, this folder): release-list cards are 30px narrower than github.com's.** The list container keeps its 11/12 width rule at every viewport (`tags-releases.css:141-144`, `max-width: calc((100% - 2 * var(--page-margin-x)) * 11 / 12)`).
   - At 390 the cards sit at x=31, w=328. github.com's releases cards are at x=16, w=358. Its header row stays at 31, and so does the tags Box, which ours matches.
   - Release-detail at 390 is already 16/358.
   - Fix: inside the existing `@media (max-width: 767.98px)`, let `#release-list` use the full page width, or drop the 11/12 rule for `.repository.releases`.
3. **minor (390, this folder): release titles shrink to 20px on phones** (`tags-releases.css:404-408`). github.com keeps the h1/h2 at 32/600 at 390 (measured h1 32px on the detail page; the list title renders the same size in `releases-390.png`).
   Ours is 20/600 on both the list and the detail page, so the release name looks like a card heading, not a page title.
4. **minor (cross-folder): directory-tree at 390 still scrolls horizontally by 31px** (document 421 wide). The rules are in the code folder, where it is open as C-5 with a proposed diff. It is not this folder's fault, but it happens on this folder's route.
5. **nit: Compare is 102×28 with pad 0 12. github.com's small Button is 90×28 with pad 0 8** (`--control-small-paddingInline-condensed`). This applies on both the list and the detail page.
6. **nit: release-detail at 390 keeps Compare above the card** in the tag/SHA row. github.com puts it inside the card under the title. At 1440 it is correctly in the card corner.
7. **nit: hovering the search icon shows Gitea's syntax-help tooltip** ("… to match any sequence of numbers") above the field (`repo-r3/tags/states/*-search-btn-hover-clip.png`, and the same on commits).
   It is template-bound (`shared/search/button.tmpl` `data-tooltip-content`). It is harmless, but a GitHub leading-visual icon has no tooltip.
8. **nit: the release byline breaks as "released this / 10 months ago | / 3 commits …" at 390,** with the "|" separator hanging at a line end. github.com uses a "·" that sits at the start of the wrapped line.
9. **nit (repo home, template text): the sidebar heading is "Description", not "About",** and Gitea's "Search code…" field sits above it. Both come from the template (`repo.repo_desc`). The other nits from the builder's known-gaps list still apply: the topic tag is 24/500 against github.com's 26/600 (data-display), and the search field right padding is 8px against Primer's 12.

## What is good

- All of round 2's actionable issues (1, 2, 3, 4, 7, 8, 9, 10, and 6 at 1440) are really fixed, and the fixes are clean.
- The releases vertical rhythm matches github.com to the pixel (73px from segment to card, 32px between cards).
- The three list searches are now one Primer TextInput with a leading visual. Focus, hover and button focus are correct in both schemes.
- The single-release layout now works in real non-English locales with 0 CLS. That was a hard problem, and the `@scope` on the page title is a sound workaround.
- Dark mode is clean on every page I viewed (`reldetail-dark.png`, `commits-branches.png` right, `tags-390.png` right, `search-states.png`).

## Why 8.3 and not 8.5

The in-folder remaining issues (2, 3, 5, 6) are small, and fixing them would bring the list pages to about 8.4.
The rest of the gap is structural (issue 1): the commits and branches pages. CSS alone cannot make them read as github.com.

## Evidence

- Ours: `shots/critic-pages/repo-r3/`, routes `shots/critic-pages/repo-routes-r3.json` (generator `repo-mkroutes-r3.mjs`; adds search-focus / search-btn-hover / search-btn-focus on tags, branches and commits, compare-hover on releases and release-detail, newrelease-focus, and commit-detail browse-focus).
- Reference: `docs/reference/{releases,release-detail,tags,repo-home}` plus live github.com probes (pemistahl/grex releases, release tag v1.4.6, tags, branches, commit 99cc347) via `repo-pos.mjs` and `repo-text.mjs`.
- Crops: `shots/critic-pages/repo-r3-crops/` (`releases-1440.png`, `releases-390.png`, `reldetail-1440.png`, `reldetail-dark.png`, `reldetail-390.png`, `tags-1440.png`, `tags-390.png`, `search-states.png`, `btn-states.png`, `home-1440.png`, `commits-branches.png`).
- Probes: `repo-focus3.mjs` (focus/placeholder styles), `repo-locale.mjs` (anonymous locale check), `repo-cls.mjs`, `repo-text.mjs`, `repo-sbs.py`.
- Smoke: `shots/critic-pages/repo-r3-smoke.log`.
