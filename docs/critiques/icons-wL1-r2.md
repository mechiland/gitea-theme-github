# Critique: icons, wave L1 round 2

Critic: independent GitHub design-systems reviewer, 2026-09-30. Evidence folder: `shots/critic-icons-wL1r2/`
(the brief's `shots/critic-icons-r2` already holds wave-1 round-2 evidence, so I used a separate folder).

**Score: 8.0 / 10. Not a pass.** Console errors 0, literal colours 0, smoke green (13/13).
- The round-2 work is correct and closes critic #2 (Projects glyph) and #3 (colorblind marker).
- None of it reaches users: `icons` is still missing from `build/folders.mjs` FOLDERS, and `dist/build-report.json`
  has no `folders["icons"]`. That is integrator item IC-1, and the builder cannot fix it.
- On the live site the theme menu still shows the colorblind pies, "Files Changed" still shows the bare ±, and the
  repo Projects tab still shows `octicon-project`.
- In my own simulated IC-1 build, the icons surfaces score about 9.0. The remaining gaps there belong to other folders.

## What I verified myself
- **Lint and build**
  - `node build/lint.mjs icons`: 0 errors, 0 warnings, 10 selectors.
  - `npm run build` (revision 9cb8629c74): 14 folders, and **icons is not one of them**.
  - Masks in use: 18, including `table` (pages/people's rule), but not `file-diff`.
- **Served files.** dist equals the served CSS for all three themes (sha1 prefixes 656c2f8334b6 / 5365b630869a /
  977a1fc42bff), so I did not run a deploy.
- **My own simulated build** (independent of the builder's): I copied the project to the scratchpad, changed only
  FOLDERS (`'icons'` before `'dark'`), and ran the real `build/lint.mjs` and `build/build.mjs`.
  - Lint: all 15 folders plus icons, 0 errors.
  - `folders.icons`: status ok, 3,071 B of source.
  - Masks in use: 19 (`file-diff` added).
  - Auto theme file: 338.7 KB → 340.1 KB, so icons adds about 1.4 KB. That matches the builder's 1,401 B.
- **Shoots** of 7 routes (user-settings-appearance, repo-pull, actions-list, action-run, repo-home, user-profile,
  org-home) × light/dark × 1440/390, with `--states --measure`. I ran them live and with the simulated build
  (`--theme-css`).
  - Both runs: 0 console errors, 0 failed requests, 0 off-palette colours, 0 unresolved vars, maxCLS 0.0003.
  - Non-Octicon icons: 32 in both runs. That is 28 colorblind svgs plus 4 gitea-running. In the simulated build the
    28 are `display:none` (0×0) but the audit still counts them; IC-4 asks the audit to skip them.
  - Masked icons: live 160, simulated 180.
  - The repo-home `tooltip-hover` state failed in both runs (locator timeout, not related to icons).
- **Probe** (`probe.mjs`, route interception): live vs simulated, both schemes, 1440 and 390, including hover,
  active-tab and overflow-popup states. I also probed github.com logged out: `pemistahl/grex`, `/pull/42` and
  `/pemistahl`.
- **Other checks**
  - `gen-icons --check`: up to date.
  - All 15 `src/icons/svg` files are byte-identical to the deployed `CUSTOM_PATH/public/assets/img/svg`.
  - Smoke `node tools/shoot/smoke.mjs --theme github-auto`: 13/13 ok, no console errors → **green**.

## Findings, most important first
1. **Major, still open: nothing in the icons layer is live (IC-1).**
   - Live user-settings-appearance with the theme menu open: 7 pies, 16×16, display block, in both schemes. See
     `probe/live-appearance-menu-light-1440.png`.
   - Live repo-pull: "Files Changed" is `octicon-diff`, mask none. See `probe/live-pr-tabs-light-1440.png`.
   - Live repo-home: Projects is `octicon-project`, mask none. See `probe/live-repo-nav-light-1440.png`.
   - Owner: integrator (IC-1). The builder filed a fresh reminder with evidence.
2. **Major, not icons-owned, new: at 390 the org tab bar's "…" overflow popup is invisible.**
   - `src/pages/people/org.css:63` gives the tab band (`.organization > .flex-container:first-child + *`, the
     `.ui.container`, 48 px tall) `clip-path: inset(0 -100vmax calc(var(--borderWidth-thin) * -1))`.
   - The popup is a child of that container: absolute, z 100, 192×196 at y 292. The clip cuts it off below the band.
     `elementFromPoint` at the popup's position returns `#readme_profile`.
   - Without our theme CSS the popup shows, so the theme causes this. Org Projects, Packages, Members and Teams are
     unreachable from that menu on phones.
   - This is the "org-390-popup crop missed its target" the builder noticed. It is not a crop problem.
   - Evidence: `probe/live-org-popup-viewport-390.png` and `probe/sim-org-popup-viewport-light-390.png` (no popup
     drawn), and `probe/nocss-org-popup-viewport-390.png` (popup drawn).
   - Owner: pages/people. The profile band (`profile.css:198`) doesn't clip its popup: `probe/sim-profile-popup-dark-390.png`
     is fine.
3. **Minor, not icons-owned: the active tab's icon colour.**
   - On github.com the active UnderlineNav tab keeps its octicon muted. Code / Overview: text rgb(31,35,40), svg fill
     rgb(89,99,110) in light; fill rgb(145,152,161) in dark.
   - Ours paints the active tab's icon in the text colour, fgColor-default (Code on repo-home; Projects on /projects).
   - The table mask follows currentColor, so it is consistent with its sibling icons. The fix belongs to navigation
     and pages/people.
4. **Nit, not icons-owned: PR tab icons sit 0.5 px low.** Ours dy +0.5, github.com +0.02. Already forwarded to
   pages/issues-prs.
5. **Nit (icons): a comment in nav-tabs.css is inaccurate.**
   - The comment says the overflow popup is appended to `<body>` (tippy). In 1.27.3 the probe shows
     `.overflow-menu-popup` as a child of `<overflow-menu>` on the repo, profile and org pages.
   - The rules still work, and the extra `.overflow-menu-popup > .item` selectors are harmless. Fix the comment.
6. **Nit (cross-folder): budget.** In the simulated build the theme files are auto 340.1 KB, light 334.8 KB and dark
   336.0 KB, all over the 300 KB cap. Icons' share is about 1.4 KB.

## Round-2 claims confirmed (simulated IC-1 build)
- **FG-091 colorblind markers.** All 7 are `display:none`, 0×0, in light and dark at 1440 and 390. Item height stays
  32 px (17 items). The "Blue-yellow / Red-green colorblind friendly" description still names each variant.
  - The description sits inline right after the name, not on its own line as the builder described. That is
    acceptable.
  - Evidence: `probe/sim-appearance-menu-{light-1440,dark-390}.png` and
    `sim/user-settings-appearance/states/*-theme-dropdown-open*.png`.
- **FG-114 Files changed tab.**
  - `file-diff` mask, 16×16, background equal to the tab colour: rgb(31,35,40) light, rgb(240,246,252) dark. Gap 8,
    and the original children are hidden.
  - This holds for the resting, hover and active (files page) states. It matches github.com's
    `octicon-file-diff fg-muted mr-2` (16×16, same colours) next to Conversation / Commits / Checks.
  - At 390 the tab icons are hidden, which matches github.com's `d-none d-sm-inline-block`.
  - Evidence: `probe/sim-pr-tabs-light-1440.png`, `probe/sim-pr-tabs-files-active-dark-1440.png` and
    `probe/gh-pr-tabs-light-1440.png`.
- **Projects tab.**
  - Repo tab bar: `table` mask, 16×16, gap 8, dy 0. Muted when inactive (89,99,110 / 145,152,161) and default when
    active, the same as its siblings.
  - The three 390 popups (repo, profile, org) all use the table mask at 16×16, in both schemes.
  - The glyph matches github.com's `octicon-table` (profile tabs on /pemistahl, 16×16, gap 8).
  - Evidence: `probe/sim-repo-nav-light-1440.png`, `probe/sim-repo-nav-projects-active-dark-1440.png`,
    `probe/sim-repo-popup-dark-390.png`, `probe/sim-profile-popup-dark-390.png` and `probe/gh-profile-nav-light-1440.png`.
  - pages/people's profile/org rule is live now and draws the table glyph: `live-profile-nav-*`.
- **gitea-running** is kept on purpose (it matches github.com). It is still counted 4 times on actions-list until IC-2
  lands.

## Not verified
- github.com's repo Projects tab: pemistahl/grex shows no Projects tab when logged out. I relied on the profile tab
  and on the builder's cpython check.
- The projects-list page glyphs (`octicon-project-symlink`) and the timeline "added to project" badge
  (`comments.tmpl:560`, `octicon-project`): no seeded event exists, and the builder left these open.
