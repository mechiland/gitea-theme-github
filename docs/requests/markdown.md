# Requests for markdown

# Integrator (end of wave 2, 2026-09-30)
## MD-1 `.markup pre` lacks Primer's `overflow: auto` (critic markdown-w2-r2 #1) — DONE (L1 r1): `.markup pre { overflow: auto }` in src/markdown/code.css; package-detail-npm 390 document 390px wide, no horizontal overflow (shots/markdown-r1).
/octo-org/-/packages/npm/%40octo-org%2Ftheme-tokens/1.0.0 at 390 (route package-detail-npm, both schemes): document
438px wide; the overflowing element is the `code` inside the .npmrc `pre` (x 48–438). gitea-auto has no overflow there.
Primer markdown/code.scss sets `overflow: auto` next to `overflow-wrap: normal`; src/markdown/code.css copies only the
latter. Proposed: `.markup pre { overflow: auto; }`.

# Integrator (end of wave 3, 2026-09-30)
- **MD-1** (`.markup pre { overflow: auto }`) — DONE (L1 r1), see above. Status of the package page overflow at 390 is in docs/STATUS.json audit.horizontalOverflow390 (shots/integrate-w3).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. DONE (L1 r1): src/markdown/copy-button.css — comments/wiki/releases/packages: bordered default Button 34x36 at 8px/8px (github.com measured), revealed on block hover/focus-within (opacity, stays keyboard-focusable), always shown on hover:none; README/file view keep github.com's always-visible 28px invisible button in its own column. **FG-087 [theme-fixable-css] Code-block copy button always visible and borderless, overlapping code at 390 (github.com: bordered 32px IconButton on hover)** — impact 4 (judges 0, critic wt 4; routes: repo-pull, issue-detail-playground-reactions-alerts-tables)
   - Fix: Reveal on pre:hover / :focus-within, bordered IconButton, pre padding-right.
   - Critic refs: C119 (issue-detail-playground-reactions-alerts-tables, minor), C141 (repo-pull, nit)
   - PNG: `shots/final-gate-critic-4/issue-detail-playground-reactions-alerts-tables-390-0.png`, `shots/final-gate/repo-pull/dark-390.png`, `shots/final-gate/repo-pull/dark-1440.png`, `shots/final-gate/repo-pull/light-390.png`


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. DONE (L2 r1): copy button now always visible on every code block (comments, wiki, releases, packages, READMEs), matching github.com, re-probed live on 2026-09-30 (pemistahl/grex README + pull/42, mouse never moved, (hover: hover) true: `.zeroclipboard-container` has opacity 1 and display block at rest, and github.com's CSS has no hover reveal). The README half of C149 is contradicted by github.com; C123 (hidden in the PR comment) is fixed. Measured with shots/markdown-L2-measure.mjs, gitea = github in light and dark: 34x36 at 8/8, README icon offset 4/6. PNGs are in shots/markdown-L2-r1b. **FG2-096 [theme-fixable-css] Markdown code-block copy button: always visible in READMEs (github.com: on hover/focus), missing on the repo-pull comment block** — impact 2 (judges 0, critic wt 2; gate 1 FG-087; routes: repo-home, repo-pull)
   - Fix: `.markup pre:not(:hover):not(:focus-within) .code-copy { opacity:0 }` (keep it focusable); check why the PR comment's fenced block has no `.code-copy` (JS adds it after render — maybe the lazy content; if markup-less, skip).
   - Critic refs: C123 (repo-pull, nit), C149 (repo-home, nit)
   - PNG: `docs/reference/repo-pull/light-1440.png`, `shots/final-gate-2/repo-pull/light-1440.png`, `shots/final-gate-2/repo-home/dark-1440.png`, `shots/final-gate-2/repo-home/light-1440.png`
2. DONE (L2 r1): src/markdown/toc.css. The wiki sidebar ToC summary (`.markup.wiki-content-toc > details > summary`) now shows octicon-triangle-down in 16px fgColor-muted, the same as the Pages box caret, rotated -90deg while closed, with a rounded focus ring. User-authored `<details>` keep the UA marker, like github.com's .markdown-body. PNGs are in shots/markdown-L2-r1b/wiki-page-playground/states. **FG2-098 [theme-fixable-css] Markdown `<details>` (ToC box) uses the native ▼ marker instead of an Octicon chevron** — impact 1 (judges 0, critic wt 1; new; routes: wiki-page-playground)
   - Fix: `.markup details > summary::marker { content:'' }` + chevron-right/down mask. The grey Mermaid theme in the same critic is inherent (FG2-100, mermaid-iframe).
   - Critic refs: C058 (wiki-page-playground, nit)
   - PNG: `shots/final-gate-2/wiki-page-playground/light-1440.png`
