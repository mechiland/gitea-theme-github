# Critique: dark, wave 3b, round 1

Critic: independent design-systems reviewer. I wrote no theme code.

**Score: 8.6 / 10. Pass.** The score is at least 8.5. There are 0 console errors attributable to the theme, 0 literal colours, and the smoke test is green (12 of 12 steps in light and 12 of 12 in dark).

## What I ran myself

| Check | Result |
|---|---|
| `node build/lint.mjs dark` | 0 errors, 0 warnings, 6 selectors |
| `npm run build` → `dist/build-report.json` | `folders.dark.status = "ok"`, 2 files, 2,691 B of source |
| Output of the dark layer | Auto file: 1,294 B minified, inside `@layer gh.dark{@media (prefers-color-scheme:dark){…}}`. `theme-github-dark.css` has 4 `--gh-label-veil` refs and no media wrapper. `theme-github-light.css` has 0. |
| Served bytes | sha1 of `http://localhost:3000/assets/css/theme-github-auto.css` = sha1 of `dist/theme-github-auto.css` (8b49856…). The served file was not stale, so I did not redeploy. |
| Shoot: all 101 routes × light/dark × 1440/390, `--states --measure` → `shots/critic-dark-r1/` | 404 pages. 0 off-palette colours, 0 unresolved vars, 0 failed requests, 0 pages with unlayered Gitea CSS. The raw console count is 8: one per 404 capture (not-found and not-found-anon × 2 schemes × 2 viewports), all the expected 404 document. The 396 non-404 pages have 0. 4 page problems, all state-selector timeouts at 390 (repo-home branches-link-hover/focus, repo-commits sha-hover), in both schemes. The element is hidden at 390, so this is a route/tool issue, not a style issue. Max CLS 0.3648 is on `home` at 390 in both schemes (source `div.flex-container-main`, the Vue repo list loading). The same 0.3648 is in `shots/dark-r1-before` and `shots/integrate-w3`, so it is pre-existing and not caused by dark. |
| Smoke `node tools/shoot/smoke.mjs --theme github-auto` | **Green**, 12 of 12 steps, 0 console errors (`shots/critic-dark-r1-smoke.log`) |
| Smoke `--scheme dark` | **Green**, 12 of 12 steps, 0 console errors. Final screenshot `shots/20260930-103159-smoke-github-auto/final.png`, which I looked at. |
| github.com IssueLabel computed style, logged out, dark, `pemistahl/grex/labels`, read-only | `shots/critic-dark-r1-probe/ghlabel.mjs`. Output in the table below. |
| Label probes | `shots/critic-dark-r1-probe/probe.mjs` (computed style of every label in dark and light), `edge.mjs` (DOM-injected edge cases, nothing saved to Gitea), `md.mjs` (Mermaid, code blocks and images in dark) |

## DD-D1 / IssueLabel in dark: verified

Side by side at 2× (`shots/critic-dark-r1-probe/labels-sbs.png`: ours on the left, github.com dark on the right, same 13 grex labels). I pixel-sampled the tint inside each pill and the brightest text pixel.

| label | tint ours / github | text ours / github |
|---|---|---|
| bug #d73a4a | (49,23,31) / (50,24,32) | (235,157,165) / (236,161,168) |
| dependencies #0366d6 | (11,31,57) / (12,32,58) | (129,179,235) / (95,168,253) |
| documentation #0075ca | (10,34,54) / (11,35,55) | (128,186,229) / (58,173,255) |
| duplicate #cfd3d7 | (47,51,57) / (48,52,58) | (207,211,215) / (208,212,216) |
| enhancement #a2eeef | (39,56,61) / (40,57,62) | (162,238,239) / (163,238,239) |
| github_actions / rust #000000 | (10,13,18) / (11,14,19) | (128,128,128) / (153,153,153) |
| good first issue #7057ff | (30,29,64) / (31,30,65) | (184,171,255) / (194,184,255) |
| help wanted #008672 | (10,37,39) / (11,38,40) | **(128,195,185) / (0,230,196)** |
| invalid, new feature, wontfix | within 1–2 per channel | within 1–2 per channel |
| question #d876e3 | (49,34,59) / (50,35,60) | (216,118,227) / (219,130,229) |

- The tint matches github.com within 1 per channel on all 13 labels. The ring is present and visible on the page (`--bgColor-default`) and on overlays (`--bgColor-inset`): `shots/critic-dark-r1/repo-issues/states/dark-1440-label-filter-open-clip.png`, `dark-390-label-filter-open.png` and `shots/critic-dark-r1/repo-issue/states/dark-1440-labels-panel-open-clip.png`. The `github_actions` and `rust` regression is fixed.
- Geometry (ours / github.com): 20px / 20px high, 9999px radius on both, 1px border on both, font 12px on both, **weight 500 / 600**, padding 0 8px on both.
- Light is unchanged. Computed style in light: `background-clip: border-box`, `::before` content `none`, text fill = inline colour. Screenshot: `shots/critic-dark-r1-probe/light-pg-labels-crop.png`.
- Row hover over a label link (`A.item > span.ui.label`) keeps the tint and ring: `shots/critic-dark-r1-probe/dark-label-hover.png`.

## Issues (most important first)

1. **minor: saturated dark labels are duller than github.com.** Scope: dark, every route with labels, both viewports. GitHub shifts HSL lightness by `(0.6 − perceived lightness)`, which keeps saturation. The 50% white veil lowers it instead. Measured text: help wanted (128,195,185) against (0,230,196), which is 128 per channel apart. Documentation (128,186,229) against (58,173,255). Dependencies (129,179,235) against (95,168,253). The playground's `area/ci` #5319e7 computes to (169,140,243) against (220,208,250). Near-black labels come out (128,128,128) against (153,153,153). Contrast is still fine: #808080 on the tinted `--bgColor-default` is about 4.9:1. The whole set is visibly "paler teal and blue" next to github.com (`labels-sbs.png`). *Optional*, which I checked numerically over 18 common dark label colours: a 60% veil plus `filter: saturate(1.8)` on `.gt-ellipsis` (a unitless number, not a colour) lowers the mean per-channel error from 61 to 53 and makes #000 exactly #999. It costs bug/red about 17 channels. No linear filter reproduces the HSL shift exactly, so this stays a nit-level trade-off.
2. **minor, not dark-specific (data-display owns it): IssueLabel weight is 500 but github.com uses 600** (`prc-Token-IssueLabel`, measured computed `font-weight: 600` on all 13 labels). This affects both schemes. It is the most visible remaining label difference after colour. I did not file a request because it is a data-display item and should go through that folder.
3. **nit: scoped labels show a double seam in dark.** `priority | high/low/medium` on `/octo-org/theme-playground/labels`: each half draws its own 30% ring, so where the halves meet you get two stacked 1px rings plus the scope-left/scope-middle colour change (`shots/critic-dark-r1-probe/dark-pg-labels-crop.png`). GitHub has no equivalent to compare against. Suggestion: drop `::after` on `.scope-left` for the right edge, or on `.scope-middle` for the left edge.
4. **nit: selecting text in a dark label makes it low-contrast.** With `-webkit-text-fill-color: transparent` the selected glyphs keep the clipped label paint over the selection highlight. "SelectMe" on #fbca04 reads grey-on-blue (`shots/critic-dark-r1-probe/dark-edge.png`, third pill). Light is normal. `::selection { -webkit-text-fill-color: currentColor }` or a token colour on the label would fix it.
5. **nit: an emoji outside Gitea's emoji DB becomes a label-coloured silhouette.** Gitea wraps every known Unicode emoji in `span.emoji` (`modules/markup/html_emoji.go`), so seeded content is fine. A bare emoji glyph that is not wrapped renders as a silhouette (`dark-edge.png`, first pill, leading 🚀). This is an edge case.
6. **nit: `inset: -1px` in `src/dark/labels.css` is a literal length.** The lint accepts it, but it is the border width. Prefer `calc(-1 * var(--borderWidth-thin))`, to match `overflow-clip-margin: var(--borderWidth-thin)` a few lines above.

## Rest of the dark site

I found no dark-only gaps. These are spot comparisons I looked at in `shots/critic-dark-r1-probe/sbs/` and `grid/`:

- **Paired routes at 1440 in dark** (repo-home, repo-pulls, repo-pull, repo-pull-files, repo-code-file, releases, user-profile, action-run, login and others). Page background (13,17,23) matches on every one I sampled. README markdown, code blocks and diff add/delete colours are visually identical. Nav counter (30,35,42) matches exactly. Markdown pre and code match on every measured property.
- **Unpaired routes in dark** (home heatmap, project board, repo and user settings, notifications, admin, action-job log, packages, teams, new issue, repo-create, split diff, milestone issues, and six routes at 390). All of them look coherent, with no light-only artefacts.
- **Mermaid** renders with Gitea's `theme: 'dark'` (node (31,32,32)). This is JS-chosen inside an iframe and not stylable from our CSS.
- **Images in the showcase** are not inverted.

These gaps are not dark-specific. Other folders own them:

- Button counters in the Watch/Star/Fork buttons are outlined circles; github.com fills them (#2f3742 in dark), in both schemes.
- The login primary button has a resting shadow; github.com has none, in both schemes.
- The login input focus uses a 2px outline; github.com uses a 1px inset accent shadow.

## Measurements (ours / github.com, dark 1440)

- IssueLabel: height 20 / 20. Radius 9999 / 9999. Border 1px / 1px. Border colour text@30% / text@30%. Font 12px / 12px. Weight 500 / 600. Tint = label@18%, sampled within 1 per channel.
- Label text colour: see the table above. 8 of 13 are within 13 per channel; help wanted is 128 apart, documentation 72, dependencies 34, black labels 25.
- Repo-nav counter bg: (30,35,42) / (30,35,42) sampled.
- button-primary (repo-home): height, padding, radius, colour, bg and box-shadow all equal. Line-height 20 / 21.
- markdown-pre and markdown-code (repo-home): all measured properties equal.
- Page bg: (13,17,23) / (13,17,23).
