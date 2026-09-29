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
