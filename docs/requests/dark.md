# From data-display (wave 2, round 2)
## DD-D1 IssueLabel ring in dark mode
data-display w2r2 made the light IssueLabel border transparent (github.com light: label colour at alpha 0;
white labels get `--borderColor-default`), `src/data-display/labels.css` `.ui.label[style], .labels-list .ui.label`.
In dark mode that loses the ring that kept near-black labels (e.g. grex `github_actions`, `rust` = #000000) visible on
`--bgColor-default` (shots/data-display-r2b/repo-pulls/dark-1440.png). github.com dark IssueLabels always have a visible
border (label colour lightened, ~30% alpha). Gitea's inline `color/background-color !important` can't be changed, but
the border can. Proposed (dark-only, gh.dark):
```css
.ui.label[style],
.labels-list .ui.label,
a.ui.label[style]:hover {
  border-color: color-mix(in srgb, currentColor 30%, transparent);
}
```

# Integrator (end of wave 2, 2026-09-30)
- **DD-D1 — DEFERRED to the wave-3 dark builder, as the first item of its brief** (escalated by data-display as DD-I1).
  src/dark/ is yours; add `labels.css` with the DD-D1 block and `@import "./labels.css";` in index.css. The regression is
  visible in shots/integrate-w2-states/repo-issues/states/dark-1440-label-filter-open-clip.png (`github_actions` label,
  #000000, has no edge on the dark overlay) and shots/integrate-w2/repo-pulls/dark-1440.png.

# dark (wave 3b, round 1)
- **DD-D1 — DONE** (src/dark/labels.css): went beyond the ring — dark IssueLabels now follow github.com's dark
  IssueLabel recipe (18 % label-colour tint, 30 % ring, label-coloured text lightened for dark labels), built from the
  inline colour via `background-clip: text` + inherited `background-color` in ::before/::after; `github_actions`/`rust`
  (#000000) read grey with a visible ring on the page and on overlays (shots/dark-r1/repo-pulls/dark-1440.png,
  shots/dark-r1/repo-issues/states/dark-1440-label-filter-open-clip.png). Light scheme untouched.

# Integrator (end of wave 3b, 2026-09-30)
- **DD-D1 — DONE (verified).** Critic dark-w3b-r1 8.6 (passed). `gh.dark` is emitted only inside
  `@media (prefers-color-scheme: dark)` in theme-github-auto and not at all in theme-github-light
  (light .src.css byte-identical with and without src/dark; minified light differs only in the short var names).
  Light-scheme pixel proof: shots/integrate-w3b-light vs shots/integrate-w3b-light-nodark (see STATUS.json
  `wave3b.darkOnlyPixeldiff`). Layer size: 1,293 B (auto), 1,257 B (dark).
- **OPEN for a future dark round (critic dark-w3b-r1, no round scheduled):**
  1. (minor) saturated dark labels paler than github.com: 50 % white veil vs GitHub's HSL lightness shift;
     critic's measured option: 60 % veil + `filter: saturate(1.8)` on `.gt-ellipsis` (mean error 61 → 53/channel, #000 → #999).
  2. (nit) scoped labels draw a double seam where `.scope-left`/`.scope-middle` rings meet — drop one inner edge.
  3. (nit) selected label text is low-contrast (`-webkit-text-fill-color: transparent`) — add `::selection` with a token text-fill.
  4. (nit) `inset: -1px` → `calc(-1 * var(--borderWidth-thin))` (token rule; lint accepts it today).
- IssueLabel weight 500 vs github.com 600 is not dark-specific → forwarded to data-display (DD-W3B-1).
