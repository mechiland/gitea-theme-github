# Critique: markdown (src/markdown), wave 2, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Verdict: **8.3 / 10, not a pass (below 8.5).** Console errors 0, literal colours 0, smoke green.

## What I verified myself

| Check | Result |
|---|---|
| `node build/lint.mjs markdown` | 0 errors, 3 spacing warnings, 130 selectors |
| `npm run build` | `dist/build-report.json` has `folders.markdown.status` = `ok` (11 files, 18,346 B) |
| Served vs dist | `theme-github-auto.css` sha1 is `39548258…` for both, so I did not redeploy |
| Shoot, 10 routes × light/dark × 1440/390, `--states --measure` → `shots/critic-markdown-r1` | 40 pages: 0 console errors, 0 failed requests, 0 unresolved vars, 0 non-Octicon icons, 0 pages with unlayered Gitea CSS, no horizontal overflow at 390 |
| Off-palette | Only two colours, neither from markdown: `rgba(0,0,0,1)` fill on `svg#svg-mfi-*` (file-list icons, code/navigation) and `rgba(0,0,0,.8)` on `.ui.dropzone` (controls) |
| github.com reference (logged out), file-view-markdown / repo-home-readme-with-images-and-tables / wiki-page with states → `shots/critic-markdown-r1-ref` | captured |
| Smoke `node tools/shoot/smoke.mjs --theme github-auto` | **green**, all 12 steps ok, 0 console errors (`shots/20260930-030953-smoke-github-auto/smoke.json`) |

For a like-for-like comparison I ran the builder's probe into my own folder, then wrote an independent block-offset script, `shots/critic-markdown-r1/sections.mjs`. It renders the playground README on Gitea next to GitHub's own render of the same README injected into github.com (local DOM only, nothing submitted). The results:

- **All 55 top-level blocks before the Media section have identical top offsets and heights**, within 0.1 px, in light and dark. Examples: h1 50.6 = 50.6, h2 38.2 = 38.2, the text paragraph 96 = 96, blockquote 104 = 104, ordered list 184 = 184, task list 160 = 160, both tables 186 = 186 and 112 = 112, every alert 72 = 72, Go code block 189.6 = 189.6, footnotes 69 = 69.
- Divergence starts only at Media and Math, and both differences are content. GitHub's API cannot resolve the repo-relative images, and GitHub leaves math and mermaid as source until JS renders them.
- Side-by-side PNGs: `shots/critic-markdown-r1/probe/sbs-{light,dark}-{0..7}.png`. I looked at 0–4 and 6. Typography, lists, tables, zebra rows, kbd, mark, blockquote, alerts (light and dark) and code-block chrome are visually indistinguishable.
- States on file-view-markdown compared with github.com (`states-fv-light.png`, `states-zoom.png`): heading hover, anchor focus ring, copy hover (bg rgb(239,242,245) light and rgb(38,44,54) dark, the same on both sites), copy focus ring, link hover and link focus all match to the pixel at 4× zoom.
- Playground states (`states-pg.png`): h1/h3 hover anchors, copy press, link hover and focus, and details open all look right in both schemes.
- Enabled task checkboxes in issue #1 (`tasks-issue-{light,dark}.png`): native 13 px box with the accent tick and a visible 2 px focus ring. The markdown editor Preview tab (`editor-preview-{light,dark}.png`, nothing submitted) renders heading, code, link, alert, code block and task correctly.
- Lazy images: the shoot tool's full-page PNGs show the Media section empty because the images use `loading="lazy"`. That is a tool artefact, not the theme. When I scrolled them into view, all three images loaded at the right sizes with a transparent background (`media-dark.png`).

## Issues (most important first)

### 1. MAJOR: the copy button overlays code text on long lines (every viewport, obvious at 390)

- **Where:** file-view-markdown at 390 in light (`shots/critic-markdown-r1/code390-sbs.png`: ours on the left, github.com on the right). The issue-detail-playground dark 390 capture shows the same thing (`issue-detail-playground-reactions-alerts-tables/dark-390.png`, "currentC…" under the icon).
- **What happens:** Gitea's `.code-copy` is `position:absolute; top:8px; right:8px` over the `<pre>`. On a line that scrolls, the icon sits on top of "port" and "default-f…".
- **What github.com does:** `.js-snippet-clipboard-copy-unpositioned .markdown-body .highlight` is `display:flex; justify-content:space-between; background: bgColor-muted`. The `<pre>` shrinks and scrolls beside the button, which gets its own 8 px margin (`clipboard-copy.m-2`), so code never runs under the button.
- **Measured:** `markdown-pre` width at 390 is 326 px here vs 280 px on GitHub. The 46 px difference is the button column. At 1440 GitHub's pre is 536 px (content width) vs our 993 px.
- **Fix, all in the markdown folder:**
  - `.markup .code-block-container:has(> pre)` gets `display:flex; justify-content:space-between; background-color: var(--bgColor-muted); border-radius: var(--borderRadius-medium)`.
  - Its `> pre` gets `flex: 1 1 auto; min-width: 0`.
  - `> .code-copy` gets `position: static; flex-shrink: 0; margin: var(--base-size-8)`.
  - Keep the 52 px `min-height`, and keep the mermaid/math containers out of this rule.
  - Recheck `code-overflow-wrap` (Gitea's wrap mode), where the button must still not cover text.

### 2. MAJOR: release bodies render at 14 px with circle bullets, while github.com uses 16 px with disc bullets

- **Where:** release-detail light 1440 (`shots/critic-markdown-r1/release-crop.png` against `docs/reference/release-detail/light-1440.png` and `release-ref-bullets.png`).
- **Measured on live github.com** (`/pemistahl/grex/releases/tag/v1.4.6`, logged out): `.markdown-body` 16 px, `li` 16 px, `ul` list-style `disc`, `h3` 20 px.
- **Ours** (`/octo-org/grex/releases/tag/v1.4.6` and `/releases`): `li` 14 px / 21 px, `ul` list-style `circle`, `h3` 17.5 px.
- The builder listed release font size as "unverified". It is visibly off.
- **Cause of the circles:** the body `.markup` sits inside `ul#release-list > li.release-entry`, so the browser's nested-list rule turns its top-level `ul` into `circle`. Any `.markup` inside a list has the same problem.
- **Fix:**
  - Set the list style explicitly: `.markup ul { list-style-type: disc }`, `.markup :is(ul,ol) ul { list-style-type: circle }`, `.markup :is(ul,ol) :is(ul,ol) ul { list-style-type: square }`.
  - Release bodies at `--text-body-size-large`, scoped like the wiki rule the builder already owns: `.repository.releases .release-entry .markup`. Coordinate with pages/repo if they claim the selector.

### 3. MINOR: @mentions look like plain links instead of GitHub's user-mention style

- **Where:** repo-home-markdown-showcase-playground, issue bodies, release bodies (`pgL-02.png` region, `release-crop.png`).
- **Ours:** accent colour (rgb(9,105,218)), weight 400, underlined.
- **github.com:** `.user-mention, .team-mention { font-weight: semibold; color: fgColor-default }`, underlined because link underlines are on. Measured live on the release page: rgb(31,35,40), weight 600, underline.
- **Gitea markup:** `<a href="/alice-dev" data-markdown-generated-content rel="nofollow">@alice-dev</a>`, with no class (`modules/markup/html_mention.go`).
- **Selector that hits only mentions and team mentions** (checked against the playground README and issue #1): `.markup a[data-markdown-generated-content][href^="/"]:not([class])`. Autolinks have absolute hrefs, issue refs carry `class="ref-issue"`, and commit links have no data attribute. Style it with `color: var(--fgColor-default); font-weight: var(--base-text-weight-semibold)`.

### 4. NIT: the heading anchor sits 0.5 px higher than GitHub's

The builder already noted this. I confirmed it at 4× zoom (`states-zoom.png`). It is not visible at 1×.

### 5. NIT: the ⚠️ emoji is 16 px here, 20 px on GitHub

The probe's `emoji` sample: GitHub's `g-emoji` (VS16 emoji only) is 20 px inline-block with vertical-align −1.5 px; ours is 16 px. Only the VS16 shortcodes are affected, which is rare.

### 6. NIT: colour swatches appear after hex codes in README tables

Gitea adds a colour preview dot after `` `#0d1117` `` (`sbs-light-2.png`). GitHub shows these only in issue and PR comments, not in rendered files. This is a Gitea feature, so it is optional to hide it in file and README contexts.

### 7. Not verified by anyone this round

- Permalink code previews (`.code-preview-container`) and the Jupyter render.
- Mermaid and KaTeX output against GitHub (GitHub renders these client-side, so there is no reference).
- Tab width in code blocks: our Go block uses 2 because of the repo's `.editorconfig` (`tab-size-2`, Gitea `!important`); GitHub's rendering looks like 4. This is content and config driven, and I agree it should not be overridden.

## Out of scope, seen in passing

- Syntax token colours inside fences differ from GitHub. Examples: Python `class` is purple here and red there, Go `Greet` is purple here and plain there, dark `def` is yellow here and red there, TOML `[dependencies]` is plain here and purple there. These belong to the code folder (the builder filed M-1).
- The wiki page layout (no Pages sidebar or footer box) belongs to pages/repo.

## Score rationale

Rendered README markdown is close to indistinguishable. The vertical rhythm matches GitHub to 0.1 px over 55 blocks, and the interaction states match to the pixel in both schemes. The deductions are:

- a real overlap defect on every long-line code block (especially on mobile);
- release bodies, a route in scope, off by size and bullet style;
- mentions styled as links, which are common in issues and comments.

With issues 1–3 fixed this folder would be around 9.
