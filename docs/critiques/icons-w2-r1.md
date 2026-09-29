# Critique: `icons` folder, wave 2, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30, 03:05–03:25 CST.

**Score: 8.5 / 10. Verdict: PASS**, with one condition: the gitea-auto regression from w2 r0 #1 is fixed in
source but still live until the integrator restarts Gitea (II-1). How the pass criteria stand:
- **Console errors:** 0 attributable. The tool logged 4, and all 4 are the intentional 404 document of route
  `not-found`.
- **Literal colours:** 0 in `src/icons/**`.
- **Smoke:** green, 12/12 steps (`shots/20260930-031947-smoke-github-auto/`, `final.png` looked at).

## What I verified myself

| Check | How | Result |
|---|---|---|
| Lint | `node build/lint.mjs icons` | 0 errors, 0 warnings. icons is not a CSS build folder, so `build-report.json` has no `folders.icons`. All 14 CSS folders are `ok`. |
| Mask bundling | `dist/build-report.json → octiconMasks` | defined 21, used 7: alert, stop (overlays), file, file-submodule, file-symlink-file (code), move-to-start/end (navigation). `unverified` and the 5 NI-1 masks have no consumer yet, so the build prunes them. |
| Served = dist | sha256 of `dist/theme-github-auto.css` vs `curl /assets/css/theme-github-auto.css` | identical (e167e216…), so I did not deploy |
| Deployed icons = src | `cmp` of the 15 files against `CUSTOM_PATH/public/assets/img/svg` | 15/15 identical. The two chevron copies are gone, and `.gh-icons-manifest.json` lists 15. |
| Generator | `SVGO_PATH=<svgo 4.0.1> node src/icons/gen-icons.mjs --check` | "2 upgraded, 374 identical, 13 replaced, 0 restored, 0 missing", exit 0 |
| `gitea-unlock` file | read it | `class="svg gitea-unlock octicon-unlock"`, path = `unlock-16` after svgo |
| Masks catalogue | decoded all 21 data-URIs and compared their `d` with Gitea's svgo-normalised `octicon-<name>.svg` | 21/21 identical paths, no fills or strokes |
| Live `gitea-unlock` | `curl` of the commit page with the gitea-auto cookie | **still the w1 drawing** (`svg gitea-unlock octicon-unverified`, tooltip "Not a signed commit"). Gitea started at 18:30:06Z and the file changed at 18:58Z, so it is not live until the restart. |
| Post-restart behaviour | my own simulation: `shots/critic-icons-w2r1-sim.mjs` rewrites the **served HTML** through route interception, not DOM injection. 4 modes × 2 themes × light/dark × 1440/390 = 32 captures, 0 console errors. Sheet: `shots/critic-icons-r1/sim/sim-sheet.png`, report `sim/report.json`. | see below |

Simulation results:
- gitea-auto, unsigned commit: open padlock, 16×16, rgb(24,28,33) / rgb(210,212,216). Gitea's meaning is restored.
- github-auto, unsigned commit: badge `display:none` (D-4).
- github-auto, signed-but-unverified (forced `commit-is-signed sign-warning`): `unlock` glyph inside Gitea's **red**
  `sign-warning` border. With D-5 injected, the glyph is the `unverified` mask, 16×16, rgb(89,99,110) /
  rgb(145,152,161). The border is still red (issue 2).

## Live audit

Run `shots/critic-icons-r1/`:
- Routes: `shots/critic-icons-w2r1-routes.json` = routes.json + the 6 icon routes, with my own states.
- Coverage: light/dark × 1440/390, `--states --measure`. 296 pages, 0 pages with problems, 0 failed requests, 0
  unresolved vars, 0 pages with unlayered Gitea CSS.
- Note: this out dir already held wave-1 round-1 critic files. The run's summary is fresh (296 pages, generated
  19:12Z), and every number below comes from it.

**Non-Octicon icons: 288** (the same number the builder reports).

| Name | Count / pages | Status |
|---|---|---|
| `gitea-double-chevron-left` (PR-list branch chip) | 208 / **12** | pending pages/issues-prs P-1/P-2. The builder's text says "36 pages"; the real number is 12 (repo-pulls, icons-dashboard-pulls, icons-playground-pulls × 4). |
| `gitea-colorblind-blueyellow` / `-redgreen` | 16 + 12 / 4 | documented keep |
| `fontawesome-openid` | 8 / 8 | documented keep (login "Sign in with OpenID", looked at) |
| `gitea-npm` | 8 / 8 | documented keep (red npm logo in the package-type Label, looked at light and dark) |
| `gitea-running` | 4 / 4 | documented keep; see below |
| 8 migrate brands | 32 / 4 | keep |

**Masked icons: 1700**:
- material-file 984 and octicon-file 560 (code)
- triangle-down 92
- pagination `gitea-double-chevron-left` 32 and `-right` 32 (navigation, using this folder's masks)

`gitea-double-chevron-right` no longer appears as a non-Octicon.

**Off-palette colours:** `rgba(0,0,0,1)` fill on `svg#svg-mfi-*` symbol defs (code), and the dropzone
`rgba(0,0,0,.8)` (controls). Neither comes from this folder.

**Screenshots I looked at:**
- sim: `sim/sim-sheet.png`
- crops: `crops/sheet-pagination.png` (pulls 1440, pulls 390, commits 1440; github-auto vs gitea-auto, light and
  dark), `crops/sheet-a.png` (footer, footer theme menu, diff toolbar, graph Mono/Color, Actions status filter),
  `crops/sheet-b2.png` (PR-list chips), `crops/sheet-c.png` (token key, migrate brands), `crops/x-login-dark.png`,
  `crops/x-packages.png`, `crops/states-sheet.png` (pagination hover/focus, split hover/focus, whitespace menu open)
- full pages: `user-settings-appearance/states/dark-1440-theme-dropdown-open.png`
- github.com: `docs/reference/critic-icons-w2r1-actions-running/light-1440.png` (cropped), and
  `critic-icons-r1/gh-verified-light.png`

## github.com comparison (logged out, `docs/reference/critic-icons-w2r1-*`)

- **Pagination** (pemistahl/grex pulls): github.com has only Previous/Next, with 14×14 chevrons. Disabled is
  rgb(129,139,152) light / rgb(101,108,118) dark; the link is rgb(9,105,218) / rgb(68,147,248).
  - Ours, repo-commits: 14×14, disabled rgb(129,139,152) / rgb(101,108,118), Next rgb(9,105,218) /
    rgb(68,147,248). The colours match exactly.
  - First/Last still render, as move-to-start/end masks. github.com has none (N-5 is navigation's call).
- **Diff toolbar icon**: ours 16×16 rgb(89,99,110) / rgb(145,152,161); github.com's gear is the same, 16×16
  rgb(89,99,110) / rgb(145,152,161).
- **Running status**: github.com (microsoft/vscode Actions, in progress) shows a ring with a dot, 16px.
  - Pixel colour is rgb(154,103,0) light / rgb(210,153,34) dark, which is `--fgColor-attention`.
  - Ours in the status filter shows the same ring-with-dot shape in the attention colour
    (`crops/sheet-a.png`). The keep is justified.
  - I compared shape and colour visually and by pixel. I did not diff the path data myself.
- **Signature**: github.com's commit list shows a **text Label** "Verified":
  `prc-Label-Label`, 20px high, pill radius, 12px/500, 0 6px padding, no glyph. Colours are rgb(26,127,55) text
  with a rgb(31,136,61) border (light) and rgb(63,185,80) / rgb(35,134,54) (dark).
- **PR list**: github.com shows no branch chips; ours still shows `main « head` (12×12, muted).

## Issues (most important first)

1. **[major, dependency: integrator II-1] The fix for w2 r0 #1 is not live.** The live commit page
   (`/octo-org/grex/commit/99cc3477…`) still shows `octicon-unverified` with the tooltip "Not a signed commit" in
   **gitea-auto** (`sim/live-gitea-auto-{light,dark}-1440.png`, 16×16). This happens in every non-GitHub theme,
   which is the instance default. The source is correct, and the HTML-level simulation shows the open padlock
   after a restart. The regression stays user-visible until Gitea restarts.
2. **[minor → data-display] D-5 does not match GitHub's pattern.**
   - github.com renders signature state as a text Label ("Verified" success; "Unverified" attention), with no glyph.
   - With D-5, a signed-but-unverified badge in github-auto becomes a muted `unverified` glyph inside Gitea's
     **red** `sign-warning` border (`sim/restart-signedwarn-D5-github-auto-*.png`). The expected look is an
     attention-coloured Label.
   - The same gap applies to `gitea-lock` → `verified` (glyph-only badge vs the "Verified" text Label).
   - The icons guidance should say that the glyph is the fallback. Data-display should restyle the border to
     `--borderColor-attention-emphasis` / `--fgColor-attention` (and the success tokens for verified). Text labels
     would need locale-bound `content`, which is not recommended.
3. **[minor, dependency: pages/issues-prs] 208 `«` on 12 github-auto pages** (`crops/sheet-b2.png`). P-1/P-2 have no
   consumer, because the folder is still empty. Not this folder's code, but it is the largest remaining
   non-Octicon on the GitHub theme.
4. **[nit] Count error in the audit doc and the claim.** §5 table and the known gaps say "208 / 36 pages". The
   builder's own `shots/icons-w2r1/full/summary.json` and my run both say 12 pages.
5. **[nit] Six masks are defined but unused** (`unverified` plus the NI-1 five). The build prunes them, so they cost
   nothing, but the catalogue claims "for D-5 / NI-1" while neither consumer exists yet. Recheck when they land.
6. **[nit, process] svgo@4.0.1 is still not a devDependency** (II-2). Unchanged.

## What is good

- **Source-to-deploy chain is exact:**
  - The generator reproduces the tree (`--check` exit 0).
  - The deployed set is exactly the 15 intended files; the RESTORED copies were deleted, so the upgrade pinning
    risk is gone.
  - All 21 masks are path-identical to Gitea's normalised Octicons.
- **The unlock decision is right:** the file override is purely presentational again, and D-4 hides the unsigned
  badge in GitHub themes.
- **Pagination parity via this folder's masks is live and measured:** 14×14 glyphs with GitHub's exact disabled and
  link colours, correct in hover and focus states. Gitea's own themes keep « ».
- **Brand keeps are now backed by github.com evidence** (npm logo, running icon), and the audit doc's stale sections
  are rewritten.

## Measurements

| Control | Property | Ours (github-auto) | github.com | OK |
|---|---|---|---|---|
| pagination icon, light | size / disabled / link colour | 14×14 / rgb(129,139,152) / rgb(9,105,218) | 14×14 / rgb(129,139,152) / rgb(9,105,218) | yes |
| pagination icon, dark | disabled / link colour | rgb(101,108,118) / rgb(68,147,248) | rgb(101,108,118) / rgb(68,147,248) | yes |
| pagination First/Last | presence | move-to-start/end masks rendered | absent | no (navigation N-5) |
| diff toolbar icon, light/dark | size / colour | 16×16 rgb(89,99,110) / rgb(145,152,161) | 16×16 rgb(89,99,110) / rgb(145,152,161) | yes |
| running status icon | size / colour | 16 / `--fgColor-attention` (visual) | 16 / rgb(154,103,0) light, rgb(210,153,34) dark | yes |
| PR-list branch chip icon | glyph / size | « 12×12 rgb(89,99,110) / rgb(145,152,161) | no chips | no (pages/issues-prs) |
| commit sign badge, unsigned | visible | hidden (D-4) | no badge | yes |
| commit sign badge, verified | form | glyph-only `verified` 16×16 in label | text Label "Verified", 20px, 12px/500, success border | no (data-display) |
| gitea-unlock in gitea-auto (live) | glyph | octicon-unverified (pre-restart) | n/a | no until restart |
| masks catalogue | exact paths | 21/21 | — | yes |
