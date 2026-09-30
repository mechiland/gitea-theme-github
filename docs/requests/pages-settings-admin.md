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


# Final gate #2 (loop iteration 2)

Source: docs/final-gate-2/issues.md (full evidence, PNG paths, critic C### ids of docs/final-gate-2/raw.json) and issues.json. Ranked by impact (judge reasons + critic severity), weakest routes first. Only this folder’s theme-fixable items; `theme-fixable-template` items are either installed by the integrator first (this folder styles the result) or stay rejected (noted per item). Budget: github-auto 288.9 / 300 KB — trim before adding. Check every page-scoped selector against the shared page classes (see FG2-105) before you ship.

1. **FG2-032 [theme-fixable-css] Settings empty states (webhooks, deploy keys, collaborators, protected branches, OAuth2 apps, org hooks) are centred muted text or an empty Box, not a Primer Blankslate** — impact 12 (judges 0, critic wt 12; gate 1 FG-064; routes: repo-settings-collab, repo-settings-hooks, repo-settings-deploykeys, repo-settings-branches, org-settings-hooks, user-settings-applications)
   - Fix: One shared rule for the settings empty segment: bordered Box, 32px padding, 24px Octicon via `::before` mask keyed on the page class (webhook / key / people / git-branch / apps), text 16px/600 heading style for the first line. Collaborators: put the add-collaborator input row in the Box header, not centred in an empty Box.
   - Critic refs: C018 (org-settings-hooks, nit), C071 (repo-settings-deploykeys, nit), C089 (user-settings-applications, nit), C112 (repo-settings-collab, minor), C136 (repo-settings-branches, minor), C161 (repo-settings-hooks, minor)
   - PNG: `shots/final-gate-critic-0/osh-l.png`, `shots/final-gate-2/repo-settings-collab/light-1440.png`, `shots/final-gate-2/repo-settings-collab/dark-1440.png`, `shots/final-gate-2/repo-settings-collab/light-1440.png`
2. **FG2-040 [theme-fixable-css] 390 settings/admin: page heading squeezed to 3 lines beside its action button (users, repos, orgs); ToggleSwitches wrap under their labels; full NavList (~460px) precedes the content** — impact 10 (judges 0, critic wt 10; gate 1 FG-065; routes: admin-dashboard-config-settings, admin-orgs, admin-repos, site-admin-users)
   - Fix: < 768: Subhead stacks (heading 100%, actions below, left-aligned); toggle rows `flex-wrap:nowrap` with the switch `flex-shrink:0`; collapse the admin NavList to its selected item + disclosure (or move it after the content with `order`).
   - Critic refs: C004 (site-admin-users, nit), C088 (admin-repos, minor), C091 (admin-dashboard-config-settings, minor), C114 (admin-orgs, minor)
   - PNG: `shots/final-gate-critic-0/site-admin-users-390.png`, `shots/final-gate-critic-4/aorgs-390.png`, `shots/final-gate-2/admin-dashboard-config-settings/dark-390.png`, `shots/final-gate-2/admin-dashboard-config-settings/dark-1440.png`
3. **FG2-042 [theme-fixable-css] Settings details: 2FA is prose + buttons (github.com: method Box rows), org avatar upload is a native file input under the form, appearance uses Selects, cache 'Test' button 8px low, description-less org row off-centre, header copy** — impact 10 (judges 0, critic wt 10; gate 1 FG-079; routes: org-settings, user-settings-security, user-settings, site-admin-config, user-settings-appearance, user-settings-orgs)
   - Fix: Security page: render each method section (TOTP, WebAuthn) as a Box row (title + status Label + action on the right). Org settings: style the file input as a Primer button + muted file name, align Update/Delete. Align `Test` button with `align-self:center`; centre description-less rows. C046/C076 need template changes: skip.
   - Critic refs: C023 (site-admin-config, nit), C038 (user-settings-orgs, nit), C046 (user-settings, nit), C068 (user-settings-security, minor), C076 (user-settings-appearance, nit), C191 (org-settings, minor)
   - PNG: `shots/final-gate-critic-1/sac-m-04.png`, `shots/final-gate-critic-1/uso-light.png`, `shots/final-gate-2/org-settings/dark-390.png`, `shots/final-gate-2/org-settings/dark-1440.png`

# FYI from navigation (wave L2, round 1)
- admin-repos 390 CLS 0.0025 (final-gate-2) → 0.2355 and site-admin-users 390 0 → 0.0612 (shots/navigation-L2r1-all390):
  the shift sources are `div.flex-container-nav` / `details.item`, at t≈75 ms. Likely your FG2-040 `order: 1` (the admin
  NavList now sits below the content, so any early growth of the table above moves it). Not verified by bisecting.
- The settings NavLists now have leading icons and no top heading (FG2-014, nav-list.css); nothing needed from you.

# Builder pages/settings-admin — wave L2 round 1 (2026-09-30)
Screens: shots/pages-settings-admin-r1 … r3 (light/dark, 1440/390), states shots/pages-settings-admin-r3s (own routes file
shots/pages-settings-admin-routes.json: webhook add hover/press/focus, unadopted hover, add-team hover, token open/hover,
config "Open with" open).
- **FG2-032 — DONE.** blankslate.css: one Primer Blankslate rule (Box, 32px padding, 24px Octicon ::before mask
  --fgColor-muted 8px above the text) for empty webhooks + git hooks (webhook), deploy keys (key), branch protection
  (git-branch), SSH/GPG keys, access tokens, OAuth2 apps/grants whose list only holds the description (key). One-line
  "There are no … yet." messages are the Blankslate heading (16px/600/24px --fgColor-default, measured on deploy keys);
  descriptions stay 14px muted. Collaborators / teams add rows (form#repo-collab-form, #repo-collab-team-form) are a
  --bgColor-muted Box-footer under the list Box, or the Box-header row when nobody is added yet (left-aligned).
- **FG2-040 — DONE.** < 768px: Subheads stack (heading full width with text-wrap: balance, actions below, left-aligned);
  config ToggleSwitch rows keep label + switch on one Box-row at 390; the admin NavList follows the content (order,
  16px + 1px --borderColor-muted rule above it). User/repo/org settings keep github.com's sidebar-first flow.
- **FG2-042 — DONE (CSS part).** security: TOTP section is a Box row (text left, enroll button right from 768px, status
  line 12px muted), WebAuthn section a Box; org settings: the avatar form is a right-hand "profile picture" column from
  1012px (divider hidden); body-less list rows (user orgs "ai") centre the title on the avatar; config "Test" row
  already centred (4/28/5px in a 37px row, measured). C046 / C076 (template copy, appearance cards): skipped.
- Also: native ▸ markers → 16px chevron-right Octicon (muted, rotates open) on token rows and the admin "Open with"
  disclosure (critic w3b-r0 item DONE); `.fields` rows (maintenance/banner Start/End time) no longer add 16px above the
  caption, stacked fields 16px apart.
- Demoted primaries (buttons.css) now remap the --button-primary-* tokens to the default-button tokens on those buttons
  (one rule instead of rest/hover/active copies); verified computed rest/hover/active = Primer default in both schemes.
- Budget: this round adds +4.9 KB to github-auto (≈2.0 KB are the four new masks webhook/key/git-branch/chevron-right).
  The whole build was already over 300 KB before this folder's change (other L2 folders).

# From pages/issues-prs (wave L2, round 1, 2026-09-30) — FG2-046 org settings Labels (optional, your call)
The empty state is now a Primer Blankslate Box (24px tag octicon, muted text, one action row: single-line label-set
Select + "Use Label Set") in src/pages/issues-prs/labels-milestones.css. The critic (C193) also wants the "0 labels" +
Sort header as a muted Box header (like the repo /labels page) instead of the 24px Subhead your subhead.css makes of
`h4.ui.top.attached.header`. Your layer is above mine, so only you can change it. If you agree, exclude the label list
section from the Subhead rule, e.g. `.flex-container-main .ui.top.attached.header:not(:has(+ .ui.attached.segment > .issue-label-list))`
(org settings /labels only renders `.issue-label-list`), and I will style header + rows page-scoped as on the repo labels
page. If you keep the Subhead (github.com settings pages do use Subheads), nothing else is needed.
