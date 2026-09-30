# Critique: pages/repo, wave L2 (final gate #2 loop 2), round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30.

## Verdict

**Score: 8.4 / 10. NOT PASS** (the bar is 8.5; every other gate is green).

Most of the Final gate #2 work landed and holds up against github.com at 1440 and 390. The releases card (FG2-025) is now very close to github.com at both widths. The new-repo form, the 390 toolbars, the commit list icon and "Commits on" prefix, the tags header icon, the wiki clone label and the code-view right edge all check out.

Three things keep it under 8.5:
- The new FG2-025 card grid breaks at tablet widths. At 800px the tag and SHA are pushed to the card's right edge, and the SHA runs into the card border.
- FG2-038 is reported DONE, but the compare page still shows the rule under "Compare commits". A later rule in the same file puts it back.
- The reason given for leaving the release SHA at 10 characters in sans is wrong. github.com renders it as 7 characters in 14px monospace, so the fix the builder ruled out is available.

## Gates

- **Lint:** `node build/lint.mjs pages/repo` reports 0 errors, 0 warnings, 407 selectors. I found no literal colours in the folder.
- **Build:** `npm run build` gives `folders["pages/repo"]` status ok (13 files, 91,242 B of source).
  - All three theme files are over budget: auto 322.2 KB, light 317.2, dark 318.2. That is the theme as a whole, not this folder alone.
- **Folder size:** `@layer gh.pages-repo{…}` is 31,634 B minified, which is 30.89 KiB, under the 31.5 KiB cap. The block is byte-identical in dist and in the served file.
- **Deploy:** I did not deploy. The served file differs from dist only in other folders' layers.
- **Audit:** 88 captures (22 routes × light/dark × 1440/390) with `--states --measure`, in `shots/critic-pages/repo-wL2-r1/`. My routes file is `shots/critic-pages/repo-wL2-r1-routes.json`.
  - Results: 0 console errors, 0 failed requests, 0 non-Octicon icons, 0 unlayered Gitea CSS.
  - Off-palette: 1 colour, `rgba(0,0,0,1)` as the SVG `fill` on `#repo-activity-top-authors-chart` `<g>` groups (Pulse, both schemes). That is Gitea's vue-bar-graph default fill, not a surface of this folder.
  - Unresolved var: `--gh-octicon-calendar`, owned by the controls folder, 0 live elements.
  - State failures were all selector misses in my own routes file (`history-focus` on file-view-markdown, `downloads-focus` on the playground, `pages-item-hover` on a one-page wiki). None was a theme problem.
- **CLS above 0.01:**

  | route | 390 | 1440 | note |
  |---|---|---|---|
  | file-view-markdown | 0.22–0.25 | 0.09–0.22 | README images |
  | repo-activity-contributors | 0.53 dark, 0.078 light | 0.084 | |
  | repo-activity-code-frequency | 0.115 | 0.033 | builder did not mention it |
  | repo-activity-recent-commits | 0.091 | 0.016 | builder did not mention it |
  | wiki-page-playground | 0.049 | — | |

- **Smoke:** **green**, 13 of 13 steps and 0 console errors (`shots/critic-pages/repo-wL2-r1-smoke.log`). I ran it after the capture run had finished, so its theme switch could not touch the captures.

## Verification of the builder's claims

| item | verdict | evidence |
|---|---|---|
| FG2-025 releases | **verified at 1440 and 390; broken at about 768–900** | 1440: Compare 94×28 at the card's top right, 12/500, padding 0 8; tag and SHA in the byline row; rule under the byline (`rel-l-ours.png` next to `rel-l-gh.png`). 800: SHA x=652 w=100, so it ends at 752 = the card's border edge (`rel-800-card.png`). |
| FG2-063 new repo | verified | Unboxed, 24/600 heading, muted rule, Owner / Repository name on one row (`repo-create/light-1440.png`). In the error state the flash sits between the heading and the subtitle (nit). |
| FG2-030 toolbar | verified | 390 toolbar is 72px (two 32px rows + 8px gap). History is a 32×32 icon button on the directory view. Directory, file and blame views all checked. |
| FG2-018 / FG2-021 | verified | `<>` browse icon and "Commits on Jan 14, 2026" on /commits, the same as github.com (`commits-ours.png` / `commits-gh.png`). |
| FG2-038 compare | **NOT done (rule); tab and actions done** | `h2.ui.header` still has `border-bottom: 1px solid rgba(209,217,224,.7)`. See issue 2. |
| FG2-049 / FG2-090 tags | verified | 7-character mono SHA; tag icon in the Box header. |
| FG2-049 release byline | **reason wrong** | github.com: `db9275a` in 14px `ui-monospace` (span inside the 14px sans link). Ours: `db9275ace1` in 13.3px sans. |
| FG2-062 | partial, as the builder said | Triangle is the exact size of Octicon triangle-down (7×4). github.com's marker is larger (about 10×9). No Counter. |
| FG2-064 | verified for one-line titles | On a two-line title (`v1.0.0 — Public preview` at 390) the status × and the Label are centred on the whole block, not on line 1. |
| FG2-026 / FG2-047 wiki | verified | "Clone this wiki locally" label, 24px gap. At 390 the wrapped "1 ⟲" line starts about 12px in from the byline. |
| FG2-016 branches | verified | Row hover and keyboard focus reveal the icons (`branches/states/*-rowicon-focus-clip.png`, `*-row-hover-clip.png`). The rule is not limited to `(hover: hover)`, so on a touch tablet ≥ 768 the icons stay invisible but can still be tapped. |
| FG2-087 | verified | `.repo-view-content` x=320, w=1104, so it ends at 1424. |
| Activity pages | **partially like github.com** | See issue 4: nav component and width, heading weights. |

## Issues (most important first)

1. **MAJOR: the release card overflows at tablet widths.**
   - Where: releases, light, 800px (the same grid applies from 768 up).
   - The byline wraps to 2 lines in grid column 1. Tag and commit are forced (nowrap) into columns 2 and 3 of an `auto auto auto minmax(0,1fr)` grid.
   - The SHA's box ends at x=752, which is exactly the card's outer edge (card x=48, w=704). It sits inside the 16px padding and touches the border.
   - The tag and SHA also float bottom-right, away from the byline.
   - github.com wraps the tag and commit onto the next line instead.
   - Probe: `shots/critic-pages/repo-wL2-r1-probe.mjs` at vw 800. PNG: `shots/critic-pages/repo-wL2-r1-crops/rel-800-card.png`.
   - Fix: let the byline and meta items wrap together (for example a flex-wrap byline row), or limit the ≥ 768 layout to ≥ 1012 and use the < 768 stacked layout below that.

2. **MINOR, but a false DONE: FG2-038 "no rule under the title" is not in effect.**
   - The rule at `src/pages/repo/commits.css:231` (`.diff:not(.pull) > .ui.container > h2 { border: 0 }`) is overridden by `commits.css:418-426`. That rule has the same selector, comes later, and adds `border-bottom: var(--borderWidth-thin) solid var(--borderColor-muted)` back.
   - Measured: compare `h2` has border-bottom 1px `rgba(209,217,224,0.7)` in light, at 1440 and 390.
   - PNG: `shots/critic-pages/repo-wL2-r1-crops/cmp-ours.png`, `cmp-d390.png`.
   - The builder said they looked at this screenshot.

3. **MINOR: the release byline SHA is wrong, and the reason given for leaving it is wrong.**
   - github.com (live probe, /pemistahl/grex/releases, 1440): `db9275a`, 7 characters, in a span with 14px/21px `ui-monospace`, 60.6px wide.
   - Ours: `db9275ace1`, 13.3px/19.95px sans, 99.6px wide.
   - The mono 7ch clip already used on the tag rows would work here too.

4. **MINOR: the Insights / Activity pages do not match github.com's Insights frame.**
   - Nav:
     - github.com: a bordered classic Menu, 296px wide at x=112, radius 6, 38px rows (padding 8/16) split by 1px `--borderColor-default`, the selected row marked with a coral left bar.
     - Ours: an unboxed NavList, 240px wide, blue bar.
     - Content therefore starts at x=368 (github.com 432) and is 960 wide (github.com 896).
   - Headings:

     | page | github.com | ours |
     |---|---|---|
     | Pulse | 20px/600 | 24/400 |
     | Contributors | 24/600 | 24/400 |
     | Code frequency | 24/400 | 24/400 (matches) |

   - Pulse stat cells: github.com's dividers run the full cell height; ours stop short.
   - The brief described the target as "NavList left", but github.com's Insights pages use the boxed Menu.
   - PNG: `repo-activity/light-1440.png` next to `docs/reference/repo-activity/light-1440.png`; `repo-activity-contributors/dark-1440.png` next to its reference.
   - The nav selector may need a page-scoped rule, or a request to the navigation folder.

5. **MINOR (template-bound, FYI): github.com /releases now has a "Release list" sidebar.**
   - The release card is at x=366, w=912 on github.com; ours is at x=163, w=1115 (the col-11 layout).
   - This needs data Gitea doesn't render. It is recorded so the next round does not re-measure against the old reference.

6. **MINOR: compare row actions.**
   - github.com: all three controls (copy, SHA, browse) are Button--secondary with fill `rgb(246,248,250)`.
   - Ours: only the SHA is filled. Copy (32×28) and browse (28×28) have `background-color` transparent: the rule sets `--button-default-bgColor-rest`, but something wins over it.
   - Rows are 64px; github.com's are 58–59px.
   - PNG: `cmp-ours.png` / `cmp-gh.png`.

7. **MINOR: layout shift at 390 on code-frequency (0.115) and recent-commits (0.091).**
   - Both are chart mounts, like contributors (0.53 dark). None is reserved, and the builder's notes cover only contributors.

8. **NIT: repo-create error state.** The error flash splits the heading from its subtitle (`repo-create/states/dark-390-submit-empty.png`).

9. **NIT: Downloads summary.**
   - The focus ring is a square ring tight on the text box, no radius or offset (`releases/states/dark-1440-downloads-focus-clip.png`).
   - The triangle is visibly smaller than github.com's "▼ Assets" marker.
   - There is no Counter (known).

10. **NIT: wiki 390.** The revision count wraps to its own line, indented about 12px from the byline's left edge (`wiki-page/dark-390.png`).

11. **NIT: FG2-064 two-line titles.** The status icon and Label are centred on the block instead of line 1 (`releases-playground…/light-390.png`).

12. **NIT: branches.** The hover-reveal is not limited to `(hover: hover)`, so on touch tablets the icons are invisible but can be tapped.

13. **NIT: tags Box header.** The gap between the tag icon and "16 Tags" is about 8px; github.com's is about 4px.

## Measurements (light, 1440 unless noted; live probes)

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| release title | font | 32/48/600 | 32/48/600 | yes |
| release Compare | box, font, padding, radius, border | 94.4×28, 12/500, 0 8, r6, 1px rgb(209,217,224) | 28 tall, 12/500, r6, 1px same | yes |
| release byline tag | font | 14/21/400 sans | 14/21/400 sans | yes |
| release byline SHA | font, chars | 13.3px sans, 10ch (99.6px) | 14px ui-monospace, 7ch (60.6px) | no |
| release card @1440 | x / w | 162.7 / 1114.7 | 366 / 912 (Release list sidebar) | no (template) |
| release card @800 | SHA right edge vs card edge | 752 = 752 (overflows padding) | wraps | no |
| compare SHA button | box, font | 67.9×28, 12/500 mono | 69.9×28, 12/500 mono | yes |
| compare copy / browse | fill | transparent | rgb(246,248,250) | no |
| compare commit row | height | 64 | 58–59 | no |
| compare title rule | border-bottom | 1px rgba(209,217,224,.7) | none directly under the title (rule after the description) | no |
| commits day list | layout, browse icon | same geometry, octicon-code | octicon-code | yes |
| code view (FG2-087) | right edge | 1424 | 1424 | yes |
| 390 toolbar (FG2-030) | rows / height | 2 / 72px, History 32×32 | 2 rows | yes |
| Pulse heading | font | 24/36/400 | 20/32.5/600 | no |
| Contributors heading | font | 24/36/400 | 24/36/600 | no |
| Code frequency heading | font | 24/36/400 | 24/36/400 | yes |
| Insights nav | width, style | 240, NavList | 296, bordered Menu, 38px rows | no |
| new-repo heading | font | 24/600 | 24/600 (Subhead) | yes |
