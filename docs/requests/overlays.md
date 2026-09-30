# Requests from `icons` (wave 1, round 1)

## O-1 Toast icon `gitea-exclamation` is JS-bundled → CSS mask — DONE (overlays r1: src/overlays/toast.css, alert/stop masks keyed on the inline background var and data-toast-unique-key)
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
  — DONE (overlays r1): generalized as `.ui.selection.dropdown > .menu` in action-menu.css (all open selects); integrator
  asked to delete the controls rule (docs/requests/integrator.md OV-1).


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-094 [theme-fixable-css] Flash banners: danger icon in fgColor-default with 4px gap; validation flash has no Octicon/dismiss** — impact 4 (judges 0, critic wt 4; routes: signup, user-settings-account)
   - Fix: .flash-error .svg fgColor-danger, 12px gap; ::before alert mask when Gitea renders no icon.
   - Critic refs: C053 (user-settings-account, minor), C135 (signup, nit)
   - PNG: `shots/final-gate-critic-1/usa-flash-l.png`, `shots/final-gate/signup/dark-1440.png`, `shots/final-gate/signup/light-1440.png`, `shots/final-gate/user-settings-account/dark-1440.png`
2. **FG-103 [theme-fixable-css] Destructive confirm dialogs use a green primary 'Confirm' (Primer: danger button)** — impact 3 (judges 0, critic wt 3; routes: labels)
   - Fix: Style the confirm button of delete modals (data-modal-confirm / .delete modals) as danger.
   - Critic refs: C149 (labels, minor)
   - PNG: `shots/final-gate/labels/dark-390.png`
3. **FG-121 [theme-fixable-css] Long ActionMenu (theme picker) has no scroll affordance** — impact 1 (judges 0, critic wt 1; routes: user-settings-appearance)
   - Fix: Bottom fade / visible scrollbar in overflowing menus.
   - Critic refs: C085 (user-settings-appearance, nit)
   - PNG: `shots/final-gate/user-settings-appearance/light-1440.png`
