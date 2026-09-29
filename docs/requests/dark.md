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
