# Critique: data-display, wave 2, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.

**Score: 8.0 / 10. Not a pass.** The gate needs 8.5 or more. The other gates all pass: 0 console errors, 0 literal colors, smoke green.

## What I verified

- **Lint:** `node build/lint.mjs data-display` gives 0 errors and 2 warnings (literal `-15px` and `7px`/`-7px` in timeline.css). The build report shows `folders["data-display"].status = "ok"` (15 files, 38,975 bytes).
- **Deploy:** the served file is current. The `dist/theme-github-auto.css` SHA-256 is `e7be0002…ae7c`, and it matches http://localhost:3000/assets/css/theme-github-auto.css. I did not redeploy.
- **Our screenshots:** `shots/critic-data-display-r1/`, from routes file `shots/critic-dd-routes.json`.
  - 35 routes × light/dark × 1440/390, with `--states --measure`, gives 140 pages.
  - 0 console errors, 0 failed requests, 0 pages with problems, 0 unresolved vars, 0 pages with unlayered Gitea CSS.
- **Off-palette colours:**
  - `rgba(0,0,0,0.8)` on the comment-form `.ui.dropzone` border. This is the dropzone library's unlayered CSS, not this folder.
  - `rgba(0,0,0,1)` on `svg#svg-mfi-*` on repo-home. These are file-icon sprites, not this folder.
- **Non-Octicon icons:** `gitea-double-chevron-left` in the PR-list branch chips. This is the icons folder's P-2 decision, not this folder.
- **Reference:** github.com logged out, 15 routes, with states and measure, in `shots/critic-data-display-r1-ref/`. I also probed computed styles with `shots/critic-dd-probe.mjs` (read-only) and diffed with `shots/critic-dd-cmp.mjs`.
- **Smoke:** `node tools/shoot/smoke.mjs --theme github-auto` is **green**. All 12 steps passed with 0 console errors (`shots/20260930-030506-smoke-github-auto/`, log `shots/critic-data-display-r1-smoke.log`).

## Measurements (light, 1440)

| Control | Property | Ours | github.com | OK |
|---|---|---|---|---|
| Issue list Box | border / radius | 1px `#d1d9e0` / 6px | 6px container, border from header+ul | ✓ |
| Issue row | height | **62px** (8+24+4+18+8) | 64px | ✗ (−2) |
| Issue row | gap between title and meta | 4px (item-main) | 4px | ✓ |
| Issue title | font | 16px/600/24px `#1f2328` | 16px/600/24px `#1f2328` | ✓ |
| Issue title | hover | `--fgColor-accent` + underline | same | ✓ |
| Issue title | focus-visible | 2px accent outline | 2px accent outline | ✓ |
| Issue row | hover background | `#f6f8fa` | `#f6f8fa` | ✓ |
| Issue label | box | 96.5×20, 0 8px, pill, 12px/500 | 96.5×20, 0 8px, pill, 12px/500 | ✓ |
| Issue label | border colour | `rgba(0,0,0,.15)` (currentColor 15%) | label colour at alpha 0 (invisible) | ✗ nit |
| Meta line | font | 12px/18px `#59636e` | 12px/18px `#59636e` | ✓ |
| Meta line | item separation | 8px gap, no `·` | `·` separators | ✗ (template) |
| Counter (tab) | size / padding | 20px, 0 6px | 20px, 0 6px | ✓ |
| Counter (tab) | line-height | **12px** | 18px | ✗ (ND-1) |
| StateLabel "Merged" | box | 95.2×32, pill, 14px/600/16px, `#8250df` | 95.7×32, same | ✓ |
| StateLabel | padding | 0 12px (height via min-height) | 8px 12px + 1px inset shadow | ~ (same box) |
| Timeline badge | box | 32px circle, 2px `--bgColor-default` ring, `#f6f8fa`, icon `#59636e` | same | ✓ |
| Timeline badge | margin | 0 4px 0 −15px, plus 4px row gap | 0 8px 0 −15px | ✓ (same position) |
| Timeline event row | height / padding | 64px / 16px 0 | 64px / 16px 0 | ✓ |
| Event actor | colour | **`#59636e`** (muted) | `#1f2328` bold | ✗ |
| Comment header | height / bg | 38px / `#f6f8fa` | 38px / `#f6f8fa` | ✓ |
| Comment box | border / radius | 1px `#d1d9e0` / 6px | 1px `#d1d9e0` / 6px | ✓ |
| Comment body | padding | 16px | 16px | ✓ |
| Role label | box | 20px, 0 6px, pill, 12px/500, `#d1d9e0`, `#59636e` | 20px, 0 6px, same | ✓ |
| Timeline avatar | box | 40px, left −72px, 1px `rgba(31,35,40,.15)` ring | same | ✓ |
| Reaction pill | height / padding | 24px / 0 8px | 26px / 0 4px | ✗ nit |
| ProgressBar (milestones) | height / radius | **8px / 6px** | 5px / 3px | ✗ |
| ProgressBar | track | **`rgba(129,139,152,.12)`** `--bgColor-neutral-muted` | `#d1d9e0` `--progressBar-track-bgColor` | ✗ |

## Issues, most important first

1. **Major: the "reviewed" (comment review) timeline badge icon is invisible in light mode.**
   - `timeline.important.css` has `.timeline-item .badge.tw-text-white { color: var(--fgColor-onEmphasis) !important }`, and it applies to every badge.
   - Gitea renders a review of type 2 as `<span class="badge tw-text-white ">` with no `tw-bg-*` class (`comments.tmpl:376`). That badge keeps `--bgColor-muted`.
   - Result: a white icon on `rgb(246,248,250)`, about 1.05:1 contrast.
   - Where: `/octo-org/theme-playground/pulls/16`, "dave-qa reviewed" at y≈3075, in `shots/critic-data-display-r1/pr-conversation-playground-large-diff-reviews/light-1440.png`. Zoom: `shots/critic-data-display-r1/pg16-zoom.png`.
   - In dark mode the icon is white on `rgb(21,27,35)`. It is visible but wrong: github.com uses `--fgColor-muted` on `--bgColor-muted`.
   - Fix: scope the rule to filled badges, e.g. `.badge.tw-text-white:is(.tw-bg-green,.tw-bg-red,.tw-bg-purple,.tw-bg-grey)`, and make the unfilled one `--fgColor-muted`.
2. **Minor: event actor names are muted.**
   - In event rows Gitea renders the actor as `a.tw-font-semibold`, not `.author`. `.comment-text-line a { color: inherit }` wins, so the actor renders `#59636e`.
   - github.com renders `.author` as `#1f2328` / 600. The same applies to `<b>` targets such as the milestone name.
   - Probed on pulls/16 (32 samples).
3. **Minor: ProgressBar does not match GitHub's milestone bar.**
   - It is 8px tall with a 6px radius, on a `--bgColor-neutral-muted` track.
   - github.com milestones: 5px, 3px radius, track `--progressBar-track-bgColor` (= `--borderColor-default`, `#d1d9e0`), fill `--progressBar-bgColor-success`.
   - Evidence: `shots/critic-data-display-r1/milestones/light-1440.png` vs `shots/critic-data-display-r1-ref/milestones/light-1440.png`.
4. **Minor: open request ND-1 has no answer (counters inside UnderlineNav).**
   - The counter still has `line-height: 12px`; github.com has 18px (repo-issues tab counter measure). The box is 20px either way.
   - D-5 (the `unverified` mask for signed-but-unverified commit badges, requested by icons in w2 r1) is neither implemented nor mentioned in the status block.
   - ND-2 is not acknowledged, although nothing conflicts today: `img.ui.avatar` sets no width or height.
5. **Minor: issue row is 62px, not 64px.**
   - The builder claimed 64.5 / 63. `#issue-list > .item` measures 62px on repo-issues, repo-pulls and issues-list-closed (light 1440).
6. **Minor: the mobile issue meta line breaks into widely spaced lines.**
   - At 390 the `.item-body` wraps with an 8px row gap (Gitea `tw-gap-2`). For example "#272" sits alone on its own line above "opened … by", and the #48 row takes 3 lines.
   - github.com wraps inline with `·` separators.
   - Evidence: `shots/critic-data-display-r1/repo-issues/light-390.png` vs `shots/critic-data-display-r1-ref/repo-issues/light-390.png`.
7. **Nit: IssueLabel border.** Ours is `color-mix(currentColor 15%)`, which draws a visible ring on every coloured label: a black 15% ring on light labels and a white 15% ring on dark ones. github.com's border is the label colour at alpha 0. The white "wontfix" label is the only case where GitHub shows an outline.
8. **Nit: reaction pill** is 24px with 0 8px padding. github.com's is 26px with 0 4px padding (PR 42).
9. **Nit: StateLabel** uses `padding: 0 12px` plus `min-height` instead of `8px 12px`, and has no `inset 0 0 0 1px` same-colour shadow. The rendered box is identical (95×32).
10. **Page-scoped, recorded but not scored against this folder:**
    - The issue toolbar is not the Box-header (DD-1).
    - The milestone and org-members lists are unboxed (DD-2).
    - On the labels page the rows sit in a `.ui.attached.segment` with dividers, so the separators are inset 16px instead of full-bleed.
    - The issue sidebar is a bordered `.ui.segment`; github.com's sidebar is unboxed with 12px muted headings.
11. **Known limitations, confirmed:**
    - Dark-mode issue labels stay solid (inline `!important`).
    - Org avatars are square only in the three known contexts.
    - `/explore/repos?q=zzzzzzz` has no blankslate markup.
12. **CLS, unattributed:** home/390 is 0.3745 and repo-home/390 is 0.34–0.36. `shots/baseline-gitea-auto` has no CLS values (null), so I could not confirm the builder's "0.39 on built-in" claim. I did not attribute it to this folder.

## What is good

- The issue/PR list is almost indistinguishable in light and dark at 1440: row hover, title hover and underline, and the focus ring all match.
- StateLabel colours are correct for open, merged, draft, closed issue (purple) and closed PR (red).
- The timeline geometry is exact: 32px badges at −15px, 64px event rows, 38px comment header, the caret, the −72px avatar, the Owner/Member role labels, and the line continuing between boxes.
- DataTable (admin users) and Blankslate (projects empty) look right.
- The coloured badges for approved and changes-requested reviews are correct.
