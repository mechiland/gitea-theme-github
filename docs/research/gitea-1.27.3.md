# Gitea 1.27.3 — source research for the "GitHub" theme

Source: `/Users/michael/work/gitea/gitea-src-1.27.3` (tag v1.27.3). All paths below are relative to that tree unless they start with `/`.
"Verified live" = checked with `curl` against the running instance at http://localhost:3000 on 2026-09-29 (GET only).
Companion file: `docs/research/gitea-css-vars.txt` (every theme/base CSS variable with its light value, dark value and source line).

---

## 0. TL;DR for builders

| Topic | Fact | Source |
|---|---|---|
| Theme file location | `CUSTOM_PATH/public/assets/css/theme-<name>.css` → on host `/Users/michael/work/gitea/gitea/gitea/public/assets/css/` | `modules/public/public.go:25-31`, `services/webtheme/webtheme.go:181` |
| URL | `/assets/css/theme-github-light.css` (no hash, no query string) | `modules/public/manifest.go:126-140` |
| Theme list | Loaded **once** in prod and never re-scanned → **adding/renaming a theme file, or changing its meta block, needs a Gitea restart** | `services/webtheme/webtheme.go:218-252` |
| Editing CSS content of an existing theme | **No restart**: file is read from disk on every request | `modules/assetfs/layered.go:42-52,73-82` |
| Cache headers (prod) | `Cache-Control: public, max-age=21600`, `Last-Modified: <file mtime>`, **no ETag**; 304 on `If-Modified-Since` | `modules/httpcache/httpcache.go:23-48`, `modules/setting/server.go:279`, verified live |
| @layer | **Gitea ships zero `@layer` rules** (index.css, all themes, all lazy chunks; verified live). Every Gitea rule is unlayered → beats any normal (non-!important) rule inside our `@layer`, whatever the specificity | §3.5 |
| Icons (server) | `CUSTOM_PATH/public/assets/img/svg/<name>.svg` overrides the built-in, **restart required** (loaded once at startup) | `modules/svg/svg.go:41-61`, `routers/init.go:166` |
| Icons (JS/Vue) | Bundled into JS at build time by `web_src/js/svg.ts` → **cannot be overridden by files**; only CSS can restyle/mask them | `web_src/js/svg.ts:4-180` |
| Templates | Compiled once in prod → custom template changes need a restart | `modules/templates/page.go:91-97` |

---

## 1. Themes

### 1.1 Discovery (`services/webtheme/webtheme.go`)
- A theme is any file named `theme-*.css` (`fileNamePrefix`/`fileNameSuffix`, `webtheme.go:34-37`, filter at `:159`).
- Directory scanned (prod, no Vite dev server): `public.AssetFS()` path `assets/css` (`webtheme.go:180-182`). `AssetFS()` = layered FS of `CUSTOM_PATH/public` (top) over the built-in bindata (`modules/public/public.go:25-31`). `ReadDir` merges the layers (`modules/assetfs/layered.go:90-109`), so built-in hashed files (`theme-gitea-dark.zDDvTVNn.css`) and our un-hashed custom files are both found.
- Internal name = filename minus `theme-` and `.css` (`webtheme.go:120-134`). For built-in hashed files, the Vite manifest maps back to the unhashed name (`webtheme.go:122-127`, `manifest.go:177-182`). Custom themes "are not in the manifest and never have content hashes" (comment `webtheme.go:124`). So `theme-github-light.css` → internal name `github-light`.
- `[ui] THEMES` empty → every found theme is offered (`webtheme.go:190-199`; app.ini here has `THEMES =`). Sort: `DEFAULT_THEME` first, then by colorblind type, then display name (`webtheme.go:201-209`).
- **Meta info** is read from the CSS text, not from `:root` (`webtheme.go:71-118`, `140-150`):
  ```css
  gitea-theme-meta-info {
    --theme-display-name: "GitHub Light";
    --theme-color-scheme: "light";     /* light | dark | auto — only picks the selector icon */
    --theme-colorblind-type: "…";      /* optional: red-green | blue-yellow */
  }
  ```
  - Parser takes the **last** occurrence of the string `gitea-theme-meta-info` in the file (`strings.LastIndex`, `webtheme.go:79-81`) and parses the block after it. Do not mention that string again later in the file (not even in a comment).
  - Only the theme file itself is parsed; `@import`ed files are not.
  - CSS rule: `@import` must come before all other rules (except `@charset`/`@layer` statements). Gitea's own auto theme puts `@import` first and the meta block after (`web_src/css/themes/theme-gitea-auto.css:1-7`).
  - `ColorScheme` is only used for the selector icon: `dark`→`octicon-moon`, `light`→`octicon-sun`, `auto`→`gitea-eclipse`, else `octicon-paintbrush` (`modules/templates/util_render.go:234-247`).
- **Caching / restart**: `getAvailableThemes()` (`webtheme.go:218-252`):
  - returns the cached list if checked < 1 s ago (`:222`);
  - `useLoadedThemes := themes != nil && (setting.IsProd || …)` (`:227`) → in prod, once a non-empty list has been loaded it is returned forever (and `lastCheckTime` is never refreshed).
  - ⇒ In prod (this instance: `RUN_MODE = prod`, app.ini line 2), **a new `theme-*.css` file does not appear until Gitea restarts**. Same for changes to its display name / color-scheme meta.
  - A theme not in the cached map is unselectable: settings POST validates with `GetThemeMetaInfo` (`routers/web/user/setting/profile.go:366`); rendering falls back to `DEFAULT_THEME` via `GuaranteeGetThemeMetaInfo` (`webtheme.go:265-274`, `services/context/context_template.go:56-67`).
- Current theme = `Doer.Theme` for signed-in users, else the `gitea_theme` site cookie (`services/context/context_template.go:56-67`). Footer selector: `GET /-/web-theme/list`, `POST /-/web-theme/apply?theme=` (`routers/web/web.go:534-535`, `routers/web/misc/webtheme.go`, JS `web_src/js/features/common-page.ts:36-45`). Settings page: `templates/user/settings/appearance.tmpl:22-25`.

### 1.2 URL resolution (`public.AssetURI`)
- `ThemeMetaInfo.PublicAssetURI()` = `public.AssetURI("web_src/css/themes/theme-" + url.PathEscape(InternalName) + ".css")` (`webtheme.go:47-49`).
- `AssetURI` (`modules/public/manifest.go:126-140`): Vite dev mode → dev URL; else manifest lookup (`setting.StaticURLPrefix + "/assets/" + entry.File`, hashed); **manifest miss + `.css` extension → `StaticURLPrefix + "/assets/css/" + basename`** (comment: "The only expected manifest miss is a user's custom theme CSS").
- Manifest in prod is loaded once (embedded, immutable; `manifest.go:101-113`).
- ⇒ `theme-github-light.css` is served at **`/assets/css/theme-github-light.css`** (StaticURLPrefix is empty here). Sub-files imported with relative `@import "./github/x.css"` resolve to `/assets/css/github/x.css` and are served by the same handler.
- Built-in themes for comparison: `/assets/css/theme-gitea-auto.v3RW7v-i.css` (verified live).

### 1.3 Static handler and HTTP headers
- Route: `routes.Methods("GET, HEAD, OPTIONS", "/assets/*", routing.MarkLogLevelTrace, public.AssetsCors(), public.FileHandlerFunc())` (`routers/web/web.go:265`).
- `FileHandlerFunc` → `handleRequest` → `servePublicAsset` (`modules/public/public.go:43-124`):
  - `Content-Type` from extension (`text/css; charset=utf-8`, verified live).
  - `Cache-Control` from `httpcache.CacheControlForPublicStatic()` = public + `setting.StaticCacheTime` (`public.go:106`, `modules/httpcache/httpcache.go:43-48`). `STATIC_CACHE_TIME` default **6h** (`modules/setting/server.go:279`; not set in this app.ini). Prod format: `public, max-age=21600` (`httpcache.go:29-34`). Non-prod would be `max-age=0, public, must-revalidate` + `X-Gitea-Debug` (`:35-38`).
  - Body via `http.ServeContent(w, req, name, modtime, …)` (`public.go:119,123`) → sets `Last-Modified` from the file mtime and answers `If-Modified-Since` with 304. **No ETag is set** (none of this code sets one; verified live: no `ETag` header; conditional request returned `304 Not Modified`).
  - Gzip only for embedded bindata files (`public.go:108-122`); custom files are sent uncompressed.
  - CORS `*` for GET/HEAD (`public.go:33-40`), `Vary: Origin`.
- Custom files are read from disk on every request (`assetfs.Local` = `os.DirFS`, `modules/assetfs/layered.go:42-52`; `LayeredFS.Open` walks layers each call, `:73-82`) → **editing CSS content takes effect immediately server-side; browsers may keep the old copy up to 6 h**. Hard-reload, or a cache-busting query string. A query string is ignored by the server (verified live: `/assets/css/theme-studio.css?x=1` → 200).
- Live headers for a custom theme file (`theme-studio.css`):
  ```
  HTTP/1.1 200 OK
  Cache-Control: public, max-age=21600
  Content-Type: text/css; charset=utf-8
  Last-Modified: Tue, 22 Sep 2026 07:39:57 GMT
  Vary: Origin
  ```

### 1.4 How the `<link>` is emitted
- `templates/base/head.tmpl:2` → `<html lang=… data-theme="{{ctx.CurrentWebTheme.InternalName}}">` (so `html[data-theme="github-light"]` is a usable selector).
- `templates/base/head.tmpl:23` includes `base/head_style`; upstream `templates/base/head_style.tmpl`:
  ```
  1 {{AssetCSSLinks "web_src/js/index.ts" "web_src/css/index.css"}}
  2 <link rel="stylesheet" href="{{ctx.CurrentWebTheme.PublicAssetURI}}">
  ```
  Order: index.css first, theme second, then `custom/header` (`head.tmpl:25`). Upstream adds **no query string / cache busting** for custom themes.
- **This instance overrides it**: `/Users/michael/work/gitea/gitea/gitea/templates/base/head_style.tmpl` (owned by the Modern theme) appends `?modern_revision=…` **only** for `modern`, `modern-light`, `modern-dark`; for our theme it emits the plain URL. Any cache-busting for GitHub needs an additive edit by the integrator plus a restart (templates compile once in prod: `modules/templates/page.go:91-97`).
- The theme CSS is also linked **without index.css** in: the Swagger viewer (`templates/swagger/openapi-viewer.tmpl:6`) and external-render iframes (`modules/markup/render.go:247-256`). Theme files must behave sensibly there (variables only; no assumptions about index.css).

### 1.5 Auto (light+dark) theme and `--theme-color-scheme` / dark detection
- `web_src/css/themes/theme-gitea-auto.css:1-7`:
  ```css
  @import "./theme-gitea-light.css" (prefers-color-scheme: light);
  @import "./theme-gitea-dark.css" (prefers-color-scheme: dark);
  gitea-theme-meta-info { --theme-display-name: "Auto"; --theme-color-scheme: "auto"; }
  ```
  Vite inlines these into `@media (prefers-color-scheme: light){…}` / `@media (prefers-color-scheme: dark){…}` blocks (verified live in `theme-gitea-auto.v3RW7v-i.css`). A custom theme is **not** processed by Vite, so a `theme-github-auto.css` with `@import url(...) (prefers-color-scheme: …)` costs extra HTTP requests (each with the same 6 h caching).
- Colorblind variants just `@import` a base theme and override a few diff vars (`theme-gitea-light-tritanopia.css:1-15`).
- Each base theme sets on `:root`: `--is-dark-theme: false|true`, all color vars, `accent-color: var(--color-accent)` and `color-scheme: light|dark` (`theme-gitea-light.css:7,311-312`; dark same lines).
- `--theme-color-scheme` is read **only by Go** (selector icon, see 1.1). JS never reads it.
- JS uses **`--is-dark-theme`** (computed on `<html>`):
  - `isDarkTheme()` = `getComputedStyle(html).getPropertyValue('--is-dark-theme') === 'true'` (`web_src/js/utils.ts:39-42`).
  - `web_src/js/webcomponents/index.ts:6-14` sets `<html data-gitea-theme-dark="true|false">` at load and on `matchMedia('(prefers-color-scheme: dark)')` change. Consumed by `web_src/css/markup/content.css:284-290` (`#gh-light-mode-only` / `#gh-dark-mode-only` images in markdown).
  - Mermaid: `theme: isDarkTheme() ? 'dark' : 'neutral'` at render time (`web_src/js/markup/mermaid.ts:178-183`).
  - Captcha (`web_src/js/features/captcha.ts:8`), iframe renders pass `gitea-is-dark-theme` (`web_src/js/markup/render-iframe.ts:63`, `web_src/js/external-render-helper.ts:33-35`), Swagger (`web_src/js/render/swagger.ts:13-21`).
  - ⇒ **A GitHub theme must define `--is-dark-theme`** (inside each media block for auto), and should set `color-scheme` and `accent-color` like the built-ins.
- Other JS reads of theme vars at run time: `chartJsColors` (`web_src/js/utils/color.ts:28-34`: `--color-text`, `--color-secondary-alpha-60`, `--color-primary-alpha-60`, `--color-green`, `--color-red`), resolved **once when the module loads** (not re-read on OS theme switch); 3D viewer `--color-primary` (`web_src/js/render/plugins/frontend-viewer-3d.ts:22`); top-authors bar graph reads computed `background-color`/`color` of `.activity-bar-graph` / `.activity-bar-graph-alt` (`web_src/js/components/RepoActivityTopAuthors.vue:46-55,60-61`).
- Code editor: **CodeMirror 6** (no Monaco in 1.27: `package.json` has `@codemirror/*`, no monaco). It uses `classHighlighter` (`web_src/js/modules/codeeditor/main.ts:231`) → `.tok-*` classes coloured by `--color-syntax-*` in `web_src/css/modules/codeeditor.css:488-520`; chrome (`.cm-editor`, `.cm-gutters`, `.cm-activeLine`, search panel, tooltips) in the same file `:1-487`. Only 2 inline vars in JS (`main.ts:245-246`, `var(--color-secondary-dark-3)`). So the editor is fully themeable through CSS vars and `.code-editor-container .cm-*` selectors.
- EasyMDE (legacy markdown editor, lazy): `web_src/css/easymde.css`, var-driven.

---

## 2. CSS custom properties a theme defines

Full machine-readable list: **`docs/research/gitea-css-vars.txt`** (name ⇥ light value ⇥ dark value ⇥ source line). Summary:

- `theme-gitea-light.css` and `theme-gitea-dark.css` declare the **same 297 names** (verified with `diff`): 2 meta (`--theme-display-name`, `--theme-color-scheme`, inside `gitea-theme-meta-info`) + `--is-dark-theme` + 294 colour tokens. Groups: primary (27), secondary (32), console (9), named colours + light/dark-1/dark-2 variants (48), ansi (16), series-16 (16), diff (13), status error/success/warning/info/priority (17), badges (12), syntax (41), other target-based colours (63: body, box-header/body, text*, footer, timeline, input*, light/hover/active, menu, card, markup-*, button, code-bg, shadow, nav-*, label-*, accent, highlight, overlay-backdrop, danger, transparency-grid, workflow-edge-hover, reaction-*, tooltip-*, editor-*, project-column-bg, caret, expand-button, placeholder-text, secondary-bg, …).
- Tailwind generates `tw-text-*`, `tw-bg-*`, `tw-border-*` for **every** `--color-*` in those two files (`tailwind.config.ts:5-24,46-56`). So even vars not referenced by Gitea CSS are used through `tw-` classes in templates → a theme must define all of them.
- `web_src/css/base.css:1-49` `:root` (theme-independent, overridable): fonts (`--fonts-proportional`, `--fonts-monospace`, `--fonts-emoji`), weights (`--font-weight-light|normal|medium|semibold|bold`), `--line-height-default`, `--line-height-code` (20px), data-URI images (`--checkbox-mask-checked`, `--checkbox-mask-indeterminate`, `--octicon-alert-fill`, `--octicon-chevron-right`, `--octicon-x`, `--select-arrows`), `--border-radius` (4px), `--border-radius-medium` (6px), `--border-radius-full`, `--opacity-disabled`, `--height-loading`, `--min-height-textarea`, `--tab-size`, `--checkbox-size` (14px), `--page-spacing` (16px), `--page-margin-x` (32px; 16px at 768–1200px, 8px < 768px via `base.css:51-61`), `--page-space-bottom`, `--transition-hover-fade`, `--z-index-modal`, `--z-index-toast`, `--font-size-label` (12px), `--gap-inline`, `--gap-block`, `--background-view-image`, `--box-shadow-kbd`.
- **Gotcha: `--fonts-regular` is declared on `:root *` (every element)** (`base.css:63-65`) as `var(--fonts-override, var(--fonts-proportional)), "Noto Sans", …`. Overriding `--fonts-regular` on `:root` has no effect; override `--fonts-proportional` (or redeclare on `:root *`). CJK: `--fonts-override` is set per `:root :lang(ja|zh-CN|zh-TW|zh-HK|ko)` (`web_src/css/font_i18n.css:1-42`).
- Not present: no `--font-size-*` scale, no `--header-height`/`--navbar-height`. Body font size is hard-coded `html, body { font-size: 14px }` and `body { line-height: 20px }` (`base.css:75-90`); navbar height `min-height: 49px` (`web_src/css/modules/navbar.css:15-21`); container width `1280px` (`web_src/css/modules/container.css:4-9`).
- Variables set from JS: `--loading-size` (inline, `web_src/js/modules/clipboard.ts:29`), `--gitea-iframe-bgcolor` (`web_src/js/external-render-helper.ts:44`).
- **@layer gotcha for variables**: base.css `:root` vars are unlayered. If our theme declares e.g. `--border-radius` or `--fonts-proportional` **inside an `@layer`**, base.css wins (unlayered beats layered, same specificity). Such overrides must be unlayered (or `!important`). Colour vars have no competitor (only one theme file loads), so layered is fine for them.

---

## 3. CSS architecture

### 3.1 How CSS is built and loaded
- Vite build (`vite.config.ts`): entries `index` (`web_src/js/index.ts`, which imports `../css/index.css` at line 2), `swagger`, `external-render-frontend`, `eventsource.sharedworker`, `devtest` (css), and **every `web_src/css/themes/*.css` as its own entry** (`vite.config.ts:27-30,268-276`). Output `css/[name].[hash:8].css` (`:285`). PostCSS with Tailwind (`:300-304`).
- Page CSS: `index.<hash>.css` (all of index.css + Tailwind utilities + scoped/unscoped styles of **statically** imported Vue components) then the theme file (see 1.4).
- **Lazy CSS chunks** (injected at runtime by Vite with `<link>` appended to `<head>`, i.e. *after* our theme link) — from the live manifest `/assets/.vite/manifest.json`: `PullRequestMergeForm`, `RepoCodeFrequency`, `RepoContributors`, `RepoFileSearch`, `RepoRecentCommits` (Vue scoped styles), `easymde.css` (`web_src/js/features/comp/ComboMarkdownEditor.ts:335`), `features/colorpicker.css` (`web_src/js/features/colorpicker.ts:10`), dropzone (`web_src/js/features/dropzone.ts:21`), katex (`web_src/js/markup/math.ts:20`), asciinema, swagger. For equal specificity, these later sheets beat even our unlayered rules.

### 3.2 `web_src/css` tree (one line each)
Load order = the order in `web_src/css/index.css:1-90` (listed in that order; files not imported by index.css marked).

```
index.css                      entry; @imports below in this order, ends with "@tailwind utilities;" (line 90)
modules/normalize.css          normalize.css reset (html/body/hr/abbr/…)
modules/animations.css         .is-loading spinner, keyframes (pulse, fadein, rotate), --loading-size
-- "fomantic replacements" (Gitea's own re-implementations of Fomantic UI CSS, index.css:4-25) --
modules/button.css             .ui.button (+primary/basic/red/…/buttons groups), .btn, .btn-octicon
modules/container.css          .ui.container (1280px), .fluid, .medium-width; web banner
modules/divider.css            .divider, .divider-text, .inline-divider
modules/header.css             .ui.header, .sub.header, .attention-header
modules/input.css              .ui.input (focus/error/action/icon variants)
modules/label.css              .ui.label (colors, basic, circular, detail, .scope-*)
modules/list.css               .ui.list / .item
modules/segment.css            .ui.segment(s), attached top/bottom, .ui.segment.tab
modules/grid.css               .ui.grid columns/rows (stackable etc.)
modules/menu.css               .ui.menu (secondary, pointing, tabular, vertical, compact, borderless…)
modules/message.css            .ui.message (+info/warning/error/positive/negative, .flash-message)
modules/table.css              .ui.table (basic, celled, striped, attached…)
modules/card.css               .ui.card(s)
modules/checkbox.css           native input[type=checkbox|radio] styling (masks from base.css vars), .ui.checkbox, toggle
modules/dimmer.css             .ui.dimmer (modal backdrop)
modules/modal.css              .ui.modal (header/content/actions, sizes)
modules/search.css             .ui.search results popup
modules/tab.css                .ui.tab show/hide
modules/form.css               .ui.form fields/labels/errors/inline
modules/dropdown.css           .ui.dropdown (selection, search, menu, items, labels, upward, scrolling)
modules/transition.css         .transition visible/hidden for modal/dropdown
-- other modules --
modules/shortcut.css           kbd, .global-shortcut-wrapper
modules/tippy.css              .tippy-box[data-theme=default|bare|tooltip|menu|box-with-header], arrows
modules/breadcrumb.css         .breadcrumb, .breadcrumb-divider
modules/comment.css            .ui.comments .comment (fomantic-like comment blocks)
modules/navbar.css             #navbar, .navbar-left/right, .item, mobile layout, notification_count, .secondary-nav bg
modules/toast.css              .toastify, .toast-body/icon/close/duplicate-number
modules/svg.css                .svg base (fill: currentcolor), min-size per width/height attr, .svg-icon-container
modules/flexcontainer.css      .flex-container(-nav|-sidebar|-main) settings/dashboard 2-column layout
modules/codeeditor.css         CodeMirror 6 (.code-editor-container .cm-*, .tok-*)
modules/chroma.css             .chroma token colors → --color-syntax-*
modules/charescape.css         .broken-code-point / .escaped-code-point / .ambiguous-code-point
shared/flex-list.css           .flex-list / .flex-divided-list / .flex-relaxed-list / .items-with-main (issue list, feeds…)
shared/settings.css            .ui.vertical.menu > details.item (collapsible settings sidebar groups)
features/dropzone.css          attachment dropzone
features/gitgraph.css          #git-graph-container commit graph (.flow-color-16-N → --color-series-16-N)
features/heatmap.css           #user-heatmap / .activity-heatmap-container
features/imagediff.css         .image-diff-* (image compare)
features/projects.css          #project-board, .project-column (kanban)
features/expander.css          text-expander / tribute mention & emoji suggestion popups
features/cropper.css           avatar cropper panel
features/console.css           .console, ANSI .ansi-*-fg/bg and 256-colour .term-fgxN/.term-bgxN (hard-coded hex)
features/captcha.css           .m-captcha-style
markup/content.css             .markup (rendered markdown: headings, anchors, lists, task lists, tables, blockquote, code, images, gh-light/dark-mode-only)
markup/codeblock.css           .markup .code-copy button, .mermaid-block .view-controller
markup/codepreview.css         .markup .code-preview-container (permalink code previews)
markup/jupyter.css             .markup .jupyter-notebook
font_i18n.css                  CJK font overrides (:lang), system-ui-* @font-face
base.css                       :root vars (§2), global element styles, links, .page-content, overflow-menu, attention blocks, helpers (.flex-text-block, .muted, …)
avatar.css                     img.ui.avatar, .avatar-stack-*
home.css                       landing page .home, .page-footer
install.css                    install page
repo.css                       everything repo (1947 lines): .repo-header, .secondary-info, issue view/timeline/comment-list, diff (.diff-file-box, .code-diff, .lines-*), branches, commits, releases, settings…
repo/release-tag.css           #release-list
repo/issue-card.css            .issue-card (project cards, pinned issues)
repo/issue-label.css           .issue-label-list (labels page)
repo/issue-list.css            .issue-list-toolbar, #issue-list branches/checklist
repo/list-header.css           .list-header (search + buttons row)
repo/file-view.css             .file-view, .file-view-container, .code-view, active line
repo/wiki.css                  .repository.wiki
repo/home.css                  .repo-grid-filelist-sidebar, .repo-home-*, .repo-view-container/.repo-view-file-tree-container/.repo-view-content
repo/home-file-list.css        #repo-files-table .repo-file-item/.repo-file-cell/.repo-file-line
repo/reactions.css             .bottom-reactions, reaction labels
repo/clone.css                 .clone-buttons-combo, .clone-panel-*
repo/commit-sign.css           .commit-id-short, .commit-sign-badge, .commit-is-signed
repo/packages.css              .packages-content(-left|-right)
editor/combomarkdowneditor.css .combo-markdown-editor, markdown-toolbar
org.css                        .page-content.organization team items
user.css                       .user.profile card / sidebar
dashboard.css                  .dashboard.feeds/.issues context menus, .dashboard .secondary-nav
admin.css                      .admin tables / dl
explore.css                    .ui.repository.branches
review.css                     .add-code-comment button, code comment forms, .lines-escape toggle
actions.css                    .runner-container, .run-list-item-*
helpers.css                    .gt-ellipsis, .interact-fg/.interact-bg, .tw-hidden helpers…
(tailwind utilities)           "@tailwind utilities;" last (index.css:90)

NOT imported by index.css:
easymde.css                    lazy, EasyMDE editor (ComboMarkdownEditor.ts:335)
features/colorpicker.css       lazy (colorpicker.ts:10)
swagger-standalone.css         imported by web_src/js/swagger.ts:1 (API docs page)
swagger-render.css             imported by render/plugins/frontend-openapi-swagger.ts:5
devtest.css                    separate entry, /devtest pages only
themes/*.css                   9 built-in themes (separate entries)
```

### 3.3 Fomantic UI
- No Fomantic CSS is shipped. `web_src/fomantic/semantic.json` pins 2.8.7 but `web_src/fomantic/build/` only contains `fomantic.js` + `components/{api,dropdown,modal}.js` — "Hard-forked from Fomantic UI 2.8.7, patches are commented with GITEA-PATCH" (`web_src/fomantic/build/fomantic.js:1-5`), imported first by `web_src/js/index.ts:1`. Wrappers/ARIA patches: `web_src/js/modules/fomantic/{base,dimmer,dropdown,modal,tab,transition}.ts`.
- All the `.ui.*` CSS is Gitea's own re-implementation in `web_src/css/modules/*.css` ("fomantic replacements", index.css:4-25): button, container, divider, header, input, label, list, segment, grid, menu, message, table, card, checkbox, dimmer, modal, search, tab, form, dropdown, transition. (No accordion, popup, progress, sidebar, statistic, step, rating etc.)
- Behaviour-wise: dropdowns and modals are Fomantic JS (adds `.visible`, `.active`, `.transition`, moves modals into `.ui.dimmer.modals`), tabs via `modules/fomantic/tab.ts`, tooltips/popups are **tippy.js**, not Fomantic.

### 3.4 Tailwind (`tailwind.config.ts`, Tailwind 3.4.19 per `package.json`)
- `prefix: 'tw-'`, **`important: true`** (every utility is `!important`) (`tailwind.config.ts:26-27`). Only `@tailwind utilities` is included (no base/preflight, `index.css:90`; the few preflight bits are in `base.css:67-73`).
- `theme.colors` = every `--color-*` name extracted from theme-gitea-light/dark `:root` → `var(--color-…)` (`tailwind.config.ts:5-24,46-56`), plus `inherit/current/transparent`. So `tw-text-red` = `color: var(--color-red) !important`, `tw-bg-primary`, `tw-text-text-light`, `tw-border-secondary`, etc.
- `borderRadius`: DEFAULT `var(--border-radius)`, `md` `var(--border-radius-medium)`, `full` `var(--border-radius-full)`, sm 2px, lg 8px… (`:56-66`); `fontFamily` (`:67-70`) sans/mono → `--fonts-regular`/`--fonts-monospace`; `fontWeight` → `--font-weight-*`; `fontSize` xs 11 / sm 12 / base 14 / … plus numeric `tw-text-0..99` = px.
- Blocklist removes `hidden` (Gitea uses double-class `.tw-hidden.tw-hidden {display:none !important}`, plugin at `:100-120`), transform/shadow/ring/blur/filter classes.
- Content scan includes Go files, templates and web_src/js (`:28-35`; blocklist `:36-45`).

### 3.5 @layer — confirmed absent; specificity implications
- `grep -rn "@layer" web_src/css web_src/js` → no hits (the only at-rules are `@tailwind utilities` and one `@container` in `features/heatmap.css:11`). Built output verified live: **0 occurrences of `@layer`** in `index.DleUJaOD.css`, all 9 built-in theme files, and every lazy CSS chunk in the manifest. Tailwind 3 compiles `@tailwind utilities` to plain unlayered rules.
- Cascade consequences for a theme that puts its rules in `@layer github { … }`:
  1. **Normal declarations**: any unlayered Gitea declaration beats ours regardless of specificity or order. E.g. `.ui.button { … }` in Gitea beats `@layer github { html body .ui.button { … } }`. Layer is compared before specificity.
  2. **`!important` declarations**: order reverses: layered `!important` **beats** unlayered `!important`. So `!important` inside our layer wins over Gitea's 722 `!important` declarations, including all 195 `tw-*` utilities (live count of the built index.css). Watch out: `@layer github { .x { display:flex !important } }` would also beat `.tw-hidden.tw-hidden { display:none !important }`, and JS hides things with `tw-hidden` (`showElem/hideElem`). Never force `display` with `!important` on elements Gitea toggles with `tw-hidden`.
  3. **Inline `style=""`**: element-attached styles beat all normal stylesheet rules; inline `!important` beats even layered `!important`. Relevant inline cases in §8.
  4. **Custom properties** follow the same rules. base.css `:root` vars (radius, fonts, spacing) are unlayered → must be overridden unlayered or with `!important` (§2).
  5. Scoped Vue styles compile to `.cls[data-v-xxxx]`, unlayered, same as rule 1. Lazy chunks load after the theme link (§3.1).
- Gitea's own specificity is often high, e.g. `.repository.view.issue .comment-list .timeline-item .badge` (0,6,0) (`web_src/css/repo.css:485`), `.repository .diff-file-box .code-diff tbody tr .lines-type-marker` (`repo.css:12`). An *unlayered* theme rule must match or exceed these. A layered one needs `!important`.
- Colour-only theming through the ~300 vars needs no specificity fight, since all Gitea CSS is var-driven. Hard-coded colours exist only in `features/console.css` (256-colour ANSI table) and `features/colorpicker.css:18`.

---

## 4. Vue components (`web_src/js/components/*.vue`)

Every component with `<style>` uses **`<style scoped>`** (compiled to `.cls[data-v-hash]`), except `ActionRunJobView.vue`, which has a scoped block **and** an unscoped global block (`.job-step-section`, `.job-log-line`, `.log-time-*`, …) for log lines created outside Vue. "Lazy" = dynamic `import()`, so its CSS arrives as a separate chunk after the theme link (§3.1). Mount point → template:

| Component | Page / mount | Load | Style | Main class names emitted |
|---|---|---|---|---|
| `DashboardRepoList.vue` | dashboard sidebar repo/org list, `#dashboard-repo-list` in `templates/user/dashboard/repolist.tmpl` (`features/dashboard.ts:5-7`) | static | scoped | `.dashboard-repos`, `.dashboard-orgs`, `.ui.two.item.menu`, `.ui.top.attached.header`, `.repos-search`, `.repos-filter` (`.ui.secondary.pointing.tabular.borderless.menu`), `.ui.attached.table`, `.repo-list-link`, `.repo-list-icon`, `.repo-owner-name-list`, `.ui.pagination.menu`, `gitea-exclamation`/`gitea-double-chevron-*` icons |
| `RepoBranchTagSelector.vue` | branch/tag dropdown, `data-global-init="initRepoBranchTagSelector"` in `templates/repo/branch_dropdown.tmpl:49` (`features/repo-legacy.ts:22-26`) | static | none | `.ui.dropdown.custom.branch-selector-dropdown.ellipsis-text-items`, `.branch-dropdown-button`, `.menu.transition`, `.branch-tag-tab`, `.branch-tag-item`, `.branch-tag-divider`, `.scrolling.menu`, `.item.selected`, `.loading-indicator` |
| `ViewFileTree.vue` + `ViewFileTreeItem.vue` | code-view left file tree, `#view-file-tree` in `templates/repo/view_file_tree.tmpl` (`features/repo-view-file-tree.ts`) | static | scoped | `.view-file-tree-items`, `.tree-item`, `.item-toggle`, `.item-content`, `.sub-items`, `.selected`; icons via server-rendered material/octicon HTML |
| `DiffFileTree.vue` + `DiffFileTreeItem.vue` | PR/commit diff file tree, `#diff-file-tree` (`templates/repo/diff/box.tmpl:64`) | static | scoped | `.diff-file-tree-items`, `.item-directory`, `.item-file`, `.sub-items`, `.viewed`, `.selected`, status icon classes via `getIconForDiffStatus` |
| `DiffCommitSelector.vue` | diff "commits" range dropdown, `#diff-commit-select` (`box.tmpl`) | static | scoped | `.ui.scrolling.dropdown.custom.diff-commit-selector`, `.menu`, `.commit-list-summary`, `.item.selected/.hovered` |
| `RepoActionView.vue` | Actions run page, `#repo-action-view` in `templates/repo/actions/view_component.tmpl:1` (`features/repo-actions.ts:33-105`) | static | scoped | `.action-view-header`, `.action-info-summary*`, `.action-view-body`, `.action-view-left`, `.action-view-sidebar-list`, `.job-brief-*`, `.action-view-right`, `.job-summary-*`, `.left-list-header` |
| `ActionRunJobView.vue` | job log panel (child of RepoActionView) | static | scoped + **global** | `.job-info-header*`, `.job-step-container`, `.job-step-section`, `.job-step-summary`, `.job-step-logs`, `.job-log-line`, `.line-num`, `.log-time-*`, `.action-job-menu` |
| `ActionRunSummaryView.vue` | run summary (child) | static | scoped | `.action-run-summary-*` |
| `WorkflowGraph.vue` | workflow DAG (child of summary) | static | scoped | `.workflow-graph`, `.graph-header`, `.graph-container`, `.graph-svg` (SVG, inline transform), `.job-node-group`, `.job-rect`, `.node-edge`, `.matrix-panel*`, `.job-card`… |
| `ActionStatusIcon.vue` | status icon (children) | static | none | `SvgIcon` with status colour class |
| `ActivityHeatmap.vue` | contribution heatmap on profile & dashboard, `#user-heatmap` (`templates/user/heatmap.tmpl`, `features/heatmap.ts:48`) | **lazy** | none (uses `features/heatmap.css`) | `.heatmap-svg`, `.heatmap-day` (inline `style="fill: var(--color-…)"`), `.heatmap-legend` |
| `RepoActivityTopAuthors.vue` | repo Activity → top authors bar chart, `#repo-activity-top-authors-chart` (`templates/repo/pulse.tmpl`) | static | none | `.activity-bar-graph`, `.activity-bar-graph-alt` (probe elements), `vue-bar-graph` SVG |
| `RepoContributors.vue` | Activity → Contributors, `#repo-contributors-chart` (`templates/repo/contributors.tmpl`) | **lazy** | scoped | Chart.js **canvas** `.main-graph`, `.contributor-grid`, `.contributor-name` |
| `RepoCodeFrequency.vue` | Activity → Code frequency (`templates/repo/code_frequency.tmpl`) | **lazy** | scoped | Chart.js canvas `.main-graph` |
| `RepoRecentCommits.vue` | Activity → Recent commits (`templates/repo/recent_commits.tmpl`) | **lazy** | scoped | Chart.js canvas `.main-graph` |
| `PullRequestMergeForm.vue` | PR merge box form, `#pull-request-merge-form` (`templates/repo/issue/view_content/pull_merge_box.tmpl`, `features/repo-issue-pull.ts:29-33`) | **lazy** | scoped | `.ui.form.form-fetch-action`, `.ui.buttons.merge-button`, `.dropdown`, `.menu.show`, `.auto-merge-small`, `.auto-merge-tip`, `.merge-cancel` |
| `RepoFileSearch.vue` | "Go to file" box in code view, `.repo-file-search-container` (`templates/repo/view_content.tmpl:55`, `features/repo-findfile.ts:70-80`) | **lazy** | scoped | `.ui.small.input`, `.file-search-popup`, `.file-search-results`, `.item.selected`, `.full-path` |
| `ContextPopup.vue` | hover card for `#123` issue refs (`features/ref-issue.ts:25-45`), inside tippy | **lazy** | none | `.flex-text-block`, `.issue-title`, `.index`, labels |

Vue-only UI (DOM built client-side; server templates only give an empty mount): dashboard repo list, branch/tag selector, both file trees, diff commit selector, the whole Actions run page, heatmap, contributors/code-frequency/recent-commits charts, top-authors graph, PR merge form, file search popup, issue hover card. CSS can style them (class names above + `[data-v-*]` scoped rules to beat), but not restructure them.

---

## 5. Icons

### 5.1 Server-side `{{svg "name" size "classes"}}`
- Implementation `modules/svg/svg.go`:
  - `Init()` (`:41-61`) lists `assets/img/svg` through **`public.AssetFS()`** (custom layer first, then built-in) and caches every `*.svg` in memory, normalised by `Normalize(bs, 16)`.
  - Called once at startup: `mustInit(svg.Init)` in `routers/init.go:166` (and install page `:111`). ⇒ **`CUSTOM_PATH/public/assets/img/svg/<name>.svg` overrides a built-in icon of the same name (or adds a new name), but only after a restart.** Overrides apply to all themes and users (not theme-scoped).
  - `RenderHTML` (`:87-133`): replaces `width="16"`/`height="16"` with the requested size and prepends extra classes into `class="`. Unknown name → `<span>name(size/class)</span>` (`:130-132`).
- `Normalize` (`modules/svg/processor.go:34-55`): strips `<?xml…?>`, comments, `xmlns`, any `width`/`height` on the root, then appends `width="16" height="16"`; adds `class="svg"` **only if the root has no class attribute**. Built-ins carry `class="svg octicon-foo"` (e.g. `public/assets/img/svg/octicon-repo.svg`) and CSS targets `.svg` and `.octicon-*` classes. **A custom override must keep `class="svg <name>"` on its root** and should use a 16×16 viewBox + `fill="currentColor"`-compatible paths (`.svg:not(.git-entry-icon){fill: currentcolor}` in `web_src/css/modules/svg.css:3-7`).
- Generation (`tools/generate-svg.ts:115-122`): `node_modules/@primer/octicons/build/svg/*-16.svg` → `octicon-<name>.svg` (strips `-16`), `web_src/svg/*.svg` (gitea-*, fontawesome-*, material-*), `public/assets/img/gitea.svg` → `gitea-gitea.svg`; svgo adds `class="svg <name>"`, `width/height=16`, `aria-hidden`, prefixes ids (`:26-42`). Material file-icon theme → `options/fileicon/material-icon-svgs.json` + `material-icon-rules.json` (`:54-113`).
- **Octicons version: `@primer/octicons` 19.28.1** (`package.json`). Built-in set: 376 `octicon-*`, 60 `gitea-*`, 4 `fontawesome-*`, 4 `material-*` = 444 files in `public/assets/img/svg`.
- Other icon channels:
  - **File/folder icons** (`modules/fileicon`): `[ui] FILE_ICON_THEME` default `material`, `FOLDER_ICON_THEME` default `basic` (`modules/setting/ui.go:99-100`; not set in this app.ini). Material icons come from `options/fileicon/material-icon-svgs.json` (1250 icons, 1244 with **hard-coded `fill='#…'` colours**) and render as `<svg class="svg git-entry-icon octicon-file" …><use href="#svg-mfi-<name>"></use></svg>`, with the symbol defined once in a hidden `.svg-icon-container` (`modules/fileicon/material.go:64-80,108-116`, `render.go:23-34`). The extra `octicon-*` class is kept for theme selectors (`material.go:89,108`). Folders use basic octicons `octicon-file-directory-fill` / `-open-fill` (`modules/fileicon/basic.go:13-27`). `options/` is also overridable through CUSTOM_PATH but is loaded once (`sync.Once`, `material.go:27-61`).
  - CSS data-URI icons in `base.css:18-23` (`--checkbox-mask-*`, `--octicon-alert-fill`, `--octicon-chevron-right`, `--octicon-x`, `--select-arrows`) can be overridden per theme by redefining the variables (unlayered, §2).
  - Navbar logo is an `<img src="/assets/img/logo.svg">` (`templates/base/head_navbar.tmpl:5`). A file override is global and not theme-scoped; per-theme it can only be hidden/replaced with CSS (e.g. `content: url(...)` on the img or a background on `#navbar-logo`).

### 5.2 JS / Vue icons (`web_src/js/svg.ts`)
- `svg.ts:4-90` statically imports 87 files from `public/assets/img/svg/*.svg` (and `public/assets/img/favicon.svg` as `gitea-favicon`) as strings at **build time** (`const svgs = {…}`, `:92-180`). `svg(name,size,class)` (`:189-202`) and `<SvgIcon name>` (`:226-257`) only use that table (throws on unknown names). `web_src/js/webcomponents/overflow-menu.ts:3` also imports `octicon-kebab-horizontal.svg` directly.
- ⇒ **JS/Vue icons are baked into the bundle. `CUSTOM_PATH/public/assets/img/svg` overrides do NOT affect them.** They keep `class="svg octicon-…"`, so CSS can recolour/resize/hide them or swap them visually with `mask-image`/`content`.
- JS-available names: gitea-double-chevron-left/right, gitea-empty-checkbox, gitea-exclamation, gitea-favicon, gitea-running + 81 octicons (archive … zoom-out; full list `svg.ts:92-180`).

### 5.3 Inventory of non-Octicon icons

| Icon | Depicts | Where used |
|---|---|---|
| `fontawesome-openid` | OpenID logo | `templates/user/auth/signin_openid.tmpl:12,22`, `user/auth/external_auth_methods.tmpl:9` (24px), `user/settings/security/openid.tmpl:12` (20px), `shared/user/profile_big_avatar.tmpl:77` |
| `fontawesome-save` | floppy disk | `repo/issue/labels/label_edit_modal.tmpl:65`, `repo/settings/push_mirror_sync_modal.tmpl:22` |
| `fontawesome-send` | paper plane | `user/settings/applications.tmpl:15` (32px) |
| `fontawesome-windows` | Windows logo (SSPI) | `user/auth/external_auth_methods.tmpl:14` (24px) |
| `gitea-double-chevron-left` / `-right` | « » | `base/paginate.tmpl:11,38` (first/last page); `shared/issuelist.tmpl:68` (12px, PR head→base arrow); JS `DashboardRepoList.vue:500,519` |
| `gitea-exclamation` | exclamation in circle | `repo/icons/commit_status.tmpl:9,15` (18px, error/warning status); JS toasts `modules/toast.ts:27,32`; `DashboardRepoList.vue:38,40` |
| `gitea-running` | spinning half-circle (running) | `repo/icons/action_status.tmpl:25`; `routers/web/repo/pull_merge_box.go:132` (class `rotate-clockwise`); JS `ActionRunJobView.vue:490`, `RepoCodeFrequency.vue:154`, `RepoContributors.vue:393`, `RepoRecentCommits.vue:132`, `ViewFileTreeItem.vue:59`, `modules/action-status-icon.ts:26` |
| `gitea-empty-checkbox` | empty square | JS only: `ActionRunJobView.vue:440-457` (log options menu), `features/comp/EasyMDEToolbarActions.ts:111` |
| `gitea-favicon` | Gitea logo (favicon.svg) | JS `modules/favicon-status.ts:6` (tab favicon with status badge) |
| `gitea-eclipse` | half-moon "auto" | theme selector for `--theme-color-scheme: auto` (`modules/templates/util_render.go:242`) |
| `gitea-colorblind-redgreen` / `-blueyellow` | colour-blind marker | theme selector extra icon (`services/webtheme/webtheme.go:61-69`; `templates/user/settings/appearance.tmpl:23-25`) |
| `gitea-whitespace` | ¶ whitespace | diff whitespace dropdown button `repo/diff/whitespace_dropdown.tmpl:2` |
| `gitea-split` / `gitea-join` | split / unified diff toggle | `repo/diff/whitespace_dropdown.tmpl:30` |
| `gitea-lock`, `gitea-lock-cog`, `gitea-unlock` | signature state | `repo/commit_sign_badge.tmpl:66,69,73` |
| `gitea-git` | git logo | migrated-item icon for non-GitHub hosts (`modules/templates/util_misc.go:127-134` via `MigrationIcon`, used in issue/comment/review/release templates); "open in app" fallback (`routers/web/repo/view_home.go:86`) |
| `gitea-vscodium`, `gitea-jetbrains` | IDE logos | clone "open with" menu (`routers/web/repo/view_home.go:81-83`) |
| `gitea-gitea` | Gitea logo | webhook type icon `shared/webhook/icon.tmpl:6`; migrate card (`printf "gitea-%s"`); OAuth provider "gitea" |
| `gitea-feishu`, `gitea-matrix` | webhook service logos | `shared/webhook/icon.tmpl:20,22` |
| `gitea-gitlab`, `gitea-gitbucket`, `gitea-gogs`, `gitea-onedev`, `gitea-codebase`, `gitea-codecommit` | migration-service logos | `repo/migrate/migrate.tmpl:12-16` at **184px** (`printf "gitea-%s" .Name`, names from `modules/structs/repo.go:347-356`) |
| `gitea-google`, `gitea-bitbucket`, `gitea-discord`, `gitea-dropbox`, `gitea-facebook`, `gitea-twitter`, `gitea-yandex`, `gitea-azuread`, `gitea-azureadv2`, `gitea-microsoftonline`, `gitea-nextcloud`, `gitea-mastodon`, `gitea-openid`, `gitea-gitlab`, `gitea-gitea` | OAuth2 provider logos (sign-in buttons, linked accounts) | `"gitea-" + providerName` in `services/auth/source/oauth2/providers_base.go:37-49` (gplus→google, github→`octicon-mark-github`), OpenID Connect → `gitea-openid` (`providers_openid.go:35-37`) |
| `gitea-alpine`, `-arch`, `-cargo`, `-chef`, `-composer`, `-conan`, `-conda`, `-cran`, `-debian`, `-go`, `-helm`, `-maven`, `-npm`, `-nuget`, `-pub`, `-python`, `-rpm`, `-rubygems`, `-swift`, `-terraform`, `-vagrant` | package-registry logos (brand-coloured fills) | `Type.SVGName()` `models/packages/package.go:137-190`, rendered in `package/shared/list.tmpl:26` (16), `package/shared/view.tmpl:47`, `package/shared/cleanup_rules/list.tmpl:12` (32). Container→`octicon-container`, Generic→`octicon-package` |
| `material-folder-symlink` | folder with arrow | symlink-to-dir entries (`modules/fileicon/material.go:90`, extra class `octicon-file-directory-symlink`) |
| `material-invert-colors`, `material-palette` | colour toggle | commit graph mono/colour switch `repo/graph.tmpl:43-44` |
| `material-folder-generic` | folder | no reference found in Go/templates/JS |

Most brand logos (`gitea-*` packages/providers, `material-*`) have hard-coded `fill` colours in the SVG (grep of `fill="#` in `public/assets/img/svg`); CSS `fill` on descendants can still override presentation attributes, but they are data/brand icons.

### 5.4 Template icons whose size is not 16
(`{{svg name N}}` with N≠16; 16/default omitted; dev-only `templates/devtest/*` included for completeness; `$size` = passed in by caller. Paths below are relative to `templates/`. Also non-16 from Go/JS: theme items 14px in the footer list (`routers/web/misc/webtheme.go:26`), YAML front-matter table icon `octicon-table` 12px (`modules/markup/markdown/convertyaml.go:93`), OAuth provider icons `IconHTML(size)` (caller-defined), mermaid controls 12px (`web_src/js/markup/mermaid.ts`), and CSS min-size rules exist only for 12/13/14/15/16/18/20/22/24/36/48/56 (`web_src/css/modules/svg.css:24-48`).)


#### size 12 (11 uses)
- `"gitea-double-chevron-left"` — shared/issuelist.tmpl:68
- `"octicon-alert"` — devtest/flex-list.tmpl:66
- `"octicon-arrow-down"` — repo/diff/conversation.tmpl:47
- `"octicon-arrow-up"` — repo/diff/conversation.tmpl:44
- `"octicon-cpu"` — package/content/container.tmpl:82
- `"octicon-eye"` — org/member/members.tmpl:57
- `"octicon-eye-closed"` — org/member/members.tmpl:55
- `"octicon-hash"` — repo/issue/search.tmpl:15
- `"octicon-link"` — repo/view_list.tmpl:51
- `"octicon-reply"` — repo/diff/conversation.tmpl:61, repo/issue/view_content/conversation.tmpl:138

#### size 13 (1 uses)
- `"octicon-pin"` — user/notification/notification_div.tmpl:38

#### size 14 (170 uses)
- `"octicon-alert"` — devtest/flex-list.tmpl:37
- `"octicon-calendar"` — user/dashboard/milestones.tmpl:120, user/dashboard/milestones.tmpl:124, shared/issuelist.tmpl:107, repo/issue/milestones.tmpl:61, repo/issue/milestones.tmpl:65
- `"octicon-check"` — org/home.tmpl:45, org/home.tmpl:48, projects/list.tmpl:58, projects/list.tmpl:66, user/dashboard/milestones.tmpl:97, shared/issuelist.tmpl:117 (+5 more)
- `"octicon-checklist"` — shared/issuelist.tmpl:101
- `"octicon-clock"` — user/dashboard/milestones.tmpl:115, repo/issue/milestones.tmpl:56
- `"octicon-copy"` — shared/actions/runner_list.tmpl:22, repo/clone_buttons.tmpl:11, repo/clone_panel.tmpl:25, repo/view_content.tmpl:45, repo/branch/list.tmpl:27, repo/branch/list.tmpl:97 (+4 more)
- `"octicon-diff"` — shared/issuelist.tmpl:123
- `"octicon-eye"` — shared/issuelist.tmpl:129
- `"octicon-git-branch"` — shared/issuelist.tmpl:93, repo/actions/workflow_dispatch.tmpl:20
- `"octicon-globe"` — base/footer_content.tmpl:30
- `"octicon-info"` — devtest/flex-list.tmpl:40
- `"octicon-issue-opened"` — projects/list.tmpl:54, user/dashboard/milestones.tmpl:93, repo/issue/milestones.tmpl:34
- `"octicon-milestone"` — shared/issuelist.tmpl:81
- `"octicon-pencil"` — projects/list.tmpl:64, repo/settings/options.tmpl:222, repo/issue/milestones.tmpl:73
- `"octicon-skip"` — projects/list.tmpl:68
- `"octicon-sync"` — repo/settings/options.tmpl:227
- `"octicon-trash"` — projects/list.tmpl:70, repo/settings/options.tmpl:232, repo/issue/milestones.tmpl:79
- `"octicon-triangle-down"` — 115 uses: the caret of almost every `.ui.dropdown` (e.g. install.tmpl:22, webhook/new.tmpl:8, …)
- `"octicon-x"` — devtest/fomantic-dropdown.tmpl:19, devtest/fomantic-dropdown.tmpl:27, devtest/fomantic-dropdown.tmpl:57, shared/issuelist.tmpl:135, repo/issue/milestones.tmpl:77, repo/issue/fields/dropdown.tmpl:8
- `$project.IconName` — shared/issuelist.tmpl:87

#### size 15 (2 uses)
- `"octicon-code"` — repo/view_file.tmpl:41
- `"octicon-file"` — repo/view_file.tmpl:44

#### size 18 (25 uses)
- `"gitea-exclamation"` — repo/icons/commit_status.tmpl:9, repo/icons/commit_status.tmpl:15
- `"octicon-archive"` — repo/header.tmpl:14
- `"octicon-check"` — repo/icons/commit_status.tmpl:6
- `"octicon-chevron-down"` — repo/diff/box.tmpl:92
- `"octicon-chevron-right"` — repo/diff/box.tmpl:90
- `"octicon-dot-fill"` — repo/icons/commit_status.tmpl:3
- `"octicon-gear"` — shared/user/profile_big_avatar.tmpl:18
- `"octicon-kebab-horizontal"` — repo/diff/box.tmpl:139
- `"octicon-lock"` — repo/header.tmpl:18
- `"octicon-milestone"` — repo/issue/sidebar/milestone_list.tmpl:28, repo/issue/sidebar/milestone_list.tmpl:37, repo/issue/sidebar/milestone_list.tmpl:50
- `"octicon-people"` — user/dashboard/navbar.tmpl:50
- `"octicon-person"` — shared/user/profile_big_avatar.tmpl:22
- `"octicon-repo-template"` — repo/header.tmpl:30
- `"octicon-rss"` — shared/user/profile_big_avatar.tmpl:24
- `"octicon-shield-lock"` — repo/header.tmpl:22
- `"octicon-skip"` — repo/icons/commit_status.tmpl:18
- `"octicon-triangle-down"` — repo/issue/labels/label_load_template.tmpl:14
- `"octicon-x"` — repo/icons/commit_status.tmpl:12
- `.IconName` — repo/issue/filter_actions.tmpl:88, repo/issue/filter_actions.tmpl:99, repo/issue/sidebar/project_list.tmpl:29, repo/issue/sidebar/project_list.tmpl:39

#### size 20 (8 uses)
- `"fontawesome-openid"` — user/settings/security/openid.tmpl:12
- `"octicon-people"` — repo/issue/sidebar/reviewer_list.tmpl:37, repo/issue/sidebar/reviewer_list.tmpl:56
- `"octicon-sidebar-collapse"` — repo/diff/box.tmpl:8
- `"octicon-sidebar-expand"` — repo/diff/box.tmpl:9
- `"octicon-x"` — repo/issue/sidebar/reviewer_list.tmpl:63
- `(MigrationIcon $originalURLHostname)` — repo/issue/sidebar/reviewer_list.tmpl:96
- `(MigrationIcon $release.Repo.GetOriginalURLHostname)` — repo/release/list.tmpl:50

#### size 22 (2 uses)
- `"octicon-dot-fill"` — repo/settings/githooks.tmpl:12, repo/settings/webhook/base_list.tmpl:16

#### size 24 (11 uses)
- `"fontawesome-openid"` — user/auth/external_auth_methods.tmpl:9
- `"fontawesome-windows"` — user/auth/external_auth_methods.tmpl:14
- `"octicon-alert"` — devtest/gitea-ui.tmpl:131
- `"octicon-lock"` — repo/editor/commit_form.tmpl:6
- `"octicon-mirror"` — repo/icon.tmpl:5
- `"octicon-package"` — user/dashboard/guide.tmpl:2
- `"octicon-repo"` — repo/icon.tmpl:9
- `"octicon-repo-forked"` — repo/icon.tmpl:7
- `"octicon-rss"` — org/header.tmpl:13
- `"octicon-unlock"` — repo/editor/commit_form.tmpl:9
- `"octicon-x"` — devtest/gitea-ui.tmpl:131

#### size 28 (1 uses)
- `"octicon-kebab-horizontal"` — shared/user/profile_big_avatar.tmpl:96

#### size 32 (15 uses)
- `"fontawesome-send"` — user/settings/applications.tmpl:15
- `"octicon-apps"` — user/settings/applications_oauth2_list.tmpl:9
- `"octicon-info"` — devtest/flex-list.tmpl:19, devtest/flex-list.tmpl:50
- `"octicon-key"` — user/settings/keys_ssh.tmpl:44, user/settings/keys_principal.tmpl:20, user/settings/grants_oauth2.tmpl:12, user/settings/keys_gpg.tmpl:51, user/settings/security/webauthn.tmpl:10, shared/secrets/add_list.tmpl:23 (+1 more)
- `"octicon-pencil"` — shared/variables/variable_list.tmpl:22
- `"octicon-repo"` — devtest/flex-list.tmpl:73
- `(printf "octicon-%s" (ActionIcon .GetOpType))` — user/dashboard/feeds.tmpl:125
- `.Type.SVGName` — package/shared/cleanup_rules/list.tmpl:12

#### size 40 (1 uses)
- `"octicon-git-merge"` — repo/issue/view_content/pull_merge_box.tmpl:10

#### size 48 (9 uses)
- `"octicon-book"` — repo/wiki/start.tmpl:6
- `"octicon-clock"` — org/worktime/empty_placeholder.tmpl:4
- `"octicon-no-entry"` — repo/actions/runs_list.tmpl:4, repo/actions/no_workflows.tmpl:2
- `"octicon-package"` — package/shared/list.tmpl:47
- `"octicon-project-symlink"` — projects/list.tmpl:81
- `"octicon-repo"` — org/home.tmpl:15
- `"octicon-search"` — projects/list.tmpl:87, shared/search/code/search.tmpl:29

#### size 56 (2 uses)
- `"octicon-inbox"` — user/notification/notification_div.tmpl:84
- `"octicon-key"` — user/auth/webauthn.tmpl:8

#### size 184 (4 uses)
- `"gitea-gitbucket"` — repo/migrate/migrate.tmpl:14
- `"gitea-gitlab"` — repo/migrate/migrate.tmpl:12
- `"octicon-mark-github"` — repo/migrate/migrate.tmpl:10
- `(printf "gitea-%s" .Name)` — repo/migrate/migrate.tmpl:16

#### size $size (11 uses)
- `"gitea-feishu"` — shared/webhook/icon.tmpl:20
- `"gitea-gitea"` — shared/webhook/icon.tmpl:6
- `"gitea-matrix"` — shared/webhook/icon.tmpl:22
- `"gitea-running"` — repo/icons/action_status.tmpl:25
- `"octicon-blocked"` — repo/icons/action_status.tmpl:23
- `"octicon-circle"` — repo/icons/action_status.tmpl:21
- `"octicon-skip"` — repo/icons/action_status.tmpl:17
- `"octicon-stop"` — repo/icons/action_status.tmpl:19, repo/icons/action_status.tmpl:27
- `(Iif $circleFill "octicon-check-circle-fill" "octicon-check")` — repo/icons/action_status.tmpl:15
- `(Iif $circleFill "octicon-x-circle-fill" "octicon-x")` — repo/icons/action_status.tmpl:29

---

## 6. Page-structure landmarks to restyle

Page skeleton (`templates/base/head.tmpl:27-37`, `templates/base/footer.tmpl`): `<body>` → `div.full.height` → `nav#navbar` + `.ui.message` web banner (`base/head_banner`) → `div.page-content.<page classes>[role=main]` → … → `footer.page-footer`. `body` is `display:flex; flex-direction:column` (`base.css:80-90`). Per-page hooks: `html[data-theme]` and the `page-content` classes, e.g. `.page-content.repository.file.list` (code), `.page-content.repository.issue-list`, `.page-content.repository.view.issue.pull` (issue/PR view), `.page-content.user.profile`, `.page-content.dashboard.feeds`, `.page-content.organization`.

### 6.1 Global navbar: `templates/base/head_navbar.tmpl` (+ `head_navbar_icons.tmpl`) / CSS `web_src/css/modules/navbar.css`
```
nav#navbar
  div.navbar-left
    a.item#navbar-logo > img[src=/assets/img/logo.svg][width=30]
    div.ui.secondary.menu.navbar-mobile-right.only-mobile   (notification bell + button#navbar-expand-toggle, octicon-three-bars)
    a.item[.active]  Issues | Pull requests | Milestones | Explore   (signed-in; /issues /pulls /milestones /explore/repos)
    {{template "custom/extra_links"}}  a.item Help (signed-out)
  div.navbar-right
    a.item.active-stopwatch (optional) ; a.item[href=/notifications] > div.tw-relative > svg.octicon-bell + span.notification_count
    div.ui.dropdown.jump.item  (create: octicon-plus + octicon-triangle-down) > div.menu > a.item (New repo / migrate / org)
    div.ui.dropdown.jump.item  (user) > span.text > span.navbar-avatar > img.ui.avatar(24) [+ svg.navbar-admin-badge]
        > div.menu.user-menu > div.header, div.divider, a.item (profile, stars, subscriptions, settings, help, admin, sign out)
    signed-out: a.item (Register / Sign in)
  div.active-stopwatch-popup.tippy-target
```
CSS: `#navbar { background: var(--color-nav-bg); border-bottom: 1px solid var(--color-secondary); padding: 0 10px }`, `.navbar-left > .item, .navbar-right > .item { color: var(--color-nav-text); min-height:36px; padding:3px 13px; border-radius:4px }`, `#navbar .item.active { background: var(--color-active) }`, hover `var(--color-nav-hover-bg)` (`navbar.css:1-45`); mobile collapse `@media (max-width:767.98px)` (`:47+`). There is **no search box** in the navbar and the logo is an `<img>` (see 5.1).

### 6.2 Secondary nav / repo header: `templates/repo/header.tmpl`
```
div.secondary-nav                                    (bg var(--color-secondary-nav-bg) !important, navbar.css:152-153)
  div.ui.container > div.repo-header.flex-left-right
     left:  div.flex-text-block > {{template "repo/icon"}} (24px octicon-repo|repo-forked|mirror, repo/icon.tmpl)
            div.flex-text-block.tw-text-18 > a.muted(owner) "/" a.muted(repo)
            span.ui.basic.label (Archived/Private/Internal/Template/SHA256), span.ui.basic.orange.label (public access)
     right: a.ui.compact.small.basic.button (RSS), repo/header/watch, repo/header/star, repo/header/fork   (button + count combos)
  div.secondary-info  (mirror/fork/generated-from lines)
  div.ui.container > overflow-menu.ui.secondary.pointing.menu > div.overflow-menu-items
     a.item[.active] > svg + text + span.ui.small.label(count)   Code | Issues | Pull requests | Actions | Packages | Projects | Releases | Wiki | Activity | {custom/extra_tabs} | span.item-flex-space | Settings
  div.ui.tabs.divider
```
- `overflow-menu` is a custom element (`web_src/js/webcomponents/overflow-menu.ts`): it wraps text nodes of items in `span.resize-for-semibold[data-text]` (`:188-205`), moves overflowing items into `.overflow-menu-popup` behind a kebab button `.overflow-menu-button` on resize (ResizeObserver, `:207+`), and sets inline `display:none !important` on `.item-flex-space`/button while measuring (`:113-134`). CSS for it in `base.css:515-600` (`overflow-menu { border-bottom: 1px solid var(--color-secondary) !important }`).
- Tab styles: `.ui.secondary.pointing.menu …` in `web_src/css/modules/menu.css:507-565` (active item = 2px bottom border).
- Other `.secondary-nav` users: dashboard context bar `templates/user/dashboard/navbar.tmpl:1` (`div.secondary-nav > .ui.secondary.stackable.menu`), explore tabs `templates/explore/navbar.tmpl:1` (`overflow-menu.ui.secondary.pointing.tabular.top.attached.borderless.menu.secondary-nav`), `user/auth/link_account.tmpl`, `signup_openid_navbar.tmpl`. User profile tabs: `templates/user/overview/header.tmpl:1` (`overflow-menu.ui.secondary.pointing.tabular.borderless.menu`); org header `templates/org/header.tmpl`.
- Margin rules: `.page-content > :first-child.secondary-nav { margin-bottom: 14px }` / other first child `margin-top: var(--page-spacing)` (`base.css:405-418`).
- Repo code page: `templates/repo/home.tmpl` / `view.tmpl` (`.repo-grid-filelist-sidebar` | `.repo-grid-filelist-only` > `.repo-home-filelist` + sidebar `repo/home_sidebar_top.tmpl` `.repo-home-sidebar-top`, `.repo-home-sidebar-bottom`), summary bar `templates/repo/sub_menu.tmpl` (`.ui.segments.repository-summary > .ui.segment.sub-menu.repository-menu > a.item.muted`; **hidden by Modern's override for Modern themes only**), file list `templates/repo/view_list.tmpl` (`#repo-files-table > .repo-file-line.repo-file-last-commit`, `.repo-file-item > .repo-file-cell.name|.message|.age`; CSS `repo/home-file-list.css`). This instance's `view_list.tmpl` override also emits `<a hidden class="m-commit-count muted">` for every theme (only Modern's CSS shows it).

### 6.3 Issue / PR list: `templates/repo/issue/list.tmpl` → `templates/shared/issuelist.tmpl`
```
div.list-header.flex-text-block  (search = repo/issue/search.tmpl; a.ui.small.button Labels/Milestones; a.ui.small.primary.button.issue-list-new)
div#issue-filters.issue-list-toolbar
   .issue-list-toolbar-left  > input.issue-checkbox-all, div.small-menu-items.ui.compact.tiny.menu > a.item(.active) "N Open" / "N Closed"   (repo/issue/openclose.tmpl)
   .issue-list-toolbar-right > div.ui.secondary.filter.menu.labels > .ui.dropdown… (filter_list.tmpl)
div#issue-actions.issue-list-toolbar.tw-hidden (bulk actions)
div#issue-list.flex-divided-list.items-with-main
   div.item > div.item-leading (input.issue-checkbox + shared/issueicon: svg octicon-issue-opened.tw-text-green / issue-closed.tw-text-red / git-pull-request(.tw-text-green) / -closed(.tw-text-red) / -draft(.tw-text-text-light) / git-merge.tw-text-purple)
            div.item-main > div.item-header > a.list-item-large-title, commit status, span.labels-list > a.item > span.ui.label (inline colors)
                          > div.item-body > a.index "#N", "opened … by …", div.branches, a.milestone, checklist, …
            div.item-trailing (assignees, comments count)
```
CSS: `shared/flex-list.css` (`.flex-divided-list > .item + .item` borders), `repo/issue-list.css`, `repo/list-header.css`. Pinned issues: `#issue-pins > .issue-card` (`repo/issue-card.css`).

### 6.4 Issue / PR detail + timeline: `templates/repo/issue/view.tmpl`, `view_title.tmpl`, `view_content.tmpl`, `view_content/comments.tmpl`, `view_content/sidebar.tmpl`, `pulls/tab_menu.tmpl`
```
div.issue-title-header > div.issue-title#issue-title-display > h1 (title + span.index "#N"), div.issue-title-buttons (edit / new), div.issue-title-meta > span.ui.{green|red|purple|grey}.label.issue-state-label + text
PR only: div.ui.pull.tabs.container > div.ui.top.attached.pull.tabular.menu > a.item(.active) (Conversation/Commits/Files changed + span.ui.small.label) + repo/diff/stats
div.issue-content
  div.issue-content-left > div.comment-list
     div.timeline-item.comment[.issue-content-comment]#issue-N
        a.timeline-avatar > img.ui.avatar (40)
        div.content.comment-container
           div.comment-header.avatar-content-left-arrow > .comment-header-left (a.inline-timeline-avatar (mobile), author, "commented …") | .comment-header-right (role label, add_reaction, context_menu)
           div.ui.attached.segment.comment-body > div.render-content.markup, .raw-content.tw-hidden, .edit-content-zone
           div.bottom-reactions (repo/reactions.css)
     div.timeline-item.event        > span.badge > svg (+ .tw-bg-green/.tw-bg-red/.tw-bg-purple variants) , a.avatar-with-link, span.comment-text-line / div.detail
     div.timeline-item-group, .timeline-item.commits-list, .code-comments-list, .conversation-holder (review threads)
     pull_merge_box (PR): div.timeline-item.comment.pull-merge-box (view_content/pull_merge_box.tmpl:3) … #pull-request-merge-form (Vue)
     div.timeline-item.comment.form > a.timeline-avatar + div.content > div.ui.segment.avatar-content-left-arrow > form#comment-form (combo markdown editor, #status-button, #comment-button.ui.primary.button)
  div.issue-content-right.ui.segment  (sidebar: branch selector, reviewers, assignees, labels, projects, milestone, … each .ui.dropdown + .ui.list)
```
Key CSS (all in `web_src/css/repo.css`): `.issue-content-left/right` (`:32-102`), `.avatar-content-left-arrow::before/::after` speech-bubble arrow (`:248-280`), `.issue-title-header` (`:311+`), `.repository.view.issue .comment-list` + vertical timeline line `::before` (`:422-441`), `.timeline-item`, `.timeline-avatar` (`:443-470`), `.badge` (`:480-508`), `.comment > .content` (`:510+`), `.code-comment`, `.event` (`:604-660`). Comment header/body use `--color-box-header` / `--color-box-body`, timeline line `--color-timeline`.

### 6.5 Diff: `templates/repo/diff/box.tmpl`, `section_unified.tmpl`, `section_split.tmpl`, `section_code.tmpl`, `blob_excerpt.tmpl`, `stats.tmpl`, `whitespace_dropdown.tmpl`, `options_dropdown.tmpl`
```
div.diff-detail-box > .diff-detail-stats (+ repo/diff/stats) / .diff-detail-actions (file-tree toggle button.diff-toggle-file-tree-button, #diff-commit-select Vue, whitespace dropdown, options, review button)
div#diff-container > div#diff-file-tree (Vue) + div#diff-file-boxes
  div.diff-file-box.file-content#diff-<hash>
    h4.diff-file-header.sticky-2nd-row.ui.top.attached.header > .diff-file-name (button.fold-file, stats, a.file-link, labels) | .diff-file-header-actions (viewed checkbox .viewed-file-form, kebab)
    div.diff-file-body.ui.attached.unstackable.table.segment
      div.file-body.file-code.unicode-escaped.code-diff(.code-diff-split | .code-diff-unified)
        table.chroma > tbody > tr.{add|del|same|tag}-code  (GetHTMLDiffLineType, services/gitdiff/gitdiff.go:143-154)
          unified: td.lines-num.lines-num-old, td.lines-num.lines-num-new, td.lines-escape, td.lines-type-marker, td.chroma.lines-code(.lines-code-old) > code.code-inner ; hunk row: td.chroma.lines-code.blob-hunk
          split:   td.lines-num.lines-num-old(.del-code), td.lines-escape.lines-escape-old, td.lines-type-marker.lines-type-marker-old, td.lines-code.lines-code-old(.del-code) | same set *-new (.add-code)
          word diff inside code: span.added-code / span.removed-code (services/gitdiff/highlightdiff.go:168-169)
          line comments: button.ui.primary.button.add-code-comment(.add-code-comment-left|right), tr.add-comment > td.add-comment-left/right
```
CSS: diff rules are spread through `repo.css` (31 `.diff-file-box` selectors between lines 11 and 1646, e.g. `.repository .diff-file-box .code-diff tbody tr .lines-type-marker` `:12`,`:946`; `.tag-code` hunk rows `:928-960`; `.diff-detail-box` `:816-850`; `.diff-file-box[data-folded="true"]` `:1646`), stats bar `.diff-stats-bar` / `.diff-stats-add-bar` `:1665-1680` (`--color-diff-*-fg` used as background), word-level `.removed-code`/`.added-code` `:1682-1698`, row colours `.code-diff-unified .del-code, .code-diff-split .del-code .lines-*-old { background: var(--color-diff-removed-row-bg) }` `:1700-1708` and the add counterpart `:1710-1720`; review/comment buttons `web_src/css/review.css`. Image diff `features/imagediff.css`, CSV `repo/diff/csv_diff.tmpl`.

### 6.6 File view: `templates/repo/view_file.tmpl`, `blame.tmpl`; CSS `web_src/css/repo/file-view.css`, `repo.css`
```
h4.file-header.ui.top.attached.header.flex-left-right > .file-header-left (size, lines, LFS…) | .file-header-right.file-actions (buttons.file-view-toggle-buttons, Raw/Permalink/Blame/History a.ui.mini.basic.button, copy/download .btn-octicon, edit/delete)
div.ui.bottom.attached.segment.file-view-container
  div.file-view(.code-view | .markup <type> | .plain-text)
    table > tbody > tr > td.lines-num > span#L<n>[data-line-number]  ;  td.lines-escape ; td.lines-code.chroma > code.code-inner
    (blame: td.lines-code.blame-code.chroma, .blame-info…)
  div.code-line-menu.tippy-target (a.item copy-line-permalink / view_git_blame / ref-in-new-issue)
```
Selected line: `.file-view tr.active .lines-num/.lines-code` (`repo/file-view.css:1-40`). Code-view layout with file tree: `.repo-view-container > .repo-view-file-tree-container` (Vue tree) + `.repo-view-content` (`repo/home.css`).

### 6.7 Markdown: `.markup` (`web_src/css/markup/content.css`, `codeblock.css`, `codepreview.css`, `jupyter.css`)
- Wrapper `.markup` (issue bodies use `div.render-content.markup`; READMEs `.file-view.markup.markdown`; wiki `.repository.wiki .markup`).
- Headings with `.anchor` links (`content.css:40-120`), lists / `.task-list-item` (`:157-190`), blockquote (`:236-250`), tables `tr:nth-child(2n)` (`:251-275`, `--color-markup-table-row`), code (`:354-420`, `--color-markup-code-inline/-block`).
- Code fences: `<div class="code-block-container code-overflow-scroll"><pre class="code-block[ is-loading]"><code class="chroma language-<lang> display">` (`modules/markup/markdown/markdown.go:78-100`) + copy button `.markup .ui.button.code-copy` (`markup/codeblock.css`).
- Alerts (`> [!NOTE]`): `blockquote.attention-{note|tip|important|warning|caution}` + `strong.attention-*`, `svg.attention-icon.attention-*` (octicons info/light-bulb/report/alert/stop) (`modules/markup/markdown/transform_blockquote.go:25-37,138`; CSS `base.css:471-510`, `modules/header.css:165`).
- Light/dark-only images via `html[data-gitea-theme-dark]` (`content.css:284-290`).

### 6.8 Settings sidebars: `templates/{user,repo,org}/settings/navbar.tmpl`, `templates/admin/navbar.tmpl`
`div.flex-container` > `div.flex-container-nav > div.ui.fluid.vertical.menu > div.header.item + a.item(.active)` (+ collapsible `details.item > summary + div.menu > a.item` in admin/repo) and `div.flex-container-main` (`modules/flexcontainer.css`, `shared/settings.css`, vertical menu in `modules/menu.css`). Layout head e.g. `templates/user/settings/layout_head.tmpl:1-6`.

### 6.9 Footer: `templates/base/footer_content.tmpl`
`footer.page-footer > div.left-links (Powered by, version, page/template timing) + div.right-links (div.ui.dropdown.custom#footer-theme-selector > span.default-text > div.theme-menu-item ; div.ui.dropdown.upward language menu > div.menu.language-menu ; a Licenses ; a API ; custom/extra_links_footer)`. CSS `home.css:46-80` (`background-color: var(--color-footer)`, border-top `--color-secondary`).

### 6.10 Flash messages: `templates/base/alert.tmpl` → `RenderFlashMessage` (`modules/templates/util_render.go:249-276`)
`<div class="ui {negative|warning|info|positive} message flash-message flash-{error|warning|info|success}"><div class="tw-text-center">msg</div></div>` (single-line messages are centred). CSS `web_src/css/modules/message.css` (`.ui.message`, colour variants via `--color-{error|warning|info|success}-{bg,border,text}`).

### 6.11 Dropdowns: `.ui.dropdown` (`web_src/css/modules/dropdown.css`, Fomantic JS)
`.ui.dropdown > .text`, `> .dropdown.icon` / `svg.octicon-triangle-down` (14px), `.ui.dropdown .menu` (`:13`), `.menu > .item` (`:60`), `.menu > .header` (`:87-98`), `.menu > .divider` (`:99`), `.menu > .input` (search), `.ui.selection.dropdown`, `.ui.search.dropdown`, `.scrolling.menu`, `.upward`, open state `.active.visible` + `.menu.transition.visible` (`modules/transition.css`). Many dropdowns are `.ui.dropdown.custom` (hand-rolled, not Fomantic-driven).

### 6.12 Modals: `.ui.modal` (`web_src/css/modules/modal.css`, `dimmer.css`)
`div.ui.[mini|tiny|small|…].modal > div.header + div.content + div.actions` (`base/modal_actions_confirm.tmpl`: `.ui.cancel.button`, `.ui.primary.ok.button`, danger `.ui.danger.red.ok.button`). Fomantic moves shown modals into `body > .ui.dimmer.modals.page.active` (backdrop `--color-overlay-backdrop`). CSS `modal.css:1-120` (`.ui.modal > .header` `:46-68`, `> .content` `:70`, `> .actions` `:81`). JS confirm modal `web_src/js/features/comp/ConfirmModal.ts:29`.

### 6.13 Tooltips / popovers: tippy.js (`web_src/js/modules/tippy.ts`, CSS `web_src/css/modules/tippy.css`)
- Any `[data-tooltip-content]` (and `title` attributes converted to it, `tippy.ts:100-110`) → `.tippy-box[data-theme="tooltip"]` (`tooltip` theme `:87-90`, placement default `top-start`). Popups use `data-theme` `default`, `menu` (`.tippy-box[data-theme="menu"] .item`), `box-with-header`, `bare` (`tippy.ts:9,47-52`; CSS `tippy.css:31-120`). Arrow is an inline `<svg>` with `path.tippy-svg-arrow-outer/-inner` (`tippy.ts:13`). Boxes are appended to `body` under `[data-tippy-root]` with inline positioning styles. Colours: `--color-tooltip-bg/-text`, `--color-menu`, `--color-secondary`.

### 6.14 Toasts: `web_src/js/modules/toast.ts` (toastify-js) / `web_src/css/modules/toast.css`
`div.toastify.on.toastify-top.toastify-center[data-toast-unique-key]` (inline `style="background: var(--color-green|--color-orange|--color-red)"`, `toast.ts:20-36,75`) > `div.toast-icon` (svg octicon-check / gitea-exclamation) + `div.toast-body > span.toast-duplicate-number.tw-hidden` + `button.btn.toast-close` (svg octicon-x) (`toast.ts:66-70`). Parent = `.ui.dimmer.active` or `body` (`:47`). Info 2.5 s, warning/error sticky.

### 6.15 Other shared widgets worth theming
Buttons `.ui.button` / `.ui.primary.button` / `.ui.basic.button` / `.ui.red.button` / `.ui.buttons` (`modules/button.css`), `.btn` / `.btn-octicon` / `.interact-fg` / `.interact-bg` (`button.css`, `helpers.css`), labels `.ui.label` (`modules/label.css`), inputs `.ui.input` & native inputs (`input.css`, `form.css`, `checkbox.css`), segments `.ui.segment`/`.ui.attached` (`segment.css`), tables `.ui.table` (`table.css`), pagination `.ui.borderless.pagination.menu` (`templates/base/paginate.tmpl`), avatars `img.ui.avatar` (`avatar.css`), clone widget `.clone-buttons-combo` / `.clone-panel-*` (`repo/clone.css`), commit SHA label `.ui.label.commit-id-short` (`repo/commit-sign.css`), branch/tag dropdown (Vue, §4), reactions `.bottom-reactions` (`repo/reactions.css`), `kbd` (`shortcut.css`), `.ui.message` banners, Actions console `.console`/`.job-log-line` (`features/console.css`, `ActionRunJobView.vue`).

---

## 7. Syntax highlighting

- **Server (Chroma v2)**: `chromahtml.New(chromahtml.WithClasses(true), WithLineNumbers(false), PreventSurroundingPre(true))` (`modules/highlight/highlight.go:100-121`): **class-based output only**, the passed "github" style is not used for colours (comment `:114`). Emitted short classes: `.k .kc .kd .kn .kp .kr .kt .n .na .nb .bp .nc .no .nd .ni .ne .nf .nl .nn .nx .nt .nv .vc .vg .vi .s .sa .sb .sc .dl .sd .s2 .se .sh .si .sx .sr .s1 .ss .m .mb .mf .mh .mi .il .mo .o .ow .p .c .ch .cm .c1 .cs .cp .cpf .gd .ge .gr .gh .gi .go .gp .gs .gu .gt .gl .w .err` + structural `.lntd .lntable .hl .lnt .ln`.
- Colours: **only** `web_src/css/modules/chroma.css` (79 lines), every token mapped to a `--color-syntax-*` variable (e.g. `.chroma .k { color: var(--color-syntax-keyword) }`); `.err` intentionally unstyled. There is **no `web_src/css/chroma/` directory and no per-theme chroma CSS**; themes recolour by defining the 41 `--color-syntax-*` vars (list in `gitea-css-vars.txt`). Container class `.chroma` sits on the diff `<table class="chroma">`, `td.lines-code.chroma` in file view, and `code.chroma.language-x` in markdown fences.
- Markdown code blocks: goldmark-highlighting with the same Chroma class formatter (`modules/markup/markdown/markdown.go:151-156`) → same `.chroma` token classes inside `.markup pre.code-block > code.chroma`.
- Mermaid: rendered client-side into a **same-origin `<iframe srcdoc>`** (`iframe.markup-content-iframe`) inside `div.mermaid-block` (`web_src/js/markup/mermaid.ts:185-246`); iframe gets only a tiny inline stylesheet (`getIframeCss`, `:11-17`); mermaid theme = `isDarkTheme() ? 'dark' : 'neutral'` (`:178-183`). Page CSS does not reach inside; only the iframe box and `.mermaid-block .view-controller` buttons (`markup/codeblock.css`) are styleable. Users can still pass mermaid `%%{init}%%`/front-matter config.
- Math: KaTeX (lazy `katex.css`).
- Code editor: CodeMirror 6 with `.tok-*` classes → `--color-syntax-*` (§1.5; `web_src/css/modules/codeeditor.css:488-520`). EasyMDE legacy editor: `easymde.css` (CodeMirror 5 `cm-s-default` classes, var-driven).
- Actions logs / console files: ANSI via `ansi_up` → `.ansi-*-fg/bg` using `--color-ansi-*` plus hard-coded 256-colour `.term-fgxN/.term-bgxN` (`web_src/css/features/console.css:100+`).

---

## 8. Where pure CSS cannot fully reach

1. **Inline `!important` label colours**: `RenderLabel` emits `style="color: … !important; background-color: … !important"` on `.ui.label` and scoped label parts (`modules/templates/util_render.go:114,151-152,163-164`). Nothing in a stylesheet beats inline `!important` (not even layered `!important`). GitHub-style label pills can only be approximated with properties not set inline (border, radius, padding, font, `filter`, `box-shadow`, pseudo-element overlays). Same for project columns `style="background: {{.Color}} !important; color: … !important"` (`templates/projects/view.tmpl:82,122`).
2. **Other inline data colours** (not `!important`, overridable only with stylesheet `!important`): language colour dots `i.color-icon` and language bar `.bar` (`templates/repo/home_sidebar_bottom.tmpl:31,37`, `shared/repo/list.tmpl:40`, `shared/searchbottom.tmpl:5`, `shared/search/code/results.tmpl:5`), project column dots (`repo/issue/sidebar/project_list.tmpl:66-87`), label pre-colours (`repo/issue/label_precolors.tmpl`), toast background (`toast.ts:75`), heatmap cell `style="fill: var(--color-…)"` (`ActivityHeatmap.vue:21-28,183,203`, var-driven, so theme vars already control it).
3. **Canvas charts (Chart.js)**: Contributors, Code frequency, Recent commits (`RepoContributors.vue`, `RepoCodeFrequency.vue`, `RepoRecentCommits.vue`) draw on `<canvas>`. Colours come from `chartJsColors`, read once from CSS vars at module load (`web_src/js/utils/color.ts:28-34`). Change them by theme vars (`--color-text`, `--color-secondary-alpha-60`, `--color-primary-alpha-60`, `--color-green`, `--color-red`), not by selectors. An OS light/dark switch under an auto theme is not picked up until reload.
4. **SVG graphics with attributes/JS geometry**: top-authors bar graph (`vue-bar-graph`, colours copied from probe elements `.activity-bar-graph(-alt)`, `RepoActivityTopAuthors.vue:46-61`); WorkflowGraph (inline `transform`, mask `fill="white|black"`, `WorkflowGraph.vue:273-299`); commit graph SVG colours are CSS (`features/gitgraph.css`, `--color-series-16-*`) and themeable. Favicon status badge built in JS with `fill="#ffffff"` (`web_src/js/modules/favicon-status.ts:49-50`). Brand/package icons have hard-coded fills.
5. **Material file icons** (default `FILE_ICON_THEME=material`): 1244 of 1250 symbols have hard-coded brand `fill` colours and are rendered via `<use href="#svg-mfi-…">` (§5.1). GitHub shows monochrome octicons. CSS `fill` on `.svg-icon-container svg path` / `svg.git-entry-icon` can flatten colours (CSS beats presentation attributes; `<use>` clones inherit the referenced element's styles), but shapes stay Material. Shapes only change via `[ui] FILE_ICON_THEME = basic` (app.ini, global, restart) or CSS masking.
6. **Icons rendered by JS** can't be replaced by file overrides (§5.2), only CSS (mask/content/hide+pseudo-element).
7. **Mermaid diagrams** live in iframes (§7), so page CSS can't touch them.
8. **Markup/structure**: CSS can't reorder or add DOM (e.g. GitHub's navbar search box, repo "About" layout, "Code" green button with dropdown). The header/tab structure is fixed by templates. Template overrides are a separate, restart-requiring mechanism, and `head_style.tmpl`, `repo/view_content.tmpl`, `repo/view_list.tmpl` are owned by the Modern theme here.
9. **JS-computed layout**: `overflow-menu` measures item widths and moves tabs into a kebab popup (`overflow-menu.ts:113-134,207+`); changing tab padding/font changes when items overflow. It sets inline `display:none !important` during measurement.
10. **Swagger page / external-render iframes** load only the theme CSS (no index.css) (`templates/swagger/openapi-viewer.tmpl:6`, `modules/markup/render.go:247-256`). Broad selectors in the theme will hit those documents too.
11. **Lazy CSS order**: lazily loaded component CSS is appended after the theme link (§3.1), so ties go to Gitea there.
12. **Vite-less theme**: custom theme `@import`s are separate HTTP requests with 6 h `max-age` and no content hash. Stale sub-files are possible after edits unless URLs are versioned (needs a template edit + restart).
