# Critique: pages/settings-admin, wave 3, round 4

Critic: independent GitHub design-systems reviewer (no theme code written). Date: 2026-09-30.

## Verdict

**Score 8.4 / 10: FAIL (pass needs 8.5 or more).** All in-folder defects from r3 are fixed and measured. The remaining gap is the github.com settings page header (SA-4, integrator-owned), which is still absent on the live pages. I score it as a major, not a nit, so the folder stays just under the bar.

| Check | Result |
|---|---|
| Lint | 0 errors, 0 warnings, 120 selectors |
| Build | `dist/build-report.json` pages/settings-admin: status "ok", 11 files, 43,696 B (global OVER BUDGET warnings on the bundles are not this folder's) |
| Served vs dist | `theme-github-auto.css` served bytes identical to dist (437,210 B). No redeploy |
| Console errors / failed requests | 0 / 0 (96 captures) |
| Off-palette / unresolved vars / literal colours | 0 / 0 / 0 |
| Non-Octicon icons | 52 (appearance colourblind icons and webhook type icons, icons folder) |
| Max CLS | 0.0105 on user-settings-applications light-390 (source `div.item-body`, t=54ms). Builder reported 0.0027; my run differs, still far below 0.1 |
| Smoke | green, 12/12 (`shots/20260930-054543-smoke-github-auto/smoke.json`) |
| templates/ | still only `base/head_style.tmpl` and `custom/footer.tmpl`: SA-4 not applied |

## Evidence
- Run: `shots/critic-pages/settings-admin-r4/` (24 routes, light/dark, 1440/390, `--states --measure`), log `shots/critic-pages/settings-admin-r4.log`, routes `shots/critic-pages/settings-admin-routes-r4.json` (r3 routes + fixed applications delete-hover selector + delete-focus).
- Probe: `shots/critic-pages/sa-r4-probe.mjs` → `shots/critic-pages/settings-admin-r4/probe/probe.json` and crops `probe/{light,dark}-{tok390,hookfocus,merge,reindex,profile,branches,users,adminrepos-hdr,deploykeys}.png`.
- github.com reference (logged out): `docs/reference/critic-sa-r4-releases-blankslate/` (Blankslate + btn-sm) and `docs/reference/critic-sa-r4-labels/` (my btn focus/hover states failed on github.com's React labels page; focus spec taken from Primer `buttons/button.scss` focusOutline 2px accent, offset -2px). Settings pages need a login, so no direct settings reference.

## Verified builder claims (re-measured)
1. Token name wrap (keys.css): `.item-title` is `display: inline`; at 390 line 1 starts at x=15 beside the marker, line 2 wraps at x=0; summaries 21px / 42px in both schemes (`probe/light-tok390.png`, `user-settings-applications/dark-390.png`). Holds.
2. Add Webhook focus ring: `.ui.jump.dropdown` focus-visible, outline 2px rgb(9,105,218) light / rgb(31,111,235) dark, offset -2px, radius 6px (`probe/dark-hookfocus.png`). Holds.
3. Merge Styles gap: 7px (Code/Wiki/Issues/Pull Requests 5px, Signature Trust Model 4px). Holds (`probe/light-merge.png`).
4. Nits: Reindex button light #f6f8fa/#25292e/#d1d9e0, hover #eff2f5; dark #212830/#f0f6fc/#3d444d, hover #262c36. Unadopted Repositories 28px default in both schemes. Admin users check rgb(26,127,55)/rgb(63,185,80), x rgb(89,99,110)/rgb(145,152,161). Branch-protection Blankslate 936×87, padding 32px 16px, 1px #d1d9e0 / #3d444d, radius 6, 14/21 muted centred. "Username *" asterisk 4px after text, same as "User visibility *". All hold.

## Issues (most important first)

1. **MAJOR (blocked on integrator, SA-4): github.com settings page header missing.** user-settings (all schemes/widths, `user-settings/light-1440.png`): no 48px avatar, name, "Your personal account", "Go to your personal profile". `header.css` matches nothing. The single most recognisable element of github.com/settings; this alone keeps the page below "matches with nits".
2. **MINOR (this folder): empty states are inconsistent.** Branch protection now has a bordered Blankslate, but deploy keys shows bare "There are no deploy keys yet." at the left under the Subhead (`probe/light-deploykeys.png`) and SSH/GPG keys shows descriptions only (`user-settings-keys/light-1440.png`; github.com shows "There are no SSH keys associated with your account." in a Box). The builder says the deploy-keys text node cannot be targeted, but the segment can: in `repo/settings/deploy_keys.tmpl` the empty segment holds only `#add-deploy-key-panel.tw-hidden` plus the text, so `.ui.attached.segment:has(> #add-deploy-key-panel.tw-hidden):not(:has(.flex-list))` can take the same Blankslate box, and stops matching once the panel opens.
3. **NIT: native ▸ disclosure markers** on token names, "Generate New Token", "Create a new OAuth2 Application", push-mirror Authorization (`user-settings-applications/states/light-1440-delete-focus.png`). GitHub uses Octicon chevrons or no disclosure at all.
4. **NIT: Username label is a full-width flex box** (936×20 vs "User visibility" 102×20), so the click target spans the whole row. Harmless visually; `display: inline-flex` would keep the text fix without the wide hit area.
5. **NIT: CLS 0.0105** on user-settings-applications light-390 (`div.item-body`), higher than the builder's 0.0027. Well within budget; likely timing.
6. **NIT: btn-sm padding.** Subhead actions (Add Webhook, Create User Account) are 28px with 0 8px padding (Primer React condensed small); github.com's `.btn-sm` Notifications measures 3px 12px. Both exist on github.com; noted only.
7. Out of scope, noted: dark jump-dropdown menu (`repo-settings-hooks/states/dark-1440-add-open.png`) renders darker than the page; menu surface belongs to the dropdown owner. The menu opening on keyboard focus is Gitea behaviour.

## Measurements (ours vs github.com / Primer)
- Default btn-sm: 28px, 12/500/20, radius 6, bg #f6f8fa, border #d1d9e0, fg #25292e (github Notifications: 28, 12/500/20, radius 6, same colours; padding 0 8 vs 3 12).
- Danger/primary: Update Profile 32px, 14/500, bg #1f883d / dark #238636, radius 6 (Primer btn-primary 32, 14/500).
- Input: 440×32, radius 6, padding 0 12, border #d1d9e0 / #3d444d (Primer form-control 32, radius 6, 440 form-group).
- Subhead: 936×45, 24/400/36, bottom border rgba(209,217,224,.7) / rgba(61,68,77,.7) (Primer Subhead 24/400, borderColor-muted).
- Blankslate: ours padding 32 16, 14/21 muted; github 32 32, 14/21, desc muted #59636e / #9198a1 (ours #59636e / #9198a1).
- Focus ring: 2px #0969da / #1f6feb, offset -2, radius 6 (Primer focusOutline).

## What would reach 8.5
SA-4 applied. With the header in place and issue 2 fixed, the folder should pass.
