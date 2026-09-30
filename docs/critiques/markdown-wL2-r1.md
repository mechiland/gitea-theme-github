# Critique: markdown, wave L2, round 1 (FG2-096 copy button, FG2-098 ToC details marker)

Critic: independent GitHub design-systems reviewer. Date: 2026-09-30. No theme code was touched.

## Verdict
**Score 9.0 / 10. PASS.** Pass criteria: score >= 8.5, 0 console errors, 0 literal colors, smoke green.

Both fixes are real, and I verified them myself.
- **FG2-096.** The copy button is now visible at rest in the PR comment, which was the C123 bug. It matches github.com pixel-for-pixel in light and dark at 1440 and at 390. I re-probed github.com myself. Its copy button has an effective opacity of 1 at rest, with (hover: hover) true and the mouse never moved. Its stylesheets have no hover-reveal rule for `.zeroclipboard-container`. The builder's reading of C149 therefore stands: github.com shows the README button at rest.
- **FG2-098.** The wiki ToC summary uses Octicon triangle-down in fgColor-muted. It matches the Pages box caret above it and rotates when closed. Its focus ring is rounded.

## Checks
- `node build/lint.mjs markdown`: 0 errors, 3 warnings. The warnings were already there.
- `npm run build`: `folders.markdown.status` is "ok", with 13 files and 25,756 bytes. The whole build reports OVER BUDGET: theme-github-auto.css is 319.4 KB against a 300 KB budget. Most of that comes from other folders.
- Served CSS differs from dist only in other folders' minified token names. It already contains this folder's `code-copy.auto-hide-control{visibility:visible;opacity:1}` rule and the ToC clip-path rule, so I did not deploy.
- Screenshots are in shots/critic-markdown-wL2-r1 (ours) and shots/critic-markdown-wL2-r1-ref (github.com). There are 6 routes, in light and dark at 1440 and 390, with states. The routes file is shots/critic-markdown-wL2-r1-routes.json.
  - 24 pages, 0 console errors, 0 failed requests, 0 off-palette colors, 0 non-Octicon icons.
  - 1 unresolved var, `--gh-octicon-calendar`, on `input[type=date]`. That is the forms/icons folders' surface, not markdown.
- `node tools/shoot/smoke.mjs --theme github-auto`: all steps ok, 0 console errors. The run is in shots/20260930-165550-smoke-github-auto. **Green.**
- The geometry probe is shots/critic-markdown-wL2-r1-probe.mjs, with results in shots/critic-markdown-wL2-r1-probe.log.

## Measurements (ours = github.com; light, dark, 1440 and 390)
| control | property | ours | github |
|---|---|---|---|
| comment copy btn (repo-pull) | box | 34x36 | 34x36 |
| comment copy btn | offset from block top/right | 8/8 | 8/8 |
| comment copy btn | icon offset left/top | 9/9 | 9/9 |
| comment copy btn | radius / border | 6px, 1px rgb(209,217,224) light / rgb(61,68,77) dark | same |
| comment copy btn | rest bg | rgb(246,248,250) light / rgb(33,40,48) dark | same |
| comment copy btn | hover bg | rgb(239,242,245) / rgb(38,44,54) | same |
| comment copy btn | pressed bg | rgb(230,234,239) / rgb(42,49,60) | same |
| comment copy btn | effective opacity at rest | 1 | 1 |
| README copy btn (file-view-markdown) | box / offset | 28x28 at 8/8 | 28x28 at 8/8 |
| README copy btn | icon offset left/top | 4/6 | 4/6 |
| README copy btn | hover bg | rgb(239,242,245) / rgb(38,44,54) | same |
| README copy btn | **pressed bg** | **rgb(230,234,239) / rgb(42,49,60)** | **transparent (block bg shows: rgb(246,248,250) / rgb(21,27,35))** |
| copy icon | size / color | 16px, rgb(89,99,110) light / rgb(145,152,161) dark | same |
| pre | padding-right / overflow | 16px / auto | 16px / auto |
| focus ring (both variants) | width/color/offset | 2px accent inset, per screenshots | same |

## Issues (most important first)
1. **nit: the README copy button's pressed background differs from github.com.**
   - Where: `.file-view.markup` copy button, `:active`.
   - Ours paints opaque button-default-bgColor-active: rgb(230,234,239) light, rgb(42,49,60) dark.
   - github.com's `.btn-invisible:active` sets `background: 0 0`, so the button is transparent while pressed. Its rule meant for a selected background (`.btn-invisible:active .btn-invisible.zeroclipboard-is-active`) is a broken descendant selector and never matches.
   - Evidence: shots/critic-markdown-wL2-r1/zoom-copy-q3.png and zoom-copy-q4.png (rows file-view-markdown light/dark-1440 copy-press), plus the pixel samples in the table above.
   - Fix: scope the `:active` background in copy-button.important.css to the floating variant only, or give the rendered-file variant `background: transparent`.
   - The state lasts only as long as the mouse button is held.
2. **nit: Mermaid view controls stay hidden at rest; github.com shows them at rest.**
   - The builder says Mermaid's controls "still use the reveal".
   - github.com's mermaid blocks, probed on mermaid-js/mermaid README.md logged out, show the copy and fullscreen buttons and the pan/zoom pad at rest, with no hover. Evidence: shots/critic-markdown-wL2-r1/gh-mermaid-rest.png.
   - In ours (wiki-page-playground light-1440), the copy button is visible over the diagram. That is consistent with github.com. `.mermaid-block .view-controller` (zoom in / reset / zoom out) is still hover-only.
   - This was already the case before this round and is outside FG2-096's scope. For consistency, drop the reveal for `.mermaid-block .view-controller.auto-hide-control` too.
3. **nit (accepted, the same on github.com): the first code line runs under the floating button at 390.** Evidence: issue-detail-playground-reactions-alerts-tables dark-390 copy-focus. The single-line `.markdown-alert-title svg { fill: cu…` continues under and past the button. github.com has the same overlap on pull/42 at 390, confirmed in sbs-repo-pull-states-390.png. No action.
4. **info: the ToC focus ring hugs the summary with no inner padding.** Evidence: wiki-page-playground toc-focus, light and dark, 1440 and 390, in shots/critic-markdown-wL2-r1/toc-states.png. The ring runs tight around the triangle and the text. The summary has no padding, so this is acceptable and matches the page's other disclosure summaries. No github.com reference exists, because the ToC box is Gitea chrome.

## Screenshots reviewed
- shots/critic-markdown-wL2-r1/zoom-copy-q1..q4.png: ours vs github, copy hover, focus and press, in light and dark at 1440 and 390.
- shots/critic-markdown-wL2-r1/sbs-repo-pull-states-390.png
- shots/critic-markdown-wL2-r1/repo-pull/light-1440.png: button visible at rest.
- shots/critic-markdown-wL2-r1/sbs-readme-dark-1440.png
- shots/critic-markdown-wL2-r1/toc-states.png
- shots/critic-markdown-wL2-r1/wiki-page-playground/light-1440.png
- shots/critic-markdown-wL2-r1/issue-detail-playground-reactions-alerts-tables/states/dark-390-copy-focus.png
- shots/critic-markdown-wL2-r1/gh-mermaid-rest.png
- shots/critic-markdown-wL2-r1/repo-pull/states/light-1440-copy-hover-clip.png (ours) and shots/critic-markdown-wL2-r1-ref/repo-pull/states/light-1440-copy-hover-clip.png (github.com)
