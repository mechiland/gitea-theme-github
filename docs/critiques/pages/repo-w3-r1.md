# Critique: pages/repo, wave 3, round 1

Critic: independent GitHub design-systems reviewer (writes no theme code).
Date: 2026-09-30. Build revision 1326dee943. `dist/theme-github-auto.css` and the served
`/assets/css/theme-github-auto.css` have the same SHA-256 (093db45d…), so the served CSS was current and I did not deploy.

## Verdict

**Score: 7.4 / 10. FAIL** (a pass needs 8.5 or more).

- Lint: `node build/lint.mjs pages/repo` gives 0 errors, 0 warnings and 262 selectors. The build report shows `folders["pages/repo"].status = "ok"` (11 files, 53,269 B). A grep of `src/pages/repo` finds no literal colours and no `!important` outside `repo.important.css`, which has 13 declarations and none of them are display or visibility.
- Audit over 72 captures (18 routes × light/dark × 1440/390, `--states --measure`): 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS.
- **CLS: max 0.4363** on release-detail at 1440 in both schemes. The builder reported 0 for this page.
- Smoke: **green**, 12/12 steps (`shots/20260930-045859-smoke-github-auto/smoke.json`).

Repo home is the strongest page. At 1440 the toolbar, file Box and About column line up with github.com to the pixel, and the ref links, focus rings and hover states match. The builder's positions are right.

The other page types are still recognisably Gitea in structure:
- **Commits:** one Box with Gitea's "445 Commits" header and search row. There is no h1, no per-day groups and no timeline rail.
- **Branches:** "Default Branch" and "Branches" are Box headers, with two-line 71px rows and five action icons. There are no tabs and no column-header row.
- **Releases:** the classic left meta column.
- **Wiki:** "Page ▾" and a green Code button instead of a Pages box.

Most of this is template-bound, and the builder lists it as known gaps. But several gaps are within CSS reach, and I also found real defects. The release-detail CLS still happens on 5 of 6 loads. At 390 the asset file names shrink to five characters. A declared 16px tag-row padding loses to `tw-p-4`. Page container widths differ from github.com on commits, branches, tags and releases.

## Evidence

- Ours: `shots/critic-pages/repo-r1/`, captured with routes file `shots/critic-pages/repo-routes.json`. That file extends the builder's routes with 17 extra states: ref-link hover and focus, Go-to-file focus, topic hover, commit row/SHA hover, copy focus, branch delete and row hover, Releases/Tags segment hover, wiki Edit hover, repo-create name focus and submit-empty. It also adds per-page measures. The generator script is `shots/critic-pages/repo-mkroutes.mjs`.
- `shots/critic-pages/repo-r1-aborted/` is **invalid**. My smoke run switched the admin theme to gitea-auto and back while that capture was running. It was re-shot cleanly.
- Reference: `shots/critic-pages/repo-r1-ref/` (github.com logged out, 1440, with states and measures) plus today's `docs/reference/*`.
- Crops and contact sheets are in `shots/critic-pages/repo-r1-crops/`: `states-sheet.png` (ours), `states-sheet-ref.png` (github.com), `mobile-sheet1.png`, `mobile-sheet2.png`, `mobile-dark-sheet.png`, and `*-light.png` / `*-dark.png` per route.
- Position probe: `shots/critic-pages/repo-pos.mjs`. CLS repro: `shots/critic-pages/repo-cls.mjs`.

## Measurements (light, 1440 unless noted)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| repo home toolbar | Branches link x / h | 226 / 32 | 226 / 32 | yes |
| ref link | font | 14/400 label, count 14/600 default | 14/500 label, count 14/600 | nit |
| ref link hover / focus | bg / ring | control-transparent hover; 2px accent ring | same | yes |
| Code button | box | 108.9×32, #1f883d, 14/500 | 108.9×32, #1f883d, 14/500 | yes |
| topic tag | box / font | 24px, 12/500, pad 0 12 | 26px, 12/600 (row pitch 33.5 vs 32) | no (data-display seam) |
| commits container | x / width | 112 / 1216 | 80 / 1280 | no |
| commit row | height / pad / divider | 64 / 8 16 / rgba(209,217,224,.7) | 64 / – / rgba(209,217,224,.7) | yes |
| commit title | font | 16/500/24 | 16/500/24 | yes |
| commit meta | font | 12/400/19.5, author **600** | 12/400/18, author 400 | no |
| commit SHA | box / font | 92×28, mono 12/500, #1f2328, 10 chars | 70×28, sans 12/500, #25292e, 7 chars | nit |
| commit icon buttons | box | 28×28 muted | 28×28 muted | yes |
| branches container | x / width | 112 / 1216 | 80 / 1280 | no |
| branch name pill | box / font | 41.7×24, mono 12, pad 2 6, r6, accent on accent-muted | identical | yes |
| branch cell | padding / font | 8 12 8 16, 12/20 | 8 12 8 16, 12/20 | yes |
| branch row | height | 71 (two-line Gitea row) | 49 | no (template) |
| branch copy button | box / colour | 28×28, **fgColor-default** | 32×32, fgColor-muted | no |
| branch row hover | bg | none | bgColor-muted | no |
| releases segment | box / font / selected bg | 32h, pad 0 16, 14/500, #0969da | 32h, 16px inline, 14/500, #0969da | yes |
| release title | font | 32/600/48 | 32/600/48 | yes |
| release list container | x / card width | 112 / 1032 | 163 / 912 | no |
| asset row | height / pad | 37.3 / 8 16 | 45 / 8 16 | nit |
| tags container | x / width | 112 / 1216 | 163 / 1114 | no |
| tag row | padding / height | **14** / 80 | 16 / 91 | no |
| tag name | font | 16/600/24 | 16/600/24 | yes |
| tags Box header | box / font | 55h, pad 16, 14/600, bgColor-muted | 55h, pad 16, 14/600 | yes |
| wiki title | font | 32/400/36 | 32/400/36 | yes |
| wiki Edit button | box / font | 40.5×28, 12/500 | 40.5×28, 12/500 | yes |
| wiki container | x / width | 112 / 1216 | 112 / 1216 | yes |
| CLS release-detail 1440 | layout shift | 0.4363 (5 of 6 loads) | – (gitea-auto baseline 0) | no |
| CLS repo-home 390 | layout shift | 0 | – | yes |

## Issues, most important first

1. **major: the release-detail CLS was not fixed.** It is 0.4363 at 1440, in light and dark.
   - My capture gives 0.4363 (`repo-r1/release-detail/light-1440.json`). `repo-cls.mjs` gives 0.4363 on 5 of 6 loads, all at t≈70 ms.
   - Shift sources: `div.ui.segment.detail` moves y263→303, `div.ui.dropdown.custom` y334→263, and `a.muted.tw-font-mono` y308→270.
   - Cause: `#release-list > .release-entry:only-child` (tags-releases.css:351). Blink does not match `:only-child` / `:last-child` until the parent has finished parsing, and a long release (notes plus 8 assets) paints before `</ul>` arrives. The first paint uses the two-column list layout, which then flips to the single-card layout. The `min-height` reservation never applies to that first paint.
   - Fix: key the single layout on something parsed before the entry. One option is `.repository.releases:has(.small-menu-items ~ * a[href*="/releases/new?tag="])`: the header's New Release link carries `?tag=` only when `PageIsSingleTag`, but only for users who can create releases. Another is to make both layouts share first-paint geometry.
   - Also re-check the builder's claimed CLS numbers with more than one load.
2. **major (mobile): release asset names shrink to five characters at 390.**
   - Evidence: releases and release-detail, both schemes (`mobile-sheet1.png`, `mobile-dark-sheet.png`), where names show as "grex-v…" or "grex-…".
   - Cause: the `@media (max-width: 767.98px)` block sets `min-width: 0` on both the name link and `.attachment-right-info`, while the right info (size, ⓘ, date) stays nowrap. The file name is the content that matters.
   - Fix: at 390, wrap the right info under the name (`flex-wrap: wrap` on the row, `flex-basis: 100%` for the info), or drop the date column.
3. **minor: page container widths differ from github.com on four page types.**
   - Commits and branches: ours `.ui.container` is 1216 at x=112, github.com is 1280 at x=80 (`h1` "Commits"/"Branches" x=80, table x=80…1360).
   - Releases and tags: github.com is 1114 at x=163 (Tags Box header 163→1277), ours is 1216.
   - Repo home, release-detail and wiki already match (112 / 1216).
   - Page-scoped container overrides (`.repository.commits > .ui.container` etc.) belong to this folder.
4. **minor: the tag row padding is 14px, not the declared 16px.** In `tag/list.tmpl` the row is `.item.tag-list-row.tw-p-4`. `tw-p-4` is `1rem !important`, which is 14px at Gitea's 14px root. The `padding: var(--base-size-16)` in tags-releases.css therefore never applies. Tag names sit at x=126 while the Box header text sits at x=128 (github.com: 16px, x=180 in a Box at 164). It needs a line in `repo.important.css`.
5. **minor: branches.**
   - There is no row hover (`branches/states/light-1440-row-hover-clip.png` stays white; github.com uses bgColor-muted, see `states-sheet-ref.png`).
   - The copy button next to the name is `fgColor-default` at 28×28. github.com uses fgColor-muted at 32×32.
   - "Default Branch" and "Branches" render as 55px Box headers. On github.com, "Default" is a 14/600 heading above the Box, and the Box starts with a 38px column-header row (12/600 muted on bgColor-muted).
   - The Box-header half is reachable in CSS: restyle `.repository.branches .ui.top.attached.header` as a plain heading and give the table segment the full Box border and radius.
   - At 390 each branch becomes a stacked block of about 200px, and commit messages truncate to "Remove de…" (`mobile-sheet1.png`).
6. **minor: commits meta line.**
   - Author links are 12/**600**; github.com uses 12/400 muted (`descA` probe: pemistahl 12px/400).
   - Line height is 19.5 against github.com's 18.
   - The SHA is monospace in fgColor-default. github.com uses the sans stack 12/500 in #25292e (button fg). The browse icon is octicon-file-code; github.com uses octicon-code.
   - The per-day groups and h1 are known template gaps.
7. **minor: "Go to file" is inconsistent between repo home and directory view.**
   - Repo home (`.repo-grid-filelist-sidebar`): 204×32 with a search octicon.
   - `/src/branch/main/src` (`directory-tree-light.png`): Gitea's 28px small input with no icon.
   - github.com uses the same 32px field with the search icon on both views. The selectors are scoped to the root grid only.
8. **minor: commit-detail header buttons.** "Browse Source" and "Operations" are green primary buttons (`commit-detail-dark.png`). github.com's "Browse files" is a default button (`commit-detail-ref.png`). The route is listed as page chrome for this folder.
9. **minor (data-display seam): topic tags are 24px / 500.** github.com's are about 26px / 600: the row pitch is 33.5px on github.com against 32 on ours (`home-ref-l.png` vs `home-ours-l.png`). This is already requested as PR-DD-1. The integrator should decide.
10. **nit: ref-link label weight.** The label is 14/400; github.com uses 14/500 (measure `ref-link`).
11. **nit: a draft release with no assets still shows an expanded "▼ Downloads" summary with about 48px of empty space** (`releases-playground…-dark.png`). Hiding the empty Box helped; the summary should go too, or be closed.
12. **nit: the /repo/create intro paragraph is centred** ("A repository contains all project files…", `.repository.new-repo` create_helper), while every field is now left-aligned (`repo-create/states/light-1440-submit-empty.png`).
13. **nit: the wiki meta line truncates at 390** ("…edited this page 3 …") next to the revision button (`mobile-sheet2.png`).
14. **nit: the Behind/Ahead bars barely show** (`repo-r1-crops/branch-bars-zoom.png`, bgColor-neutral-muted at 12% alpha on white). I could not capture a github.com branch with divergence while logged out, so this is low confidence.

## Known gaps accepted as template-bound

These do not count as defects, but they do cap the score:
- Commits page: no per-day "Commits on …" groups, no timeline rail, no `committed` verb, and no checks count.
- Branches page: no Overview / Active / Stale / All tabs.
- Releases: no Release-list left nav, no "Find a release" search, no breadcrumb, and no sha256 digests.
- Wiki: no "Pages N" box, no filter and no clone box.
- Repo home: "Description" instead of "About", with the code-search input above it. The heading is at y=246, while github.com's About sits at the toolbar row. There are no stars / watching / forks rows.
- /repo/create keeps Gitea's Box.

## What is good

- **Repo home at 1440** is close to indistinguishable in both schemes. The toolbar order, sizes and positions are right; the Latest release block and language bar match; and the hover/focus states match github.com clip for clip (`states-sheet.png` vs `states-sheet-ref.png`).
- **CR-2 mobile CLS is really fixed:** 0 on repo-home, prom_ex and theme-playground at 390 in my run.
- **Branch name pill, Releases/Tags segment, release title, tags Box header and wiki header** match github.com's computed styles exactly.
- **Dark mode** is clean everywhere: no off-palette colours, and correct emphasis and muted surfaces.
