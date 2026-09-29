# Critique: `icons` folder, wave 1, round 3

Critic: independent GitHub design-systems reviewer. I wrote no theme code. Date: 2026-09-30, 01:12–01:25 CST.

**Score: 7.5 / 10. Verdict: NOT PASS.**
- The score is below 8.5.
- Smoke is **red**: `switch-theme-back` times out because `github-auto` is not registered. It needs a restart.
- None of the overrides are live.

Console errors: 0 (112 live pages, 128 simulated captures, 16 measure pages). Literal colours in `src/icons/**`: 0.

The folder is still careful work: the generator is exact and every round-2 nit was handled. Round 3 does make the
pagination bar correct in GitHub themes with the restart alone. But it gets there by changing a **global** override
(policy §6). That creates a regression in Gitea's own themes, where every PR-list row will read `main ⇤ head`, and no
CSS in this repo can undo that. The GitHub end state still depends on I-4, which has only moved from navigation (N-3)
to pages/issues-prs (P-1). The trade therefore removes no dependency and adds a cost that other themes pay. That
offsets the pagination gain, so the score stays at 7.5.

## What I verified myself

| Claim | How | Result |
|---|---|---|
| Nothing live | `docker inspect` StartedAt 2026-09-29T15:31:18Z (23:31 CST); `curl /` at 01:12 CST | Confirmed. `gitea-eclipse` is still served. |
| Deployed = src | `cmp` of 17 files, src/icons/svg vs CUSTOM_PATH/public/assets/img/svg | 17/17 identical |
| Generator | `SVGO_PATH=<scratch svgo 4.0.1> gen-icons --check`, plus full regeneration into tmp and `diff -r` | "2 upgraded, 374 identical, 15 replaced, 0 missing"; regeneration byte-identical to src |
| New chevron drawings | override paths vs `move-to-start-16.svg` / `move-to-end-16.svg` | Same geometry. Only svgo's shortening differs (explicit `L`/`Z` dropped). `class="svg gitea-double-chevron-left octicon-move-to-start"`, 16×16, `aria-hidden`, no fill. |
| Lint / build | `node build/lint.mjs`; `npm run build` | 0 errors and 0 warnings in all 15 folders. `icons` is not a CSS build folder (by design). Served `theme-github-auto.css` sha256 = dist (88caff17…), so no deploy was needed. |
| Masks in dist | `grep -c gh-octicon dist/theme-github-auto.css` | **0**. I-4 has not landed. |
| Builder sim report | `shots/icons-r3/sim/report.json` | 96 captures, 0 failed, 0 console errors. `filelist-*-proposals`: `unlayered: 0`, directories rgb(145,152,161) dark. `filelist-*-ours`: `unlayered: 1`. Matches the claim, and the cmp-c.png third column now really shows the end state (round-2 nit 8 fixed). |
| `iconsChanged: 0` "looks wrong" | `build/build.mjs:163-175`, plus file mtimes | The counter is per invocation. The deployed chevron was written at 01:02:28, 4 s after src (01:02:24), so a later deploy correctly reports 0. The real gap is different: `restartRequired` is also false on that no-op deploy even though the server has not restarted. That belongs with I-7 (integrator). |
| N-3 withdrawn, P-1 filed, pages-people follow-up, D-4 NoKeyFound note | request files | Present: navigation.md:29, icons.md "P-1", pages-people.md:19-22, data-display.md:44 |

## Issue A (new, major): the chevron change is a global regression for non-GitHub themes

`gitea-double-chevron-left` is rendered by the server in three places:
- `base/paginate.tmpl:11` (First)
- `base/paginate.tmpl:38` (the `-right` twin, Last)
- `shared/issuelist.tmpl:68`, a 12px glyph between the base and head branch in **every PR-list row**

The override file applies to **all themes** (ARCHITECTURE §6). Policy §6 allows an override "only where the icon is
purely presentational". The PR-list use carries direction meaning (merge head into base). Round 3 knowingly turns it
into `move-to-start`, a "jump to beginning" glyph.

The only fix, P-1, lives in `@layer gh.pages-issues-prs`, so it reaches **only** the github-* themes. `DEFAULT_THEME`
in app.ini is `gitea-auto`, so the default for every user of this instance is affected. Modern and Studio do not
restyle the glyph either: `grep double-chevron` over CUSTOM_PATH/public/assets/css found 0 hits.

Evidence: my simulation `shots/critic-icons-r3-sim.mjs` has a 4th mode, "ours-gitea-theme": icons rewritten as after
the restart, Gitea's own `gitea-auto` theme left in place. Sheet: `shots/critic-icons-r3/cmp-pag-branches.png`, which I
looked at. Data: `sim/report.json`.

| Mode (1440, light / dark) | PR-list glyph | Size | Colour |
|---|---|---|---|
| gitea (today) | « `gitea-double-chevron-left` | 12×12 | rgb(89,99,110) / rgb(145,152,161) |
| ours (github-auto, after the restart) | ⇤ `octicon-move-to-start` | 12×12 | same |
| **ours-gitea-theme (gitea-auto, after the restart)** | **⇤, no fix possible from this repo** | 12×12 | rgb(91,97,103) / rgb(150,154,161) |
| ours-p1 (P-1 injected) | ← mask applied, bg = currentColor | 12×12 | rgb(89,99,110) / rgb(145,152,161) |

The trade also does not buy the independence it claims:
- Round 2: the GitHub end state needed I-1 + I-4 + N-3 (navigation).
- Round 3: it needs I-1 + I-4 + P-1 (pages/issues-prs).
- In both cases I-4 gates it.

What changed is which intermediate state is wrong:
- Round 2, after the restart alone: `← ‹ 1 › →` on the pagination bar, GitHub themes only.
- Round 3, after the restart alone: `main ⇤ head` in PR lists, **all themes, permanently for non-GitHub themes**.

Recommended alternatives, both with zero effect outside the GitHub themes:
- (a) Leave `gitea-double-chevron-left/right` **un-overridden**. Navigation masks the two pagination uses to
  `move-to-start`/`move-to-end`, and P-1 masks the PR-list glyph to `arrow-left`. Both need I-4, which is required
  anyway.
- (b) Go back to the round-2 `arrow-left`/`arrow-right` file. It is correct in the PR list for all themes and neutral in
  pagination ("← First" is readable when the label is shown). Restore N-3 for 390px in GitHub themes.

Either way, docs/icons-audit.md must record the effect on other themes. The round-3 row only discusses GitHub themes.

## Simulated after-restart icons (my run)

Script: `shots/critic-icons-r3-sim.mjs`. 8 targets × light/dark × 1440/390 × 4 modes = **128 captures, 0 failed, 0
console errors**. Sheets, both of which I looked at:
- `shots/critic-icons-r3/cmp-pag-branches.png`
- `shots/critic-icons-r3/cmp-other.png`

- **Pagination (github-auto):**
  - 390: `⇤ ‹ 1 › ⇥`.
  - 1440: `⇤ First ‹ Previous 1 2 3 4 5 … Next › Last ⇥`, in light and dark.
  - Unambiguous. The builder's claim holds.
- **PR-list glyph:** see Issue A.
- **P-1 by injection:** `mask: true`, 12×12, bg = currentColor. It works as claimed.
  - github.com's compare view shows `base: main ← compare: main` with a **16×16** `octicon-arrow-left` in rgb(89,99,110)
    light / rgb(145,152,161) dark (`docs/reference/critic-icons-compare/*`, crop
    `shots/critic-icons-r3/gh-compare-crop.png`, which I looked at).
  - github.com's PR list shows no branch pair at all. So 12px is acceptable as metadata, but hiding `.branches` would be
    the stricter parity.
- **Graph Mono/Color:** `○ Mono` / `paintbrush Color`. The glyphs are fine.
  - In github-auto the segmented buttons have no left padding. The circle touches the Mono button's edge, and the
    paintbrush touches "Mono" (`sim/graph-buttons-light-1440-ours.png`, which I looked at).
  - In gitea-auto with the same icons the spacing is normal, so this is controls/pages-repo padding, not an icon
    problem.
- **Footer theme menu:** `device-desktop` for Auto. **Diff toolbar:** gear, then rows/split-view, then kebab. **Sign
  badge:** `unverified` (hidden by D-4 once applied). All good.

## Live audit (pre-restart)

Run `shots/critic-icons-r3/run/`, from `shots/critic-icons-r3-routes.json` (28 routes) with `--states --measure`:
- 112 pages: 0 problems, 0 console errors, 0 failed requests, 0 unresolved vars.
- 86 states, 0 failed.
- Non-Octicon names live, identical to round 2 (nothing is live):

| Name | Count | Pages |
|---|---|---|
| `gitea-eclipse` | 112 | 112/112 |
| `gitea-double-chevron-left` | 56 | 12 |
| `gitea-whitespace` | 8 | 8 |
| `gitea-join` | 8 | 8 |
| `gitea-unlock` | 4 | 4 |
| `fontawesome-send` | 12 | 4 |
| `fontawesome-save` | 4 | 4 |
| `material-invert-colors` | 4 | 4 |
| `material-palette` | 4 | 4 |
| `gitea-double-chevron-right` | 4 | 4 |

Brand icons are kept deliberately: migrate cards, colorblind markers, openid, `gitea-running`, npm.

I looked at:
- `shots/critic-icons-r3/look-seed-repo-home-dark.png`: material brand glyphs, accent-blue directories, and a blue Code
  button, which is I-6 in action.
- `look-seed-pulls-light.png`: « between the branches.
- `icons-commit/states/dark-1440-split-hover-clip.png`: Gitea's split glyph.

**Off-palette colours on the icon surface:** `rgba(0,0,0,1)` fill from `svg#svg-mfi-*` material symbols and the Vue
file tree's `git-entry-icon`, on repo-home, code-file, commit and seed-repo-home. These need I-3 or C-1 + C-2 + I-4.

**Off-palette colours not from this folder:**
- `div#rel-container > svg` (graph) and `svg.graph-svg` (Actions run): pages
- `rgba(0,0,0,0.8)` dropzone border: controls
- `rgba(255,255,0,1)` `mark`: markdown

Smoke: `shots/20260930-012152-smoke-github-auto/smoke.json`.
- Every step passes up to and including `switch-theme-alt`.
- `switch-theme-back` times out on `.item[data-value="github-auto"]`.
- **Red.**

## Issues (most important first)

1. **[major] Nothing is live.** Needs I-1.
   - `gitea-eclipse` on 112/112 pages; 22 non-Octicon names.
   - All after-restart evidence (the builder's and mine) is simulated.
2. **[major] New in round 3: global PR-list regression.**
   - After the restart, every theme renders `main ⇤ head`, including the instance default `gitea-auto`, Modern and
     Studio. P-1 can repair only the github-* themes.
   - This contradicts policy §6 ("purely presentational only").
   - It does not remove the I-4 dependency. Fix with alternative (a) or (b) above, and document the effect on other
     themes in docs/icons-audit.md.
3. **[major] The file list is still the largest visible deviation from github.com.** Needs I-3, or C-1 + C-2 + I-4,
   **and** I-6.

   | Scheme | Our directories | github.com |
   |---|---|---|
   | light | rgb(9,105,218) | rgb(84,174,255) |
   | dark | rgb(68,147,248) | rgb(145,152,161) |

   - Material glyphs carry `rgba(0,0,0,1)` fills.
   - The end state is proven only by the builder's simulation (cmp-c.png, which I looked at, matches its report).
4. **[major, cross-folder] I-6 is still open.**
   - The live repo home shows the blue Code button and accent directories.
   - Every repo-home and file-view measurement stays Gitea's until the integrator lands the `media="not all"` link.
5. **[minor] Icon sizes: all owned by other folders, unchanged.**

   | Icon | Ours | github.com |
   |---|---|---|
   | Latest-commit status | 18×18 | 16×16 |
   | Pagination icons | 16×16 | 14×14 |
   | P-1 arrow | 12×12 | 16×16 in the compare view |

   - Pagination items: ours 43px tall, 4px radius, 16px padding; github.com 32px, 6px.
   - Diff toolbar button: ours **34×28**, bg rgb(246,248,250), 1px rgb(209,217,224) border; github.com 32×32,
     transparent. This changed since round 2's 30×30, through the controls folder.
6. **[minor] D-4 NoKeyFound limitation.** It is now documented correctly (data-display.md:44, audit). I accept it as a
   limitation. github.com would show "Unverified".
7. **[nit] Graph Mono/Color buttons.** In github-auto the icons touch the button edge and the neighbouring label. This
   is padding owned by controls/pages-repo. The glyph choice (`circle`) is fine.
8. **[nit, process]**
   - svgo is still not a devDependency (I-2).
   - Deploy never deletes removed overrides (I-7), and `restartRequired` resets to false on a no-op deploy.
   - The builder's claim that `iconsChanged: 0` is a wrong counter is itself inaccurate: the counter is per invocation.

## What is good

- The generator is exact and reproducible. `--check` and a full regeneration are byte-identical to src.
- The new chevron files are clean Octicons with correct hooks.
- The pagination bar in GitHub themes reads correctly after the restart alone, at 390 and 1440, in light and dark.
- Round-2 nits were fixed:
  - the simulation now includes I-6
  - cmp-c/d show the real end state
  - the contact sheet is reproducible (197/197)
  - the icon counts are explained
  - D-4 is corrected
- P-1 is precise, minimally scoped, and verified by injection with real numbers.

## Measurements (ours = github-auto live preview, 1440 unless noted; github.com captured 01:15 CST)

Our side: `shots/critic-icons-r3/refcmp/`. Reference: `docs/reference/critic-icons-{pagination,compare,repo-home,commit}/`.

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| file-list directory icon, light | color | rgb(9,105,218) | rgb(84,174,255) | no |
| file-list directory icon, dark | color | rgb(68,147,248) | rgb(145,152,161) | no |
| file-list icon | size | 16×16 | 16×16 | yes |
| latest-commit status icon | size | 18×18 | 16×16 | no |
| diff toolbar icon, light / dark | size / color | 16, rgb(89,99,110) / rgb(145,152,161) | 16, rgb(89,99,110) / rgb(145,152,161) | yes |
| diff toolbar button, light | box | 34×28, bg rgb(246,248,250), 1px rgb(209,217,224), r6 | 32×32, transparent, r6 | no |
| pagination icon | size | 16×16 | 14×14 | no |
| pagination item | height / radius | 43px / 4px | 32px / 6px | no |
| pagination First/Last glyph, 390 (sim) | glyph | move-to-start / move-to-end | (no First/Last; Previous/Next text kept, 85.5px) | no |
| PR branch arrow, github-auto after restart (sim) | glyph | move-to-start ⇤ | arrow-left ← (compare view) | no |
| PR branch arrow, gitea-auto after restart (sim) | glyph | move-to-start ⇤ (unfixable) | n/a (Gitea's «) | no |
| PR branch arrow with P-1 (injected), light / dark | glyph / size / color | arrow-left mask / 12×12 / rgb(89,99,110) / rgb(145,152,161) | arrow-left / 16×16 / rgb(89,99,110) / rgb(145,152,161) | partly |
| generator fidelity (19.38.0 check) | files | 2 upgraded, 374 identical, 15 replaced | — | yes |
