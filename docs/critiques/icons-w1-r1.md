# Critique: `icons` folder, wave 1, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30 00:20–00:45 CST.

**Score: 7.0 / 10. Verdict: NOT PASS** (score is below 8.5, smoke is red, and none of the overrides are live).
Console errors attributable to this folder: 0. Literal colours in `src/icons/**`: 0. Smoke: **red**
(`switch-theme-back` fails because `github-auto` is not registered yet, which is a restart problem and not an icons defect).

## What I verified myself

| Claim | Verified how | Result |
|---|---|---|
| Generator reproduces Gitea byte for byte | `SVGO_PATH=<scratch>/svgo-env node src/icons/gen-icons.mjs --octicons <octicons 19.28.1>/build/svg --out <tmp> --no-replace` | **0 files emitted, 376 identical.** Confirmed. |
| 19.38.0 gives 2 upgrades | `gen-icons.mjs --check` | "2 upgraded, 374 identical, 15 replaced, 0 missing". Up to date. Confirmed. |
| Root attributes are kept | inspected all 17 files | `class="svg <orig> octicon-<x>"`, 16×16, viewBox, aria-hidden, no fill. Confirmed. |
| Added `octicon-*` classes are harmless | grep of Gitea `web_src` for the 15 added classes | Only `.svg.octicon-file-directory-symlink` (base.css:887) has a rule, and Gitea already adds that class itself. No JS hooks. OK. |
| Audit covers all 68 non-Octicons | checked every non-`octicon-*` file name in `public/assets/img/svg` against docs/icons-audit.md | 0 missing. Confirmed. |
| Lint | `node build/lint.mjs icons` | 0 errors, 0 warnings. `icons` is not in build FOLDERS (by design), so `dist/build-report.json` has no `icons` entry. |
| Deployed = src | `cmp` src/icons/svg vs CUSTOM_PATH/public/assets/img/svg | 17/17 identical. Served theme CSS sha256 = dist. |
| Overrides live? | `gitea-server` started 23:31 CST, deploy at 00:10 | **Not live.** `/` still serves the original `gitea-eclipse` path. |

## Evidence runs

- `shots/critic-icons-r1/`: 36 routes (the builder's list plus my states) × light/dark × 1440/390, with `--states --measure`.
  144 pages, 0 problems, 0 failed requests. The 4 console errors are the expected 404 document on `not-found`.
  Also 13 seeded routes (`shots/critic-icons-seed-routes.json`: the seed exists now, octo-org/theme-playground) and
  3 reference-comparison routes (`shots/critic-icons-ref-routes.json`, with the github.com reference in
  `docs/reference/critic-icons-*`).
- **Post-restart simulation** (`shots/critic-icons-sim.mjs`, read-only): it rewrites Gitea HTML and
  `/-/web-theme/list` exactly as `modules/svg` `Normalize` + `RenderHTML` would, with the override files loaded
  (size and class prefix preserved). Before/after sheets:
  `shots/critic-icons-r1/sim-{diff,misc,settings,theme,signbadge}-1440.png`, `sim-390.png`, raw crops +
  `sim/report.json` (computed size/colour of each replaced icon). 88 captures OK. The 8 failures are
  `pagination-pulls`: that page has no pagination.
- Mask proposal reproduction: `shots/critic-icons-mask.mjs` → `shots/critic-icons-r1/mask-repro-sheet.png`.

## Issues (most important first)

1. **[major] Nothing is live, so the live GitHub parity of the icon surface is unchanged.** Every one of 144 audited
   pages still shows `gitea-eclipse` (footer). The commit/diff pages still show `gitea-whitespace/split/unlock`, the graph
   page `material-*`, and the pulls/issues pagination `gitea-double-chevron-*`. Needs the integrator restart (I-1).
   Everything below about the replacements comes from the simulation, not from the running server.

2. **[major] The most visible icon deviation from github.com, the file list, is untouched and depends on other owners.**
   On seed-repo-home and admin/jiri, dark 1440 (`shots/critic-icons-r1/seed-repo-home-dark-top.png`):
   - Files use material icons with hard-coded fills (Docker whale, Go, LICENSE badge, npm hexagon, etc.). GitHub uses a
     muted `octicon-file`.
   - Directories render in `--fgColor-accent`: measured light rgb(9,105,218) and dark rgb(68,147,248). GitHub measures
     light rgb(84,174,255) and dark rgb(145,152,161) (`docs/reference/critic-icons-repo-home/*.measure.json`).
   - The audit also flags off-palette `rgba(0,0,0,1)` fills from the `#svg-mfi-*` symbols: 72 per scheme on
     seed-repo-home and seed-run, 106 in dark on the builder's routes. These colours belong to the icons surface.

   Owners are the integrator (I-3 `FILE_ICON_THEME=basic`) and code (C-1/C-2). The builder filed these requests
   correctly, but the surface is not GitHub-like until they are applied.

3. **[minor→major, evidence] The builder's mask-test PNG contradicts its own claim.**
   `shots/icons-r1-mask-filelist-compare.png`, "after" panels: the directory icons turned **black** in light and
   **black-on-black (invisible)** in dark. The builder only reported "muted octicon-file icons".

   I reproduced it (`mask-repro-sheet.png`). With C-1 applied, the directory colour is `var(--treeViewItem-leadingVisual-iconColor-rest)`,
   and that token is pruned from dist (computed value is empty). The colour therefore falls back to inherit: light
   rgb(31,35,40), dark rgb(240,246,252). With C-2 alone, the files are correct (light rgb(89,99,110), dark
   rgb(145,152,161)) and the directories stay accent.

   The proposal is sound only because a real reference from `src/code` keeps the token. The code folder must verify
   the directory colours after its build, and the request should say so explicitly instead of in a parenthesis.

4. **[minor] Pagination at 390 px: `arrow-left` (First) next to `chevron-left` (Previous) is ambiguous.**
   See `sim-390.png`, pagination rows. Below 768 px Gitea hides the "First/Last" labels, so the bar reads
   `← ‹ 1 › →`: two synonymous left glyphs. The original `« ‹` distinguished them.

   Better options:
   - (a) Keep the file override as `arrow-left`, which is correct for the PR-list "base ← head" use (12 px, looks right
     in `sim-misc-1440.png`). Have navigation mask `.pagination .gitea-double-chevron-left/right` with
     `octicon-move-to-start/move-to-end`: add both to `MASKS`.
   - (b) Follow github.com, which has **no First/Last** at all (`docs/reference/critic-icons-pagination/*`, shown as
     `ref-gh-pagination-390.png`): navigation hides those items.

   The builder's contact sheet shows it considered `move-to-start`, but the audit doesn't say why it rejected it.

5. **[minor] `gitea-unlock` → `octicon-unverified` also marks every *unsigned* commit as "unverified".**
   `commit_page.tmpl:174` renders the badge with no Commit, so `commit_sign_badge.tmpl` always shows it.
   admin/jiri adf2d49 has the tooltip "Not a signed commit" and now shows the `unverified` badge
   (`sim-signbadge-1440.png`). On github.com an unsigned commit shows no badge (outside vigilant mode), and
   "Unverified" is an attention state for signed-but-unverifiable commits. The GitHub reference commit shows a text
   "Verified" Label with no icon (`shots/critic-icons-r1/ref-gh-commit-top-light.png`). Proposal to data-display or
   pages/repo: hide `.commit-sign-badge:not(.commit-is-signed)` in the GitHub theme. The glyph choice itself is fine for
   `.sign-warning`.

6. **[minor] `material-invert-colors` → `octicon-circle-slash` reads as "blocked / not allowed", not "monochrome".**
   See `sim-misc-1440.png` and the graph buttons. `octicon-circle` (hollow, "no colour") keeps the Mono/Color pair
   readable without a prohibition connotation. The builder self-flagged this as a judgement call. I agree it is the
   weakest choice after `rows`.

7. **[minor] Sizes are proposed but not verified in context.** Measured (ours vs github.com):
   - latest-commit status: 18 vs 16
   - pagination chevrons: 16 vs 14
   - diff toolbar buttons: 30×30 bordered `--button-default` vs 32×32 invisible (the gear sits in an invisible IconButton
     on github.com)

   All three are owned by other folders (data-display, navigation, controls/code). The requests are filed and accurate.

8. **[nit] Global effect.** The overrides change the Gitea/Modern/Studio themes too (policy §6, documented).

9. **[nit] JS copies stay non-Octicon until overlays/pages-people apply the masks.** These are toasts, the dashboard
   repo list, and `gitea-running` in Vue. After the restart, the server commit-status `alert` and the toast `!` will
   differ. `octicon-masks.css` is not in dist yet (0 `--gh-octicon` refs in `theme-github-auto.css`): request I-4.

10. **[nit, process]** `svgo` is not a devDependency (I-2). The deploy copies icons but never removes a deleted
    override from CUSTOM_PATH; worth adding when I-2 lands.

## What is good

- The generator is exact: 376/376 byte fidelity against 19.28.1, and `--check` mode works.
- The replacements look native at 16/32 px and in buttons, light and dark (simulation):
  - footer theme menu: `device-desktop` for Auto
  - diff toolbar: `gear` + `split-view`/`rows`, matching GitHub's diff-settings gear
  - token list: 32 px `key`, consistent with the SSH-key lists
  - label modal Save: `check` at `--button-primary-iconColor-rest` rgba(255,255,255,0.8)
  - PR list: 12 px `arrow-left`

  Every replaced icon measured 16×16 (12 and 32 where the template asks), `currentColor`, no console errors.
- The audit is thorough: source lines, live pages, reasons, and the size table measured on github.com. The change
  requests are concrete diffs.

## Measurements (ours vs github.com, 1440)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| repo file list icon | size | 16×16 | 16×16 | yes |
| directory icon (light) | color | rgb(9,105,218) | rgb(84,174,255) | no |
| directory icon (dark) | color | rgb(68,147,248) | rgb(145,152,161) | no |
| file icon | glyph/fill | material symbols, hard-coded fills | octicon-file rgb(89,99,110) / rgb(145,152,161) | no |
| latest-commit status icon | size | 18×18 | 16×16 | no |
| pagination prev/next icon | size | 16×16 | 14×14 | no |
| diff toolbar icon (sim) | glyph/size/colour | octicon-gear 16, rgb(89,99,110) / rgb(145,152,161) | octicon-gear 16, rgb(89,99,110) / rgb(145,152,161) | yes |
| diff toolbar button | box | 30×30, bg rgb(246,248,250), border rgb(209,217,224) | 32×32 invisible | no |
| replaced icons (sim) | size | 16 (12 in PR list, 32 on the token list) | n/a | yes |
| generator fidelity | identical files vs Gitea (19.28.1) | 376/376 | 376 | yes |
