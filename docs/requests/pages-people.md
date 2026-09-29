# Requests from `icons` (wave 1, round 1)

## P-1 Dashboard repo list (Vue `DashboardRepoList.vue`) non-Octicons → CSS mask
JS-bundled, so the server overrides don't reach them. Needs `src/icons/octicon-masks.css` (docs/requests/icons.md I-4).
- commit status error/warning `gitea-exclamation` (`:38,40`) → `--gh-octicon-alert` (matches the server override).
- pagination first/last `gitea-double-chevron-left/right` (`:500,519`) → `--gh-octicon-arrow-left` / `--gh-octicon-arrow-right`.
```css
.dashboard-repos .gitea-exclamation,
.dashboard-repos .gitea-double-chevron-left,
.dashboard-repos .gitea-double-chevron-right { background-color: currentColor; mask: var(--gh-octicon-alert) center / contain no-repeat; }
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-arrow-left); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-arrow-right); }
.dashboard-repos :is(.gitea-exclamation, .gitea-double-chevron-left, .gitea-double-chevron-right) > * { visibility: hidden; }
```
(Scope selector to be confirmed against the live DOM: `#dashboard-repo-list` / `.dashboard-repos`.)

# Round 3 (icons)
Dashboard repo-list pagination (Vue, `DashboardRepoList.vue:500,519`): to match the server pagination (whose files are
now `move-to-start` / `move-to-end`), use `--gh-octicon-move-to-start` / `--gh-octicon-move-to-end` instead of
`arrow-left` / `arrow-right` in lines 11–12 of the proposal above:
```css
.dashboard-repos .gitea-double-chevron-left { mask-image: var(--gh-octicon-move-to-start); }
.dashboard-repos .gitea-double-chevron-right { mask-image: var(--gh-octicon-move-to-end); }
```

# Round 4 (icons)
No change: the dashboard pagination masks from round 3 (`move-to-start` / `move-to-end`) still match the server
pagination, which now gets the same glyphs through navigation N-3 masks (the server files are Gitea's `«`/`»` again).

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
  P-1 (dashboard repo list masks, move-to-start/end) can ship in wave 3.

# pages/people wave 3 round 1 (builder)
- **P-1 DONE** (wave 3 r1): masks shipped in `src/pages/people/dashboard.css` (`.dashboard-repos .gitea-exclamation` →
  `--gh-octicon-alert`, `gitea-double-chevron-left/right` → `--gh-octicon-move-to-start/-end`, children hidden).
  Not visually verified yet: the seeded dashboard has < 1 page of repos and no error/warning commit status, so none of
  the three glyphs renders on `home`.

# From pages/settings-admin (wave 3, round 2) — SA-P1 [blocker per critic]: `.organization > .flex-container` also matches org SETTINGS
What: every `.organization > .flex-container …` rule in src/pages/people/org.css (lines 17, 29, 35, 40, 53, 60, 66, 72,
98, 104, 115, 259 …) also matches the org settings grid: templates/org/settings/layout_head.tmpl:4 renders
`.page-content.organization.settings > .ui.container.flex-container > .flex-container-nav + .flex-container-main`
right after the org header band. Result (critic, shots/critic-pages/settings-admin-r1/org-settings/): the whole settings
area becomes a --page-header-bgColor full-bleed band, align-items:center drops the nav to y=583, every Subhead
(`.ui.top.attached.header` matches `.organization > .flex-container .ui.header`) gets the band box-shadow, and at 390
`flex-direction: row` squeezes the main column to ~70px (document 434px wide).
Why: the header band is only `templates/org/header.tmpl`'s container; the settings container is pages/settings-admin's.
Proposed diff (scope every header-band selector to the container that has no settings nav):
```css
/* before */ .organization > .flex-container { … }
/* after  */ .organization > .flex-container:not(:has(> .flex-container-nav)) { … }
```
(same `:not(:has(> .flex-container-nav))` on each `.organization > .flex-container` / `.organization:not(.profile) > .flex-container`
selector, including the `+ .ui.container` tab-band rules, which are unaffected but read more clearly with it).
Meanwhile pages/settings-admin guards the grid itself (layout.css: background/box-shadow/clip-path/align-items/
flex-direction reset on `.page-content.settings > .flex-container:has(> .flex-container-nav)`, subhead.css resets the
band box-shadow/clip-path on its Subheads), so either order of landing is safe.
- **SA-P1 DONE** (pages/people wave 3 r2): every header-band selector is now `.organization > .flex-container:first-child`
  (org/header.tmpl is the page's first child on every org page; the settings grid is the third child), so nothing in
  org.css / people.important.css matches `.page-content.organization.settings > .ui.container.flex-container` any more
  (checked: the settings container's margin/background/box-shadow now come only from Gitea + pages/settings-admin).

# Integrator (end of wave 3, 2026-09-30)
- **PPL-1 addendum — DONE** (short custom-property names at build time: auto 435 → 335 KB). Budget still exceeded;
  decision escalated as ORCHESTRATOR.md ORC-4.
- **PPL-N1** (UnderlineNav radius) — still open in docs/requests/navigation.md (no navigation round scheduled).
