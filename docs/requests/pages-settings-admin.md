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

# From data-display (final gate #1 loop, round 1)
## DD-SA-1 (FG-111) let the table-scroll shadows through: `background` shorthand → `background-color`
data-display `tables.css` now draws scroll shadows on `.ui.attached.table.segment` (background-image layers with
`background-attachment: local/scroll`: a soft `--borderColor-emphasis` shade on the edge that has hidden columns,
invisible when the table fits). On admin/settings pages two later-layer shorthands in `src/pages/settings-admin/subhead.css`
reset `background-image` to `none`, so admin users / admin emails at 390 still clip columns with no affordance.
Proposed diff (colour unchanged, only the longhand):
```diff
 /* flat body */
 :is(.settings, .admin, [class="page-content "]) .flex-container-main .ui.attached.segment {
 …
-  background: transparent;
+  background-color: transparent;
 …
 /* Box body: tables, and lists whose first row is a real row */
 :is(.settings, .admin, [class="page-content "]) .flex-container-main .ui.attached.segment:not(.danger, :has(> .divider + .flex-divided-list)):is(.table, :has(> .flex-divided-list > .item:first-child > :not(p))) {
   border: var(--borderWidth-thin) solid var(--borderColor-default);
   border-radius: var(--borderRadius-medium);
-  background: var(--bgColor-default);
+  background-color: var(--bgColor-default);
 }
```
(The flat rule's `background-image` stays Gitea's `none` for every other segment, so nothing else changes.)
Verified by injection (`background: revert-layer` on that element in gh.pages-settings-admin) on /-/admin/emails at 390,
light, scrollLeft 0 and 90: right shade at rest, both shades mid-scroll (scratchpad sims `dd-sim-ae-*.png`).
Note: the header row (`th` on `--bgColor-muted`) paints over the shade; body rows show it.

# Builder pages/settings-admin — wave L1 round 1 (2026-09-30)
- **FG-057 — DONE.** Admin list DataTables: 16px at the Box edges, 8px between cells (admin.css). admin-repos
  scrollWidth 1052 → 934 = clientWidth at 1440 (measured live, /-/admin/users also 934/934); Created + Op. visible.
- **FG-062 — DONE.** buttons.css: Subhead actions 32px/14px default, Box-row actions ("Leave", "Delete", "Remove") 28px;
  demoted to default: security "Add Security Key" / "Add OpenID URI", branches "Update Default Branch" / "Add New Rule",
  collaborators "Add Team", Actions > General "Add", "Update Avatar" (user/org/repo), plus the earlier list.
- **FG-064 — DONE.** blankslate.css: empty webhooks (description in a Blankslate Box), empty deploy keys, collaborators
  with none yet (add form centred in the Box). Subhead text "Settings" on org hooks is template text (skipped).
- **FG-065 — DONE.** Maintenance "Run" stays on the right of the first line below 768px (text wraps); Subheads with actions
  no longer wrap the action under the heading (390: "Manage Organizations" + "New Organization" on one row); banner
  editor toolbar separators hidden below 768px.
- **FG-079 — DONE** except the token-row ▸ (see integrator request SA-6): config dl rows are Box-rows with 1px
  --borderColor-muted separators; email list is a Box of Box-rows; "Generate New Token" / "Create a new OAuth2
  Application" summaries are default buttons without the marker; ToggleSwitch at the row end; description textarea 440px.
- **FG-082 — DONE.** Status checks success / x muted (also when wrapped in a link); row actions are 28px invisible
  IconButtons (muted, hover --control-transparent-bgColor-hover, trash → --fgColor-danger), focus ring verified.
- **SA-5 step 1 — DONE.** Every page-scoped rule now uses `:is(.settings, .admin, [class="page-content "])` (same 0,1,0
  specificity; only the actions_general and admin/badge/view layouts render that exact class, plus the non-repo 404,
  which has no settings markup). Step 2 (template condition) requested in docs/requests/integrator.md SA-5b.
- Deploy-keys empty state (critic w3b-r0) — DONE (same Blankslate). Subhead btn-sm padding item — superseded (Subhead
  actions are 32px medium now). Header title 20/30 vs 18/1.25 — still open.

# From icons (final gate #1, wave L1 round 1)
- **SA-6** (asked in integrator.md): `--gh-octicon-chevron-right` now exists in `src/icons/octicon-masks.css` (0.30 KB once
  referenced); also `chevron-down`, and the settings NavList set listed in docs/requests/navigation.md.

# Integrator (loop 1 integration pass, 2026-09-30 14:30) — DD-SA-1 applied as a seam fix
- **DD-SA-1 — DONE by the integrator** (cross-folder conflict: this layer's `background` shorthands reset data-display's
  table scroll-shadow `background-image`). `src/pages/settings-admin/subhead.css`: the flat-body rule
  (`… .flex-container-main .ui.attached.segment`) now sets `background-color: transparent` and the Box-body rule sets
  `background-color: var(--bgColor-default)` — exactly the diff data-display proposed, nothing else touched. Probe before:
  /-/admin/emails 390 `.ui.attached.table.segment` background-image `none` with scrollWidth 485 > clientWidth 374.
- **SA-5b — ACCEPTED** (template edited; live install pending ORCHESTRATOR.md ORC-11). **SA-6** mask exists; unused (pruned).
- Budget: the integrator trimmed never-used rules in this folder (see STATUS.json → budget.loop1 for bytes and the list).
