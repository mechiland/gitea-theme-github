# Critique: `icons` folder, wave 2, round 0

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30, 02:41–03:00 CST.

**Score: 8.0 / 10. Verdict: NOT PASS** (score < 8.5). Console errors 0 attributable (the tool logged 4, all the
intentional 404 document of route `not-found`). Literal colours in `src/icons/**`: 0. Smoke: **green** 12/12
(`shots/20260930-025247-smoke-github-auto/`).

The folder's files are unchanged since wave 1 round 4 (mtimes 01:25–01:30). What changed is the environment: Gitea
restarted at 2026-09-29T18:30:06Z, so the 15 overrides and 2 upgrades are **live**, and the masks catalogue is now
bundled on demand. I re-scored from scratch against the live server.

## What I verified myself

| Check | How | Result |
|---|---|---|
| Lint | `node build/lint.mjs icons` | 0 errors, 0 warnings (icons is not a CSS build folder) |
| Build | `npm run build` | all 14 folders `ok`; `octiconMasks {used: [], defined: 15}` at build time |
| Served = dist | sha256 of `dist/theme-github-auto.css` vs `curl /assets/css/theme-github-auto.css` | identical (78b7f1ce…), no deploy needed |
| Deployed icons = src | `cmp` of 17 files vs `CUSTOM_PATH/public/assets/img/svg` | 17/17 identical, all older than the restart; `.gh-icons-manifest.json` present (I-7) |
| Generator | `SVGO_PATH=<svgo 4.0.1> node src/icons/gen-icons.mjs --check` | "2 upgraded, 374 identical, 13 replaced, 2 restored, 0 missing", exit 0 |
| Overrides live | `curl` explore/commit markup | `svg gitea-eclipse octicon-device-desktop`, `svg gitea-split octicon-split-view`, `svg gitea-unlock octicon-unverified`; PR list still `gitea-double-chevron-left` (restored original) |
| Masks catalogue | rendered all 15 `--gh-octicon-*` at 32 and 16px (`shots/critic-icons-r0/crops/masks-catalogue.png`) | 30/30 mask-images resolve; each glyph is the named Octicon |
| Mask consumers | grep of wave-2 folders | `code/file-icons.css` (file, file-submodule, file-symlink-file) and `navigation/pagination.css` (move-to-start/end) reference them; written 02:49–02:52, not yet deployed |

## Live audit

Run `shots/critic-icons-r0/` (routes `shots/critic-icons-w2r0-routes.json` = the 68 routes + 6 icon routes;
light/dark × 1440/390, `--states --measure`). 296 pages, 106 states (4 failed: my own `repo-commits pagination-hover`
selector, not the theme), 0 failed requests, 0 unresolved vars, 0 pages with unlayered Gitea CSS.

Non-Octicon icons: 1328 total = **984 `material-file:*`** (code folder, C-1/C-2) + **344 others**:

| Name | Count / pages | Decision in audit doc | Status |
|---|---|---|---|
| `gitea-double-chevron-left` | 236 / 36 | keep file, mask in GitHub themes (N-3, P-1) | consumers pending |
| `gitea-double-chevron-right` | 28 / 28 | same | pending |
| `gitea-colorblind-blueyellow` / `-redgreen` | 16 + 12 / 4 | keep (meaning is the colour pair) | OK |
| `fontawesome-openid` | 8 / 8 | keep (brand) | OK |
| `gitea-npm` | 8 / 8 | keep (brand) | see issue 5 |
| `gitea-running` | 4 / 4 | keep (no Octicon spinner) | not verified vs github.com |
| 8 migrate-card brands | 32 / 4 | keep | OK |

Off-palette colours: `rgba(0,0,0,1)` 880 × 2 (material `svg#svg-mfi-*`, code surface), dropzone `rgba(0,0,0,.8)`
(controls), `mark` yellow (markdown). None come from this folder's files.

Looked at: `crops/sheet-footer.png`, `c-footer-open.png`, `sheet-diff-sign.png`, `sheet-graph-buttons.png`,
`sheet-pulls-branches.png`, `sheet-pagination.png`, `c-github-auto-{light,dark}-filelist.png`,
`sheet-applications.png`, `c-migrate-dark.png`, `c-actions-light.png`, `states-sheet.png`, `gh-pulls-bottom.png`,
smoke `final.png`. github.com references: `docs/reference/critic-icons-w2r0-{repo-home,commit,pulls,issue}/`.

## Issues (most important first)

1. **[major] Unsigned commits now show `octicon-unverified` in every theme.** `gitea-unlock` is also rendered for
   *unsigned* commits (`commit_page.tmpl:174`). The live `/octo-org/grex/commit/99cc3477…` shows the unverified
   glyph with the tooltip "Not a signed commit", in github-auto **and** gitea-auto (`crops/sheet-diff-sign.png`,
   16×16, fgColor-default). github.com shows no badge on the same commit (measure: 0 `octicon-verified/unverified`).
   In GitHub's vocabulary "Unverified" means *signed, key not verified*. So Gitea's own themes lose the meaning
   "not signed", which breaks the rule in §2.2 ("correct under every theme"). D-4 (hide the badge) is only
   GitHub-scoped and has not landed. Fix: map `gitea-unlock` → `octicon-unlock`, which keeps the same meaning
   everywhere. Then either D-4 hides it for unsigned commits, or data-display masks it to `unverified` for the
   signed-but-unverified case in GitHub themes.
2. **[major, dependency] Pagination and the PR list still show Gitea's `«`/`»` on the GitHub theme.** There are 264
   occurrences on 36+28 pages (`crops/sheet-pagination.png`, `sheet-pulls-branches.png`). The masks exist and
   navigation now references them (not deployed yet). P-1 has no consumer yet.
   - github.com has **no First/Last** in pagination (measure: 2 icons, 14×14 chevrons only).
   - The PR list on github.com shows no branch chips at all (`gh-pulls-bottom.png`).
   - The audit doc recommends move-to-start/end masks for First/Last. Parity would hide First/Last and the
     `.branches` chips instead. The doc should state the parity option first and leave the masks as the fallback.
3. **[minor] Audit doc is stale after the restart.**
   - §4 still says the masks "need to be bundled".
   - §2.1 says "the shoot audit does not flag them" (it does now: `material-file:*`, I-5).
   - §5 says everything is simulated.
   - There are no live post-restart counts (344 non-material / 984 material on 296 pages here; integrator 312 → 176).
4. **[minor] `RESTORED` not dropped although I-7 landed.** The two chevron files are still deployed copies of
   Gitea 1.27.3's bytes. These copies will pin the old drawing on a future upgrade. The integrator's note says the
   names can be dropped now, and the next deploy deletes them.
5. **[minor] `gitea-npm` in the package list label** (`packages-org`, `div.item-title .label-list .ui.label > svg`).
   This is a brand logo with hard-coded fills inside a Label. The keep decision is documented, but it was never
   compared with github.com's package list, which uses `octicon-package` per row. Verify, or document it as an
   accepted difference.
6. **[minor] `gitea-running` is still "not verified live".** The keep decision stands, but the audit should say that
   a github.com logged-out Actions run in progress was not reachable.
7. **[nit] Upgrade pinning is undocumented for the 13 replacements and 2 upgrades** (carried from w1 r4 #5).
8. **[nit, process] svgo@4.0.1 devDependency (I-2) is still pending.** The generator needs `SVGO_PATH`.

## What is good

- The server overrides are live and correct in both themes:
  - footer / theme menu "Auto" shows `device-desktop`
  - diff toolbar shows `gear` / `split-view` / `rows`: 16×16, fgColor-muted rgb(89,99,110) / rgb(145,152,161), the
    same as github.com's gear
  - graph Mono/Color show `circle` / `paintbrush`
  - the access-token row shows `key` at 32px
- The overrides render without regressions in gitea-auto: 0 broken icons in the crops, and the PR list is unchanged.
- The generator is exact and reproducible, and the masks catalogue is exact: all 15 render as the named Octicons.
- Wave-2 folders consume the masks without friction.

## Measurements

| Control | Property | Ours (github-auto) | github.com | OK |
|---|---|---|---|---|
| file-list directory icon, light | size / color | 16×16 / rgb(9,105,218) | 16×16 / rgb(84,174,255) | no (code) |
| file-list directory icon, dark | color | rgb(68,147,248) | rgb(145,152,161) | no (code) |
| file-list file icon | size / glyph | 16×16 material glyphs with own fills | 16×16 octicon-file rgb(89,99,110) | no (code) |
| diff toolbar icon, light / dark | size / color | 16×16 rgb(89,99,110) / rgb(145,152,161) | 16×16 rgb(89,99,110) / rgb(145,152,161) | yes |
| diff toolbar button, light | box | 34×28, bg rgb(246,248,250), 1px rgb(209,217,224), r6 | 32×32 transparent, r6 | no (code C-4) |
| commit sign badge (unsigned) | glyph | octicon-unverified 16×16 | no badge | no |
| PR list branch arrow | glyph / size / color | « 12×12 rgb(89,99,110) / rgb(145,152,161) | no branch chips | no |
| pagination icon | size / color, light | 16×16 rgb(31,35,40) | 14×14, disabled rgb(129,139,152), Next rgb(9,105,218) | no (navigation) |
| pagination item | height / radius / padding | 43px / 4px / 13px 16px | 32px / 6px / 8px 6px | no (navigation) |
| issue state label icon | size / color | 16×16 rgb(255,255,255) | 16×16 rgb(255,255,255) | yes |
| masks catalogue | glyphs rendered | 15/15 (30/30 mask-images) | — | yes |
