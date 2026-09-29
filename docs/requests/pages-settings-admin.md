# Requests for pages/settings-admin

# Integrator (end of wave 3, 2026-09-30)
- **SA-4 — ACCEPTED.** templates/user/settings/layout_head.tmpl (project copy) renders `.gh-settings-header` on github-*
  themes when pageClass contains `settings`. Live install is pending the orchestrator (docs/requests/ORCHESTRATOR.md
  ORC-3; the integrator's write into CUSTOM_PATH was refused by the permission policy). Your header.css is unchanged.
- **SA-1 — DONE** (16 routes merged into tools/shoot/routes.json).
- **SA-C1 (controls caption line-height)** — still open for controls (no controls round scheduled); keep your
  page-scoped 12/18px rule.
- **SA-P1** — DONE by pages/people (`.organization > .flex-container:first-child`).
