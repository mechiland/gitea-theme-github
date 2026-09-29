# Critique: `icons` folder, wave 1, round 4

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30, 01:32–01:50 CST.

**Score: 7.5 / 10. Verdict: NOT PASS.**
- The score is below 8.5.
- Smoke is **red**. `switch-theme-back` still times out because `github-auto` is not registered, which needs a restart.
- None of the overrides are live.

Console errors: 0 (112 live pages, 86 states, 100 simulated captures, 16 measure pages). Literal colours in
`src/icons/**`: 0.

Round 4 fixes the round-3 global regression (issue A) correctly and in a way I could verify:
- In Gitea's own `gitea-auto` theme, the post-restart pagination and PR-list output is **pixel-identical** to today.
- The markup is byte-identical too.

That fix also takes away the round-3 pagination gain. The GitHub themes now show Gitea's `«`/`»` until I-4, N-3 and
P-1 land. The visible GitHub-facing result after a restart is therefore the same as round 3 (minus the regression).
Everything big is still blocked on other owners: the restart, the file list and the masks. So the score stays at 7.5.
The folder's own work is now policy-compliant and has no side effects on other themes.

## What I verified myself

| Claim | How | Result |
|---|---|---|
| Nothing live | `docker inspect` StartedAt 2026-09-29T15:31:18Z; live PR list HTML | Confirmed. Live `<svg class="svg gitea-double-chevron-left" … width="12">` is still served, and `gitea-eclipse` appears on 112/112 pages. |
| Deployed = src | `cmp` of the 17 files in src/icons/svg against CUSTOM_PATH/public/assets/img/svg | 17/17 identical (chevrons at 01:26) |
| Restored chevrons = Gitea's original | `cmp` against gitea-src `public/assets/img/svg/gitea-double-chevron-{left,right}.svg`; path data compared with the **embedded** icon that the live server renders today (the server started before any override existed) | Byte-identical to gitea-src. The live inline path equals the restored file's path, so serving it from CUSTOM_PATH is equivalent to no override. |
| Generator | `SVGO_PATH=<scratch svgo 4.0.1> gen-icons --check`; full regeneration into tmp + `diff -r`; fidelity run against `@primer/octicons@19.28.1 --no-replace` | "2 upgraded, 374 identical, 13 replaced, 2 restored, 0 missing", exit 0. The regeneration is byte-identical to src. The fidelity run emits **0 files**. |
| Lint / build | `node build/lint.mjs`; `npm run build` | 0 errors and 0 warnings in all folders. `icons` is not a CSS build folder (by design). Served `theme-github-auto.css` sha256 = dist (307b9900…), so no deploy was needed. |
| Masks in dist | `grep -c gh-octicon dist/theme-github-auto.css` | **0**. I-4 has not landed. |
| §2.2 "0 hits" | grep of the 17 file names over gitea-src `web_src/css` and all non-github CSS in CUSTOM_PATH (Modern, Studio) | 0/0 for every name. **I also grepped the added `octicon-*` classes** (not in the builder's check). There are 2 hits, and neither affects rendering: `.svg.octicon-file-directory-symlink` colour (`base.css:887`), which the material provider already sets, and Modern's `.issue-content-right .octicon-gear`, which targets the issue sidebar, not the diff toolbar. |
| Mask selectors reach every use | `shared/issuelist.tmpl:1` is `<div id="issue-list">` and is included by repo, milestone, dashboard and subscriptions lists; `paginate.tmpl:8` is `.ui.borderless.pagination.menu` | P-1 and N-3 selectors match all call sites. |

## Simulation (my run, `shots/critic-icons-r4-sim.mjs`)

Scope: 5 targets × light/dark × 1440/390 × 5 modes = **100 captures, 0 failed, 0 console errors**.
- Targets: footer-theme, pulls-branches, **pulls-dashboard** (new), pagination, **pagination-commits** (new).
- Modes: gitea-auto today, gitea-auto after restart, github-auto today, github-auto after restart, and
  +I-4/N-3/P-1 injected.
- Sheets: `shots/critic-icons-r4/cmp-branches.png`, `cmp-pagination.png` and `cmp-footer.png`. I looked at all three,
  plus full-size crops.

- **gitea-auto, today vs after the restart:**
  - Pixel diff is **0 px on all 16 pagination and PR-list crops** (`shots/critic-icons-r4/pixel-diff-gitea-auto.json`).
  - Chevron `outerHTML` is identical in 16/16 comparisons.
  - The footer differs, as intended: `gitea-eclipse` becomes `device-desktop`, plus the render-time text.
  - The regression is gone.
- **github-auto, after the restart alone:** the PR list reads `main « head` and pagination reads `« First … Last »`, in
  Primer colours. This is today's state.
- **With I-4 + N-3 + P-1:**
  - Pagination at 390 reads `⇤ ‹ 3 › ⇥`.
  - Pagination at 1440 reads `⇤ First ‹ Previous 1 2 3 4 5 … Next › Last ⇥`.
  - The pagination mask applies at 16×16, bg = currentColor: rgb(31,35,40) light / rgb(240,246,252) dark.
  - The PR list reads `main ← head` at 12×12, rgb(89,99,110) / rgb(145,152,161). This covers the repo PR list and the
    user dashboard `/pulls` list.

The builder's claims all reproduce.

## Live audit (pre-restart)

Run: `shots/critic-icons-r4/run/`, 28 routes × light/dark × 1440/390, `--states --measure`.
- 112 pages: 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars.
- 86 states, 0 failed.
- 23 non-Octicon names, as in round 3 because nothing is live. Top counts: `gitea-eclipse` 112/112 pages;
  `gitea-double-chevron-left` 72 on 16 pages; `gitea-whitespace` and `gitea-split` 8 each (the admin diff style is
  back to unified).

I looked at:
- `icons-pulls/light-1440.png`: `main « theme-test/…`
- `icons-commit/states/light-1440-split-focus-clip.png`: Gitea's split glyph with a focus ring
- `look-repo-home-dark-crop.png`: material glyphs and accent-blue folders
- github.com crop `gh-pagination-light-1440-crop.png`: `‹ Previous 1 2 … 40 Next ›`, no First/Last

Off-palette colours, unchanged since round 3:

| Colour | Source | Owner |
|---|---|---|
| `rgba(0,0,0,1)` | `svg#svg-mfi-*` material symbols and Vue tree `git-entry-icon` (repo-home, code-file, commit, seed-repo-home) | Icon surface: needs I-3, or C-1 + C-2 + I-4 |
| `rgba(0,0,0,1)` | graph `#rel-container > svg`, Actions `svg.graph-svg` | pages |
| `rgba(0,0,0,0.8)` | dropzone | controls |
| `rgba(255,255,0,1)` | `mark` | markdown |

Smoke: `shots/20260930-014151-smoke-github-auto/`.
- Every step through `switch-theme-alt` passes.
- `switch-theme-back` times out on `.item[data-value="github-auto"]`.
- **Red.** The admin theme remains `gitea-auto` and the diff style `unified`.

## Issues (most important first)

1. **[major] Nothing is live (I-1).**
   - `gitea-eclipse` appears on 112/112 pages, with 23 non-Octicon names.
   - All post-restart evidence (the builder's and mine) is simulated.
2. **[major] The file list is still the largest deviation from github.com.** It needs I-3, or C-1 + C-2 + I-4, **and** I-6.

   | Scheme | Our directories | github.com |
   |---|---|---|
   | light | rgb(9,105,218) | rgb(84,174,255) |
   | dark | rgb(68,147,248) | rgb(145,152,161) |

   Material glyphs carry `rgba(0,0,0,1)` fills.
3. **[major, dependency] GitHub-theme pagination and PR-list glyphs depend on 3 unlanded requests.**
   - I-4 (masks bundle: 0 `gh-octicon` in dist), N-3 (navigation) and P-1 (pages/issues-prs).
   - Until they land, the GitHub themes show Gitea's `«`/`»` after the restart.
   - This is not a regression, but it is not GitHub either. github.com has no First/Last and uses `arrow-left` at 16px
     in the compare view.
4. **[minor] Icon and box sizes owned by other folders are unchanged.** I re-measured them this round:

   | Item | Ours | github.com |
   |---|---|---|
   | Commit status icon | 18×18 | 16×16 |
   | Pagination icon | 16×16 | 14×14 |
   | Pagination item | 43px / r4 / padding 13/16 | 32px / r6 / padding 8/6 |
   | Pagination Next colour | fg-default | accent rgb(9,105,218) |
   | Pagination disabled Previous | — | fgColor-disabled rgb(129,139,152) |
   | Diff toolbar button | 34×28, bg rgb(246,248,250), 1px rgb(209,217,224), r6 | 32×32 transparent |
   | P-1 arrow | 12×12 | 16×16 in the compare view |

5. **[minor] Upgrade pinning.** The `RESTORED` copies pin Gitea 1.27.3's chevrons in CUSTOM_PATH, and the caveat is
   documented. The same is true, but **undocumented**, for the 2 upgraded Octicons and the 13 replacements: a later
   Gitea that bundles Octicons newer than 19.38.0 would be *downgraded* by `octicon-project-template.svg` and
   `octicon-repo-forked-locked.svg`. Add one line to §2.2 or §4: re-run the generator on every Gitea upgrade. I-7 would
   let files that became identical drop out.
6. **[nit, bookkeeping] Request ID collisions.**
   - `docs/requests/code.md` has **two `C-3`s**: "Tree view chevrons 12px" (round 1) and "Diff toolbar icon buttons"
     (round 4).
   - `P-1` means the dashboard repo-list masks in `pages-people.md` but the PR-list arrow in `icons.md`.
   - The pages/issues-prs request lives only in `icons.md`, and there is no `docs/requests/pages-issues-prs.md`
     pointer, so the owner may never see it.
   - Rename the new items (for example C-4 and PR-1) and add a pointer.
7. **[nit] §2.2 wording.** "0 hits" is true for the 17 file names. The added `octicon-*` classes have 2 hits that do not
   change rendering (see the table above). Say that explicitly.
8. **[nit] Builder simulation crops are not deterministic.** In `shots/icons-r4/cmp-pag-branches.png` the dark
   `proposals` cells show a different PR row (`…172726`) from the other columns (`…172152`). This is cosmetic.
9. **[nit, process]**
   - svgo is still not a devDependency (I-2).
   - The `restartRequired` gap and deploy-never-deletes (I-7) are still open.
   - D-4 NoKeyFound is an accepted limitation.
   - Graph Mono/Color button padding belongs to controls.

## What is good

- Issue A is fixed by the right option. It is minimal and verified:
  - 0 px difference in gitea-auto across 16 crops
  - identical markup
  - no hooks on the 17 names in Gitea, Modern or Studio CSS
- The `RESTORED` workaround is a clean way around deploy-never-deletes. It is guarded: an error if a name is both
  replaced and restored, the same root sanity check, and `--check` covers it.
- The generator is exact and reproducible, and the fidelity run (19.28.1) emits 0 files.
- The docs are honest about what is simulated. §2.2 is a useful per-theme impact table.

## Measurements

- Ours: github-auto live preview, 1440 unless noted, `shots/critic-icons-r4/refcmp/` and `sim/`.
- github.com: captured 01:40 CST, `docs/reference/critic-icons-r4-{pagination,compare}/`. Repo-home and commit
  references are from critic r3.

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| file-list directory icon, light | color | rgb(9,105,218) | rgb(84,174,255) | no |
| file-list directory icon, dark | color | rgb(68,147,248) | rgb(145,152,161) | no |
| file-list icon | size | 16×16 | 16×16 | yes |
| latest-commit status icon | size | 18×18 | 16×16 | no |
| diff toolbar icon, light / dark | size / color | 16, rgb(89,99,110) / rgb(145,152,161) | 16, rgb(89,99,110) / rgb(145,152,161) | yes |
| diff toolbar button, light | box | 34×28, bg rgb(246,248,250), 1px rgb(209,217,224), r6 | 32×32, transparent, r6 | no |
| pagination icon | size | 16×16 | 14×14 | no |
| pagination item | height / radius / padding | 43px / 4px / 13px 16px | 32px / 6px / 8px 6px | no |
| pagination First/Last, gitea-auto after restart (sim) | pixels vs today | 0 px diff (16 crops) | n/a | yes |
| pagination First/Last, github-auto + N-3 (sim) | glyph / size / color | move-to-start/end mask, 16×16, rgb(31,35,40) / rgb(240,246,252) | no First/Last; chevrons 14×14 | partly |
| PR branch arrow, gitea-auto after restart (sim) | glyph | « unchanged (0 px diff) | n/a | yes |
| PR branch arrow, github-auto + P-1 (sim), light / dark | glyph / size / color | arrow-left mask, 12×12, rgb(89,99,110) / rgb(145,152,161) | arrow-left, 16×16, rgb(89,99,110) / rgb(145,152,161) | partly |
| generator fidelity | files | 2 upgraded, 374 identical, 13 replaced, 2 restored; 19.28.1 run emits 0 | — | yes |
