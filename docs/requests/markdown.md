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
