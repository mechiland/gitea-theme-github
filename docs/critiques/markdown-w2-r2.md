# Critique: markdown (src/markdown), wave 2, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Verdict: **8.8 / 10, pass.** Console errors 0, literal colours 0, smoke green.

## What I verified myself

| Check | Result |
|---|---|
| `node build/lint.mjs markdown` | 0 errors, 3 warnings, 143 selectors |
| `npm run build` | `folders.markdown` = `{status: ok, lintErrors: 0, files: 11, bytes: 21766}` |
| Served vs dist | sha1 is identical for all three theme files (auto `3a978c14…`, light `f836ab07…`, dark `a10972cc…`), so I did not redeploy |
| Shoot, 10 routes × light/dark × 1440/390, `--states --measure` → `shots/critic-markdown-r2` | 40 pages: 0 console errors, 0 failed requests, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS, no horizontal overflow |
| Off-palette | Only `rgba(0,0,0,.8)` border on `form#comment-form .ui.dropzone` (controls folder). Nothing from markdown |
| CLS | 0.257 and 0.267 on repo-home routes at 390. The source is `div.repo-home-filelist`, which is not markdown and is unchanged from r1. file-view-markdown is 0.05–0.18, from README badge images (content) |
| github.com reference (logged out) → `shots/critic-markdown-r2-ref` | file-view-markdown, prom_ex README and release-detail, with states and measure: 12 pages, 0 errors |
| Smoke `node tools/shoot/smoke.mjs --theme github-auto` | **green**, 12/12 steps, 0 console errors (`shots/20260930-033548-smoke-github-auto/smoke.json`) |

## Claims re-measured independently

### 1. Copy button (was MAJOR): fixed, verified

I wrote my own probe, `shots/critic-markdown-r2/probe/code.mjs` (output in `code.json`). It covers all 26 code blocks of the grex README on both sites, light and dark, at 1440 and 390.

- **Wrapper:** display flex, bg `rgb(246,248,250)` light and `rgb(21,27,35)` dark, radius 0. Identical on both sites.
- **Height:** every block's height is identical on both sites, from 51.7 up to 1253.6.
- **Pre width at 390:** 282 here vs 280 on GitHub. The wrapper is 326 vs 324, so the 2 px comes from page content width.
- **Pre width at 1440:** all 26 blocks are within 0.3 px of GitHub (e.g. 536.4/486.3/864.3 vs 536.4/486.1/864.3). The wrapper is 993.3 vs 1012; that is file-view padding, not this folder.
- **Button:** 28×28, 8 px from the top and 8 px from the right, always visible, on every block and in every scheme.
- **Side by side** (`probe/sbs-code390-{light,dark}.png`): code stops at the button column, as on GitHub. The issue #2 dark 390 blocks (`probe/iss-d390-0.png`, `-1.png`) no longer run under the icon.
- **States** (`probe/states-copy.png`, `probe/states-fv-sbs.png`): hover, focus ring and press in light and dark match github.com's copy-hover and copy-focus clips.

### 2. Release bodies (was MAJOR): fixed, verified

Probe: `probe/release.mjs`, v1.4.6 against github.com, 1440 and 390, light and dark.

| | ours | github.com |
|---|---|---|
| body | 16px/24 | 16px/24 |
| h3 | 20px/25, weight 600 | 20px/25, weight 600 |
| ul | disc, 32px padding | disc, 32px padding |
| li | 16px/24 | 16px/24 |
| body height at 1440 | 238 | 238 |
| body height at 390 | 382 | 382 |

Side by side: `probe/sbs-release-{light,dark}-390.png`. The only visible difference is `@jqnatividad`, which is plain text here because that user does not exist on this Gitea. That is content, not the theme.

### 3. @mentions (was MINOR): fixed, verified

- The playground (6 mentions, including the team mention `/org/octo-org/teams/core`) and issues #1 and #2 all measure fgColor-default (rgb(31,35,40) light, rgb(240,246,252) dark), weight 600, underline, nowrap.
- No non-mention link picked up the semibold style.
- Crops: `probe/mention-stack.png`.
- Source check: `createLink` (modules/markup/html.go:435) adds `data-markdown-generated-content` to autolinks (absolute href), mailto (`mailto:`), issue refs (class `ref-issue`) and commits (class `commit`). Only mentions have a `/`-rooted href and no class, so the selector is sound.

### 4. Heading anchor (was NIT): fixed, verified

Probe: `probe/anchor.mjs` on hovered headings.

| | anchor box | svg |
|---|---|---|
| h2, ours | 28×28, dx −28, dy 0.3 | dx −24, dy 6.3 |
| h2, github.com | 28×28, dx −28, dy 0.3 | dx −24, dy 6.3 |
| h3, ours | dy −1.5 | dy 4.5 |
| h3, github.com | dy −1.5 | dy 4.5 |

Identical on both sites.

### 5. Colour swatch (was NIT): fixed, verified

- The playground README and the file view each show 4 swatches, all `display:none`.
- I rendered hex code spans through `/api/v1/markdown` (read-only render) and injected the result into an issue comment in the local DOM only; nothing was submitted.
- There the swatch shows as 8×8, 4 px left margin, 1 px `borderColor-muted` (rgba(209,217,224,.7) light, rgba(61,68,77,.7) dark), radius full.
- Evidence: `probe/inject-vp-dark-390.png`.

### Regression check (vertical rhythm)

I re-ran my r1 block-offset script (`probe/sections.mjs`). It compares the playground README on Gitea with GitHub's own render of it injected into github.com.

- **At 1440, light and dark:** all 54 top-level blocks up to Media have identical top and height. This is unchanged from r1, and the new flex wrapper did not move anything.
- **At 390:** the first difference is block 16, the mentions paragraph, which is 144 vs 168. `probe/sbs-mentions-390.png` shows the cause is content: GitHub's render leaves the long commit SHA unlinked, which forces an extra line.

## Issues (most important first)

### 1. MINOR: a bare `<pre>` with a long line spills out of its box

- **Selector:** `.markup pre`, which has no `overflow: auto`.
- **What the builder did:** copied Primer's `pre { overflow-wrap: normal }` into `code.css`.
- **What was missed:** the rule next to it in `node_modules/@primer/css/markdown/code.scss:54-57` (`.highlight pre, pre { padding; overflow: auto; … }`).

Markdown fences are not affected, because Gitea's `.code-overflow-scroll pre` sets `overflow-x: auto`. Every `pre` that is not inside `.code-block-container` is:

- **Package pages (a regression against stock Gitea).** Route `/octo-org/-/packages/npm/%40octo-org%2Ftheme-tokens/1.0.0`, light 390 (`probe/pkg390-light.png`). The `.npmrc` line `@octo-org:registry=http://localhost:3000/api/packages/octo-org/npm/` runs past the grey box's right edge.
  - Measured: pre is 326 wide with scrollWidth 406, `overflow: visible`, `overflow-wrap: normal`; the code's right edge is 438 against the pre's right edge at 358.
  - Stock gitea-auto wraps the same line inside the box (`overflow-wrap: break-word`, code right 346 < pre right 369; `probe/pkg390-giteaauto.png`).
- **Raw HTML `<pre>` in markdown and comments.** The same injection at 390 (`probe/inject-vp-dark-390.png`): pre is 324 wide, scrollWidth 891, and the text runs over the comment box edge. GitHub scrolls it (`overflow: auto`).
- **Fix, in this folder:** add `overflow: auto` to `.markup pre` in `src/markdown/code.css`. Optionally also set `.markup pre > code { white-space: pre }` (Primer). Then recheck the package page: its copy button is the absolute, always-visible one, and it must not cover the scrolled text.

### 2. NIT: VS16 emoji are 16 px here, 20 px on GitHub

The builder acknowledged this. The ⚠️ from `:warning:` is 16 px here; GitHub's `g-emoji` is 20 px. Gitea's `span.emoji` markup gives no way to single these out in CSS, so I accept it as a documented gap. It is rare in practice.

### 3. Not verified (by anyone)

- `.code-preview-container` permalink previews.
- Jupyter renders.
- The `code-overflow-wrap` container mode (devtest only).
- Mermaid and KaTeX against GitHub (no logged-out reference exists). They render legibly in light and dark (`probe/pgL-3.png`, `wiki-page-playground/light-390.png`), but mermaid uses its default grey node style.

## Out of scope, seen in passing

- Syntax token colours (e.g. TOML `[dependencies]` is plain here and purple on GitHub): code folder, already requested as M-1.
- Diff fence red/green line backgrounds in issue #2: code (chroma).
- The release page has no divider or spacing between the meta line and the body, and no Contributors or reactions area: pages/repo layout, not `.markup`.
- prom_ex README content width is 856 here vs 838 on GitHub, which changes table wrapping (591 vs 615 at 1440; identical 1719 at 390): repo-home layout.
- `repo-home-filelist` CLS of about 0.26 at 390: code/pages.

## Score rationale

All three r1 defects are fixed, and my own probes show them at pixel parity with github.com:

- 26 code blocks within 0.3 px, with the button 8/8 px from the corner in every scheme and viewport;
- the release body identical to the pixel height;
- mention style exact;
- anchors identical.

Vertical rhythm still matches across 54 blocks. The remaining defect is the missing `overflow: auto` on non-fenced `pre`. It is outside the main markdown routes but visible on package pages at 390, and it is a small regression against stock Gitea there. That and the emoji nit keep this just under 9.
