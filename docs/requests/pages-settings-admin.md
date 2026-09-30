# Requests for pages/settings-admin

# Integrator (end of wave 3, 2026-09-30)
- **SA-4 — ACCEPTED.** templates/user/settings/layout_head.tmpl (project copy) renders `.gh-settings-header` on github-*
  themes when pageClass contains `settings`. Live install is pending the orchestrator (docs/requests/ORCHESTRATOR.md
  ORC-3; the integrator's write into CUSTOM_PATH was refused by the permission policy). Your header.css is unchanged.
- **SA-1 — DONE** (16 routes merged into tools/shoot/routes.json).
- **SA-C1 (controls caption line-height)** — still open for controls (no controls round scheduled); keep your
  page-scoped 12/18px rule.
- **SA-P1** — DONE by pages/people (`.organization > .flex-container:first-child`).

# Integrator (end of wave 3b, 2026-09-30)
- **ORC-3 / SA-4 — DONE** (orchestrator installed templates/user/settings/layout_head.tmpl; critic w3b-r0 8.6 passed).
## SA-5 Actions > General settings pages get neither the header nor the Subhead/Box styling — OPEN (needs this folder first)
/user/settings/actions/general and /org/octo-org/settings/actions/general render `<div role="main" class="page-content ">`
(upstream `actions_general.tmpl` passes `(dict)`, verified live 2026-09-30), so every `:is(.settings,.admin)`-scoped rule
in this folder misses them. ARCHITECTURE §7 is CSS first, so the integrator did NOT change the template alone (a header
emitted there would be unstyled, because header.css is scoped to `.page-content.settings`).
Proposed order: (1) this folder widens the page scope. Note `.flex-container-nav` alone is NOT settings-only (upstream
also uses it in user/dashboard/issues, user/dashboard/milestones, repo/activity, repo/actions/list), so key on the empty
pageClass instead: `.page-content:is(.settings, .admin, [class="page-content "]:has(> .ui.container > .flex-container-nav))`
(only the two actions_general templates and admin/badge/view — also a settings-style admin page — render `class="page-content "` with a nav column); (2) then the integrator relaxes the layout_head condition to
`(or (not .pageClass) (StringUtils.Contains … "settings"))` for github-* themes so the user page gets the header too.
The org page has no header by design (org/settings/layout_head is not overridden).
- Still OPEN from critic w3b-r0: deploy-keys empty state bare text (suggested selector
  `.ui.attached.segment:has(> #add-deploy-key-panel.tw-hidden):not(:has(.flex-list))`), header title 20/30 vs Primer
  `.h3.lh-condensed` (20 → 18 below 768, line-height 1.25), native ▸ on token rows, Subhead btn-sm padding 0 8px vs 3px 12px.
- Header strings (`your_settings` "Settings", `your_profile` "Profile") — REJECTED as a change: Gitea 1.27.3 has no
  closer locale keys; new locale strings would need a custom locale file for every language. Known gap.
