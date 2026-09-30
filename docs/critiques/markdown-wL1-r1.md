# Critique: markdown, wave L1, round 1 (FG-087 copy button, MD-1 pre overflow)

Critic: independent GitHub design-systems reviewer. 2026-09-30.

## Verdict
Score **8.5 / 10**: matches github.com, with nits. **PASS**: lint 0 errors, 0 console errors, 0 off-palette colors, smoke green.

## Checks
- `node build/lint.mjs markdown`: 0 errors, 3 warnings, 146 selectors. The `npm run build` report shows folders.markdown with status ok, 12 files and 24,492 B. The build as a whole is OVER BUDGET (333.7 KB auto). That is global, not this folder's doing.
- The served `/assets/css/theme-github-auto.css` has the same sha1 as dist (c680c9e7…), so I did not redeploy.
- Gitea capture: 9 routes, light+dark, 1440+390, 4 states each (code-hover, copy-hover, copy-focus, copy-press) with --measure, in `shots/critic-markdown-wL1-r1/` (routes: `shots/critic-markdown-wL1-r1-routes.json`). Results: 0 console errors, 0 failed requests, 0 unresolved vars, 0 off-palette colors, 0 non-Octicon icons on every page.
  - The failed states are all "no code block on the page": wiki-page-playground (mermaid only), release-detail and wiki-page. The github.com reference release-detail and wiki-page have no code block either.
- Reference: github.com logged out, `shots/critic-markdown-wL1-r1-ref/` (repo-pull, file-view-markdown, repo-home-readme-with-images-and-tables, release-detail, wiki-page).
- Probes in `shots/critic-markdown-wL1-r1-probe/`: gt-probe.mjs, gh-probe.mjs, gh-rules.mjs, overflow.mjs, pkg2.mjs, fv390.mjs.
- Smoke: `node tools/shoot/smoke.mjs --theme github-auto` passed all 12 steps with no console errors (`shots/20260930-125612-smoke-github-auto/smoke.json`).

## Measurements (computed styles, ours vs github.com)
Floating variant (ours: issue-detail-playground #2; github.com: pemistahl/grex/pull/42), light / dark, 1440:
| property | ours | github.com |
|---|---|---|
| size | 34x36 | 34x36 |
| inset from block top/right | 8 / 8 | 8 / 8 |
| icon (size, x, y) | 16 @ 9,9 | 16 @ 9,9 |
| radius / border width | 6px / 1px | 6px / 1px |
| rest bg / border (light) | rgb(246,248,250) / rgb(209,217,224) | same |
| rest bg / border (dark) | rgb(33,40,48) / rgb(61,68,77) | same |
| hover bg | rgb(239,242,245) / rgb(38,44,54) | same |
| active bg | rgb(230,234,239) / rgb(42,49,60) | same |
| focus-visible outline | 2px solid rgb(9,105,218) / rgb(31,111,235), offset -2px | same |
| icon color | rgb(89,99,110) / rgb(145,152,161) | same |
| **rest opacity** | **0** (appears on block hover / focus-within) | **1** (always visible) |

README / file view (ours: grex README.md; github.com: grex blob README.md), 1440 and 390, light and dark:
| property | ours | github.com |
|---|---|---|
| size | 28x28 | 28x28 |
| inset | 8 / 8 | 8 / 8 |
| rest bg / border | transparent / 0 | transparent / 0 |
| hover bg | rgb(239,242,245) / rgb(38,44,54) | same |
| **active bg** | **rgb(230,234,239) / rgb(42,49,60)** | **transparent** (`.btn-invisible:active { background: 0 0 }`) |
| focus outline | 2px, focus-outlineColor, -2px | same |
| **icon x offset** | **6px (centered)** | **4px** |

Code metrics:
- pre: padding 16, radius 6, 11.9px/17.255px in comments and 13.6px/19.72px in READMEs, background bgColor-muted. Identical on repo-pull, file-view-markdown and prom_ex README, at 1440 and 390.
- Inline code: 2.38/4.76 padding, rgba(129,139,152,.12) light and rgba(101,108,118,.2) dark. Identical.

## Issues (most important first)
1. **minor: the floating copy button is hidden at rest; github.com shows it all the time.** Found on issue-detail-playground-reactions-alerts-tables and repo-pull, both schemes and both viewports, selector `.markup .code-copy.auto-hide-control`.
   - Ours has opacity 0 until the block is hovered; github.com has opacity 1 at rest.
   - I dumped every github.com stylesheet rule that mentions zeroclipboard (gh-rules.mjs). There is no hover or opacity reveal rule in the served CSS at all, so the always-visible button is almost certainly the signed-in behaviour too. The "appears on hover" wording in the brief and FG-087 is not supported by the reference.
   - Evidence: `shots/critic-markdown-wL1-r1/issue-detail-playground-reactions-alerts-tables/light-1440.png` (no buttons on the two code blocks) vs `shots/markdown-L1-r1/gh-issue-dark-390-rest.png`.
   - Fix: drop the opacity reveal in src/markdown/copy-button.css, i.e. give `.markup .code-copy.auto-hide-control` `opacity: 1`. This also keeps the button reachable for touch users and simplifies the CSS.
2. **minor (accessibility; not fixable in this folder): the copy button has no accessible name and is now always in the tab order.**
   - Gitea's codecopy.ts creates `button.code-copy` with no aria-label or tooltip. github.com's button has aria-label "Copy code to clipboard".
   - Before this change, Gitea's `visibility: hidden` kept the button out of the tab order until hover. With `visibility: visible` it is reachable by keyboard and screen reader everywhere, but unnamed.
   - Needs a JS or template change from the integrator, or an accepted gap.
3. **nit: the README-variant active state paints a filled bg.** `.file-view.markup` copy button during press (copy-button.important.css `:active`): ours shows button-default-bgColor-active, github.com's btn-invisible shows transparent. Evidence: `shots/critic-markdown-wL1-r1/repo-home-readme-with-images-and-tables/states/dark-1440-copy-press-clip.png` vs `shots/critic-markdown-wL1-r1-ref/repo-home-readme-with-images-and-tables/states/dark-1440-copy-press-clip.png`.
4. **nit: the README-variant icon is centered.** It sits at x 6 inside the 28px button; github.com's sits at x 4. The 2px shift is visible only side by side.
5. **Clarification of a builder gap (no defect).** On the package page the bare `pre.code-block` computes `overflow: hidden`, and its `code` (display block, overflow auto) does the scrolling (pkg2.mjs).
   - So the button does NOT scroll sideways with long lines; it stays put, and the code is clipped before it (`package-detail-npm/states/light-390-copy-hover-clip.png`).
   - The document is 390px wide at 390, so MD-1 is fixed.

## Out-of-folder observations (not scored against markdown)
- The page is 407px wide at 390 on issue #2, the playground repo home and wiki-page-playground. The overflowing element is `.gh-app-header-avatar` (right edge 407), which belongs to the navigation folder.
- The file-view README at 390 has 16px `.file-view.markup` padding; github.com's BlobContent has 32px, which makes our article 356px wide vs 324px. That rule is src/code/file-view.css:268-271, owned by the code folder.
- Syntax colours in code blocks belong to the code folder.
