# Critique: foundation, wave 1, round 1

Critic: independent GitHub design-systems reviewer. I wrote no theme code.
Date: 2026-09-30. Build: foundation `ok`, lint 0 errors / 0 warnings / 47 selectors. The served `theme-github-auto.css` equals `dist/` (SHA-256 checked, so no deploy was needed). The theme is unregistered, so everything ran in PREVIEW mode.

**Score: 7.5 / 10. FAIL.** Score is below 8.5 and smoke is red.

## Evidence

- Gitea captures: `shots/critic-foundation-r1/` (12 routes x light/dark x 1440/390, with `--states --measure`). Routes are in `shots/critic-foundation-routes.json`.
- Built-in baseline (`gitea-auto`): `shots/critic-foundation-r1-builtin/`.
- github.com reference, logged out, no form interaction: `shots/critic-foundation-r1-ref/`. This covers pemistahl/grex home, commits and releases, explore, login, 404 and the octocat profile.
- Computed-style probes (headings, kbd, code, containers, Tab-key focus, ::selection, color-scheme):
  - `shots/critic-foundation-r1/probe-gitea.json` (ours)
  - `probe-gitea-builtin.json` (gitea-auto)
  - `probe-github.json` (github.com)
  - Script: `shots/critic-foundation-probe.mjs`
- CLS A/B test (theme CSS with and without the foundation layer, and with parts of it removed): `shots/critic-foundation-cls.mjs`. Variants are in the scratchpad `cf1/`.
- Crops and side-by-side images I looked at: `shots/critic-foundation-r1/crops/*.png`. These are repo-light-top, gh-repo-light-top, login-light-pair, login-dark-pair, releases-pair, milestone-ours-vs-builtin, settings-ours-vs-builtin, profile-light, states-sheet, login-focus-zoom and dark-390-sheet.
- Smoke log: `shots/critic-foundation-r1/smoke.log`.

Seed note: `octo-org/grex` is stuck at "Migrating from ..." and its page calls `/-/migrate/status`, which returns 404. `octo-org/prom_ex` and `octo-org/folderify` do not exist. So the Gitea side of the repo routes uses `octo-org/theme-playground`, and the github.com side stays pemistahl/grex as the styling reference.

## Issues, most important first

### 1. BLOCKER (integrator / template; it cancels foundation). Gitea's index.css is re-injected unlayered on repo pages

On repo pages the lazy chunks (RepoFileSearch, katex, mermaid) load through Vite's `preload-helper`. That helper only skips a CSS dependency when `link.href === dep && link.rel === "stylesheet"`:

```
for(...){let t=r[e];if(t.href===i&&(!o||t.rel===`stylesheet`))return}
let s=document.createElement(`link`);s.rel=o?`stylesheet`:e ...
```

`head_style.tmpl` (github branch) and `lib/preview.mjs` only emit `<link rel="preload" as="style">` plus `@import ... layer(gitea)`. The helper therefore appends `<link rel="stylesheet" href="/assets/css/index.DleUJaOD.css">`. That copy is unlayered, and about 0.3 s after load all of Gitea's CSS beats every `gh.*` layer.

On `/octo-org/theme-playground` I measured with and without the injection, stripping the link via a MutationObserver:

| property | injected (what users get) | injection blocked (foundation as designed) | github.com |
|---|---|---|---|
| content x / width @1440 | 80 / 1280 | 112 / 1216 | 112 / 1216 |
| content x @390 | 8 | 16 | 16 |
| nav-to-content gap | 14px | 24px | 24px |
| body line-height | 20px | 21px | 21px |
| kbd | 2px/4px pad, 4px radius, white bg | 4px pad, 6px radius, bgColor-muted | Primer kbd |
| focus ring, dark | rgb(68,147,248) | rgb(31,111,235) | rgb(31,111,235) |
| ::selection | solid rgb(9,105,218), white text | rgba(9,105,218,.2), own text | UA default |

The page also jumps when the injected CSS lands. `--page-margin-x` falls back from 16px to 8px at 390, and the repo tab bar changes from 43 to 45px:

- Repo home @390: CLS 0.553 vs built-in 0.252 (`shots/critic-foundation-r1/summary.json`).
- README file view @390: CLS 0.26 vs 0.054 without foundation.
- With the injection blocked, foundation adds nothing: 0.27 vs 0.21–0.25, and 0 vs 0.

The builder's "CLS no worse" claim was measured on `admin/jiri`, which never loads these chunks.

Proposed integrator fix (not a foundation file): in the github branch of `templates/base/head_style.tmpl` and in `tools/shoot/lib/preview.mjs`, also emit an inert link for each Gitea CSS URL, for example `<link rel="stylesheet" href="{{.}}" media="not all">`. Vite then finds a `rel=stylesheet` link with the same href and skips the injection, while the `media="not all"` link never applies. Verify afterwards that `document.querySelectorAll('link[rel=stylesheet][href*="/assets/css/index."]')` finds only that inert link.

### 2. MAJOR (foundation, `layout.css`). `.ui.grid { margin: -16px }` overflows every `.ui.page.grid`

Gitea's `modules/grid.css` sets `.ui.page.grid { margin-left: 0; margin-right: 0 }` inside its media queries. Our layer wins, so the sign-in grid is 1472px wide at x=-16. The page scrolls horizontally: document width is 1456 at 1440 and 406 at 390. The built-in theme stays at 1440 and 390. Evidence: `shots/critic-foundation-r1/login/light-1440.png` is 1456px wide.

Every template with `ui middle very relaxed page grid` is affected: signin, signup, forgot/reset password, activate, 2FA, webauthn and link-account.

The same block also:
- overrides `.ui[class*="very relaxed"].grid` (-2.5rem margins) and `.ui.grid + .grid { margin-top }`;
- gives `.row` 16px inline padding through `.ui.grid > * { padding-inline }`. Gitea sets `.ui.grid > .row { padding: 0 }`, so row gutters double, for example the two-column rows in `repo/diff/compare.tmpl`.

Fix: set only the gutter variables that differ, and keep Gitea's exceptions. For example, scope to `.ui.grid:not(.page, [class*="very relaxed"])` and exclude `.row` from the `> *` rule.

### 3. MAJOR (foundation, `typography.css`). Heading rules clobber component heading sizes

Because we win by layer, `h4:where(...)` beats Gitea's `#release-list .release-list-title { font-size: 2rem; font-weight: normal }`, even though that rule uses an ID.

- Release titles went from 28px/400 to 16px/600. GitHub's release title is 32px/600 (`span.f1`). Evidence: `crops/releases-pair.png`.
- `h3.tag-list-row-title` changes from 18px regular to 20px semibold.
- `h3.name` in user cards (stargazers, watchers) changes from regular to semibold 20px.
- `.ui.header:not(h1..h6) { font-size: 16px }` beats `.ui.attached.header:not(h1..h6) { font-size: 1em }`. Div box headers go from 14px to 16px: "8 Commits" on commits and "Teams 3" on org home. GitHub's Box-header is 14px semibold.

Fix: add `.release-list-title`, `.tag-list-row-title`, `.user-cards *` and `.ui.attached.header` to the `:where(:not(...))` exclusions. Alternatively, limit the element rules to headings with no class (`:not([class])`) and style `.ui.header` separately.

### 4. MINOR. Builder claims that don't hold up as stated

- "Body 14/21, matches github.com" is true only where the injection doesn't happen. On repo pages it is 20px (issue 1).
- "Nav-to-content gap 24px at 1440 and 390" and "content at x=112" have the same caveat.
- The CLS comparison used a repo without lazy chunks.

### 5. MINOR / NIT. ::selection

github.com leaves ::selection unstyled: `getComputedStyle(el, '::selection')` returns transparent, so the UA default applies. Ours uses `--selection-bgColor`. In light that is rgba(9,105,218,.2), which is close. In dark it is rgba(31,111,235,.7), noticeably heavier than GitHub's native highlight. The brief asked for this, so it is only a nit. Consider keeping it light-only, or dropping it.

### 6. NIT. Paragraph margins

Primer base `p` has margin 0 0 10px. Gitea keeps 0 0 1em (14px) and foundation leaves it alone. The line-height change is correct.

### 7. Environment. Smoke is red

11 of 12 steps pass. `switch-theme-back` times out because `github-auto` is not in the appearance menu until the theme is registered and Gitea restarted. `smoke.mjs` should use preview mode, or skip that step, while the theme is unregistered. This is not foundation's fault, but the gate is red.

## What is right (verified)

- Focus (no injection):
  - `:focus-visible` is `2px solid --focus-outlineColor`, offset -2px. Light rgb(9,105,218) and dark rgb(31,111,235) are identical to github.com's Tab-focus values on links and buttons.
  - Mouse press gives `1px solid rgba(0,0,0,0)`, focus-visible false (tested with mouse-down only, no click).
  - Pixel zoom of "Forgot password?" focus is identical to github.com (`crops/login-focus-zoom.png`).
- Heading sizes match GitHub on pages with plain headings: h1 32, h2 24, h3 20, h4 16, all semibold. The Subhead on milestones/new is 24px/400 with 8px padding, a borderColor-muted rule and 16px margin, like GitHub's Subhead.
- kbd (no injection) is 11px/10px, 4px padding, bgColor-muted, borderColor-neutral-muted border and inset shadow, 6px radius. This matches `@primer/css/base/kbd.scss` exactly.
- Code outside markdown is 85%: 11.9px in 14px, where GitHub is 12px in 14px. It uses the mono stack.
- Containers on every non-injected page are x=112 / 1216 at 1440 and x=16 at 390. This is identical to github.com's `container-xl` with 32/16px padding.
- Dividers are borderColor-muted. The login "or" divider is 14px/400, muted.
- Dark mode: html and body are rgb(13,17,23), text rgb(240,246,252), `color-scheme: dark`, the same as github.com. That also covers dark native scrollbars.
- Audit:
  - 0 unresolved vars. 0 off-palette colours from foundation. The rest are file-type SVG fills and a `<mark>` inside `.markup`, owned by other folders.
  - Console errors: 4, all the expected 404 on the not-found route. The earlier migrate-status 404s come from the broken grex seed.

## Measurements (ours vs github.com)

| control | property | ours | github | ok |
|---|---|---|---|---|
| body | font-size / line-height (no injection) | 14 / 21 | 14 / 21 | yes |
| body | line-height on repo pages (injected) | 20 | 21 | no |
| container @1440 | x / width (no injection) | 112 / 1216 | 112 / 1216 | yes |
| container @1440 | x / width on repo home (injected) | 80 / 1280 | 112 / 1216 | no |
| container @390 | x | 16 (8 on repo pages) | 16 | partial |
| link focus-visible | outline, light | 2px solid rgb(9,105,218), -2px | same | yes |
| link focus-visible | outline, dark | rgb(31,111,235) (rgb(68,147,248) on repo pages) | rgb(31,111,235) | partial |
| kbd | font / lh / pad / radius | 11 / 10 / 4 / 6 (Gitea's 11/11/2x4/4 on repo pages) | Primer 11 / 10 / 4 / 6 | partial |
| release title | font-size / weight | 16 / 600 | 32 / 600 | no |
| div box header | font-size | 16 | 14 | no |
| h2 Subhead | size / weight / rule | 24 / 400 / muted 1px, pb 8, mb 16 | 24 / 400 / muted | yes |
| code (outside markdown) | size | 11.9px (85%) | 12px | yes |
| login page | document width @1440 | 1456 | 1440 | no |
| repo home @390 | CLS | 0.553 | built-in 0.252 | no |
