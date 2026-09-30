# Critique: pages/actions-packages-projects, final gate loop 1 (wL1), round 3

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30.
**Score 8.6 / 10: PASS** (bar 8.5). Console errors 0, literal colours 0 (lint 0/0), off-palette 0, unresolved vars 0, smoke green (12/12 steps ok, exit 0).

The round-2 major (Actions pane divider stopping mid-viewport when scrolled, fixed-height magic number) is fixed the way I asked: the full-height pane carries the border, only the NavList is sticky. I measured it at six viewport/scheme combinations and it behaves like github's PaneDivider at scroll 0, scrolled and at the end of the page. The Projects header octicons are gone. What remains is template-bound or Gitea logic.

## What I verified myself
- **Lint:** `node build/lint.mjs pages/actions-packages-projects` → 0 errors, 0 warnings, 317 selectors.
- **Build:** `npm run build` → `folders["pages/actions-packages-projects"]` = `{status: ok, lintErrors: 0, lintWarnings: 0, files: 7, bytes: 67021}`. Served `theme-github-auto.css` sha1 `97b72796…` = dist, so no deploy was needed. (The build prints OVER BUDGET for all three bundles, ~334-339 KB; that is whole-theme, this folder is 67 KB of it. Info only.)
- **Shoot:** shots/critic-pages/actions-packages-projects-wL1-r3 (routes shots/critic-pages/actions-packages-projects-wL1-r3-routes.json, 13 routes × light/dark × 1440/390, `--states --measure`): 52 pages, 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette, all states ok, max CLS 0.0003 (actions-list 1440). No horizontal overflow anywhere, 390 pages are 390 wide now (the 407px AppHeader overflow from r2 is gone).
- **Non-Octicon icons:** `gitea-running` in the runs Status menu (icons folder, FG-091) and `gitea-npm` (brand exemption). Not this folder.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` → exit 0, 12/12 steps ok, 0 console errors (shots/critic-pages/actions-packages-projects-wL1-r3-smoke.log).

## Builder claims checked
| # | claim | verdict | evidence |
|---|---|---|---|
| 1 | pane full height, divider y=112 → fold at scroll 0 | **confirmed** | apx-wL1-r3-pane.mjs: 1440×900 nav {x0 y112 w336 h2580}, border-right 1px rgb(209,217,224) light / rgb(61,68,77) dark = --borderColor-default. apx-wL1-r3-al-top-light.png |
| 1 | scrolled 1500: divider spans viewport, menu sticks at 16 | **confirmed** | nav bottom 1192 > vh at 1440×900, 1280×720, 1012×900, 800×900, 1440×1300; menu y=16 sticky, overflow-y auto. github: pane 900 tall when scrolled (r2 measurement). apx-wL1-r3-al-scrolled-1440x900-light.png |
| 1 | page end: divider stops at footer top | **confirmed** | END nav bottom = footer y (788 @900, 608 @720, 1188 @1300). apx-wL1-r3-al-end-1440x900-dark.png |
| 1 | empty filter: pane 112→788 = footer top | **confirmed** | 1440×900: nav h676 b788, footer y788; also 1280×720 (b608 = footer 608), 1440×1300 (b1188). apx-wL1-r3-empty-light.png |
| 1 | no magic number | **confirmed** | actions-list.css uses a flex chain `.full.height` → `.page-content` → `.ui.container` → `.flex-container` (flex-grow), menu `top: --base-size-16; max-height: calc(100vh - --base-size-32)` |
| 1 | accent bar not clipped, focus ring not clipped | **confirmed** | items x=16 w303 (1440), menu box x=8 w319; bar visible at x≈8. Keyboard focus: 2px solid accent, offset −2px, fully drawn, light rgb(9,105,218) / dark rgb(31,111,235) (apx-wL1-r3-navfocus-light.png, apx-wL1-r3-navfocus2-dark.png) |
| 1 | < 768 unchanged | **confirmed** | 390: nav static, no border, rows stacked (apx-wL1-r3-al-390.png) |
| 1 | no leak to settings Actions pages | **confirmed (my own check)** | /settings/actions/runners and /secrets: `.full.height` display block, padding-bottom 64px, container 1216 @x112 (unchanged) |
| 2 | Open/Closed octicons removed; header 65, text at 17px | **confirmed** | header h65 (github 65); Open text x=129 vs box x=112 → 17 (github 425−408 = 17); no visible svg; Open 14/600, Closed 14/400 --fgColor-muted. apx3-projects-list/light-1440.png vs docs/reference/apx1-projects-list/light-1440.png |
| – | CLS | **confirmed** | max 0.0003 (actions-list), action-run/job/job-ok 0 |

## Findings (most important first)

### 1. NIT (template, known): projects Box header reads "2 Open" / "0 Closed"
github: "Open [16]" with a Counter. The count is a bare text node in templates/projects/list.tmpl. Row icon octicon-project vs github octicon-table (template). Row order also differs: github title → description → meta; ours title → open/closed meta → description (list.tmpl).

### 2. NIT (template, known): Actions page has no "Actions" pane title, "All workflows" heading or "Filter workflow runs" input
FG-049 rejected as template work. The pane, runs Box (1056 @x360), header and rows (78/79/79 vs github 79) match.

### 3. NIT: divider ends in white space above the footer
At the page end the pane border stops at y=788 and Gitea's footer (no top border) sits 112px below it (apx-wL1-r3-al-end-1440x900-dark.png, apx-wL1-r3-empty-light.png). github logged-out has no footer, so there is no direct reference; logged-in github puts the footer outside the layout too. Acceptable; a footer top rule would be a footer-folder decision.

### 4. NIT (Gitea logic): graph zoom controls at 100%
github disables all three; Gitea disables only "+".

### 5. NIT (template): package keywords plain text; org projects search leading icon vs repo projects/packages trailing button.

### 6. INFO (not this folder)
- Whole-theme bundles OVER BUDGET (334-339 KB).
- `gitea-running` non-Octicon icon in the runs Status menu (icons folder).

## Measurements (ours vs github.com, light 1440 unless noted)
| control | property | ours | github | ok |
|---|---|---|---|---|
| actions pane (scroll 0) | x / w / y / padding | 0 / 336 / 112 / 16 | 0 / 336 / 182 / 16 | yes (y differs only by header height) |
| actions pane | border-right light / dark | 1px rgb(209,217,224) / rgb(61,68,77) | same | yes |
| actions pane (scrolled 1500) | divider visible end | viewport bottom (900) | 900 | yes |
| actions pane (end of page) | divider end | footer top (788) | document end (no footer) | yes (n/a) |
| NavList menu | sticky top | 16 | pane content sticky | yes |
| NavList item | h / padding / radius / font | 32 / 6px 8px / 6 / 14 | 33 / 6px 8px / 6 / 14 | yes |
| NavList current item | weight / bg | 600 / rgba(129,139,152,.15) | 600 / --control-transparent-bgColor-selected | yes |
| NavList focus | outline | 2px solid accent, offset −2px | 2px accent | yes |
| run row | height | 78/79/79 | 79 | yes |
| runs Box | x / w | 360 / 1056 | 361 / 1054 (inner) | yes |
| filter trigger | h / padding / colour | 32 / 0 8px / rgb(89,99,110) | invisible button, --fgColor-muted | yes |
| projects Box header | height / bg | 65 / rgb(246,248,250) | 65 / rgb(246,248,250) | yes |
| projects header text | inset | 17 | 17 | yes |
| projects Open / Closed | font | 14/600, 14/400 muted | 14/600 | yes |
| projects Open / Closed | leading icon | none | none | yes |
| New Project | h / font / radius / bg | 32 / 14/500 / 6 / rgb(31,136,61) | 32 / primary | yes |
| CLS | max over 52 pages | 0.0003 | — | yes |
