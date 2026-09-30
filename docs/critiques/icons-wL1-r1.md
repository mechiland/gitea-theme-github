# Critique: icons, wave L1 round 1 (final gate #1)

Critic: independent GitHub design-systems reviewer, 2026-09-30. Evidence folder: `shots/critic-icons-wL1r1/`.

**Score: 8.0 / 10. Not a pass.** Console errors 0, literal colours 0, smoke green. The score stays under 8.5 because
none of the gate fixes (FG-091 colorblind, FG-114) reach users yet: `icons` is not in `build/folders.mjs` FOLDERS, and
`dist/build-report.json` has no `folders["icons"]` entry. If the integrator lands IC-1 unchanged, the simulated result
scores about 8.8.

## What I verified myself
- `node build/lint.mjs icons`: 0 errors, 0 warnings, 6 selectors. The full lint of all folders is clean.
- `npm run build`: 14 folders built OK, and **icons is not among them**. `octiconMasks.used` = 16, and `eye` and
  `file-diff` are not included. Budget: auto 333.7 KB, light 328.4 KB, dark 329.6 KB, all over the 300 KB cap. That is
  a cross-folder problem; icons adds only about 1.7 KB of live masks.
- Served CSS equals dist. Other folders deployed twice while I was reviewing (revisions 16a2e4a586 → e9c90d580d), so I
  rebuilt my simulation CSS from the current dist before the final probe.
- Simulation: current `dist/theme-github-auto.css` plus `@layer gh.icons{…}` (the two mask vars and
  `theme-menu.css` + `pr-tabs.css`), served through `--theme-css` / route interception
  (`shots/critic-icons-wL1r1/theme-with-icons.css`).
- Shoots: `live/` and `sim/` cover 5 routes (user-settings-appearance, repo-pull, actions-list, action-run,
  user-profile) × light/dark × 1440/390, with --states and --measure. Both runs: 0 console errors, 0 failed
  requests, 0 off-palette colours, 0 unresolved vars, maxCLS 0.0036.
  - Non-Octicon icons: **live 32** (28 colorblind + 4 gitea-running), **sim 4** (gitea-running only).
- Mask catalogue: I rasterised all 65 `--gh-octicon-*` data URIs against `@primer/octicons/build/svg/<name>-16.svg`.
  - At 16 px: 65/65 identical (alpha tolerance 24).
  - At 64 px there are small svgo-rounding deltas in older masks: x-circle 41 px, unverified 56 px, gear/globe 3 px,
    file-symlink-file 1 px. These are invisible at 16 px.
- `gen-icons --check`: up to date. All 15 deployed `img/svg` files are byte-identical to `src/icons/svg`.
- Smoke `node tools/shoot/smoke.mjs --theme github-auto`: 13/13 steps ok, no console errors → **green**.

## Findings, most important first
1. **Major: FG-091 (colorblind) and FG-114 are not live.** `build/folders.mjs` FOLDERS has no `icons`, so
   `src/icons/index.css` is never compiled.
   - Live, user-settings-appearance, theme menu, both schemes: the 7 `gitea-colorblind-*` pies are still drawn.
     Probe: bg transparent, mask none, children visible. See `probe/cmp-appearance-1440.png` rows 1 and 3.
   - Live, repo-pull: "Files Changed" still shows the bare ± (`octicon-diff`). See `probe/cmp-repo-pull-1440.png`
     rows 1 and 3.
   - Blocked on integrator IC-1, which the builder filed correctly. Until then the audit keeps reporting 28 non-Octicon
     icons.
2. **Minor, new: the Projects tab icon differs from github.com.** github.com uses `octicon-table` in both places.
   - Profile tabs: Gitea `octicon-project-symlink` (template `user/overview/header.tmpl:16`) vs `octicon-table` on
     github.com (measured on /pemistahl, 16 px, gap 8). See `probe/cmp-profile-tabs.png`.
   - Repo header nav: Gitea `octicon-project`.
   - Proposed: add a `table` mask to MASKS and send a note to pages-people / navigation. A server-side file swap would
     change every theme, so a mask is the right tool.
3. **Minor (design judgement): the eye marker in the theme menu.** In the simulation all 7 markers are 16×16 eye
   glyphs in --fgColor-muted (light #59636e, dark #9198a1) and render correctly.
   - The red-green and blue-yellow variants now look identical; only the description text tells them apart.
   - `eye` means "watch" everywhere else in GitHub's vocabulary.
   - github.com has no such marker. Acceptable, but dropping the marker would match github.com more literally.
4. **Nit, not icons-owned: PR tab icon vertical centre.** The icon sits 0.5 px below the tab's centre; github.com is
   at 0.02 px. Owner: pages/issues-prs.
5. **Resolved since the builder's report.** The builder said PR tab icons were --fgColor-muted. The current live build
   renders them in --fgColor-default in both schemes (rgb 31,35,40 / 240,246,252), which matches github.com. The finding
   forwarded to pages/issues-prs is now stale.
6. **Nit: budget.** All three theme files are over 300 KB. Icons' share is about 1.7 KB live, plus about 1.8 KB when
   IC-1 lands.

## Confirmed claims
- **gitea-running.** I found an in-progress run on python/cpython/actions, logged out, both schemes. github.com's svg
  has the same three paths (ring at .5 opacity, r=4 dot, arc), fill `var(--fgColor-attention)` and `anim-rotate` 1s.
  - Ours: `rotate-clockwise` 1s, colour #9a6700 (light) / #d29922 (dark). The rotated bounding box is 22.1–22.5 px on
    both sites.
  - Keeping it is correct, and IC-2 (reclassifying it as GitHub-native) is justified. See `probe/cmp-running.png`.
- **Files changed tab (sim).** 16×16 file-diff, same colour as its sibling icons, 8 px gap to the label; this matches
  github.com (`octicon-file-diff`, 16 px, mr 8 px). At 390 the tab icons are hidden, as github.com's
  `d-none d-sm-inline-block` does.
- **Newly live masks.**
  - Profile Overview tab shows `book` in both schemes: 16 px, gap 8, selected tab in --fgColor-default and others in
    --fgColor-muted, the same as github.com.
  - Actions graph controls show screen-full / dash / plus in both schemes. See `probe/graph-controls.png` next to
    `ref/action-run/light-1440.png`.

## Not verified
- FG-011 (person), FG-050 (NavList set), FG-086, FG-095, FG-117 and SA-6 masks: they exist and render correctly
  standalone, but no folder uses them yet, so there is nothing live to check.
