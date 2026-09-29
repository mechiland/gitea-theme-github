# GitHub theme for Gitea 1.27.3 — Architecture

Goal: a self-hosted Gitea 1.27.3 that a daily github.com user needs a second look to tell apart from github.com,
in light and dark. Every color, size, radius, shadow, type and motion value comes from **Primer Primitives**, every
icon is an **Octicon**, every control follows the **Primer component spec**. Recoloured Fomantic is a failure.

Environment facts: `docs/CONTEXT.md`. Gitea source research (with file:line citations): `docs/research/gitea-1.27.3.md`.

## 1. Deliverables

| File (CUSTOM_PATH/public/assets/css/) | Internal name | Display name | Scheme |
|---|---|---|---|
| `theme-github-auto.css`  | `github-auto`  | **GitHub**       | `auto` — follows `prefers-color-scheme` |
| `theme-github-light.css` | `github-light` | GitHub Light     | `light` |
| `theme-github-dark.css`  | `github-dark`  | GitHub Dark      | `dark` |

- Each file is **self-contained** (one request, like Gitea's built-in themes). The auto file carries both Primer
  color sets inside `@media (prefers-color-scheme: …)` blocks and the component CSS **once** (components are
  scheme-agnostic because they only reference tokens) — not two `@import`s of the full light and dark bundles.
- Meta block (`gitea-theme-meta-info { --theme-display-name; --theme-color-scheme }`) is appended after minification
  (Gitea parses the *last* occurrence, `services/webtheme/webtheme.go`).
- Registered in `app.ini` `[ui] THEMES` (explicit list that keeps every theme that was already offered: gitea-*,
  modern*, studio*), and after the final gate `DEFAULT_THEME = github-auto`.
- Gitea (prod) loads the theme list once: **adding** a theme file needs one restart; changing an existing file does not.

## 2. Pinned versions

| Package | Version | Use |
|---|---|---|
| `@primer/primitives` | **11.10.0** | all tokens (`build/gen-tokens.mjs` → `src/tokens/generated/`) |
| `@primer/octicons`   | **19.38.0** | icon source (Gitea 1.27.3 bundles 19.28.1) |
| `@primer/css`        | **22.3.2**  | reference only for component specs (not shipped) |
| Gitea                | **1.27.3**  | source at `../gitea-src-1.27.3` (tag v1.27.3) |

Recorded again in `docs/STATUS.json → pinned`.

## 3. Cascade architecture (why a template override is required)

Gitea's own CSS (`index.css`, which contains Fomantic, base, modules and Tailwind utilities) is **unlayered**.
Unlayered declarations beat every `@layer`ed declaration regardless of specificity, so "one @layer per folder"
would lose every fight with Fomantic selectors like `.ui.secondary.pointing.menu .active.item:hover`.

Solution (the only template override that exists for cascade reasons): `templates/base/head_style.tmpl` gets a
branch that is active **only when the current theme name starts with `github-`**. It imports Gitea's stylesheet(s)
into a low layer instead of linking them unlayered:

```
<link rel="preload" as="style" href="/assets/css/index.<hash>.css">
<style>@layer gh-important, gitea, gh; @import url("/assets/css/index.<hash>.css") layer(gitea);</style>
<link rel="stylesheet" href="/assets/css/theme-github-auto.css?github_revision=<rev>">
```

Resulting order (low → high priority for normal declarations):

1. `gitea` — all of Gitea's CSS (Fomantic, base, Tailwind `tw-*` utilities)
2. `gh.tokens` — Primer tokens + Gitea variable mapping
3. `gh.foundation` → `gh.controls` → `gh.overlays` → `gh.navigation` → `gh.data-display` → `gh.code` →
   `gh.markdown` → `gh.pages-*` → `gh.dark`

For `!important` declarations the layer order inverts: Gitea's `tw-*` utilities (Tailwind `important: true`) and
Fomantic `!important`s now beat our layered `!important`s — which is what we want for `tw-hidden` etc. When a folder
truly must beat a Gitea `!important`, it puts that declaration in a `*.important.css` file, which the build places in
the first layer `gh-important` (highest priority for important declarations). Lint forbids `display`/`visibility` there.

Consequences every builder must know:
- Write plain, low-specificity selectors; you win by layer, not by specificity. Never add `!important` in normal files.
- **Lazy-loaded Vue chunk CSS is unlayered** (e.g. `PullRequestMergeForm`, `RepoContributors`, `RepoCodeFrequency`,
  `RepoRecentCommits`, `RepoFileSearch`, swagger, easymde, colorpicker — see `docs/research/gitea-1.27.3.md`).
  Those rules beat our layers; override them only via `*.important.css`.
- Inline `style=""` attributes beat everything except `!important` → same escape hatch.
- If the template override is missing (e.g. after a Gitea upgrade), the theme degrades (Gitea wins some fights) but
  nothing breaks: tokens still apply because Gitea's theme variables come only from the theme file.
- The template never breaks other themes: the `else` branch is Gitea's original line plus the Modern theme's line,
  byte-for-byte. It is hot-reloaded with `gitea manager reload-templates`, which refuses a broken template instead
  of crashing (prod `log.Fatal` only happens on startup).

## 4. Token layer (`src/tokens/`, owner: integrator)

- `generated/primer-color-{light,dark}.css` — Primer functional color tokens (942 each), re-scoped from
  `[data-color-mode…]` to `:root` (Gitea's `<html>` has no data-color-mode attributes). Token names are verbatim
  Primer names (`--bgColor-default`, `--button-primary-bgColor-hover`, …) so Primer docs apply 1:1.
  Dropped: `--color-ansi-*` (Gitea owns those names; mapped to Primer `--ansi-*`).
- `generated/primer-scale.css` — size, space, radius, border, typography, motion, z-index, breakpoints.
  **rem → px at 16 px/rem** because Gitea sets `html { font-size: 14px }` (`web_src/css/base.css`) and Primer's rems
  assume 16 px. `"Mona Sans VF"` is removed from the font stacks (no GitHub brand fonts; system stack as Primer lists it).
- `gitea-map.css` — **every** Gitea variable (all of `theme-gitea-light.css` + the overridable `base.css` ones) points
  at a Primer token or a `color-mix()` of Primer tokens. Scheme-independent. The only hand-written token file.
- `scheme-{light,dark}.css` — `--is-dark-theme`, `color-scheme`, `accent-color`.
- `generated/primer-literal-colors.json` — every literal color Primer emits; the screenshot tool uses it as the
  allowed palette.
- Build prunes Primer tokens that nothing references (transitively), keeping the files small.

**Lint (`build/lint.mjs`, runs in every build; a folder with lint errors is excluded from the build):**
- No hex / `rgb()` / `hsl()` / `hwb()` / `lab()` / `lch()` / `oklab()` / `oklch()` / `color()` / named colors in any
  declaration outside `src/tokens/`. Allowed keywords: `transparent`, `currentColor`, `inherit`, `initial`, `unset`.
- `font-size`, `font-weight`, `font-family`, `line-height`, `border-radius`, `box-shadow`, `z-index`, durations must
  use tokens (error). Spacing/size literals other than `0`, `1px`, `2px` are warnings (critics count them).
- Selector ownership: the same selector may not appear in two folders (except `dark`).

Useful Primer tokens (all available as `var(--…)`): `--fgColor-{default,muted,accent,success,danger,attention,severe,done,onEmphasis,disabled}`,
`--bgColor-{default,muted,inset,emphasis,accent-muted,accent-emphasis,success-*,danger-*,…}`,
`--borderColor-{default,muted,emphasis,translucent,accent-*,…}`, `--button-{default,primary,danger,invisible,outline}-*`,
`--control-{bgColor,borderColor,fgColor}-*`, `--control-{xsmall,small,medium,large}-{size,paddingInline-*,gap,lineBoxHeight}`,
`--controlKnob-*`, `--controlTrack-*`, `--overlay-*`, `--shadow-{resting,floating}-*`, `--focus-outline*`,
`--text-{body,title,caption,subtitle,display,codeBlock,codeInline}-*`, `--fontStack-*`, `--base-size-*`, `--space-*`,
`--stack-*`, `--borderRadius-*`, `--borderWidth-*`, `--boxShadow-*`, `--base-duration-*`, `--base-easing-*`,
`--diffBlob-*`, `--prettylights-syntax-*`, `--label-*`, `--counter-*`, `--avatar-*`, `--underlineNav-*`,
`--header-*`, `--tooltip-*`, `--data-*-color-*`, `--contribution-*`, `--progressBar-*`, `--reactionButton-*`.

## 5. Component layer — folders, layers, ownership

One folder per surface; each compiles into its own `@layer`. Each folder has `index.css` (entry, `@import`s the
folder's files) and optionally `*.important.css` (see §3). **A builder edits only its own folder.** Shared needs
(new token mapping, build change, template) go to the integrator as a change request in `docs/requests/<folder>.md`.

| Folder → layer | Surface | Owns (Gitea selector families) | GitHub/Primer reference |
|---|---|---|---|
| `foundation` → `gh.foundation` | typography, links, focus rings, selection, scrollbars, body, headings, `hr`, `kbd`, `.text.*` helpers | `html`, `body`, `a`, `::selection`, `:focus-visible` (global), `h1–h6` outside `.markup`, `.muted`, `.text`, `.help`, scrollbars, `.page-content` base, `.ui.container` widths, `.ui.grid` gutters, `.ui.divider` | Primer base/typography, `Link`, focus ring spec |
| `controls` → `gh.controls` | buttons (all variants/sizes), text inputs, textareas, selects, checkboxes, radios, toggles, segmented controls, input groups, form fields/validation | `.ui.button*`, `.ui.buttons`, `.ui.basic.button`, `.ui.primary.button`, `.ui.red.button`, `.ui.form .field*`, `input`, `textarea`, `select`, `.ui.input`, `.ui.action.input`, `.ui.checkbox`, `.ui.toggle.checkbox`, `.ui.radio`, `.ui.selection.dropdown` (the closed control only), `.ui.small/tiny/mini/compact` sizes, `.ui.form .error` states, `.ui.icon.button` | `Button`, `IconButton`, `TextInput`, `Textarea`, `Select`, `Checkbox`, `Radio`, `ToggleSwitch`, `SegmentedControl`, `FormControl` |
| `overlays` → `gh.overlays` | dropdown menus, action menus, select panels, modals, tooltips, toasts, flash banners | `.ui.dropdown .menu`, `.menu > .item` inside dropdowns, `.ui.popup`, `.tippy-box*`, `.ui.modal*`, `.ui.dimmer`, `.toastify*`, `.ui.message`, `.flash-*`, `.ui.negative/positive/warning/info.message` | `ActionMenu`, `ActionList`, `SelectPanel`, `Dialog`, `Tooltip`, `Toast`, `Flash`/`Banner` |
| `navigation` → `gh.navigation` | global header, repo header, underline nav, sidebar nav, breadcrumbs, pagination, tabs | `#navbar*`, `.navbar-*`, `.secondary-nav`, `.repo-header`, `.repo-title`, `.overflow-menu*`, `.ui.secondary.pointing.menu`, `.ui.tabular.menu`, `.ui.vertical.menu` (settings sidebars), `.ui.breadcrumb`, `.ui.pagination.menu`, `.page-footer` | `Header`/AppHeader, `UnderlineNav`, `NavList`, `Breadcrumbs`, `Pagination`, `TabNav` |
| `data-display` → `gh.data-display` | labels, counters, state badges, avatars and stacks, Box & list rows, tables, timeline, blankslate, progress | `.ui.label*`, `.ui.labels`, `.label-list`, `.ui.circular.label`, `.badge`, `.ui.avatar`, `img.avatar`, `.avatar-stack`, `.ui.segment*`, `.ui.attached.header/segment`, `.flex-list`, `.flex-item*`, `.ui.table*`, `.ui.list`, `.timeline`, `.timeline-item*`, `.comment` shell (header/border, not content), `.empty-placeholder`, `.ui.progress`, `.progress-bar`, `.ui.cards/.card` | `Label`, `CounterLabel`, `StateLabel`, `Avatar`, `AvatarStack`, `Box`, `Timeline`, `Blankslate`, `ProgressBar`, `DataTable` |
| `code` → `gh.code` | file tree, file view, blame, diff split/unified, syntax highlighting (`.chroma`), code editor chrome | `.repo-file-list`, `#repo-files-table`, `.file-view`, `.file-header`, `.code-view`, `.lines-num`, `.lines-code`, `.lines-blame-btn`, `.blame*`, `.diff-file-box`, `.diff-file-header`, `.code-diff*`, `.diff-detail-box`, `.chroma` + token classes, `.view-raw`, `#diff-file-tree`, `.repo-view-file-tree*` (Vue file tree), monaco wrapper | github.com code view, diff view, `TreeView`, prettylights |
| `markdown` → `gh.markdown` | rendered markdown | `.markup` and everything inside it (`.markup h1…`, `.markup table`, `.markup .markdown-alert*`, `.markup pre`, `.markup code`, task lists, footnotes, math, mermaid container), `.markup-content-iframe` | `github-markdown-css` behaviour, `.markdown-body` spec |
| `pages/repo` | repo home, file browser page layout, commits, branches, tags, releases, wiki | page-scoped selectors under `.page-content.repository.*` for home/commits/branches/tags/releases/wiki (`#repo-topics`, `.repo-description`, `.release-list`, `.branch-*`, `.wiki-*`, `#commits-table`…) | github.com repo pages |
| `pages/issues-prs` | issue & PR lists, issue/PR detail (conversation, sidebar), PR files-changed page chrome, milestones, labels pages, new issue/PR forms | `.issue-list*`, `.issue-title*`, `.issue-content*`, `.issue-sidebar*`, `.pull-desc`, `.merge-section`, `.milestone-*`, `.labels-list`, `#issue-filters` … (page-scoped) | github.com issues/PRs |
| `pages/actions-packages-projects` | Actions list & run/job view, packages, projects boards | `.run-list`, `.action-view-*` (Vue), `.job-*`, `.package-*`, `.project-*`, `.board-*` | github.com Actions, Packages, Projects |
| `pages/people` | dashboard/feed, user profile, org home/teams/members, explore, notifications | `.dashboard*`, `.feeds`, `.user.profile`, `.org*` page scopes, `.explore*`, `.notifications*`, heatmap | github.com dashboard, profile, org, explore |
| `pages/settings-admin` | user/repo/org settings, admin panel | `.user.settings`, `.repository.settings`, `.organization.settings`, `.admin*` page scopes | github.com settings pages |
| `pages/auth` | sign-in, sign-up, forgot password, 2FA, install | `.user.signin`, `.user.signup`, `.page-content.user.*` auth forms | github.com login |
| `dark` → `gh.dark` | dark-only exceptions after the whole-site dark pass | may repeat any selector (exempt from ownership), emitted only for dark (and inside `@media (prefers-color-scheme: dark)` in auto) | — |

Ownership rules: component folders own **generic** selectors (`.ui.button` everywhere); page folders own selectors
**scoped to their page** (`.repository.releases .ui.button` only if the page really deviates). The lint rejects the
same exact selector in two folders. When in doubt, the component folder owns it; pages request changes there.

## 6. Icon policy (`src/icons/`, owner: icons builder in wave 1, then integrator)

- Server-rendered icons: the `svg` template helper reads `assets/img/svg/*.svg` through `public.AssetFS()`, which layers
  `CUSTOM_PATH/public` **over** the built-in assets, once at startup (`modules/svg/svg.go Init`). So
  `CUSTOM_PATH/public/assets/img/svg/<name>.svg` overrides an icon **for all themes**, and needs a **restart**.
- Vue/JS icons are compiled into the JS bundle (`web_src/js/svg.ts`) and cannot be overridden from CUSTOM_PATH;
  where a Vue component renders a non-Octicon, the fallback is CSS (`mask-image` with an Octicon data-URI) scoped to
  the GitHub themes — listed in `docs/icons-audit.md`.
- Octicons upgrade: every `octicon-*.svg` Gitea ships is regenerated from `@primer/octicons@19.38.0` (normalized the
  same way Gitea's generator does: `class="svg octicon-<name>"`, `width/height="16"`, `aria-hidden`). Upgrading an
  Octicon is harmless to other themes (same icon, newer drawing).
- Non-Octicon icons (`gitea-*`, `material-*`, `fontawesome-*`, …) are replaced with the closest Octicon **only where
  the icon is purely presentational**, because the override is global (all themes). Brand/product logos (Gitea logo,
  git-provider logos for migrations, language/file-type icons whose meaning would be lost) are kept and listed as
  deliberate exceptions. Full audit: `docs/icons-audit.md`.
- Sizes follow GitHub: 16 px default; 24 px where GitHub uses 24 (blankslate icons, some headers); 12 px for
  small metadata icons where GitHub uses 12. Sizes that templates hard-code are adjusted with CSS (`.svg` width/height).

## 7. Template-override policy

CSS first. A template override is allowed only when a layout cannot be reached with CSS. Overrides break on Gitea
upgrades, so each one is listed here with its reason, is conditional on the GitHub themes where possible, and must
keep the non-GitHub output byte-identical.

| Template | Reason | Scope | Added by |
|---|---|---|---|
| `templates/base/head_style.tmpl` | Cascade layering (§3) + cache-busting `?github_revision=`. Shared with the Modern theme's existing override: our branch is additive, the else-branch is untouched. | `github-*` themes only | integrator, wave 0 |

(Pre-existing overrides owned by the Modern theme — `repo/view_content.tmpl`, `repo/view_list.tmpl` — render
Gitea's standard markup for non-Modern themes; we build against that output and never edit them.)

## 8. Gitea-only features

Features GitHub doesn't have (time tracking, stopwatch, dependencies, OAuth2 apps UI, admin panel, mirrors, project
column colors, repo units, federation, wiki clone box, etc.) get the **closest Primer pattern**: Box + Box-row lists,
`ActionList` menus, `Label`/`CounterLabel`, `Blankslate`, `SegmentedControl`, `NavList` sidebars, `Flash` banners,
`Dialog`. Never a one-off style.

## 9. Build (`build/`, owner: integrator)

- `npm run tokens` — regenerate `src/tokens/generated/` from the pinned Primer package.
- `npm run lint` — §4 lint.
- `npm run build` — PostCSS (`postcss-import`) per folder → validate with Lightning CSS → wrap in `@layer` → assemble
  per scheme (+ pruned tokens) → minify (Lightning CSS, evergreen targets) → `dist/theme-github-*.css`
  (+ `*.src.css` unminified for debugging) → `dist/build-report.json`.
- `npm run deploy` — build, then atomically copy the three files to `CUSTOM_PATH/public/assets/css/`, copy icons,
  bump `github_revision` in `head_style.tmpl`, `gitea manager reload-templates`, then **fetch each file back from
  Gitea and compare SHA-256** (the deploy fails if Gitea serves different bytes). Reports `restartRequired` when theme
  files are new or icons changed (restarts go through the integrator, never during a critic run).
- Cache-busting: theme files are served unhashed with `Cache-Control: max-age=21600`; the `?github_revision=<sha>`
  query in the link (hot-reloaded template) makes browsers fetch new bytes after each deploy.

## 10. Budget

- ≤ 300 KB per theme file minified (build fails otherwise). Current sizes in `docs/STATUS.json`.
- No added JavaScript. (If a control truly cannot match without JS, it is listed here with the reason — none so far.)
- No layout shift: the screenshot tool records CLS per route; must not exceed the built-in theme's.
- No page-load regression: same number of render-blocking requests as the built-in theme (1 Gitea CSS + 1 theme CSS;
  the Gitea CSS is preloaded, then `@import`ed into the layer). The tool records DCL/load/CSS bytes for `github-auto`
  vs `gitea-auto`.

## 11. Assets & licensing

Only Primer Primitives, Primer CSS (reference), Octicons — all MIT (notices in `NOTICE`). No GitHub logo, Invertocat,
Mona, Hubot, Copilot marks or other trademarks; the Gitea logo stays. Fonts: system stack as Primer defines it
(minus the Mona Sans brand font); no web fonts are loaded.

## 12. Failure isolation

- Each folder compiles separately; a folder that fails lint or compilation is **excluded** and reported, and the
  build still produces working themes (`--strict` makes it fail instead, used for the final gate).
- `--exclude a,b` or a `src/<folder>/.disabled` file removes a folder deliberately.
- Layers mean a folder can only win against Gitea or earlier folders, never silently against a later one.
- Deploy is atomic per file (write tmp + rename); a template reload failure leaves the previous template active.

## 13. Verification loop

- `tools/seed/seed.mjs` — idempotent seed via API (admin token): migrated public GitHub repos (same pages exist on
  github.com), users, org + teams, a playground repo with a markdown torture-test README, large multi-file PR, Actions
  runs, a package, releases, wiki. Manifest: `docs/seed-manifest.json`. Pre-seed baseline: `docs/baseline-pre-seed.json`.
- `tools/shoot/` — Playwright screenshots (1440 & 390, light & dark, interaction states) + JSON log (console errors,
  failed requests, unresolved CSS variables, off-palette colors, non-Octicon icons, CLS, timings), reference capture
  of github.com into `docs/reference/`, side-by-side contact sheets and blind A/B pairs, computed-style measurements.
- `tools/shoot/smoke.mjs` — functional smoke test (issue, comment, label, PR open+merge, web editor, setting, theme
  switch) after every round.

## 14. Process

Waves: (0) architecture, tokens, build, seed, tooling → (1) foundation, controls, icons → (2) overlays, navigation,
data-display, code, markdown → (3) pages/*, then whole-site dark pass. Between waves the integrator (only agent
allowed to touch `src/tokens/`, `build/`, `templates/`, app.ini) applies change requests and fixes seams.
Every builder round is followed by an independent critic (writes no code) scoring 0–10 against `docs/reference/`
with measurements; pass = ≥ 8.5, zero console errors, zero literal colors, smoke test green; up to 4 rounds.
Final gate: whole-site critic + blind A/B judges. State persists in `docs/STATUS.json`.
