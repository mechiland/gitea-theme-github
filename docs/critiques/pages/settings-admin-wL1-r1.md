# Critique: pages/settings-admin, wave L1, round 1

Critic: independent GitHub design-systems reviewer (no theme code written). Date: 2026-09-30. Scored from scratch.

## Verdict

**Score 8.6 / 10: PASS** (≥ 8.5, 0 console errors, 0 literal colours, smoke green).

Every Final gate #1 item the builder claims is visible in my own captures:
- FG-057: the admin tables fit the 934px Box at 1440.
- FG-062: demoted default buttons, 32px Subhead actions and 28px row actions.
- FG-064: bordered Blankslates.
- FG-065: "Run" stays at the row end at 390.
- FG-079: config Box rows, the email Box, summary buttons, toggles at the row end and a 440px textarea.
- FG-082: muted 28px IconButtons with a red trash on hover and success checks.
- SA-5: the Actions › General pages get the Subhead layout.

It still does not reach 9. Four minor issues remain:
- The pending DD-SA-1 two-line fix was not applied, so admin tables at 390 cut off columns with no scroll cue.
- The deploy-keys Blankslate falls back to bare text as soon as the add form opens.
- The new `nowrap` Subhead produces 3-line 24px headings at 390.
- /user/settings/account still has two green primaries.

| Check | Result |
|---|---|
| Lint `node build/lint.mjs pages/settings-admin` | 0 errors, 0 warnings, 158 selectors |
| Build | `dist/build-report.json` pages/settings-admin: status "ok", 14 files, 57,726 B src. All three theme files are over the 300 KB budget (325.9 / 327.1 / 331.2 KB); that is the integrator's call |
| Served vs dist | `theme-github-auto.css`: served and dist are byte-identical (339,127 B). No redeploy |
| Captures | 92 pages (23 routes × light/dark × 1440/390) plus 60 state shots, 0 problems, 0 failed states |
| Console errors / failed requests | 0 / 0 |
| Off-palette | 0 |
| Unresolved vars | `--gh-octicon-screen-full/dash/plus` (`.graph-controls`, matchedElements 0). Icons folder, not this one |
| Non-Octicon icons | 24: `gitea-gitea/feishu/matrix` in the webhook type menu. Icons folder |
| Horizontal overflow | admin-emails 390, light and dark: scrollWidth 391 vs 390. The cause is `.gh-app-header-avatar` (right edge 391), so it belongs to the header folder, not this one. No other page overflows |
| Max CLS | 0.0343 |
| Smoke | **green**, 12/12 steps, 0 console errors (`shots/critic-pages/settings-admin-wL1-r1-smoke.log`, `shots/20260930-124015-smoke-github-auto/`) |

## Evidence
- Ours: `shots/critic-pages/settings-admin-wL1-r1/` (`--states --measure`), log `shots/critic-pages/settings-admin-wL1-r1.log`. Routes: `shots/critic-pages/settings-admin-routes-wL1-r1.json`. These are the builder's 23 routes plus these states: site-admin `run-hover/focus/press`; user-settings-orgs `leave-hover`, `new-org-focus` (1440 and 390); user-settings-security `webauthn-hover/disabled`; repo-settings-branches `defbranch-hover`; admin-repos `trash-hover/focus`; repo-settings-hooks `add-open`; repo-settings-deploykeys `add-panel`; repo-settings-collab `collab-submit-empty`, `collab-input-focus`; admin config `toggle-focus`. Every route also got a settings-specific measure set.
- Probes: `shots/critic-pages/settings-admin-wL1-r1-probe.mjs` (overflow culprit, org-row alignment, collab input, check colours) and `-probe2.mjs` (disabled button colours).
- github.com reference (logged out, 1440, light and dark, `--states --measure`): `docs/reference/critic-sa-l1-{blankslate,btn,iconbtn,branches}/`. Routes: `shots/critic-pages/settings-admin-gh-ref-wL1-r1.json`. The pages are the Hello-World empty releases Blankslate, the grex repo btn-sm, the README blob invisible IconButtons, and the grex branches DataTable (row trash IconButton hover).
- Screenshots reviewed:
  - admin-repos: `light-1440`, `dark-390` (crop), states `light-1440-trash-hover-clip`, `dark-1440-trash-focus-clip`.
  - admin-emails: `light-1440`, `trash-focus-clip`.
  - admin-orgs: `dark-1440` (crop), `edit-hover-clip`.
  - site-admin: `light-390`, `dark-390` (crop), and the six `run-*` clips.
  - user-settings-orgs: `light-1440`, `leave-hover`, `new-org-focus`.
  - repo-settings-collab: `light-1440`, `dark-390`, `collab-submit-empty`.
  - repo-settings-branches: `light-1440`, `defbranch-hover`.
  - org-settings-hooks: `light-1440` (crop).
  - repo-settings-deploykeys: `dark-1440` (crop), `light-1440-add-panel`.
  - user-settings-account: `light-1440`.
  - user-settings-applications: `dark-1440`, `summary-open`, `summary-focus/hover` clips.
  - user-settings-security: `dark-1440`, `webauthn-hover/disabled`.
  - admin-dashboard-config-settings: `light-1440`, `toggle-focus`.
  - site-admin-config: `dark-1440` and `light-390` (crops).
  - user-settings-actions-general: `light-1440`.
  - org-settings: `dark-1440`.
  - repo-settings-hooks: `dark-1440-add-open`.
  - user-settings-keys: `dark-390`.
  - site-admin-users: `light-390`.
  - repo-settings: `dark-1440-delete-modal-open-clip`.
  - Reference: `critic-sa-l1-blankslate/light-1440`, `critic-sa-l1-branches/states/light-1440-row-trash-hover-clip`, `critic-sa-l1-btn` focus and `critic-sa-l1-iconbtn` hover clips.

## Verified fixes
- **FG-057.** admin-repos at 1440: `.ui.attached.table.segment` is 936px (a 934px row inside 1px borders), `document.horizontalOverflow` false. All 11 columns are visible including Created and Op. (`admin-repos/light-1440.png`). Cells are 8px 8px, with 16px at the Box edge. For comparison, github.com's DataTable uses 8px 12px with 16px at the edge. Rows are 38.3 / 39.3px.
- **FG-062.** Subhead actions are 32px, padding 0 12px, 14/500/20. Demoted buttons use the default btn colours (#f6f8fa / #d1d9e0 / #25292e light, #212830 / #3d444d / #f0f6fc dark), shadow `0 1px 0 rgba(31,35,40,.04)`. Row actions ("Leave", "Delete", "Remove") are 28px, 12/500/20, radius 6px. "Leave" hover is a filled danger button (`leave-hover`).
- **FG-064.** Webhooks, deploy keys and collaborators each render a Box: 1px #d1d9e0, radius 6px, padding 32px 16px, centred 14/21 muted text. This matches the github.com empty-releases Blankslate, which has padding 32 32.
- **FG-065.** "Run" stays at the row end at 390 and the text wraps (`sa-dark-390-run`). Rows are divided by a single 1px line.
- **FG-079.** Config dl rows are Box rows with 1px `--borderColor-muted` separators (rgba(209,217,224,.7)); at 390 they stack key over value. The email row reads `mechiland@… [Primary] [Activated]` on one line, 16px padding. The summaries are default buttons, and the open state renders the token form. The toggles sit at the right end of the row. The org description textarea is 440×58.
- **FG-082.** Admin table IconButtons are 28×28, radius 6, --fgColor-muted (#59636e / #9198a1). On hover they get the `--control-transparent-bgColor-hover` fill and the trash turns red. Focus is a 2px accent ring (`trash-focus` light and dark). Status checks are #1a7f37 (also inside `<a>` on emails), x marks are muted. github.com's branches-row trash IconButton is also 28×28 muted, so this matches.
- **SA-5 step 1.** `/user/settings/actions/general` and `/org/octo-org/settings/actions/general` now use Subhead + Box ("Cross-Repository Access", "Actions Token Permissions"). The header will come from SA-5b.

## Issues (most important first)

1. **MINOR (this folder, an open request not applied): admin tables at 390 cut off columns with no scroll cue.** `site-admin-users/light-390.png` cuts "Activa…", and `admin-repos/dark-390.png` cuts at "Watchers | S…". There is no edge shade. data-display's DD-SA-1 (this folder's request file, with the diff given) asks for two `background` → `background-color` changes in `subhead.css`. Lines 27 and 105 still use the shorthand, which resets the scroll-shadow `background-image` to none. The change is two lines, has already been verified by injection, and costs 0 B.
2. **MINOR (this folder): the deploy-keys Blankslate reverts to bare text while the add form is open.** `repo-settings-deploykeys/states/light-1440-add-panel.png` shows "There are no deploy keys yet." flush left below the form with no Box. The selector requires `#add-deploy-key-panel.tw-hidden`. Drop the `.tw-hidden` condition (keep `:not(:has(> .flex-divided-list))`) so the empty-state Box stays. On github.com the add-key form is a separate page, so the empty list never loses its Box.
3. **MINOR (this folder, a regression from FG-065): `flex-wrap: nowrap` on every Subhead with actions squeezes long headings into 3 lines at 24px on phones.**
   - `site-admin-users/light-390.png`: "User Account / Management / (Total: 5)" is a 3-line heading about 180 device px tall beside "Create User Account".
   - `admin-repos/dark-390.png`: "Repository Management (Total: 10)" is also 3 lines.
   - The action is centred on the block, not on the first line (the comment in `subhead.css` says "first line").
   - Primer `.Subhead` is `flex-flow: row wrap`, so a long heading pushes the actions onto their own line.
   - Keep nowrap only where it helps, or drop it and accept the wrap. The FG-065 complaint was about the short "Manage Organizations" case. At minimum, align the action with `align-self: flex-start` so it sits on the first line.
4. **MINOR (this folder, FG-062 left incomplete): /user/settings/account has two green primaries**, "Update Password" and "Add Email Address" (`user-settings-account/light-1440.png`, both `rgb(31,136,61)`). On github.com, /settings/emails "Add" is a default btn. Demote "Add Email Address" (`form[action$="/settings/account/email"] .ui.primary.button`).
5. **NIT (now fixable here): the token rows still show the native ▸ marker** (`user-settings-applications/dark-1440.png`). The builder's reason was the missing mask. Icons has since shipped `--gh-octicon-chevron-right` / `chevron-down` for SA-6 (see the "From icons" entry in the request file).
6. **NIT (this folder): config dl check/x icons are --fgColor-default**, not success/muted as in the admin tables (`site-admin-config/dark-1440.png`: `octicon-check` = rgb(240,246,252)). This is inconsistent with FG-082.
7. **NIT (this folder): demoted buttons cannot show a disabled state.** The demote rules in `buttons.css` sit in a later layer than controls' `:disabled` rules and have no `:not(:disabled, .disabled)`, so `#register-webauthn[disabled]` keeps the rest colours (`webauthn-disabled-clip`; probe2 gives the same rest/disabled colours and only the cursor changes). Outside this folder: disabled `.ui.primary.button` also stays #1f883d on /octo-org/grex/issues/new, although `--button-primary-bgColor-disabled` is #95d8a6. That belongs to controls and the integrator, so it is not counted here.
8. **NIT (from w3b-r0, still open): row-action padding.** Ours is 0 8px (condensed), so "Leave" is 51.6px wide. github.com `.btn-sm` is 3px 12px (`critic-sa-l1-btn/light-1440.measure.json`: 28px, 3px 12px, 12/500/20).
9. **NIT (still open): header title** is 20/600/30 at every width; Primer `.h3.lh-condensed` is 18px below 768 with line-height 1.25.
10. **NIT: row alignment on the org list.** On /user/settings/organization, the title of a row with no description sits 3.5px above the avatar centre (probe: titleMid 251.5 vs avatar and button 255).
11. **Recorded, not counted (template):**
    - The org webhooks Subhead reads "Settings".
    - The collaborators Box holds only the add form, with no "You haven't invited any collaborators yet" text.
    - SSH/GPG key pages have no empty-state text.
    - The Actions › General header waits on SA-5b.
    - The collab `submitEmpty` state showed no visible flash, and I could not attribute why.

## What would reach 9+
Apply DD-SA-1 (issue 1), keep the deploy-keys Box while the form is open (2), and let long Subheads wrap or top-align their actions at 390 (3). Demote the second account primary (4) and use the new chevron mask for the token rows (5).
