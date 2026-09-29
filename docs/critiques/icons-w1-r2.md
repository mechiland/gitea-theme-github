# Critique: `icons` folder, wave 1, round 2

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30, 00:47–01:00 CST.

**Score: 7.5 / 10. Verdict: NOT PASS.**
- The score is below 8.5.
- Smoke is **red**: `switch-theme-back` fails because `github-auto` is not registered, which needs a restart.
- None of the overrides are live.

Console errors: 0. Literal colours in `src/icons/**`: 0.

The folder's own work is correct and every round-1 finding was addressed. The score moves only half a point for two
reasons. First, the live icon surface on the running server is the same as in round 1. Second, the GitHub end state
depends on six requests owned by others: I-1, I-3 or C-1/C-2, I-4, I-6, N-3 and D-4.

## What I verified myself

| Claim | How | Result |
|---|---|---|
| Overrides not live | `docker inspect` StartedAt 2026-09-29T15:31:18Z (23:31 CST); `curl /` | Confirmed. Still `gitea-eclipse`, and `THEMES =` is still empty. |
| Deployed = src | `cmp` of 17 files, src/icons/svg vs CUSTOM_PATH/public/assets/img/svg | 17/17 identical |
| Generator fidelity | `gen-icons.mjs --octicons <19.28.1> --no-replace --out <tmp>` | 0 emitted, 376 identical |
| Generator freshness | `--check`, plus full regeneration into tmp and `diff -r` against src/icons/svg | "2 upgraded, 374 identical, 15 replaced, 0 missing"; regeneration is byte-identical |
| `material-invert-colors` → circle | file content | `class="svg material-invert-colors octicon-circle"`, 16×16, same path as `circle-16.svg` (svgo drops the `Z`s) |
| 15 masks | `grep --gh-octicon` src/icons/octicon-masks.css | 15, including move-to-start and move-to-end |
| Lint | `node build/lint.mjs` | All folders: 0 errors, 0 warnings. No fill, stroke or style attributes in the 17 SVGs. |
| Build | `npm run build` | 14 folders ok. `icons` is not a build folder (by design). Served `theme-github-auto.css` sha256 = dist, so no deploy was needed. |
| Masks in dist | `grep gh-octicon dist/theme-github-auto.css` | **0**. I-4 is not applied, so N-3 and C-2 cannot ship yet. |

## I-6: independently confirmed, and it is the most important finding of the round

`shots/critic-icons-r2-unlayered.mjs` runs in preview mode (same head as `head_style.tmpl`), loads each page and waits
3.5 s. Output is in `shots/critic-icons-r2/unlayered/`: `today.json`, `fix.json`, and `cmp-light-repo-home.png`
(top: today, bottom: with the fix).

**Today:** an unlayered `link[rel=stylesheet][href*=/css/index.]` is appended after load.

| Route | Unlayered index.css |
|---|---|
| repo home | yes (light and dark) |
| file view (README.md) | yes (light and dark) |
| issues | no |
| explore/repos | no |
| dashboard | no |

On repo home, light:

| Measurement | Today (unlayered copy wins) | With the fix |
|---|---|---|
| `.repo-button-row .ui.button` | 30px high, 4px radius | 28px high, 6px radius |
| Code button | rgb(9,105,218), Gitea blue | rgb(31,136,61) = `--button-primary-bgColor-rest` |

In dark, the Code button is rgb(68,147,248) today and rgb(35,134,54) with the fix. I looked at the stacked PNG: the Code
button is blue on top and green below.

**With `<link rel="stylesheet" href="…index.css" media="not all">`:** 0 unlayered copies on all 5 routes × 2 schemes,
and 0 console errors.

A first attempt of my probe that chained two `ctx.route` handlers was invalid, because `route.fetch` does not chain. I
discarded it and redid the rewrite in a single handler. That re-run gives the numbers above.

## End state of the file list (my own injection)

Probe: `shots/critic-icons-r2-endstate.mjs`. It injects the I-6 fix, C-1, C-2, and the masks with the Primer tree token.
Output: `shots/critic-icons-r2/endstate/`, stacked light and dark in `fix-stack-1440.png`, which I looked at.

| Case | Directories (10) | Material file icons (18) |
|---|---|---|
| With I-6, light (1440 and 390) | rgb(84,174,255) | masked `octicon-file`, rgb(89,99,110), 16×16 |
| With I-6, dark | rgb(145,152,161) | masked `octicon-file`, rgb(145,152,161), 16×16 |
| Without I-6 | rgb(9,105,218) / rgb(68,147,248): C-1 loses | masks still apply |

This matches github.com (reference below). Without I-6, only the file masks survive, because Gitea's CSS has no `mask`
rule to fight them. The builder's claim holds.

Note that the builder's own `cmp-d.png` "ours + requested CSS" column still shows **accent directories**. Its
`report-filelist.json` gives rgb(9,105,218) and rgb(68,147,248). That column does not show the end state; only the
separate I-6 test does.

## Simulated after-restart icons (my own run)

Script: `shots/critic-icons-r2-sim.mjs`, my r1 simulation re-run on the round-2 files. 96 captures, all ok, 0 console
errors. Sheet: `shots/critic-icons-r2/sim/critic-sim-sheet.png`, which I looked at.

- **Graph buttons:** `○ Mono` / `paintbrush Color`. It no longer reads as "blocked". The 16px circle ring looks a little
  heavier than the paintbrush. That is a nit.
- **Footer theme menu:** `device-desktop` for Auto, light and dark. Good.
- **Diff toolbar:** gear, then rows/split-view, then kebab. Good glyphs. The button box still differs from github.com
  (see measurements).
- **Label modal:** Save shows `check` on the green primary button. OK.
- **Token list:** 32px `key`. OK.
- **Pagination without N-3:** still reads `← ‹ 1 › →` at 390. It becomes `⇤ ‹ 1 › ⇥` only once navigation applies N-3,
  and that needs I-4 first. I read the builder's `cmp-b.png` and `cmp-c.png`: the proposal renders as claimed.
- **Sign badge:** the builder's `sign-badge-cmp.png` shows that D-4 hides the unsigned badge on the commit header.

## Live audit

Run: `shots/critic-icons-r2/run/`, from `shots/critic-icons-r2-routes.json` with `--states --measure`.
- Coverage: 28 routes (15 from my r1 list plus 13 seeded) × light/dark × 1440/390 = 112 pages.
- Results: 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars, 0 failed states.
- **Non-Octicon names live: 22.** `gitea-eclipse` appears on 112/112 pages. Also live:
  - `gitea-double-chevron-left` ×40 (PR lists)
  - `gitea-whitespace` and `gitea-join` (commit and PR files)
  - `gitea-unlock`
  - `fontawesome-send` and `fontawesome-save`
  - `material-invert-colors` and `material-palette`
  - plus brand icons, which are kept on purpose
- **Off-palette colours on the icon surface:** `rgba(0,0,0,1)` fill from `svg#svg-mfi-*` material symbols, 136 per
  scheme on 12 pages (repo home, code file, commit, graph, seed repo home, seed run).
- **Off-palette colours not from this folder:** `rgba(0,0,0,0.8)` dropzone border (controls/markdown); `rgba(255,255,0,1)`
  `mark` in the README (markdown).
- State clips show Gitea's original glyphs, as expected before the restart (`look-states.png`).

Smoke (`shots/20260930-005600-smoke-github-auto/smoke.json`): every step passes except `switch-theme-back`. The step
times out waiting for `.item[data-value="github-auto"]` because the theme is not registered. **Red.**

## Issues (most important first)

1. **[major] Nothing is live.** Needs I-1.
   - The live icon surface is identical to round 1: `gitea-eclipse` on 112/112 pages, and 22 non-Octicon names in total.
   - All after-restart evidence (the builder's and mine) is simulated.
2. **[major] The file list is still the most visible deviation from github.com.**
   - Live (`shots/critic-icons-r2/look-seed-repo-home-dark.png`): material brand glyphs (Docker whale, Go, git, LICENSE).
   - Directories: light rgb(9,105,218) vs GitHub rgb(84,174,255); dark rgb(68,147,248) vs GitHub rgb(145,152,161).
   - 136 off-palette `rgba(0,0,0,1)` fills per scheme.
   - The fix is proven by injection but needs I-3, or C-1 + C-2 + I-4, **and** I-6.
3. **[major, cross-folder] I-6: unlayered Gitea CSS re-inserted on repo home and file view.** Confirmed independently
   (numbers above). It defeats every `gh.*` layer on the two most-viewed repo pages. The integrator should apply it
   before the wave-2 critics measure repo pages, or their numbers there are Gitea's.
4. **[minor] Pagination First/Last stays ambiguous until two other owners act.**
   - The file override gives `← ‹ 1 › →` at 390. N-3 needs I-4, which is not in dist.
   - github.com at 390 keeps the "Previous"/"Next" text: item 85.5px wide, 14px chevrons. Gitea drops the labels.
   - After I-1 alone, the bar will be worse than today's `« ‹`. Order I-4 + N-3 together with I-1.
5. **[minor] D-4 also hides one signed-commit case.**
   - `commit_sign_badge.tmpl` lines 37–41: when Verified=false and Warning=false (`NoKeyFound`, a signed commit whose key
     is unknown, per services/asymkey/commit.go:185), `$extraClass` is reset to "". The commit page then renders the badge
     without `commit-is-signed`.
   - So `.commit-sign-badge:not(.commit-is-signed)` hides it, where github.com would show "Unverified".
   - Gitea's own lists already drop it, so the result is consistent with Gitea. But the request's statement that Gitea
     adds `commit-is-signed sign-warning` there is only true when Warning=true.
6. **[minor] Icon sizes are unchanged. All three are owned by other folders; the requests are filed.**
   - latest-commit status: 18 vs 16
   - pagination chevrons: 16 vs 14
   - diff toolbar button: 30×30 bordered `--button-default` vs 32×32 invisible
7. **[nit] Graph buttons.** The 16px `octicon-circle` ring is visually heavier than `paintbrush`. The Mono icon also sits
   flush against the button's left border, the same as in Gitea's layout (owned by pages/repo or controls).
8. **[nit] Evidence hygiene.**
   - The builder's cmp-d "ours + requested CSS" column does not include I-6 or the tree token, so its directories are
     still accent.
   - docs/icons-audit.md §4 says "all 195 SVGs render", but the builder claims 196.
9. **[nit, process]**
   - svgo is still not a devDependency (I-2).
   - Deploy never deletes a removed override (I-7).
   - Overrides remain global to all themes (policy §6, documented).

## What is good

- The generator is exact and reproducible: 376/376 against 19.28.1, and `--check` plus a full regeneration are
  byte-identical to src.
- Every round-1 finding was acted on with sound reasoning:
  - circle instead of circle-slash
  - move-to-start/end masks instead of hiding First/Last, with a correct argument: Gitea's page window has no last-page
    number
  - D-4 for unsigned badges
  - C-1 clarified to check the colour after build
  - the deploy-deletion gap was filed
- I-6 is a genuine, well-diagnosed cascade bug that affects every folder, with a minimal verified fix.

## Measurements (ours live vs github.com reference, 1440 unless noted)

Our side is in `shots/critic-icons-r2/refcmp/`. The github.com reference is `docs/reference/critic-icons-*`, captured
00:29 today.

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| file-list directory icon, light | color | rgb(9,105,218) | rgb(84,174,255) | no |
| file-list directory icon, dark | color | rgb(68,147,248) | rgb(145,152,161) | no |
| file-list directory icon, light, with I-6 + C-1 (injected) | color | rgb(84,174,255) | rgb(84,174,255) | yes |
| file-list directory icon, dark, with I-6 + C-1 (injected) | color | rgb(145,152,161) | rgb(145,152,161) | yes |
| file icon, light, with C-2 (injected) | glyph / color | octicon-file mask, rgb(89,99,110) | octicon-file, rgb(89,99,110) | yes |
| file-list icon | size | 16×16 | 16×16 | yes |
| latest-commit status icon | size | 18×18 | 16×16 | no |
| diff toolbar icon, light / dark | size / color | 16, rgb(89,99,110) / rgb(145,152,161) | 16, rgb(89,99,110) / rgb(145,152,161) | yes |
| diff toolbar button | box | 30×30, bg rgb(246,248,250), 1px rgb(209,217,224), 6px radius | 32×32, transparent, 6px radius | no |
| pagination icon | size | 16×16 | 14×14 | no |
| pagination item | height / radius | 43px / 4px | 32px / 6px | no |
| Code button, repo home, light | background | rgb(9,105,218) today; rgb(31,136,61) with I-6 | rgb(31,136,61) | no |
| generator fidelity (19.28.1) | identical files | 376/376 | 376 | yes |
