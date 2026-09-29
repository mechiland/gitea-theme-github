# Critique: pages/issues-prs, wave 3, round 2

Critic: independent GitHub design-systems reviewer (writes no theme code). Date: 2026-09-30.

## Verdict

**Score: 8.5 / 10. PASS**, with one cross-folder regression that someone has to fix (issue 1).

- Console errors: 0. Literal colours: 0. Smoke: green.
- All three round-1 blockers are fixed and verified: the merge-style menu, the compare form and the Close-issue icon. The page now matches classic github.com closely on the issue list, the issue and PR headers (1440 and 390), the sidebar, the composer, the diffstat and the labels page.
- The score is held at 8.5, not higher, by four things:
  - A 32px misalignment on the PR Commits tab. It is caused by a pages/repo selector leaking into this page, and it was already visible in the builder's own run.
  - The 54px merge-style menu items.
  - The labels count text.
  - The PR-list branch chips.

## Build and audit

- **Lint:** `node build/lint.mjs pages/issues-prs` gives 0 errors, 0 warnings and 262 selectors.
- **Build:** `npm run build` gives revision 37fa4504fe. The build report shows `folders["pages/issues-prs"]` as `ok`, with 13 files and 63,347 B, and no folder is non-ok. All three bundles are OVER BUDGET (auto 429.1 KB). That is build-wide, but this folder grew 49 KB → 63 KB.
- **Served CSS:** `dist/theme-github-auto.css` and the served `/assets/css/theme-github-auto.css` have the same SHA-256 (107f898e…), so I did not deploy.
- **Audit run:** `shots/critic-pages/issues-prs-r2`, using routes `shots/critic-pages/issues-prs-r2-routes.json`. That file is my round-1 routes plus `update-branch-open`, `pr-compare-form-playground/form-open` and `repo-issue/close-icon`. It covers 21 routes, light and dark, 1440 and 390, `--states --measure`, 84 pages.
  - 0 pages with problems (all states ran).
  - 0 console errors and 0 failed requests.
  - 0 off-palette colours and 0 unresolved variables.
  - 0 non-Octicon icons (304 masked).
  - Max CLS 0.0066.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` passed 12/12 steps with 0 console errors (`shots/20260930-052718-smoke-github-auto`).
- **Reference:** `shots/critic-pages/issues-prs-r1-ref/` (github.com logged out, `--measure`), captured earlier the same day.

## Round-1 items re-verified

| # | item | result | evidence |
|---|---|---|---|
| 1 | Merge-style menu | **fixed.** `elementFromPoint` hits all 4 items at 1440 and 390, light and dark. The group has `isolation: auto`. Main button background: light rgb(31,136,61), dark rgb(35,134,54) = `--button-primary-bgColor-rest`. The pressed caret is `-active`: light rgb(25,121,53), dark rgb(46,154,64). The "Update branch" menu's 2 items are reachable too. | `ip2-probe.json`, `ip2-merge-menu-{light-1440,dark-390}.png`, `…/states/*-update-branch-open-clip.png` |
| 2 | Compare form | **fixed.** Main column 1032, gap 24, sidebar 320. The sidebar has border 0 and padding 0, with 12px muted headings. The tabs strip is `--bgColor-muted`. The gap from textarea to file bar is 0. The toolbar is centred on the tabs (Δ 0). | `ip2-compare-*.png`, `…/pr-compare-form-playground/states/*-form-open.png` |
| 3 | Close-issue icon | **fixed.** The svg is rgb(130,80,223) light and rgb(171,125,248) dark (`--fgColor-done`). "Close Pull Request" is red. | `repo-issue/states/dark-1440-close-icon-clip.png` |
| 4 | Diffstat | **fixed.** Text is 12px / 600. #42 (+3 −3) shows 2 green, 2 red and 1 neutral. #358 (+35 −1) shows 4 green and 1 neutral, pixel-identical in shape to github.com. | `ip2-diffstat-cmp.png` (ours above github.com, light and dark), `ip2-diffstat-42.png` |
| 5 | 390 header | **fixed.** Actions sit above the title, right-aligned. Title is 26px / 32.5px. The state label has its own row, and the meta line is full width (358px). The branch token is one 22px line with an ellipsis. Matches github.com 390 (`gh-issue390` vs ours). | `ip2-pr358-head-light-390.png`, repo-issue light-390 |
| 6 | Toolbar centring | **fixed** at ≥1012 (Δ 0px). At 390 it wraps to two rows under the tabs (64px tall), which is a known gap. | probe |
| 7 | Search input text | **fixed**: 14px, 32px tall. | probe |
| 8 | Labels rows | **fixed**: 57px at 1440 (github.com 57), 101px at 390. | `labels/dark-1440.png` vs ref |
| 9 | Reply form | **fixed**: same editor as the main composer. | `…/states/light-1440-reply-open-clip.png` |
| 11 | Nits | **fixed.** "#N" is weight 300. Title → state is 10px, state → meta is 10px. The filter trigger is rgb(37,41,46) (= github.com #25292e). Hover/press backgrounds are the `--control-transparent-bgColor-hover/active` tokens (light .10/.15, dark .20/.25). Empty PR sidebar values use the default colour. | `ip2-st.mjs` output, `ip2-m-pr-gt.txt` |

## Issues, most important first

1. **major (regression, cross-folder): the PR Commits tab header and list are 32px wider than the tab bar.**
   - Where: `pr-commits-tab` and `pr-commits-tab-playground`, 1440 (every width ≥768).
   - Measured: title x=80 w=1220, the commit Box x=81 w=1278, and the tab bar x=112 w=1216. On the Conversation tab the title, tabs and columns all start at x=112.
   - Cause: `src/pages/repo/branches.css:227`, `.repository.commits > .ui.container { width: var(--breakpoint-xlarge) }`, matches the PR page too, because its classes are `page-content repository view issue pull commits`. The nested `.ui.pull.tabs.container` keeps 1216.
   - The same leak from `src/pages/repo/commits.css:255-291` turns "N Commits" into a bare heading and the table into a stand-alone Box.
   - Round 1 had x=113. The builder's own run `shots/pages-issues-prs-w3r2-run/pr-commits-tab/light-1440.png` already shows x=81, and it was not reported.
   - Evidence: `issues-prs-r2/pr-commits-tab-playground/light-1440.png`.
   - Fix: in pages/repo, scope those rules with `:not(.pull)`. Alternatively, this folder can restore it page-scoped: `.repository.view.issue.pull.commits > .ui.container { width: calc(var(--breakpoint-xlarge) - 2 * var(--page-margin-x)); max-width: … }`.
2. **minor: the merge-style menu items are 54.4px tall** (Gitea's scoped `.action-text` padding 11.2px), and they have no check mark or description.
   - The "Update branch" menu next to them uses 32px items, so the two menus in the same Box disagree.
   - GitHub's merge menu is an ActionList with title plus description and a check mark on the selected item.
   - This folder owns the surface. A `merge-box.important.css` (Vue scoped CSS is unlayered) could reset `.action-text` padding to `--base-size-6 --base-size-8`. This is a known gap.
3. **minor (known gap): labels page count text.** Every row reads "N open issues/pull requests", including 0.
   - github.com shows an octicon and the number only, and hides zeros (`labels/dark-1440.png` vs reference).
   - It needs a template change (a request to the integrator), not CSS.
4. **minor (known, owner's choice P-2): PR list rows carry two BranchName tokens.** github.com uses that slot for check status.
5. **minor: 390 composer toolbar wraps to two rows under the tabs** (toolbar 340×64). This happens on the issue page, the new issue page and the compare form.
6. **nit: the copy-branch button in the head token is accent blue, not muted.**
   - header.css `.pull-desc code .btn { color: var(--fgColor-muted) }` loses to Gitea's `.interact-fg { color: inherit !important }` (helpers.css:25), so the rule is dead code.
   - Measured rgb(9,105,218). github.com draws a muted CopyToClipboard after the tokens.
7. **nits:**
   - Diffstat number → squares gap: 8px vs about 6px on github.com (`ip2-diffstat-cmp.png`).
   - The review reply footer is ordered [Reply(primary)] [Cancel]; github.com is [Cancel] [Comment].
   - The 390 title size is `calc(--text-title-size-large * 13/16)`, a derived value, not a token.
8. **Not verified:**
   - The 390 issue header buttons, the reply form and the compare form against github.com: they need login there.
   - The merged/closed merge box with Delete branch.
   - Server validation on the new-issue form (not submitted).

## Measurements (ours light 1440 vs github.com)

The table below is the source for the measurements array.

| control | property | ours | github.com | ok |
|---|---|---|---|---|
| layout | main / gap / sidebar | 872 / 24 / 320 | 872 / 24 / 320 | yes |
| title | font | 32 / 40 / 400 | 32 / 40 / 400 | yes |
| "#N" | weight | 300 muted | 300 muted | yes |
| title → state | gap | 10 | 10 | yes |
| state label | box | 80×32, 8px 12px, pill, 14/600 | same | yes |
| diffstat | font | 12 / 600 | 12 / 600 | yes |
| diffstat squares | geometry | 5 × 8px, 1px apart, r2, 4 green + 1 neutral (#358) | same | yes |
| diffstat | text → squares gap | 8px | ~6px | nit |
| 390 title | font | 26 / 32.5 | 26 / 32.5 | yes |
| 390 meta | width | full 358px, own row | full width | yes |
| sidebar heading | font | 12 / 600 / 18 muted | same | yes |
| sidebar divider | border | 1px rgba(209,217,224,.7) | 1px borderColor-muted | yes |
| filter trigger | box / colour | 32, 0 12, 14/400, rgb(37,41,46) | 32, 0 12, 14/400, #25292e | yes |
| search input | text | 14px, 32 tall | 14px | yes |
| labels row | height | 57 | 57 | yes |
| merge-style menu item | height | 54.4 | ~32 single-line ActionList (title-only) | no |
| PR commits tab | header x vs tabs x | 80 vs 112 | aligned | no |
| composer toolbar | centre offset | 0 | 0 | yes |
