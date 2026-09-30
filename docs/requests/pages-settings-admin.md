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


# Final gate #1 (loop iteration 1)

Source: docs/final-gate/issues.md (full evidence, PNG paths) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only theme-fixable items for this folder are listed; `theme-fixable-template` items need the integrator to install a github-* template branch first (this folder styles the result). Trim before adding (budget caps).

1. **FG-057 [theme-fixable-css] Admin repos table clipped at 1440 (scrollWidth 1052 > 934; Created cut, operations hidden)** — impact 7 (judges 0, critic wt 7; routes: admin-repos)
   - Fix: Tighter cell padding / wrapping so the table fits the column at desktop widths.
   - Critic refs: C102 (admin-repos, major), C103 (admin-repos, nit)
   - PNG: `shots/final-gate/admin-repos/dark-390.png`, `shots/final-gate/admin-repos/dark-1440.png`, `shots/final-gate/admin-repos/light-390.png`, `shots/final-gate/admin-repos/light-1440.png`
2. **FG-062 [theme-fixable-css] Settings buttons: three primary greens on one page, mixed 28/32px sizes, 'Leave' at 32px where github.com uses btn-sm** — impact 7 (judges 0, critic wt 7; routes: repo-settings-branches, user-settings-orgs, user-settings-security)
   - Fix: One primary per view (secondary adds as default), consistent 32px, org rows btn-sm.
   - Critic refs: C078 (user-settings-security, minor), C159 (repo-settings-branches, minor), C055 (user-settings-orgs, nit)
   - PNG: `shots/final-gate/user-settings-security/light-1440.png`, `shots/final-gate/repo-settings-branches/dark-1440.png`, `shots/final-gate/repo-settings-branches/light-1440.png`, `shots/final-gate/user-settings-orgs/dark-1440.png`
3. **FG-064 [theme-fixable-css] Empty states are bare text (webhooks, deploy keys, collaborators), not bordered Blankslates** — impact 7 (judges 0, critic wt 7; routes: org-settings-hooks, repo-settings-deploykeys, repo-settings-collab)
   - Fix: Box + Blankslate styling around Gitea's empty-state text (collaborators: style the empty list container). Subhead 'Settings' vs 'Webhooks' is template text: skip.
   - Critic refs: C021 (org-settings-hooks, minor), C079 (repo-settings-deploykeys, minor), C128 (repo-settings-collab, nit)
   - PNG: `shots/final-gate/org-settings-hooks/light-1440.png`, `shots/final-gate/repo-settings-deploykeys/light-1440.png`, `shots/final-gate/repo-settings-collab/light-1440.png`, `shots/final-gate/org-settings-hooks/light-1440.png`
4. **FG-065 [theme-fixable-css] Settings/admin at 390: every 'Run' button wraps under its text, banner editor toolbar wraps with dangling separators, 'New Organization' on its own line** — impact 7 (judges 0, critic wt 7; routes: admin-dashboard-config-settings, site-admin, user-settings-orgs)
   - Fix: Action right-aligned on the first line, text wraps; toolbar separators hidden when wrapped.
   - Critic refs: C188 (site-admin, minor), C105 (admin-dashboard-config-settings, minor), C056 (user-settings-orgs, nit)
   - PNG: `shots/final-gate/site-admin/light-390.png`, `shots/final-gate-critic-7/site-admin/light-390-0.png`, `shots/final-gate-critic-1/user-settings-orgs-mob.png`, `shots/final-gate/admin-dashboard-config-settings/dark-390.png`
5. **FG-079 [theme-fixable-css] Settings details: config dl rows without Box-row separators, email list not in a Box, token/OAuth 'Generate' as <summary> triangles, ToggleSwitch mid-row, org description textarea full width** — impact 5 (judges 0, critic wt 5; routes: org-settings, admin-dashboard-config-settings, site-admin-config, user-settings-account, user-settings-applications)
   - Fix: Box rows; summary styled as a default button (no marker); toggles at row end; textarea max-width 440px.
   - Critic refs: C030 (site-admin-config, nit), C054 (user-settings-account, nit), C104 (user-settings-applications, nit), C106 (admin-dashboard-config-settings, nit), C203 (org-settings, nit)
   - PNG: `shots/final-gate-critic-1/sac-light-b.png`, `shots/final-gate/org-settings/dark-1440.png`, `shots/final-gate/org-settings/light-1440.png`, `shots/final-gate/admin-dashboard-config-settings/dark-1440.png`
6. **FG-082 [theme-fixable-css] Admin tables: status icons accent-blue/green mixed, trash and edit pencils accent-blue (Primer: muted icon buttons, danger on hover)** — impact 4 (judges 0, critic wt 4; routes: admin-emails, admin-orgs)
   - Fix: Status icons success/muted; row actions muted IconButtons.
   - Critic refs: C161 (admin-emails, minor), C130 (admin-orgs, nit)
   - PNG: `shots/final-gate/admin-emails/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`, `shots/final-gate/admin-emails/light-1440.png`, `shots/final-gate/admin-orgs/light-1440.png`
