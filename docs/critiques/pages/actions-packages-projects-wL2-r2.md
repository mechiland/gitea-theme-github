# Critique: pages/actions-packages-projects, wave L2, round 2

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.6 / 10: PASS.** Console errors 0, literal colours 0 (lint 0/0), off-palette 0, smoke green (14/14 steps ok, exit 0).

Last round's one major finding was the workflow-selected runs Box breaking into pieces. It is fixed: the Box is continuous in both schemes and at both widths. The other seven items are fixed or narrowed as the builder described, and I checked each one with my own measurements.

What is left is small. Most of it is two places where the round-1 spec (partly mine) did not match github.com:
- the weight and colour of the "Type:" label;
- the weight of "N jobs completed" in the matrix card.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` gave 0 errors, 0 warnings, 365 selectors.
- **Build:** `npm run build` gave `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 7, bytes: 82380}`.
- **Bundle budget:** auto 325.7 KB, light 320.7, dark 321.7, all OVER BUDGET. This is whole-theme and informational only.
- **Served CSS:** it differs from dist, but only because `src/pages/repo/*` changed after the last deploy. No file in this folder is newer than the deployed `theme-github-auto.css` (17:29), and the served file contains this round's rules (for example `content: "Type: "`). So I did not deploy.
- **Shoot:** `shots/critic-pages/actions-packages-projects-r2`, using routes `shots/critic-pages/actions-packages-projects-wL2-r2-routes.json`. That is the r1 critic routes plus a new route `awl2-packages-type-npm` (`?type=npm`) and new versions states `sort-hover`, `sort-open` and `crumb-hover`. 15 routes × light/dark × 1440/390 = 60 pages, with `--states --measure`. Results:
  - 0 problems and 0 failed states.
  - 0 console errors and 0 failed requests.
  - 0 off-palette colours.
  - Max CLS 0.0053.
  - `--gh-octicon-calendar` is unresolved on every page. It comes from the controls date-input rule and has matchedElements 0, so it is not this folder's.
  - `gitea-npm` ×16 is the npm brand icon (exempt).
- **Reference:** I captured github.com again, logged out, into `docs/reference/awl2r2-actions-workflow` (cli/cli go.yml, a real workflow page; the r1 grex URL was "Not found") and `docs/reference/awl2r2-action-run` (with matrix-hover).
- **Probe:** `shots/critic-pages/awl2r2-probe.mjs` → `shots/critic-pages/actions-packages-projects-r2/awl2r2-probe.json`. It records computed styles and geometry on our pages and on github.com: the run page, the workflow page, packages, versions, the board, the github run page and the github packages Type button.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` gave 14 steps ok, 0 failed, 0 console errors (`shots/critic-pages/actions-packages-projects-wL2-r2-smoke.log`).

## Builder claims checked
| # | verdict | evidence |
|---|---|---|
| 1 workflow-selected Box | **confirmed** | 1440 header y128 h66, message y194 h61, segment y255, no gaps. Message margin 0, 16px padding, side border 1px rgb(209,217,224), bottom 1px rgba(209,217,224,.7), radius 0. bg rgb(221,244,255) light / rgba(56,139,253,.1) dark (= --bgColor-accent-muted). At 390: header y216 h95, message y311 h90, segment y401, borders 0 at the sides (edge to edge). Run Workflow button 28px 12px/500. See `awl2-actions-workflow/{light,dark}-1440.png` and `light-390.png`. |
| 2 no duplicate heading at 390 | **confirmed** | `awl2-actions-list/{light,dark}-390.png`: NavList, then the muted subtitle only. |
| 3 board 390 header | **confirmed (trade-off)** | Group on its own row at y224: Fullscreen and Edit icons, Close 63×32 14px, Delete 69×32 14px, New Column 32×32 icon. Title y186. No horizontal overflow (docW 390). |
| 4 matrix tab | **confirmed; one weight deviation** | Tab 101.9×21, 12px/18px 500, padding 2px 16px 0. Its bottom is 20px above the card border (github: tab 22 tall, also 20px above). The `::after` concave corner is 7×7 and follows the accent on hover (zoom of `states/{dark,light}-1440-matrix-hover.png`). **"3 jobs completed" is 14px/400/21px. github measures 14px/500/20px** ("text-semibold"), so the claim that github uses normal weight is wrong. Card: 8px 16px padding, h78. github: 16px padding, h100. |
| 5 390 double rule | **confirmed** | The first `.divider` is `display: none`. Only the graph Box edge sits above "All jobs" (`awl2-action-run/light-390.png`). |
| 6 run status icon | **confirmed** | 1440: 22×22 at x32 (github 22×22 at x32). 390: 16×16 at x16, title x40 (github 16 at x16, h1 x40). The job 390 selector icon is 16 at x16 and the name at x40, the same as github (`awl2-action-job/light-390.png`). The Re-run row at 390 remains (Vue). |
| 7 Type / Sort buttons | **confirmed as specified, but the spec differs from github** | Placeholder "Type" is rgb(37,41,46) 500 with a triangle-down octicon, 16px, muted, and the Select mask removed. `?type=npm` gives `::before` "Type: " in rgb(89,99,110), with "npm" rgb(31,35,40) **400**. github `#type-options summary.btn`: `<i>Type:</i>` and "All" are **both rgb(37,41,46) 500**, followed by an 8×4 dropdown caret. |
| 8 versions breadcrumb | **confirmed** | `p` colour rgb(89,99,110) (the "/"), link rgb(9,105,218) with no underline (underlined on hover, `states/light-1440-crumb-hover-clip.png`), last crumb rgb(31,35,40) 400, "Versions" 24px rgb(31,35,40). Dark: the same pattern with 145,152,161 / 68,147,248 / 240,246,252. |

## Findings (most important first)

### 1. MINOR: the packages Type/Sort button does not match github's content styling (packages-org, packages-type-npm, package-versions; both schemes)
- **What we show:**
  - A chosen type reads "Type: " in --fgColor-muted followed by "npm" at weight 400 in --fgColor-default.
  - The placeholder "Type" is 500 in --button-default-fgColor-rest.
  - So one button changes weight and colour depending on the state.
- **github (probe `gh-pk`):** "Type:" and the value are both --button-default-fgColor-rest (rgb(37,41,46)) at weight 500.
- **Fix, this folder:**
  - Drop the muted colour on `::before`.
  - Set `.text:not(.default)` to `color: var(--button-default-fgColor-rest); font-weight: var(--base-text-weight-medium)`.
  - My round-1 note ("label muted, value default") was wrong. This measurement replaces it.
- **Related, while open (`states/*-1440-type-open-clip.png`, `awl2-package-versions/states/light-1440-sort-open-clip.png`):** the button gets a 1px accent border, which is the Select/active look. A Primer ActionMenu button keeps its border and uses --button-default-bgColor-active when `aria-expanded`.
- **Width:** 140px against github's 106.7 (Fomantic min-width). This is a nit.

### 2. NIT: the matrix card body is lighter and tighter than github (action-run 1440/390)
- "N jobs completed": 14px/400/21px against github 14px/500/20px.
- Card padding: 8px 16px (h78) against github 16px (h100).
- Everything else about the tab (20px offset, 12px/500, concave corner, hover accent) matches.
- Evidence: zoom `awl2-action-run/light-1440.png` against `docs/reference/awl2r2-action-run/light-1440.png`, plus the probe.

### 3. NIT: workflow-selected page (known and accepted limits)
- There is no PageHeader. github shows the workflow name at 20px plus a "go.yml" link above the Box (`docs/reference/awl2r2-actions-workflow/light-1440.png`). Ours starts directly with the Box, and the name is not reachable from CSS.
- The blue flash row inside the Box cannot be checked logged out (writer-only). It is visually coherent in both schemes.
- At 390 the NavList has no rule between "All Workflows" and "CI", although the rule exists at 1440 (`awl2-actions-workflow/light-390.png`). github has no NavList at 390 at all.

### 4. NIT: 390 details that were known and are unchanged
- The board header mixes icon-only and text buttons in one group, and the icon-only ones have no tooltip (CSS limit).
- "Re-run failed jobs" sits on its own row on the run and job pages.
- The "ci.yml" graph header crowds its stats beside the title (`awl2-action-run/light-390.png`). github drops the stats at 390.
- The graph is wider than 390.

### 5. INFO (not this folder)
- Bundles over budget: auto 325.7 KB.
- `--gh-octicon-calendar` is unresolved (controls).
- `gitea-npm` brand icon.
- Also known and accepted: the "All Workflows" capital W, "(1.0.0)" bold, and "N Open" with no Counter.

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| workflow-selected Box | header / message / runs y (1440) | 128 h66 / 194 h61 / 255 (contiguous) | Box intact | yes |
| workflow message row | bg / padding / radius | rgb(221,244,255) / 16px / 0 | blue Box row (writer-only; not capturable) | yes |
| run status icon | size 1440 / 390 | 22 / 16 | 22 / 16 | yes |
| run title | x at 390 | 40 | 40 | yes |
| run title | font | 20px/30px 600 | 20px/30px 600 | yes |
| matrix tab | height / font / padding | 21 / 12px/18px 500 / 2px 16px 0 | 22 / 12px/18px 500 / 4px 16px 0 | yes |
| matrix tab | offset above card border | 20 | 20 | yes |
| matrix summary | font | 14px/21px 400 | 14px/20px 500 | no (nit) |
| matrix card | padding / height | 8px 16px / 78 | 16px / 100 | no (nit) |
| Show all jobs | font / colour | 12px/18px / rgb(89,99,110) | 12px/18px / rgb(89,99,110) | yes |
| packages Type button | size / radius / bg | 140×32 / 6 0 0 6 / rgb(246,248,250) | 106.7×32 / 6 0 0 6 / rgb(246,248,250) | yes (width nit) |
| packages Type button | label + value colour / weight | Type: rgb(89,99,110) + npm rgb(31,35,40) 400 | Type: + All rgb(37,41,46) 500 | no (minor) |
| packages Type caret | icon | triangle-down 16px muted | dropdown-caret 8×4 | yes (Primer ActionMenu uses triangle-down) |
| versions breadcrumb | separator / link / last | rgb(89,99,110) / rgb(9,105,218) no underline / rgb(31,35,40) 400 | muted / accent / default | yes |
| versions Subhead | font / margin-top | 24px 400 / 44px | 24px 400 / 73 from crumb | yes |
| board 390 header | buttons | 32px icons + Close 63w / Delete 69w, own row y224 | kebab overflow | partly |
| 390 run divider | rules under graph | 1 | 1 | yes |
| CLS | max over 60 pages | 0.0053 | — | yes |
