# Critique — foundation, wave L1, round 1 (FG-119 container width)

Critic: independent design-systems reviewer · 2026-09-30 · score **8.5 / 10** · smoke **green** · console errors **0** · literal colors **0**

## Verification performed
- `node build/lint.mjs foundation` → 0 errors, 0 warnings (46 selectors). `npm run build` → `folders.foundation.status = "ok"` (10 files, 16,049 B).
  (Whole bundle is flagged OVER BUDGET, 333.8 KB auto; not a foundation-specific problem.)
- Served `/assets/css/theme-github-auto.css` sha256 == `dist/theme-github-auto.css` (755d11ed…) → no deploy needed.
- Shots: `shots/critic-foundation-wL1-r1` (repo-issue, repo-home, repo-issues, releases, explore-repos, repo-pull, release-detail,
  org-home, user-profile, repo-commits; light+dark, 1440+390, `--states --measure`; + repo-pulls light 1440).
  40 pages: 0 console errors, 0 failed requests, 0 off-palette, 0 unresolved vars, 0 non-Octicon icons, 0 unlayered Gitea CSS,
  no horizontal overflow at 390, max CLS 0.0237 (org-home dark, repo-list `.label-list` — not foundation).
  6 "problems" are state selectors that timed out (repo-home tooltip-hover; repo-issues labels-btn-hover / select-all) — routes.json drift after the pages/issues-prs template, not foundation.
- Reference: `shots/critic-foundation-wL1-r1-ref` (github.com logged out: repo-issue, repo-home, repo-pull, releases, repo-pulls).
- Side-by-sides read: `shots/critic-foundation-wL1-r1/sbs/*.png` (repo-issue light/dark 1440, light 390; repo-home light 1440;
  repo-pull dark 1440/390; releases light 1440, dark 390; repo-pulls light 1440; state clip sheet `states-sheet.png`).
- Smoke: `node tools/shoot/smoke.mjs --theme github-auto` → all 12 steps ok, 0 console errors.
- Own probes: `shots/critic-foundation-wL1-hdr.mjs` (header/title/h1 x per width, both targets), builder's `foundation-gl1-ghedges.mjs`
  re-run on both targets, `shots/critic-foundation-wL1-focus.mjs` (keyboard focus ring).

## Container edges (h1 / content left x, px) — independently measured
| page | 1440 gh/ours | 1280 gh/ours | 1012 | 1011 | 800 | 767 | 390 |
|---|---|---|---|---|---|---|---|
| issue view | 104/104 | 24/24 | 24/24 | 24/24 | 24/24 | 16/16 | 16/16 |
| PR conversation | 112/112 | 32/32 | 32/32 | **24/16** | **24/16** | 16/16 | 16/16 |
| release detail | – | – | – | **24/16** | **24/16** | – | – |
| user profile / org home | – | – | – | **24/16** | **24/16** | – | – |
| repo home (right edge) | – | – | – | **987/995** | **776/784** | – | – |
Repo header (tabs x=32/24/16 at ≥1012/768–1011/<768) is identical on both targets and is not moved by the new rule (the header has its own padding).
Releases list container 163–1277 @1440 on both.

The builder's FG-119 claim is **confirmed** for the issue view at every width, with no regression on PR / repo home / releases.

## Issues (most important first)
1. **minor — foundation — tablet gutter 16px where github.com uses 24px (768–1011px).** `:root --page-margin-x: var(--base-size-16)` below 1012.
   github.com measured 24px on PR conversation, release detail, user profile, org home at 1011 and 800, and 24px on the *right* edge of repo home
   (left 16 there comes from the full-width ref selector button). Ours 16 on all except the issue view. Fix: `--page-margin-x: var(--base-size-24)` for
   768–1011 globally (and drop the issue-only rule to a single ≥1012 exception), then re-check repo home. Not on a gate viewport, hence minor.
2. **major (not foundation-owned) — FG-119's named route repo-pulls still differs.** github.com /pulls = centered 1232 list (x=104–1336 @1440, 24–1256 @1280),
   no sidebar; Gitea /pulls = pages/issues-prs full-width `.gh-issues-layout` with a left sidebar (x=0–1416). PNG `sbs/repo-pulls-light-1440.png`.
   Marking FG-119 DONE is correct only for foundation's part; the pulls-list layout must go to pages/issues-prs.
3. **nit — stale header comment in `src/foundation/layout.css:1-3`** still says github.com gutter is "16px below 1012px" for container-xl; own measurements
   (and the builder's) show 24px at 768–1011 for most Rails pages.
4. **nit (not foundation) — issue view inner widths:** comment column ends ≈990 vs gh ≈1015, sidebar ends 1336 vs gh 1328 @1440 (pages/issues-prs).
5. **nit (tooling) — repo-issue `toolbar-btn-focus` records `focusVisible:false`**: the state focuses a roving `tabindex=-1` button. Keyboard probe
   (Shift+Tab from textarea) shows the ring works: 2px solid rgb(9,105,218) light / rgb(31,111,235) dark, offset −2px, box-shadow none; primary button
   additionally inset 3px fgColor-onEmphasis — matches Primer focusOutline. Route selector should target `[tabindex="0"]`.

## Measurements (ours vs github.com, 1440 light unless stated)
- body text 14px/21px/400, color rgb(31,35,40) on rgb(255,255,255) — equal (dark: rgb(240,246,252) on rgb(13,17,23) — equal)
- issue page-heading 32px/40px/400 — equal; link color rgb(9,105,218) (dark rgb(68,147,248)) — equal
- markdown-p repo-home 16px/24px — equal; markdown-code 13.6px, pad 2.72/5.44, radius 6px, bg rgba(129,139,152,.12) — equal; markdown-pre pad 16, radius 6, bg rgb(246,248,250) — equal
- focus ring 2px / −2px / #0969da light, #1f6feb dark — equal to Primer
- font-family: ours system stack, github.com logged-out Mona Sans VF (logged-in github.com uses system stack) — accepted
