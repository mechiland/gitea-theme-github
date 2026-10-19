# GitHub theme for Gitea 1.27.x and 28.x — Architecture

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
| Gitea                | **1.27.3** and **28.1.0** | sources at `../gitea-src-1.27.3`, `../gitea-src-28.1.0`; one package for both (§7 "Two Gitea versions") |

Dependency versions are pinned in `package.json` and `package-lock.json`.

## 3. Cascade architecture (why a template override is required)

Gitea's own CSS (`index.css`, which contains Fomantic, base, modules and Tailwind utilities) is **unlayered**.
Unlayered declarations beat every `@layer`ed declaration regardless of specificity, so "one @layer per folder"
would lose every fight with Fomantic selectors like `.ui.secondary.pointing.menu .active.item:hover`.

Solution (the only template override that exists for cascade reasons): `templates/base/head_style.tmpl` gets a
branch that is active **only when the current theme name starts with `github-`**. It imports Gitea's stylesheet(s)
into a low layer instead of linking them unlayered:

```
<link rel="preload" as="style" href="/assets/css/index.<hash>.css">
<link rel="stylesheet" href="/assets/css/index.<hash>.css" media="not all">   <!-- inert: see below -->
<style>@layer gh-important, gitea, gh; @import url("/assets/css/index.<hash>.css") layer(gitea);</style>
<link rel="stylesheet" href="/assets/css/theme-github-auto.css?github_revision=<rev>">
```

The inert `media="not all"` link never applies; it exists because Vite's preload-helper de-duplicates a lazy
chunk's CSS dependencies only against `link[rel=stylesheet][href]`. Without it, chunks that list index.css as a
dependency (RepoFileSearch, katex, mermaid on repo home / file view) re-append Gitea's CSS **unlayered** ~0.3–1 s
after load and it beats every `gh.*` layer (wave-1 blocker; the shoot audit now flags `unlayeredGiteaCss`).

Resulting order (low → high priority for normal declarations):

1. `gitea` — all of Gitea's CSS (Fomantic, base, Tailwind `tw-*` utilities)
2. `gh.tokens` — Primer tokens + Gitea variable mapping
3. `gh.foundation` → `gh.controls` → `gh.overlays` → `gh.navigation` → `gh.data-display` → `gh.code` →
   `gh.markdown` → `gh.pages-*` → `gh.icons` → `gh.dark`

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
- `../icons/octicon-masks.css` (generated by the icons folder) — `--gh-octicon-<name>` mask images, emitted once inside
  `gh.tokens` (scheme-independent); only masks that some folder references via `var(--gh-octicon-…)` are kept. Since loop 2
  (L2b) each is `url("../img/svg/octicon-<name>.svg")` — the Octicon file Gitea serves (see §6) — and only drawings Gitea
  does not ship (e.g. `alert-24`) are data URIs.
- `generated/primer-literal-colors.json` — every literal color Primer emits; the screenshot tool uses it as the
  allowed palette.
- Build prunes Primer tokens that nothing references (transitively), keeping the files small.

**Lint (`build/lint.mjs`, runs in every build; a folder with lint errors is excluded from the build):**
- No hex / `rgb()` / `hsl()` / `hwb()` / `lab()` / `lch()` / `oklab()` / `oklch()` / `color()` / named colors in any
  declaration outside `src/tokens/`. Allowed keywords: `transparent`, `currentColor`, `inherit`, `initial`, `unset`.
- `font-size`, `font-weight`, `font-family`, `line-height`, `border-radius`, `box-shadow`, `z-index`, durations must
  use tokens (error). Spacing/size literals other than `0`, `1px`, `2px` are warnings (critics count them).
- Selector ownership: the same selector may not appear in two folders (except `dark`).
- Rule 4 (`display`/`visibility` forbidden in `*.important.css`) has an exact-selector allow-list in `build/lint.mjs`
  (`IMPORTANT_DISPLAY_ALLOW`, request CODE-L1-1): `.blame .lines-commit .blame-time.not-mobile` and
  `.repository .diff-detail-box .diff-detail-stats` — elements Gitea hides on mobile with its own `display:none !important`
  that github.com shows; neither can carry `tw-hidden`.

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
folder's files) and optionally `*.important.css` (see §3). Keep shared token, build and template changes consistent
with the component ownership below; review cross-folder selectors together to avoid cascade conflicts.

| Folder → layer | Surface | Owns (Gitea selector families) | GitHub/Primer reference |
|---|---|---|---|
| `foundation` → `gh.foundation` | typography, links, focus rings, selection, scrollbars, body, headings, `hr`, `kbd`, `.text.*` helpers | `html`, `body`, `a`, `::selection`, `:focus-visible` (global), `h1–h6` outside `.markup`, `.muted`, `.text`, scrollbars, `.page-content` base, `.ui.container` widths, `.ui.grid` gutters, `.ui.divider` | Primer base/typography, `Link`, focus ring spec |
| `controls` → `gh.controls` | buttons (all variants/sizes), text inputs, textareas, selects, checkboxes, radios, toggles, segmented controls, input groups, form fields/validation | `.ui.button*`, `.ui.buttons`, `.ui.basic.button`, `.ui.primary.button`, `.ui.red.button`, `.ui.form .field*`, `.help` (form captions), `input`, `textarea`, `select`, `.ui.input`, `.ui.action.input`, `.ui.checkbox`, `.ui.toggle.checkbox`, `.ui.radio`, `.ui.selection.dropdown` (the closed control only), `.ui.small/tiny/mini/compact` sizes, `.ui.form .error` states, `.ui.icon.button` | `Button`, `IconButton`, `TextInput`, `Textarea`, `Select`, `Checkbox`, `Radio`, `ToggleSwitch`, `SegmentedControl`, `FormControl` |
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
| `icons` → `gh.icons` (loop 1, request IC-1) | theme-scoped Octicon swaps (CSS masks) and dropped brand markers | `.svg.gitea-colorblind-*`, `.pull.tabular.menu > .item > .svg.octicon-diff`, `overflow-menu .item > .svg.octicon-project`, `.overflow-menu-popup > .item > .svg.octicon-project(-symlink)` | Octicons |
| `dark` → `gh.dark` | dark-only exceptions after the whole-site dark pass | may repeat any selector (exempt from ownership), emitted only for dark (and inside `@media (prefers-color-scheme: dark)` in auto) | — |

Ownership rules: component folders own **generic** selectors (`.ui.button` everywhere); page folders own selectors
**scoped to their page** (`.repository.releases .ui.button` only if the page really deviates). The lint rejects the
same exact selector in two folders. When in doubt, the component folder owns it; pages request changes there.

## 6. Icon policy (`src/icons/`)

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
- CSS masks (`--gh-octicon-*`, and folder rules like the settings NavList icons, NAV-I6) point at the Octicon files Gitea
  serves from `/assets/img/svg/` (relative `../img/svg/octicon-<name>.svg` from the theme file; same origin, 6 h cache, not
  render-blocking; the drawing is the upgraded 19.38.0 one because deploy places upgraded files in CUSTOM_PATH). An icon
  masked this way appears when its (cached) file has loaded. Drawings Gitea does not ship stay data URIs (loop 2, L2b budget).
- Sizes follow GitHub: 16 px default; 24 px where GitHub uses 24 (blankslate icons, some headers); 12 px for
  small metadata icons where GitHub uses 12. Sizes that templates hard-code are adjusted with CSS (`.svg` width/height).

## 7. Template-override policy

CSS first. A template override is allowed only when a layout cannot be reached with CSS. Overrides break on Gitea
upgrades, so each one is listed here with its reason, is conditional on the GitHub themes where possible, and must
keep the non-GitHub output byte-identical.

| Template | Reason | Scope |
|---|---|---|
| `templates/base/head_style.tmpl` | Cascade layering (§3) and cache-busting `?github_revision=`. | `github-*` themes only |
| `templates/base/head_impersonate_banner.tmpl` | Gitea 28.1.0's template, included so the navbar's template reference also resolves on 1.27. | Upstream markup |
| `templates/custom/footer.tmpl` | Adds a Primer Dialog close button to Fomantic modals through Gitea's extension hook; uses a small inline script with a CSP nonce. | `github-*` themes only |
| `templates/user/settings/layout_head.tmpl` | Settings page header needs the signed-in user's name, avatar and profile link; styled by `src/pages/settings-admin/header.css`. | `github-*` settings pages |
| `templates/base/head_navbar.tmpl` + `templates/custom/gh_head_navbar.tmpl` | AppHeader and auth header need context crumbs, search and existing Gitea links rearranged across containers. Preserve Gitea's JS hooks; use native `<details>` for the drawer. | `github-*` themes only |
| `templates/repo/commits_list.tmpl` | Groups commits by day with template state and a `tr.gh-commit-day` row. | `github-*` themes, excluding wiki revisions |
| `templates/repo/view_file.tmpl` + `templates/repo/blame.tmpl` | Preview / Code / Blame segments require markup and existing Gitea links. | `github-*` themes only |
| `templates/repo/wiki/view.tmpl` | Static Pages sidebar and clone input need page data and structure unavailable to CSS. | `github-*` themes only |
| `templates/repo/issue/list.tmpl` | Issue list NavList uses existing Gitea filters, Milestones and Labels links. | `github-*` issue lists; PR lists keep their own layout |
| `templates/repo/view_list.tmpl` | Places the existing commit-history link at the right of the latest-commit row. | The added link is hidden for other themes |

Install these files into `CUSTOM_PATH/templates/` and reload templates as described in README.md's upgrade instructions.
`npm run deploy` checks for template drift but does not install template overrides.

**Two Gitea versions (1.27.x and 28.x, one package).** Each template that differs between 1.27.3 and 28.1.0 starts with
`{{$gitea1 := StringUtils.HasPrefix AppVer "1."}}` (no output) and branches only where upstream differs, so a non-github
theme gets each version's upstream bytes (checked: anonymous HTML of all routes with vs. without the templates, both
versions, differs only by the documented `hidden` "N Commits" link). Two rules learned the hard way:
- Fields and methods are resolved at execution, so an untaken branch may name `.Repository.CanEnableEditor` (1.27) or
  `CanContentChange` (28); use `and`/`or` (lazy since Go 1.18) or `{{if $gitea1}}` around them.
- `{{template "x"}}` is checked by html/template's escaper even in a branch that never runs: an undefined name breaks the
  whole page. Hence `templates/base/head_impersonate_banner.tmpl` (28.1.0 verbatim) ships so the name exists on 1.27.
CSS: where 28 renamed or restructured markup, the 28 selectors are added next to the 1.27 ones and commented "28.x"
(profile sidebar `#profile-avatar-card.segment`, commit header and its "N files changed" footer row, `.site-banner-*`,
diff kebab, feed excerpt, `.dropzone` without `.ui`, release header `.flex-left-right`, notifications toolbar
`.flex-text-block`, Actions sidebar with a second "Management" menu, deploy key / token panels). The wiki view template
keeps the `view` class (dropped in 28) for github-* themes. Features only 28 has are styled to the matching Primer
component, not left on Gitea's defaults: toasts per level (Primer Toast), site + impersonation banners (flash-full),
repo switcher (SelectPanel on the AppHeader repo crumb, as on github.com; the repo-header copy is hidden), Actions job queue (PageLayout pane + DataTable), artifact preview (NavList file tree),
diff file filter + extension menu (TextInput + IconButton + ActionMenu), audit log (filter row + Box table), deploy
tokens (Box rows, Blankslate), "Mark this page as read". Verified 2026-10-12 on 1.27.3 and 28.1.0: light, dark, 390px;
1.27 pixel-diffed against a pre-change capture of every route (only live data differs). Not seen with real data: the
`diff-line-truncated` label (lines over 5000 characters) and a bot account's label (both plain Primer Labels).
When 1.27 support ends, delete the `$gitea1` branches and the 1.27 selectors.

Pitfall: `X > :is(A > B)` does not mean "B under A under X" — the `:is()` element must match X's child AND have an
A parent, so it silently matches nothing. List whole paths instead (`:has(> … > A > B, > … > C)`).

Prefer Gitea's existing locale keys and links. Avoid adding a template override solely to change wording or
reproduce a GitHub control for which Gitea has no equivalent feature. Re-check overrides against both supported
Gitea versions when upstream templates change.

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
- Short custom-property names (wave 3, request PPL-1): in the minified `dist/theme-github-*.css` only, every custom
  property defined by the Primer token files or `src/icons/octicon-masks.css` is renamed to `--<base62>` (most used =
  shortest; loop 2 dropped the former `p` prefix; a generated name is never one that our CSS or Gitea's web_src/templates
  use), −100 KB per file. Loop 2 also merges Primer tokens whose definitions are identical in every scheme into one short
  name (91 tokens; only tokens no folder re-declares, which are all resolved on :root; `--no-dedupe`). Gitea's own names (`--color-*`, `--is-dark-theme`, anything in gitea-map.css /
  scheme-*.css / folder-local names) and any Primer name mentioned in Gitea's web_src/templates or our templates are
  never renamed. `dist/theme-github-*.src.css` keeps the real names; `dist/varmap.json` maps short → Primer name.
  So in DevTools a computed `--fgColor-muted` reads as `--…` — look it up in varmap.json, or build with `--no-rename`
  (identical rendering: pixel-diffed on 8 routes × 2 schemes, only the footer's server-timing text differs).
- Prefix nesting (loop 1, integrator; `build/nest.mjs`): as the last step, in the minified `dist/theme-github-*.css` only,
  runs of **adjacent** rules whose selectors share a leading complex selector P are written as CSS nesting
  (`P X{…}P>Y{…}` → `P{& X{…}&>Y{…}}`, recursively; a rule equal to P becomes the parent; since loop 2 also compound
  suffixes: `P{…}P:hover{…}P.x Y{…}` → `P{…;&:hover{…}&.x Y{…}}`, −11 KB). `&` = `:is(P)` with one complex
  P, so matching and specificity are unchanged, and adjacency keeps the cascade order. Every build self-checks it: both
  texts are lowered with Lightning CSS for a nesting-less browser and compared selector member by selector member
  (container path + selector + declarations, in order); on any difference the flat output is kept and the report says why
  (`build-report.json → nest`). Saves ≈ 51 KB per file (auto 347,273 → 295,880 B at revision 85fbd66d9d). Browser floor
  (TARGETS): Chrome/Edge 112+ (target 120), Safari 16.5+, Firefox 117+ — all evergreen since 2023. `--no-nest` builds the
  flat file for comparison. `*.src.css` stays flat, so coverage and the
  lint are unaffected; in DevTools nested rules show as `& …` under their parent.
- Page-scope check (FG2-105, `build/page-scope-check.mjs`): page-folder selector scopes vs every Gitea template's
  `.page-content` classes (+ live route classes cached in `shots/page-classes.json`); each page folder declares its intended
  templates in `src/pages/<group>/scopes.json`; an unintended match is a LEAK (warning in `npm run lint` and the build,
  error under `--strict`). Reports: `docs/page-scope-report.{md,json}` (generated locally, ignored by Git). `--live` refetches, `--probe` counts matched elements.
- `npm run deploy` — build, then atomically copy the three files to `CUSTOM_PATH/public/assets/css/`, copy icons,
  bump `github_revision` in `head_style.tmpl`, `gitea manager reload-templates`, then **fetch each file back from
  Gitea and compare SHA-256** (the deploy fails if Gitea serves different bytes). Reports `restartRequired` when theme
  files are new or icons changed (restarts go through the integrator, never during a critic run).
- Cache-busting: theme files are served unhashed with `Cache-Control: max-age=21600`; the `?github_revision=<sha>`
  query in the link (hot-reloaded template) makes browsers fetch new bytes after each deploy.

## 10. Budget

- ≤ 340 KB per theme file minified (defined by `BUDGET_BYTES` in `build/folders.mjs`; build fails otherwise).
  This accommodates Gitea 1.27 and 28 in one self-contained theme. Run `npm run build` for current per-theme and
  per-folder sizes in `dist/build-report.json`; that generated report is ignored by Git.
- No added JavaScript, with one listed exception: the Dialog close button (`templates/custom/footer.tmpl`, §7) —
  a clickable control cannot be created with CSS. ~0.7 KB inline, github-* themes only, no network request.
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

## 14. Generated files and local artifacts

- Keep theme source, templates, build and verification tools, source research, icon decisions, and the curated
  README screenshots in Git.
- Keep `src/tokens/generated/`, `src/icons/svg/`, `src/icons/octicon-masks.css` and `src/icons/manifest.json`:
  these generated assets are inputs to the normal build. Regenerate them deliberately when changing tokens or icons.
- Keep `docs/seed-manifest.json` and `docs/baseline-pre-seed.json`: route generation reads the manifest, and the
  smoke test uses the baseline to protect pre-existing repositories.
- `dist/`, `shots/`, `docs/reference/` and `docs/page-scope-report.{md,json}` are reproducible local output and ignored
  by Git. Reference JSON, measurements and screenshots should be captured together with `--target github` before
  comparisons. See `tools/shoot/README.md`.
- Historical status snapshots, per-round critiques, handoff requests, final-gate results and template backups are
  not maintained. Git history retains past development records.
