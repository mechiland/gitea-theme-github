# Requests for markdown

# Integrator (end of wave 2, 2026-09-30)
## MD-1 `.markup pre` lacks Primer's `overflow: auto` (critic markdown-w2-r2 #1, still open)
/octo-org/-/packages/npm/%40octo-org%2Ftheme-tokens/1.0.0 at 390 (route package-detail-npm, both schemes): document
438px wide; the overflowing element is the `code` inside the .npmrc `pre` (x 48–438). gitea-auto has no overflow there.
Primer markdown/code.scss sets `overflow: auto` next to `overflow-wrap: normal`; src/markdown/code.css copies only the
latter. Proposed: `.markup pre { overflow: auto; }`.
