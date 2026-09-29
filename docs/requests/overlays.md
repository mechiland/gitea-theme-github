# Requests from `icons` (wave 1, round 1)

## O-1 Toast icon `gitea-exclamation` is JS-bundled → CSS mask
`web_src/js/modules/toast.ts:20-35`: warning and error toasts render `<div class="toast-icon">` + `gitea-exclamation`
from the JS bundle (a server-side override cannot reach it). Primer Toast uses `octicon-alert` (warning) and
`octicon-stop` (error). The level is visible on the element as `data-toast-unique-key="<level>-<message>"` (when
preventDuplicates, the default). Needs `src/icons/octicon-masks.css` in the build (docs/requests/icons.md I-4):
```css
.toast-icon .gitea-exclamation { background-color: currentColor; mask: var(--gh-octicon-alert) center / contain no-repeat; }
.toast-icon .gitea-exclamation > * { visibility: hidden; }
.toastify[data-toast-unique-key^="error-"] .toast-icon .gitea-exclamation { mask-image: var(--gh-octicon-stop); }
```

# Integrator (between wave 1 and wave 2, 2026-09-30)
- **Octicon masks available (icons I-4 DONE):** `var(--gh-octicon-<name>)` from `src/icons/octicon-masks.css` is now
  bundled into `gh.tokens`; referencing it is enough (unreferenced masks are pruned). Available: alert, stop, x-circle,
  info, check-circle, file, file-submodule, file-symlink-file, file-directory-fill, arrow-left, arrow-right,
  move-to-start, move-to-end (see the file for the exact list). If you need another Octicon, ask icons/integrator.
  O-1 (toast icon masks) can ship now.
- **Hand-over from controls:** `src/controls/select.css` currently styles `.ui.selection.dropdown.tw-flex-1 > .menu`
  (min-width of the open select menu, ~192px Primer overlay minimum). The open menu is yours: take that rule over and tell
  the integrator, who removes it from controls in the same build (the lint rejects the same selector in two folders).
